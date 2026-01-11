«««
title: good use of postgres
date: 2025-01-14
tags: software, postgresql, databases
draft: true
»»»

# good use of postgres

January 2026

I've been working with PostgreSQL for many years now, and I've learned that the difference between a database that works and one that works well often comes down to a handful of practical decisions. Most issues arise from basic misuse, poor defaults, or decisions made too early without thinking about how the system will actually be queried and operated.

This post is a collection of practices that have held up well for me across production systems and side projects. None of this is novel. That’s the point.

## track everything with timestamps

Every table should have `created_at` and `updated_at` columns. This seems obvious until you're debugging a production issue at 2 AM and desperately need to know when a record changed.

For critical state changes, I go further with dedicated log tables. If your orders table has a `status` field, create an `order_status_logs` table that records every transition. You'll thank yourself later when someone asks "why did this order get stuck in processing for three days?" and the visibility you gain here is enormous.

## backups aren't optional

Point-in-Time Recovery (PITR) isn't just for big companies. Set up WAL archiving and continuous backups from day one. The first time you need to recover from an accidental `DELETE`/`UPDATE` or investigate data corruption, you'll understand why this matters.

Managed databases make this easier, but “enabled” is not the same as “verified”. You should know:
- how far back you can restore,
- how long restores take,
- and what data you lose in the worst case.

## soft deletes for user-facing data

Hard deletes are permanent. Add a `deleted_at` timestamp column instead of actually removing rows. Filter it out in your queries with `WHERE deleted_at IS NULL`. The storage cost is negligible compared to the flexibility you gain.

## design for your query patterns

Schema design should start with how you'll query the data, not just how you'll store it. If you're constantly joining three tables to answer a common question, denormalize a bit. If you're filtering by date ranges frequently, partition your table I've seen perfectly normalized schemas become performance nightmares because nobody thought about the read patterns. Model your data for how it will be used and not for the sake of theoretical purity.

## indexing before caching

Caching is sexy. Everyone wants to add Redis. But before you introduce another moving part, make sure you've actually indexed your queries properly. Run EXPLAIN ANALYZE on your slow queries. Nine times out of ten, you're missing an index or using one inefficiently. Fix that first. Or as they say, [use the index luke](https://use-the-index-luke.com/).

## understand vacuuming (at least at a high level)

You don’t need to be a Postgres internals expert, but you do need to understand that Postgres doesn’t clean up after itself automatically in the way you might expect. If you have tables with heavy update/delete patterns, you need to monitor bloat and adjust vacuum settings. Check your vacuum stats regularly, especially on high-churn tables.

## keep ORM and migrations separate

Your ORM (Sequelize, TypeORM, whatever) should handle queries. Your migration tool should handle schema changes. Mixing these concerns creates fragile deployments. I know this is highly opinionated but I just hate seeing ORMs doing a shoddy job at "implicitly" figuring out migration changes from schema declarations. I like it when things are more explicit in my systems.

## don’t use uppercase table or column names

Postgres folds unquoted identifiers to lowercase (so `UserAccounts` becomes `useraccounts`). Uppercase names force you to quote everything. Stick to lowercase with underscores: `user_accounts`. It's consistent, requires less typing, and works everywhere.

## use IDENTITY over SERIAL

Also listed in [this article](https://wiki.postgresql.org/wiki/Don't_Do_This#Don't_use_serial) on the PostgreSQL wiki, serial types can cause issues. IDENTITY columns are the modern, SQL standard-compliant approach for auto-generated primary keys.

## prefer connection strings over key-value configs

Use a single connection string (`postgresql://user:pass@host:port/dbname`) instead of spreading credentials across multiple config keys. It's easier to rotate, simpler to pass between environments, and reduces configuration drift. Most libraries support it anyway.

## closing thoughts

None of these are revolutionary. They're just things that make your life easier over the long run. PostgreSQL is an incredibly powerful tool, but like any tool, how you use it matters as much as the tool itself.
