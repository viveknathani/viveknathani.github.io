«««
title: how i write software part 2
»»»

# how i write software part 2

Last Updated: October 2026

[Part 1](/notes/how-i-write-software/) explains how I start building a product.
This is about the smaller decisions inside a Go codebase. I keep explaining
these to agents, so here is something I can point them at.

## routes, controllers, services

For an application backend, I usually want this:

```text
routes -> controllers -> services -> database and integrations
                            ^
workers --------------------|
```

Routes register paths, methods and middleware, then connect them to controller
methods. A route file should make the HTTP surface easy to find.

Controllers deal with HTTP. Parse the body, path and query parameters, get the
caller and authorization context, call a service, and translate the result into
an HTTP response. Coordinating access checks can take a few lines. Thin does
not mean that every controller method has to fit in five lines.

Services own the product rules: whether an operation is allowed, what changes
together, and what happens when it fails. They take `context.Context` and
ordinary Go values. Passing a Fiber context into a service makes it harder to
call that service from a worker or a command.

I am comfortable with services querying the database directly. GORM and SQL
both have a place. I don't need a repository interface around every table.
Keeping the queries and transaction beside the operation often makes the code
easier to understand.

## give things an obvious home

I organise backend modules around the product: `users`, `rentals`, `payments`.
A module can have `service.go`, `models.go`, `errors.go`, and files named after
specific operations as it grows. I want to find refunds by looking for refunds.

The layout follows the program. In [dbtree](https://github.com/viveknathani/dbtree),
the useful boundaries are `database`, `graph` and `render`: inspect a schema,
build its graph, then render it. A CLI does not need controllers just because
my backend has them.

## binaries live in cmd

Executable entry points go under `cmd/<name>/`:

```text
cmd/api/main.go
cmd/worker/main.go
cmd/some-tool/main.go
internal/modules/payments/
internal/modules/rentals/
internal/controllers/
internal/routes/
```

Each entry point loads configuration, constructs dependencies, starts its work
and handles shutdown. Business logic belongs in packages the binaries can use.
The API and worker should call the same rental service when they perform the
same operation. A maintenance command should not need to start an HTTP server.

I prefer explicit constructors and wiring. Seeing where a database connection
or payment provider comes from is useful. I don't need a dependency injection
framework to hide those few lines.

## migrations have their own tool

I use versioned SQL migrations with a dedicated tool such as `golang-migrate`.
GORM can handle application queries; it does not get to infer production
schema changes through `AutoMigrate`.

Migrations run as an explicit deployment step. If they fail, deployment fails.
Starting another API or worker process should not quietly change the schema.
As in part 1, I prefer forward recovery and changes that let old and new code
briefly work against the same database.

## abstractions need a reason

Concrete structs and functions are a good starting point. I introduce an
interface when there is behaviour to substitute: a payment gateway, an IoT
provider, or different database inspectors. A fake and a real provider can
implement the same boundary without spreading vendor details through services.

This does not mean every service needs an interface. Sometimes a switch over a
few supported formats is perfectly readable. I want to understand the work
without jumping through several files that only forward the same arguments.

## keep the code comfortable to read

I aim for roughly 80 columns. I don't want to keep scrolling horizontally to
read a function call. Wrap long signatures and calls, and give complicated
expressions meaningful intermediate names. Use judgment when wrapping would
make something harder to read.

Use the repository's formatter and linter. In Go, `gofmt` handles formatting;
tools such as `golines` can help with line length. Agree on the settings once
and let the checks do the repetitive work.

Keep functions focused. Prefer early returns over deep nesting. Extract a
helper when it names a useful step, and keep related code close together.
Comments should explain the rule or reason: why a row is locked, why a retry
is safe, or why a state transition is refused.

## make the boundaries hold

A friendly validation check does not stop two concurrent requests from passing
it. Use transactions, constraints and row locks where the operation needs
them. Keep tenant scope explicit in queries. A queue does not make an operation
idempotent.

Return errors that callers can act on. Sentinel errors can identify a category;
typed errors can carry a stable conflict code and a useful message. Controllers
translate these into HTTP responses. Services should not choose HTTP statuses.

Tests should try to break the important rules: cross-tenant access, duplicate
execution, conflicting updates, and partial failure. Passing tests are useful
when they prove the behaviour we actually need.

When an agent adds a feature, I want to follow it from the route to the service,
through the transaction, and back to the response. The code should make that
ordinary review easy.
