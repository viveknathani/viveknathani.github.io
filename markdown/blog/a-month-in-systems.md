«««
title: a month in systems
date: 2026-06-29
tags: software, rust, databases
draft: true
»»»

# a month in systems

<img src="/images/rust-rewrite-comic.PNG">
<p style="text-align:center"><i> Image generated via <a href="https://helmer.plus/">Helmer</a> </i></p>

It’s been over a month into my sabbatical. I am taking this time off to get into systems programming. Here’s what I have been up to.

### open source

Contributing to open source became the highlight of June. Through a friend I met at a systems programming meetup, I stumbled upon [SlateDB](https://slatedb.io/) and the [OpenData](https://www.opendata.dev/) ecosystem. SlateDB is an embedded key-value store built on top of object storage, while OpenData is building databases around that primitive. I joined their Discord servers, started lurking through old discussions, RFCs and GitHub issues, and was hooked almost immediately.

One thing that stood out was the engineering culture. All significant changes go through RFCs, and every pull request is expected to stay under 500 lines of code (excluding tests). It forces you to break large features into small, reviewable increments. 

Over the month, I ended up contributing 6–7 PRs across the ecosystem. There's something deeply satisfying about seeing your work land in a public codebase. I believe they are now gearing for their next release - v0.14 which will have my changes too!

Beyond the code, I probably learned even more from reading design discussions, the most recent example being Almog's [RFC on subcompactions](https://github.com/slatedb/slatedb/blob/main/rfcs/0028-subcompactions.md) for parallelizing compaction across all available CPU cores on a single machine. I spent an evening thinking through the heuristics for partitioning work across threads, eventually discovering that it resembles the classic partition problem, which also has a dynamic programming solution - [link](https://www8.cs.umu.se/kurser/TDBAfl/VT06/algorithms/BOOK/BOOK2/NODE45.HTM).

Given the momentum, I created a small page to list my open-source work here: [link](https://vivekn.dev/oss/).

### memory allocation

I met a senior database engineer who casually mentioned jemalloc while explaining the internals of a database. I had heard the name before, but never really understood what made it different from the standard `malloc`. That conversation sent me down a rabbit hole of allocator design, eventually leading me to the [original jemalloc paper](https://people.freebsd.org/~jasone/jemalloc/bsdcan2006/jemalloc.pdf).

One concept that particularly stuck with me was false sharing. Two threads can end up modifying different variables that happen to live on the same CPU cache line, causing unnecessary cache invalidations and hurting performance even though the threads aren't logically sharing data.

A surprisingly simple mitigation is to pad frequently accessed data structures so they occupy an entire cache line. You trade a bit of memory for significantly lower contention. This pattern is also seen in the Linux kernel source - `____cacheline_aligned_in_smp` macro and rust's `crossbeam_utils::CachePadded`.

Another interesting takeaway from the jemalloc paper was how it assigns threads to memory arenas. I expected a clever hashing strategy to win, but the paper found that a simple round-robin approach performed better in practice. Sometimes the straightforward solution really is the right one.

### LSM trees

LSM trees were another fun rabbit hole of the month.

I spent a good chunk of June reading through [Database Internals](https://www.databass.dev/) alongside papers and real implementations like SlateDB. The core data flow is pretty easy to understand. The fun engineering begins around it: compactions, bloom filters, caching, recovery, and what changes when your storage layer is object storage instead of a local disk.

### rust

I also spent quite a bit of time writing rust this month. I had written a fair amount of C++ during my early programming days, and it was nice to see some of those fundamentals come back. Stuff like pointers, ownership of resources and memory layout didn't feel completely foreign.

I started appreciating that *thinking in rust* is a real thing. I don't think I'm there yet, but after reading enough code, I can see that experienced rust programmers tend to model problems differently.

I'm still very much learning, but reading and writing rust feels a little more natural than it did a month ago.

### developing an intuition

One muscle I'm consciously trying to build is developing an intuition for what matters in systems engineering.

We recently got to see Jarred Sumner [rewriting bun in rust](https://github.com/oven-sh/bun/pull/30412) and [his experimental work for making JavaScript multithreaded](https://github.com/oven-sh/WebKit/pull/249) - both heavily driven via AI coding agents. This got me thinking about *“what was previously considered hard in the database space that can now be kicked off as an experiment for an AI agent?”* 

The first answer to my mind was making PostgreSQL multithreaded. And I recently saw [Sam Willis taking a shot at this](https://x.com/samwillis/status/2069094864281538702). It’s reassuring that my instincts were pointing in the right direction.

### closing thoughts

Looking back, June was a pretty banger month. I managed to hack on the stuff I care about while also spending a healthy amount of time with friends and focussing on my health.

Time to dig deeper.

Happy hacking!