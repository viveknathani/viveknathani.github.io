«««
title: how i write software
»»»

# how i write software

Last Updated: September 2026

Let's say I have a product document and an empty GitHub organisation. How do I start building?

It is tempting to create a backend repository, install a framework, add a `/health` route and call it progress. I have done this several times. It feels nice because there is code on the screen, but I still don't understand the product.

So I start with the people who will use the system.

Who are the users? What can they do? Where do they do it - a web app, mobile app, desktop app or CLI? What does the backend need to make all of this work? What data do we need to store?

I usually draw a high-level system diagram and then start working on the data model. I use PostgreSQL for most products. Thinking in tables and relationships is a good test of whether I have actually understood the product.

A product document might say that a staff member belongs to a facility. Okay, but can they belong to more than one facility? Can they move? Does the history matter? Is a platform administrator also part of a customer organisation?

These look like database questions but they are actually product questions. I like to have answers before there are fifty API endpoints built around the wrong assumptions.

## boring technology is good

I pick technology based on the work it has to do. There is no prize for using the most interesting database.

Most products I work on have relational data and need transactions, so PostgreSQL is usually enough. I will consider a document database, time-series database or analytical store when there is a real usecase for it. The workload needs to justify the extra system.

Go is usually my default for backend services. It is easy to deploy, concurrency is nice and it is fast enough for pretty much all ordinary product work. Node and TypeScript make sense when using one language across the frontend and backend makes the team faster. I would not use Node for CPU-heavy work just because the frontend happens to use TypeScript.

Redis comes in when I actually need caching, or when my job system already needs it. I have used BullMQ with Node and Asynq with Go. Watermill is nice for events in Go.

Configuration comes from the environment. Logs go to standard output. Databases and other services are configured using URLs. Processes should be safe to restart. This is basically the useful part of the 12-factor model.

The backend and worker can share the same code and services while running as different processes. Separate process does not have to mean a separate repository or an entirely different service.

## the backend

I lean towards monorepos these days, although my thoughts on repository boundaries keep changing. The exact Git setup is less important to me than being able to discover the entire system without doing archaeology.

Inside the backend, I create modules named after the product: `users`, `organisations`, `payments`, `rentals`. Names like `foundation`, `common` and `misc` usually mean that I have not figured out where something belongs.

I don't like the repository pattern much in application backends. Most business logic lives in the service layer. Controllers are thin HTTP wrappers around services. Routes connect URLs and middleware to controllers. Workers use the same services instead of implementing the business logic again.

Roughly:

```text
routes -> controllers -> services -> database and integrations
                         ^
workers -----------------|
```

If changing an HTTP detail forces me to rewrite business behaviour, something is probably in the wrong layer. A controller should not be deciding whether a rental can be renewed.

I start with a modular backend, not microservices. A single application with clear modules and separate worker processes is easy to run and understand. Microservices add network calls, deployment coordination, observability work and more failure modes. They are useful when the system has real ownership or scaling boundaries. If one small team owns everything, ten services usually pretend that an organisation exists when it doesn't.

Something can always be extracted later when I have evidence that it needs to be.

## get the whole thing running early

Before building too many features, I want:

- PostgreSQL and Redis running locally, if Redis is needed;
- the backend and workers running;
- environment-based configuration;
- formatting and linting;
- a test setup;
- CI that runs the checks;
- application and request logs;
- health checks;
- basic frontend structure, authentication and the design system;
- a local setup that another engineer can start without calling me.

I don't need a giant production setup on day one. I just want the repeated work automated and failures to be visible.

Deployment is part of this setup. On Railway, for example, I run database migrations as a pre-deploy command. If a migration fails, the deployment fails. I don't want the new backend to start and hope that somebody remembers to run migrations later.

I prefer forward migrations. Rolling the schema backwards is not my default recovery plan. This means schema changes have to work while old and new versions of the app may briefly run against the same database. Add before removing. Backfill before adding a constraint. Deploy code that can work with both shapes before deleting the old one.

The backend and worker can have separate process definitions or Dockerfiles when the platform needs them. They still share the same business logic. Logs go to standard output and secrets stay in environment variables.

## external services will be late

Startup products often depend on an OTP provider, payment gateway, or a KYC vendor. Quite often, the product needs to move before the commercial agreement or final API documentation exists.

Waiting blocks the entire product. Adding fake vendor behaviour everywhere creates a mess.

I define the integration boundary and create a fake implementation for development or staging. The rest of the application talks to that boundary. The mock is obvious and controlled by the environment. When the real integration is ready, I can replace the fake without teaching every controller and frontend screen about the vendor.

Background work needs similar care. Sending a message, processing a webhook or retrying a network call may belong in a worker. The worker still calls the same service as the HTTP path. Putting work in a queue does not magically solve duplicate execution, retries or idempotency. It just moves those problems somewhere else.

## the repository should explain itself

I have worked on systems where one engineer knew most of the important things. Everything worked until that person was not around.

I don't want to be important because only I know how the system works. Three weeks into a project, another engineer should be able to understand the repository and ship an ordinary feature without speaking to me.

AI makes this easier. An agent can inspect code, update documentation in the same change and turn a mistake into an instruction that prevents it from happening again. But this only works when the repository has some structure.

I use `AGENTS.md` as the starting point. It does not contain every detail about the system. It explains how the repository is organised, where the sources of truth live, how to verify a change and which rules are important.

The rest goes into a small documentation setup:

- context documents explain how modules work today
- API docs describe the contract that is actually implemented
- ERDs explain important architectural choices
- runbooks contain operational steps
- `docs/README.md` links everything together

Documentation changes with the code. If an API changes, the docs and examples change in the same pull request. If the code proves that a context document is wrong, I fix the document. If nobody can find a document, it may as well not exist, so it goes in the index.

I also use temporary specs while building larger changes. The spec is useful while the work is in progress. Once it ships, the final truth should live in the code, API contract, context docs or an ERD. I don't want an old implementation plan quietly becoming a second source of truth.

Ideally, an engineer can point an agent at the repository and the agent can find the relevant module, understand the contract, read about earlier mistakes, make the change and run the checks.

This does not mean every change should be delegated blindly. New data flows, permissions, money movement and changes to core product rules need careful human thought.

## agents still need review

An agent-friendly repository does not make agents correct.

AI can write an implementation and a beautiful test suite where both are based on the same wrong assumption. Everything passes and the feature is still wrong.

I care more about what a test proves than how many tests were added. Important product rules, tenant isolation, payments, retries and concurrent behaviour need tests that try to break the boundary. During review, I want to trace the requirement through the handler, service, database and final behaviour.

AI makes implementation, documentation and routine verification cheaper. It does not decide what the product is supposed to mean.

## what am I optimising for?

I am not trying to predict every future requirement or design the perfect architecture.

I want ordinary work to feel ordinary. A feature should have an obvious home. HTTP code should be thin. Workers should reuse business logic. Configuration should come from the environment. Deployments should run their own migrations or fail. A new engineer should be able to run the system locally. An agent should be able to explain the repository using evidence instead of making things up.

When something goes wrong, I want the fix to leave the system slightly better. Fix the code, update the explanation, record the mistake if it can happen again and move on.

The goal is simple: keep shipping without needing a hero in the room.
