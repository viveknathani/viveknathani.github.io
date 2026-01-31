«««
title: how database branching works
date: 2026-01-31
tags: databases, software
»»»

# how does database branching work?

I've been seeing the term "database branching" being thrown around a lot lately. The idea seems really useful while creating completely isolated environments for your pull requests. But how does it work? Do we just do a `pg_dump` on demand? Or do we pass a `--schema-only` flag? When does it become a bottleneck? Let's take a look.

## just copy?

The straightforward way to "branch" a database is to copy it. Traditional Postgres stores data in files, so you copy the files. A 100GB database needs 100GB copied and 100GB more disk space. Branch creation time scales linearly with size.

Some databases have snapshots (SQL Server does this), but they're read-only. Useful for backups, less useful if you want to actually test something.

You could use `pg_dump` to serialize the database and restore it elsewhere. This works, but it's slow. A terabyte-scale database can take hours. For a pull request that lives for two days, that's ridiculous overhead.

So how do the modern solutions do it?

## copy-on-write

Here's the core idea: don't copy data until you need to change it.

When you create a branch, it starts by referencing the same physical data as the parent. No copying happens. The moment you modify something, only the changed pieces get written separately. Everything else stays shared.

This is called copy-on-write (CoW). It's the same concept behind Git branches, BTRFS snapshots, and Docker layers. But implementing it for a database is trickier because databases care about ACID guarantees, transactions, and performance.

## how neon does it

Neon went hard. They replaced Postgres's local storage backend with a remote page service.

Traditional Postgres stores data in 8KB pages on disk. When you write, it overwrites those pages. Neon doesn't do that. The Postgres execution engine still thinks it's dealing with pages, but instead of local disk, it talks to a remote pageserver that never overwrites anything.

Here's how it works:

Every change to the database generates write-ahead log (WAL) records. Neon streams these WAL records to a separate service called a "pageserver". The pageserver keeps:
- **Image layers**: Complete snapshots of pages at specific points in time
- **Delta layers**: The WAL changes themselves

When you read a page, Neon doesn't fetch a static file. It runs a function called `GetPage@LSN`. LSN stands for Log Sequence Number, basically an id in the WAL. This function:
1. Finds the most recent snapshot of the page before your requested LSN
2. Grabs all the WAL deltas after that snapshot
3. Applies those deltas to reconstruct the page as it existed at that exact moment

Branching becomes trivial. A branch is just a pointer to a specific LSN in the parent's timeline. Until you modify something, the branch fetches pages from the parent. When you write, only your changes get stored separately.

A terabyte database branches in seconds.

The catch here is complexity. Reads involve more indirection. You need to manage these layer files, timeline hierarchies, and WAL streaming infrastructure. And while Postgres itself runs mostly unmodified, you're operating a custom storage backend.

## how xata does it

Xata took a different approach. They didn't modify Postgres at all.

Instead, they implemented copy-on-write at the block storage level, below Postgres. Postgres runs unmodified in containers, but the block device it writes to is custom.

This block storage layer uses erasure coding to distribute data across nodes. When you branch, the new branch initially references the same blocks. Modifications trigger new block writes, leaving the originals untouched.

They use a custom, high-performance block storage layer with user-space and NVMe-optimized components. This reduces latency and keeps performance high even with the indirection.

Branching is still instant, but you don't need to fork Postgres. Full compatibility, at the cost of managing an entire custom storage layer.

## the supabase way

Supabase keeps it simple: they just create a new Postgres instance.

Branch creation runs a shell script that spins up a new container, creates a blank database, runs your migration scripts, and optionally runs seed scripts.

## what about merging?

Here's the thing nobody tells you upfront: you can't merge data branches with automatic conflict resolution.

Git spoiled us. We expect to branch, make changes, and merge back. But most database branching solutions don't support that. Neon doesn't. Xata doesn't. Supabase doesn't.

Branches are point-in-time copies. You can branch off main, test changes, and throw the branch away. Or you can promote a branch to be the new main. You can even replicate data between branches. But automatic conflict-resolving merge when two branches modify the same rows differently? Not a thing.

PlanetScale does schema merging for MySQL using three-way merge algorithms (like Git), but even they don't merge data. Only schema DDL.

Why? Because merging database rows is hard. What happens when two branches update the same row differently? Git can show you a conflict. A database would need application-level logic to decide which version wins. And most applications don't have that.

## when does it become a bottleneck?

If you're running a SaaS with customer branches, copy-on-write scales well. Thousands of branches sharing the same underlying data is fine.

If you're testing PRs, ephemeral branches are cheap with CoW. Supabase's full-copy approach gets expensive fast when you spin up 50 branches a day.

The bottleneck isn't storage. It's metadata. More branches mean more timeline tracking, more layer files to manage, more indices to maintain. Neon and Xata handle this well, but it's not free.

Another issue: long-lived branches diverge. If a branch sits around for weeks making changes, it's not sharing much with the parent anymore. The CoW benefits fade. At some point, you're paying the complexity cost without the storage savings.

## closing thoughts

I think the most interesting part is how much of this mirrors Git's internals. The same ideas that made code version control work, commits as immutable snapshots, references instead of copies, apply to databases too. Just with ACID guarantees and a lot more complexity.

Vivek
