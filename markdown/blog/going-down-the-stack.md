«««
title: going down the stack
date: 2025-12-10
tags: software
»»»

# going down the stack

For most of my career, I’ve worked in the application layer - APIs, business logic, database queries, infra glue. It’s useful work, but over the years, I’ve found myself getting more curious about what sits underneath it.

That curiosity started in 2023 when a Postgres slowdown at work pushed me into understanding how databases actually work. I picked up [DDIA](https://www.amazon.in/dp/9352135245), learned about LSM trees and B-trees, debugged a pan-India networking issue that sent me deep into DNS, wrote a tiny DNS server for fun, and even built a small Bitcask-style key–value store.

In 2024, I worked with [Advait](https://advaitb.com/) at Mars, building a low-latency video streaming pipeline in Rust. We learned Rust on the job, figured out video encoding/decoding, and wrote some of the most intense systems code I’ve touched. We couldn't scale the business further, but it made something obvious: I enjoyed the systems layer a lot more than the application layer.

2025 brought me back to app work for the day job, but in my free time I drifted into systems again — [writing a compiler in C](https://github.com/viveknathani/monkeyc), [building a math expression parser in Go](https://github.com/viveknathani/numero), [hacking on my exercise bike with a raspberry pi](https://www.vivekn.dev/blog/vital/), watching CMU’s 15-445 database course, and slowly orbiting around Postgres internals.

All of this has pointed in one direction: I want to spend some serious time going down the stack.

So that’s the plan for the rest of 2025 and into 2026: learning PostgreSQL deeply, hacking on it if I can, and writing about whatever I discover along the way. No rush, no deadlines, no pressure to “ship fast.” Only slow, focused exploration of a system I genuinely like.

Let’s see where it goes.
