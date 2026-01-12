«««
title: good use of postgres
date: 2025-01-14
tags: software, postgresql, databases
draft: true
-»»»

# good use of postgres

January 2026

I've been working with PostgreSQL for many years now, and I've learned that the difference between a database that works and one that works well often comes down to a handful of practical decisions. Most issues arise from basic misuse, poor defaults, or decisions made too early without thinking about how the system will actually be queried and operated.

This post is a collection of practices that have held up well for me across production systems and side projects. None of this is novel. That's the point.

## track everything with timestamps

Every table should have `created_at` and `updated_at` columns. This seems obvious until you're debugging a production issue at 2 AM and desperately need to know when a record changed.

For critical state changes, I go further with dedicated log tables. If your orders table has a `status` field, create an `order_status_logs` table that records every transition. You'll thank yourself later when someone asks "why did this order get stuck in processing for three days?" and the visibility you gain here is enormous.

**Without timestamps:**
```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    status TEXT,
    total DECIMAL
);
```
When an order status is wrong, you have no idea when it changed or what the history looks like. Was it stuck for hours or days? Did it change multiple times? You're flying blind.

**With proper tracking:**
```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    status TEXT,
    total DECIMAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_status_logs (
    id BIGINT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_by BIGINT,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
Now you can see exactly when the order was created, when it was last modified, and the complete history of status changes. When debugging, you can answer "what happened and when" immediately instead of guessing.

## backups aren't optional

Point-in-Time Recovery (PITR) isn't just for big companies. Set up WAL archiving and continuous backups from day one. The first time you need to recover from an accidental `DELETE`/`UPDATE` or investigate data corruption, you'll understand why this matters.

Managed databases make this easier, but "enabled" is not the same as "verified". You should know:
- how far back you can restore,
- how long restores take,
- and what data you lose in the worst case.

**The naive approach:**
Running `pg_dump` once a week to a file on the same server, never testing restores. When someone accidentally runs `DELETE FROM users WHERE active = true` (they meant `false`), you discover your last backup is from 6 days ago and it's corrupted because the disk had errors.

**The reliable approach:**
WAL archiving to S3 with automated continuous backups. You can restore to any point in the last 30 days within a 5-minute window. You've actually performed restore drills quarterly, so you know it takes 15 minutes for your 50GB database and exactly which steps to follow. When that accidental delete happens at 3 PM, you restore to 2:59 PM and lose only one minute of data.

## soft deletes for user-facing data

Hard deletes are permanent. Add a `deleted_at` timestamp column instead of actually removing rows. Filter it out in your queries with `WHERE deleted_at IS NULL`. The storage cost is negligible compared to the flexibility you gain.

**Hard deletes:**
```sql
DELETE FROM user_posts WHERE id = 123;
```
User contacts support: "I accidentally deleted my post about my grandmother's recipe, can you restore it?" You have to say no. The data is gone. Even if you have backups, restoring a single row from a backup is complex and risky. The user is upset, and there's nothing you can do.

**Soft deletes:**
```sql
UPDATE user_posts SET deleted_at = NOW() WHERE id = 123;

-- In queries, filter out deleted records
SELECT * FROM user_posts WHERE deleted_at IS NULL;

-- To restore
UPDATE user_posts SET deleted_at = NULL WHERE id = 123;
```
Same user scenario: you run one UPDATE query and the post is back. Takes 30 seconds. User is happy. You also get audit trails for free (you can see who deleted what and when), and compliance becomes easier since you can prove data retention policies are followed.

## design for your query patterns

Schema design should start with how you'll query the data, not just how you'll store it. If you're constantly joining three tables to answer a common question, denormalize a bit. If you're filtering by date ranges frequently, partition your table. I've seen perfectly normalized schemas become performance nightmares because nobody thought about the read patterns. Model your data for how it will be used and not for the sake of theoretical purity.

**Optimizing for normalization:**
```sql
SELECT p.*, COUNT(c.id) as comment_count
FROM posts p
LEFT JOIN comments c ON c.post_id = p.id
WHERE p.author_id = 123
GROUP BY p.id;
```
Your app shows "Posts by Author X with comment count" on every page. You designed for perfect 3NF normalization. This query runs on every page load. With 10,000 posts and 100,000 comments, it takes 2 seconds. As data grows, it gets worse. Users complain about slow page loads.

**Optimizing for how you actually query:**
```sql
ALTER TABLE posts ADD COLUMN comment_count INT DEFAULT 0;

