«««
title: ramblings in systems and health
date: 2026-08-01
tags: software, databases, life, health
»»»

# ramblings in systems and health

July was a slow month filled with curiosities, learnings, and taking care of my body. 

In case you haven’t been following me for a while, I am on a sabbatical since the past couple of months (checkout [living intentionally](https://vivekn.dev/blog/living-intentionally/) and [a month in systems](https://vivekn.dev/blog/a-month-in-systems/) for details). I am hacking on low level systems, focussing on my post op recovery and basically, chilling.

So, let’s dive in!

### database research

Unlike June, I decided to take a step back from open-source for a bit and explore a huge system that I have always loved - Postgres! io_uring has been out there since v18. It is deliberately not there in the write paths at the moment but you can use it for your reads. 

I got interested in an adaptive semantice-aware workload scheduling approach. Essentially, if two competing workloads have to run, can they balance it out with each other to maximise the perceived performance of the system? A simple example for this is to run foreground queries and VACCUM at the same time. I posted a tweet about my first set of findings: 

<blockquote class="twitter-tweet"><p lang="en" dir="ltr">interesting, VACCUM does not make every single query slower<br><br>ran a 100 TPS foreground read workload and manually triggered VACUUM. p50 stayed mostly unchanged, while p99 repeatedly spiked past 100 ms <a href="https://t.co/IX0mxwBjM4">pic.twitter.com/IX0mxwBjM4</a></p>&mdash; Vivek Nathani (@viveknathani_) <a href="https://x.com/viveknathani_/status/2077082022791844219?ref_src=twsrc%5Etfw">July 14, 2026</a></blockquote> <script async src="https://platform.x.com/widgets.js" charset="utf-8"></script>

Given this, I was tempted to write my own solution but I found that you can do some sort of static throttling using a cost-based vaccum delay. This works really well in cutting down foreground p99 but makes `VACCUM` itself a lot slower (expected). p99.9 however did not improve much.

And then, I came up with my own policy:

1. Every asynchronous read was tagged as either normal work or `VACUUM` work.
2. If a foreground read took at least 10 ms, it opened a short, shared “storage pressure” window.
3. When `VACUUM` reached one of its safe delay points, it checked that window. If foreground reads were under pressure, `VACUUM` briefly slept.
4. The controller allowed `VACUUM` to resume after at most 50 ms, so maintenance could not be starved. Failsafe vacuum bypassed the policy completely.

The first results looked good: roughly 19% fewer slow queries for almost no increase in `VACUUM` time. I followed it with a same-session `OFF, ON, ON, OFF, ON, OFF` experiment. The apparent improvement disappeared. Median foreground p99 was about 189 ms with the controller both off and on, and every measured range overlapped. My understanding is that the controller could only react after a foreground read had already completed slowly. It then had to wait for `VACUUM` to reach a delay point. It was detecting a real storage problem, but detecting it too late to reliably protect the affected queries.

There’s probably more digging worth doing here - I might get back to it someday! It was a fun exercise even if it did not lead to a deterministic performance improvement. I built a sense of scientific temperament through this research. AI makes everything a lot more fun! You can go from ideas to conclusions fairly quickly. 

### gig

There’s an interesting client I started consulting this month. I can’t get into the details (yet) but they do a whole lot of work around EV bikes and batteries. I am helping them build some software in exchange of some rent money. In the age of AI where most code is written for you, it is a nice feeling to step back and spend more time thinking deeply about architectural and product choices. Interestingly, my time away from actively writing APIs and spending more time around databases is helping me become a better systems thinker. I have learnt to question all my assumptions and think of a system as a universe with its own guarantees and invariants - similar to staying true to the laws of physics, which brings me to my next mini rabbit hole.

### physics

As a long-term side quest, I have decided to make a robot for myself. This journey requires me to go from bits to atoms. Along the way, I am catching up on Indian high-school Physics these days. July was spent working through problems of kinematics, forces, work, energy, power and gravitation. I am not aiming to be a whiz-kid problem solver but I can really appreciate the world around me with an enhanced understanding of what makes it move!

Also, I have been rewatching the show, The Big Bang Theory. It is nice to sometimes pause, look at their whiteboards, and reason through their research. Even though this is fiction, [they have taken the effort to make sure the stuff is correct](https://www.npr.org/2013/09/23/224404260/the-man-who-gets-the-science-right-on-the-big-bang-theory).

### game tech

I also got interested in emulators. As a kid, I used to have a PSP with me. Some very fond memories in getting it “cracked” and running games from a memory card without needing physical UMD discs. I can’t believe that the local computer store guy in my hometown had made a business out of this. He would essentially just copy-paste the games to the memory card.

Anyway, lately, I have come to the realisation that my iPad is the best possible frontend for gaming. My Xbox Series X is effectively useless, now that I play most of my games on Xbox Cloud. I could get my GTA San Andreas copy from the App Store. A single lightweight device to help me read papers, watch movies, and play ALL my video games while I travel across cities? You son of a bitch, I’m in!

I discovered PPSSPP and started playing with it on my iPad. It has a terrible UI however. And I wanted it to feel more like my good old PSP - starts with Sony’s intro, a distinct startup sound, then a rivery background with icons for all usecases. So, [I forked PPSSPP, called my version as epoch, and built this exact startup flow](https://github.com/viveknathani/epoch). And now, I have the classic XMB experience! I love AI.

### health

I had a spasm in my glutes this month, possibly due to some sort of exertion, was forced to rest for 10 days. Even with that and some cheat meal days with friends, I managed to lose 3.8kgs this month!

Here’s an overall graph since June - blue line represents the actual values, orange line is the EMA trend.

<img src="/images/weight.png">

I have lost 5.8kgs over 53 days, averaging about 0.77kg per week while having fun along the way! A personal win.

### science fiction

I picked up the book, 2001: A Space Odyssey. It is a bit chilling to think they had imagined AI so long ago. I have been rather slow in reading it but it is fun! Oh also, I watched Spiderman: Brand New Day and without getting into any spoilers, I believe it is a pretty plot advancing movie and has helped me re-gain my interest in MCU now!

### closing thoughts

I think I am getting to be a kid again. Doing science, writing code, imagining aliens and superheroes? It’s fun to have adult money with child-like curiosities! The big boy stuff funds everything else.

August will be more about open-source again.

I’ll be back soon.

Happy hacking!