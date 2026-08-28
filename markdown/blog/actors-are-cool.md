«««
title: actors are cool
date: 2026-08-28
tags: software, agents, ai
»»»

# actors are cool

I’ve spent a lot of time writing server-side software. And there are 4 kinds of workloads that I see most of the time:

1. Simple HTTP Request - it either fetches data or performs a well defined operation (updating a database / calling another API) and gives back a response with a status code and a body that your app can work with. Example: getting a list of todos.
2. HTTP Request that queues a job - this is useful when you know something is going to take time and/or needs a bit of retryability upon failure. The server queues the job and returns a job id which your frontend can use to poll for status. A worker in the background picks up the job and runs it. Example: processing an image.
3. Scheduled jobs and event emissions  - they are not exactly triggered by a client (although they may be a downstream effect of some work done by the client). The server itself runs some predefined logic to decide when a job should run - either at a predefined time or when a new event happens in a system. Example: sending a newsletter everyday at 7 AM or updating the analytics database when a new user signs up.
4. Realtime streaming and duplex channels - for times when you can’t afford to poll. Example: getting ticker updates for stock prices, chatting with a friend, or video calls.

There’s a new kind of workload emerging on the street, thanks to AI - agents! Agents in the backend can be non-deterministic, long-running and memory-intensive. Trying to fit them in the above 4 patterns creates a problem when you have to scale the system. 

We’ve been pilled over the years to design systems that are “stateless”. Agents don’t like that. They accumulate state: conversation history, intermediate results, schedules, tool outputs, user preferences, and whatever subset of that state needs to be assembled into the model’s context for the next inference.

In a traditional backend, the compute is ephemeral and the database owns the state. A request comes in, we load some state, do some work, persist the result and throw the compute away. That works beautifully for most server-side workloads. But an agent conceptually behaves more like a long-lived process. If we force it into the same model, every invocation has to reconstruct the agent from persisted state, coordinate with other invocations that might be modifying the same state, do some work, persist everything again, and disappear.

A shared database can handle a lot of writes. Although now, we’ve made the database both the persistence layer and the coordination mechanism for thousands of independently stateful processes.

What if we invert this? Instead of short-lived compute repeatedly operating on remote state, we give every agent a durable identity and ownership over its own state. Or, to put it more provocatively: give every agent its own database! Beautiful stateful compute.

1. An agent manages its own state - own memory + own database.
2. An agent can spawn other agents.
3. An agent uses message passing to speak with other agents.

Lo and behold, we have arrived at the actor model!

From Wikipedia,

> *The actor model in computer science is a mathematical model of concurrent computation that treats an actor as the basic building block of concurrent computation. In response to a message it receives, an actor can: make local decisions, create more actors, send more messages, and determine how to respond to the next message received. Actors may modify their own private state, but can only affect each other indirectly through messaging.*
> 

Giving every agent its own database sounds like a crazy thing because we have wired our brains to think of a database as a beefy system that needs operational expertise. But every agent does not need a PostgreSQL instance. They can do just fine with SQLite!

Cloudflare has been working on some cool stuff in this space - workers and durable objects.

Workers are V8 isolates. 1000s of sandboxed units running inside a single process, capable of running your JavaScript code (they’re adding support for Rust and Go too, via WASM). They behave a lot like serverless functions. They are also deployed on the edge so they are as close to the user as possible. Like most of our earlier workloads, they are stateless!

But the isolation model of workers gives us good guarantees to work with, even if they are stateless. Now imagine giving one of these compute units a stable identity, guaranteeing that requests for that identity reach the same logical object, and attaching private durable storage to it. You have basically arrived at a Cloudflare Durable Object.

By embedding a private, co-located SQLite engine directly within a globally routed V8 isolate, you are effectively getting a distributed actor runtime! You can now keep high-frequency tool loops and context updates close to the compute that owns them, without forcing unrelated agents to coordinate through the same rows or locks. This is beautiful!

I love Cloudflare but there’s one issue - your backend runs on AWS / GCP / Azure / GCP / Railway / Render. Your team has spent years on those platforms. You are neck deep into your existing infrastructure provider. And in order to run your agents, the Cloudflare model wants you to bring your code to them. This may not work for your team. Rivet solves this. It gives you an open-source actor management engine that you can run on your own infrastructure. Actors are first-class primitives but not limited to the bounds of a V8 isolate. They have higher memory and CPU limits. And you can self-host Rivet in your own infrastructure!

Let’s build a small app on top of Rivet - a platform to give your users a list of interesting research papers and blogs everyday based on the topics given by them.

Every user gets an actor. We define the actor once and use the user’s ID as its key:

```tsx
type AgentState = {
  userId: string;
  topics: string[];
  findings: Finding[];
  status: "idle" | "researching";
  researchRuns: number;
  lastResearchedAt: number | null;
};

const agent = actor({
  createState: (c): AgentState => ({
    userId: c.key[0],
    topics: [],
    findings: [],
    status: "idle",
    researchRuns: 0,
    lastResearchedAt: null,
  }),

  actions: {
    addTopic: (c, topic: string) => {
      c.state.topics.push(topic);
    },

    getFindings: (c) => c.state.findings,

    researchNow: async (c) => {
      // Search, rank and persist findings.
    },
  },
});
```

`createState` runs when a new actor is created. If we address an actor using the key `["vivek"]`, the actor belongs to Vivek:

```tsx
const viveksAgent = client.agent.getOrCreate(["vivek"]);
```

Both actors execute the same code, but their state, topics, findings and schedules are isolated:

```tsx
agent ["vivek"] → Vivek’s state
agent ["alice"] → Alice’s state
agent ["bob"]   → Bob’s state
```

The actor key is effectively the address of a stateful process. Rivet can locate the actor, create it if it does not exist, wake it when it is sleeping and route actions to it.

For the research action, we used Parallel’s Search API to find papers and technical blog posts for every topic. We then passed the search results to OpenAI through the Vercel AI SDK. The model generated a relevance score, a concise summary and an explanation of why each result mattered to the user.

The final pipeline looked like this:

```tsx
User topics
    ↓
Parallel web search
    ↓
OpenAI ranking and summarisation
    ↓
Durable findings inside the user’s actor
```

We can keep a conventional Express application as the public API:

```tsx
Frontend
    ↓
Express API
    ↓
Rivet endpoint
    ↓
User’s actor
```

An Express endpoint determines the current user, addresses the corresponding actor and calls an action:

```tsx
app.post("/research", async (req, res) => {
  const userId = req.user.id;
  const userAgent = rivet.agent.getOrCreate([userId]);

  const findings = await userAgent.researchNow();

  res.json(findings);
});
```

Locally, Express might run on port `3000`, while the Rivet Engine runs on port `6420`. In production, the Rivet endpoint can point to a managed or self-hosted Rivet deployment.

The frontend never needs to know how actors are created or where they live. From its perspective, it is calling ordinary endpoints.

Instead of repeatedly reconstructing an agent from rows, queue messages and cached context, we can simply send a message to it:

```tsx
await userAgent.researchNow();
```

Full example app here: [https://github.com/viveknathani/rivety](https://github.com/viveknathani/rivety)

Stateful compute amaze amaze amaze. Me likey. 

Happy hacking!