-- Update it with a trigger or in application code when comments change
-- Now your query is simple
SELECT * FROM posts WHERE author_id = 123;
```
Same data, same page, but now it loads in 20ms. Yes, you're storing redundant data. Yes, you need to keep comment_count in sync. But this is a read-heavy pattern (people view posts far more than they comment), so the tradeoff is worth it. The user experience is dramatically better.

## indexing before caching

Caching is sexy. Everyone wants to add Redis. But before you introduce another moving part, make sure you've actually indexed your queries properly. Run `EXPLAIN ANALYZE` on your slow queries. Nine times out of ten, you're missing an index or using one inefficiently. Fix that first. Or as they say, [use the index luke](https://use-the-index-luke.com/).

**Reaching for caching first:**
```sql
SELECT * FROM orders 
WHERE user_id = 123 AND status = 'pending'
ORDER BY created_at DESC;
```
This query takes 3 seconds. Instead of investigating, you add Redis. Now you're managing cache invalidation (when does it expire? what if an order updates?), cache warming (what about cache misses?), and another service in production. The complexity of your system just doubled.

**Fixing the actual problem:**
```sql
-- First, understand what's happening
EXPLAIN ANALYZE 
SELECT * FROM orders 
WHERE user_id = 123 AND status = 'pending'
ORDER BY created_at DESC;
-- Shows: Seq Scan on orders (scanning all 500k rows)

-- Add the missing index
CREATE INDEX idx_orders_user_status 
ON orders(user_id, status, created_at DESC);
-- Now: Index Scan using idx_orders_user_status
```
Query now takes 20ms. No Redis needed. No cache invalidation logic. No additional infrastructure. Just proper use of the database you already have. Save caching for when you've exhausted database optimization and still need more speed.

## understand vacuuming (at least at a high level)

You don't need to be a Postgres internals expert, but you do need to understand that Postgres doesn't clean up after itself automatically in the way you might expect. If you have tables with heavy update/delete patterns, you need to monitor bloat and adjust vacuum settings. Check your vacuum stats regularly, especially on high-churn tables.

**Ignoring vacuum:**
Your `sessions` table updates on every request (high churn). After 6 months, queries slow down mysteriously. You check the table size: 50GB. But `SELECT COUNT(*)` shows only 2GB worth of actual session data. The other 48GB is "bloat": dead tuples that Postgres hasn't cleaned up because autovacuum defaults aren't aggressive enough for your workload. Queries are slow because Postgres has to scan through all that garbage.

**Monitoring and tuning:**
```sql
-- Check when tables were last vacuumed
SELECT schemaname, relname, last_vacuum, last_autovacuum,
       n_dead_tup, n_live_tup
FROM pg_stat_user_tables
WHERE relname = 'sessions';

-- For high-update tables, make autovacuum more aggressive
ALTER TABLE sessions SET (
    autovacuum_vacuum_scale_factor = 0.05,
    autovacuum_analyze_scale_factor = 0.02
);
```
Now autovacuum runs more frequently on this table. Bloat stays under control. Queries stay fast. You've prevented the problem instead of firefighting it later.

## keep ORM and migrations separate

Your ORM (Sequelize, TypeORM, whatever) should handle queries. Your migration tool should handle schema changes. Mixing these concerns creates fragile deployments. I know this is highly opinionated but I just hate seeing ORMs doing a shoddy job at "implicitly" figuring out migration changes from schema declarations. I like it when things are more explicit in my systems.

**ORM-generated migrations:**
You change a model field name from `userName` to `username` in your TypeORM entity. The ORM auto-generates a migration that drops the `userName` column and creates a new `username` column. You deploy it. All existing usernames are gone. Or, worse: two developers make different model changes, the ORM generates different migrations on their machines due to subtle differences in how they ordered the changes, and now your migration history diverges.

**Explicit SQL migrations:**
```sql
-- migrations/002_rename_username_column.sql
ALTER TABLE users RENAME COLUMN "userName" TO username;
```
You write the migration yourself. It's explicit. It does exactly what you want: renames the column without losing data. When another developer runs migrations, they get the same result. Your ORM (TypeORM, Prisma, whatever) just queries the database as it exists. Clean separation of concerns. Migrations are too critical to leave to magic.

## don't use uppercase table or column names

Postgres folds unquoted identifiers to lowercase (so `UserAccounts` becomes `useraccounts`). Uppercase names force you to quote everything. Stick to lowercase with underscores: `user_accounts`. It's consistent, requires less typing, and works everywhere.

**Using mixed case:**
```sql
CREATE TABLE "UserAccounts" (
    "UserId" BIGINT,
    "FirstName" TEXT
);

