«««
title: modelling API rate limits as diophantine inequalities
date: 2025-06-27
tags: math, software
draft: true
»»»

# modelling API rate limits as diophantine inequalities

You're allowed 10 requests per hour. Each task you run makes three attempts:initial call, retry after 10 minutes, retry after 30 minutes.

What’s the maximum number of tasks you can safely run per hour?

Most engineers throw exponential backoff at the problem. And it works great in most cases! But can we, for the sake of having fun, be more mathematical about this?

In a way, this is just an integer feasibility problem.

### the setup

Let’s define the retry pattern: [0, 10, 30]. Every task fires three requests: at minute 0, 10, and 30 after its start.

Now suppose you start a new task every 20 minutes:
- Task A: starts at 0 → hits at [0, 10, 30]
- Task B: starts at 20 → hits at [20, 30, 50]
- Task C: starts at 40 → hits at [40, 50, 70]

Now examine the 60-minute window [30, 90]:
- Task A contributes 1 (at 30)
- Task B contributes 2 (at 30, 50)
- Task C contributes 3 (at 40, 50, 70)

Total: 6 requests in that window. What if you had 4 such tasks? Or 5?

At some point, that window exceeds the limit.

### the equation

Let's generalise this. 

- You start `X` tasks at time `T`. 
- Each task has known retry offsets.
- For any time window `[T, T + 60]`, you count how many of those retries land inside it.

Then,

Let `Xi` be the number of tasks started at time `Ti`.

Let `Ai` be the number of attempts for those tasks that fall into our window.

Let `R` be the rate limit of our window.

Therefore, we are looking at,
```math
sum(Ai * Xi) <= R
```

This is a bounded integer linear inequality. In other words: a diophantine inequality.

### a quick detour into diophantine inequalities

We've now got the building blocks: retry timings and rate limits. But before we dive into the scheduling logic, let’s take a short detour into something older and surprisingly relevant: Diophantine equations.

A Diophantine equation is just an equation where you’re only allowed integer solutions. Think 3x + 5y = 14, and you're asked to find values of x and y that are whole numbers. These types of problems show up in number theory, cryptography, even tiling puzzles.

But they also show up here as well, in disguise!

When we say, “No more than 10 requests in any 60-minute window,” we’re actually placing a constraint on how integers can be arranged on a timeline. The retry times are integers. The window is an interval on the number line. And the constraint, "no window may contain more than R retries", is a kind of a diophantine inequality.

So underneath your retry logic is a very old, very integer-flavored question:

> <i>Is it possible to insert a few more integers into this sequence, so that no interval of length W contains more than R of them?</i>

With that framing, let’s return to the real-world question:

### can I schedule this task now?

Now, let's say you're running a live system. Some tasks already in flight. You want to schedule one more task at t, with a known retry pattern.

Does this task, when added, cause any 60-minute window to exceed the limit?

Let's write a short Go program to solve this.

```go
package main

import (
	"fmt"
	"sort"
)

func canScheduleRequest(existing []int, newRequestTime int, retryOffsets []int, rateLimit int, window int) bool {
	newRetries := make([]int, len(retryOffsets))
	for i, offset := range retryOffsets {
		newRetries[i] = newRequestTime + offset
	}

	allRequests := append(existing, newRetries...)
	sort.Ints(allRequests)

	for _, retryTime := range newRetries {
		start := retryTime
		end := retryTime + window
		count := 0
		for _, requestTime := range allRequests {
			if requestTime >= start && requestTime < end {
				count++
			}
		}
		if count > rateLimit {
			return false
		}
	}
	return true
}

func main() {
	existing := []int{0, 10, 20, 30, 35, 50, 60, 70, 85}
	newRequestTime := 10
	retryOffsets := []int{0, 10, 30}
	rateLimit := 10
	window := 60

	if canScheduleRequest(existing, newRequestTime, retryOffsets, rateLimit, window) {
		fmt.Println("Can schedule request: true")
	} else {
		fmt.Println("Can schedule request: false")
	}
}
```

### optimizations:

The current function checks every new retry time by scanning the entire list of all requests to count how many fall within a time window.

To optimize it, we can take advantage of the fact that the request times are sorted. Instead of scanning the entire list for every new retry, we can use a sliding window with two pointers. This way, we keep track of the range of requests that fall within any given window as we move through the sorted list. We shift the window forward as needed, reusing previous work and avoiding redundant scans. This can reduce the time complexity from `O(n^2)` to `O(n*log(n))`.


I enjoy coming across software problems that are solvable with math. Especially when they show up in unexpected places!


<i>Need help with your software backend? Hire me! [work@vivekn.dev](mailto:work@vivekn.dev)</i>

Vivek