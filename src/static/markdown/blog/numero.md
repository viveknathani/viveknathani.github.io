«««
title: numero - building a math parser for fun
date: 2025-05-21
tags: math, software, go
»»»

# numero - building a math parser for fun

May 2025

Some weekends you fix a leaky sink and order groceries. Other weekends you wonder, “How hard could it be to write a tiny math interpreter?”

That second question is what got me into learning how parsers are built, even though I never expected to use it in production.

### the itch

Every now and then I copy-paste a quick calculation into the macOS Spotlight bar, hit Enter, and feel a little guilty. Spotlight hides the details; it never shows how it got the answer. I wanted a tool that was mine, whose guts I understood, and that I could throw behind an HTTP endpoint if I ever felt like it.

### writing it

Language: Go for simple tooling, static binary, cheap goroutines.

Design: classic shunting-yard -> postfix -> evaluate.

Minimal dependencies: Own logger, queue, stack, and parser.

Ridiculously over-engineered for something nobody had asked me to build. Perfect.

### shipping it anyway
Because projects are not real until you can send someone a link:

Here you go: https://numero.vivekn.dev

### did the world need another math parser?

Almost certainly not.
But I did, not for the functionality, but for the joy of programming. In my head, fun is a perfectly legitimate product requirement.

If you ever need a lightweight way to evaluate sin(pi/2) + ln(e) from Go or curl, steal it. If you just want to browse the source and mutter “huh, neat”, that’s fine too.

Happy hacking.

Vivek