-- Now you must quote forever
SELECT "UserId", "FirstName" FROM "UserAccounts";
```
You've committed yourself to quotes everywhere, forever. Forget quotes once `SELECT UserId FROM UserAccounts` and you get an error because Postgres looks for a table called `useraccounts` with a column called `userid`, which don't exist. Your query works in one tool but breaks in another because of how it handles quoting. It's a constant source of papercuts.

**Using lowercase:**
```sql
CREATE TABLE user_accounts (
    user_id BIGINT,
    first_name TEXT
);

SELECT user_id, first_name FROM user_accounts;
-- or even: SELECT UserId FROM user_accounts; -- works fine!
```
No quotes needed. Works in psql, works in your ORM, works in every admin tool. Case doesn't matter in queries. One less thing to think about.

## use IDENTITY over SERIAL

Also listed in [this article](https://wiki.postgresql.org/wiki/Don't_Do_This#Don't_use_serial) on the PostgreSQL wiki, serial types can cause issues. `IDENTITY` columns are the modern, SQL standard-compliant approach for auto-generated primary keys.

**Using SERIAL:**
```sql
CREATE TABLE orders (
    id SERIAL PRIMARY KEY,
    total DECIMAL
);
```
`SERIAL` is just shorthand that creates a sequence implicitly behind the scenes. That sequence is "owned" by the column but in a weird way. If you dump and restore the database, you can hit edge cases where the sequence gets out of sync with your data. If you want to grant permissions, you have to separately grant them on the sequence. If you drop the column without `CASCADE`, the sequence lingers. It's legacy behavior with quirks.

**Using IDENTITY:**
```sql
CREATE TABLE orders (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    total DECIMAL
);
```
`IDENTITY` is the SQL standard way (Postgres 10+). The sequence is properly managed as part of the column. Permissions work intuitively. Dump/restore behavior is cleaner. It's what SERIAL should have been. If you're starting fresh, there's no reason to use SERIAL anymore.

## prefer connection strings over key-value configs

Use a single connection string (`postgresql://user:pass@host:port/dbname`) instead of spreading credentials across multiple config keys. It's easier to rotate, simpler to pass between environments, and reduces configuration drift. Most libraries support it anyway.

**Scattered configuration:**
```bash
DB_HOST=postgres.example.com
DB_PORT=5432
DB_USER=app_user
DB_PASSWORD=secret123
DB_NAME=production
DB_SSLMODE=require
```
You have 6 environment variables to manage. When you need to add `sslrootcert` or `connect_timeout`, you add another variable. When you rotate credentials, you update 2 variables and hope you didn't miss any. Different environments might have different formatting expectations. Your connection pooler expects a connection string, so you have to reconstruct it from these parts. It's tedious and error-prone.

**Single connection string:**
```bash
DATABASE_URL=postgresql://app_user:secret123@postgres.example.com:5432/production?sslmode=require
```
One variable contains everything. When you rotate credentials, you update one variable atomically. Either the old credentials work or the new ones do, but you can't end up in a half-updated state. Need to add a parameter? Add it to the query string. Every library, tool, and service in the Postgres ecosystem understands this format. Heroku does it this way. Render does it this way. Connection poolers do it this way. There's a reason it's the standard.

## closing thoughts

None of these are revolutionary. They're just things that make your life easier over the long run. PostgreSQL is an incredibly powerful tool, but like any tool, how you use it matters as much as the tool itself.