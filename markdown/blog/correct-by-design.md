«««
title: correct by design
date: 2026-08-22
tags: software, rust
»»»

# correct by design

In order to be better software engineers, I believe we should learn more from aersopace engineering than software engineering itself.

AI has made it easy to write code. It has also made all of us *slop-tolerant*. While building software that is going to last longer than the inspiration to “just vibe code” it, we should try making sure it correct by design, not by happenstance.

Rust is a good example of enforcing good programming behaviour by making unsafe ideas hard to represent and opt-in to implement.

I recently got an email from Railway that said, “A server running your service has experienced a hardware failure. We are actively working to restore it. No action is needed on your part — your service will automatically resume once the issue is resolved.” This was for a PostgreSQL database. A quick google search for this message revealed [another user experiencing the same thing](https://station.railway.com/questions/why-is-my-shopify-app-down-59449a6b). I love Railway because it makes running containers so easy but this is pretty disappointing. The automatic resume setup is good but why did the design not account for hardware failure? Hardware failure is probably the most ocurrence in a data center anyway. And this is not even a brand new idea, [Google’s GFS paper](https://www.cs.princeton.edu/courses/archive/fall09/cos518/papers/gfs.pdf) highlights this as a thing to build around, back in 2003! An excerpt from that paper:

> *First, component failures are the norm rather than the exception. The file system consists of hundreds or even thousands of storage machines built from inexpensive commodity parts and is accessed by a comparable number of client machines. The quantity and quality of the components virtually guarantee that some are not functional at any given time and some will not recover from their current failures. We have seen problems caused by application bugs, operating system bugs, human errors, and the failures of disks, memory, connectors, networking, and power supplies. Therefore, constant monitoring, error detection, fault tolerance, and automatic recovery must be integral to the system.*
>

Aerospace engineers don't have the luxury of assuming that every component will continue working correctly. Components fail, sensors produce incorrect readings, humans make mistakes, and the environment itself can be hostile. The system has to be designed with these possibilities in mind.

One useful idea is [Failure Mode and Effects Analysis (FMEA)](https://en.wikipedia.org/wiki/Failure_mode_and_effects_analysis). Instead of waiting for something to fail and figuring out what to do afterwards, you enumerate the ways a system can fail and reason about their consequences beforehand: *What happens if this component fails? How do we detect it? What else does it take down with it? Can the system continue operating without it?*

Let’s also take the example of Apollo 11. During the lunar descent, the Apollo Guidance Computer encountered the famous 1201 and 1202 alarms as it became overloaded with work. Instead of the entire computer simply crashing, its software was designed to preserve higher-priority work while abandoning and restarting lower-priority tasks. The computer could become overloaded without turning overload into total system failure.

Now we apply this to software. What happens if this process crashes? What happens if the machine underneath it disappears? What if the database is reachable but extremely slow? What if an availability zone goes down? What if two supposedly redundant services depend on the same underlying component?

In my break these days, I have found the time to be closer to databases and other lower-level systems. It has changed the way I think about software. When you work several layers above the machine, it is easy to treat failures as exceptional events.

End of rant.

Let’s design better systems!