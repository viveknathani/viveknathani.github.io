«««
title: how does SKIP LOCKED actually work
date: 2026-02-16
tags: databases, postgresql, software
»»»

# how does SKIP LOCKED actually work?

You've got a table full of jobs. Multiple workers are trying to grab work from it. You need each worker to claim a different job without blocking on each other. How do you do it?

The naive approach is to `SELECT` a job, then `UPDATE` it to mark it as claimed. But there's a race condition. Two workers can read the same job, both think it's available, both try to claim it. Now you're processing the same job twice.

Fine. Use `SELECT FOR UPDATE` to lock the row. Problem solved, right? Not quite. Now when worker A locks a job, worker B blocks waiting for that lock to release.

This is where `SKIP LOCKED` comes in.

## the one-liner solution

```sql
SELECT * FROM jobs
WHERE status = 'pending'
ORDER BY created_at
FOR UPDATE SKIP LOCKED
LIMIT 1;
```

That's it. Worker A grabs a job and locks it. Worker B hits that query, sees the job is locked, skips it, and grabs the next one. No blocking. No duplicates. Just works.

## how it actually works

Here's what's happening under the hood.

PostgreSQL marks locked rows using the `xmax` field and related metadata in the tuple header. When you run `SELECT FOR UPDATE`,Postgres writes lock information into that row's header.

Now another transaction comes along and tries to lock the same row. PostgreSQL's lock conflict machinery checks this metadata and determines whether to wait, error, or skip. With `SKIP LOCKED`, it chooses to skip instead of waiting.

The query executor scans through the table, attempting to lock each row. Conflict? Skip it. No conflict? Lock it and take it.
Continue until the `LIMIT` is satisfied.

Table-level locks still get acquired normally. `SKIP LOCKED` only affects row-level locking. You still grab a `ROW SHARE` lock on the table. You just bypass individual row locks instead of waiting for them.

This version properly describes that there's actual lock conflict resolution machinery involved, not just a simple xmax check.

## building a job queue

Let's say you're building a background job system. You've got a `jobs` table and multiple workers polling for work.

```sql
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  payload JSONB NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_jobs_status_created_at ON jobs (status, created_at);
```

Your worker loop looks like this:

```sql
-- Claim a job
WITH claimed AS (
  SELECT id, payload FROM jobs
  WHERE status = 'pending'
  ORDER BY created_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1
)
UPDATE jobs
SET status = 'in_progress', started_at = CURRENT_TIMESTAMP
FROM claimed
WHERE jobs.id = claimed.id
RETURNING jobs.*;

-- Process the job in your application code

-- Mark it done
UPDATE jobs
SET status = 'completed', completed_at = CURRENT_TIMESTAMP
WHERE id = <job_id>;
```

You can run this on 10 workers, 100 workers, doesn't matter. Each one grabs a different job. No coordination needed. PostgreSQL handles the locking.

Systems like Solid Queue (Rails) and PG Boss do exactly this. They replaced RabbitMQ and cut latency in half. PostgreSQL can serve 10,000+ jobs per second with this pattern.

## the trade-offs

You get an inconsistent view of the data - If 5 jobs are pending but 3 are locked, your query only sees 2. That's intentional. It's fine for job queues. It's terrible if you need to count how many jobs are actually pending.

Index-only scans don't work - Postgres has to check the tuple header to see if a row is locked. That means fetching the actual row, not just the index. More disk I/O. Queries that could have been index-only scans become full index scans.

Performance degrades with many locked rows - If half your table is locked, workers spend a lot of time skipping rows. Eventually it approaches sequential scan performance. Keep your queue moving. Don't let jobs pile up in `in_progress` state.

Results aren't deterministic without ORDER BY - Run the same `LIMIT 1` query twice and you might get different rows. Always include `ORDER BY` if you care about which job gets processed first.

## closing thoughts

`SKIP LOCKED` solves one specific problem really well: distributing work across multiple consumers without them blocking each other.

Vivek
