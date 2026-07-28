«««
title: sharing runtime configuration in concurrent Rust apps
date: 2026-07-28
tags: software, rust
»»»

# sharing runtime configuration in concurrent Rust apps

I've been building [signal](https://github.com/viveknathani/signal), a small network monitoring app for macOS. It is composed of a few long running tasks. The throughput sampler wakes every second. A connectivity check probes the gateway, DNS and the internet, while another task refreshes details about the selected interface. They all need to know which interface the user is monitoring right now.

The user can change that setting while the tasks are running. `Arc<RwLock<_>>` looks like enough: share the state and call it a day. Except the write has side effects. We need to save the choice and refresh the snapshot, and a task may still finish work for the old interface after the switch.

### tempting approaches

We could give every task its own copy of the configuration.

```rust
#[derive(Clone)]
struct RuntimeConfig {
    selected_interface: Option<String>,
}

let config = RuntimeConfig {
    selected_interface: Some("en0".to_string()),
};

tokio::spawn(run_throughput_sampler(config.clone()));
tokio::spawn(run_connectivity_sampler(config.clone()));
```

This works as long as the configuration never changes. Once the user selects `en7`, both tasks keep sampling `en0`. We could restart the workers every time the interface changes. That is fair when a new configuration really requires a rebuilt worker. For signal, changing one string did not justify tearing down the samplers and bringing them back up.

So we share one copy instead:

```rust
type SharedState = Arc<RwLock<AppState>>;

async fn select_interface(state: &SharedState, interface_id: String) {
    state.write().await.selected_interface = Some(interface_id);
}
```

Now every task can read the current selection on its next iteration. Rust also makes sure a read cannot overlap with a write.

But the setter above only changes a string. Who checks that the interface came from the list discovered at startup? Do samplers see the change before or after SQLite saves it? The current interface snapshot has to be replaced, and the menu bar and dashboard may need an update too.

An `RwLock` controls access to memory. It does not decide who is allowed to make an application-level transition. If every task holds an `Arc<RwLock<AppState>>`, every task has the technical ability to ask for a write guard. That's not elegant. Let's keep digging.

### separate observation from mutation

The samplers only need to ask which interface is current. A UI command needs to request a switch, but it does not need a mutable reference to the rest of `AppState`.

So give the two sides different handles. A sampler gets read access to the current interface. The UI gets a command sender.

Here is how signal's throughput sampler reads the selection:

```rust
let selected_interface = {
    let state = state.read().await;
    state.selected_interface.clone()
};

let Some(interface_id) = selected_interface else {
    continue;
};

let counters = interface_reader.read_interface_counters(&interface_id)?;
```

The sampler acquires a read guard, copies the interface ID and drops the guard before asking macOS for network counters. After cloning the `String`, the task owns the value it observed. It can do slow work without holding up a later change.

The selection can change one nanosecond after the clone, so the task may finish one last sample for the old interface. Rust has kept the memory safe. We still have to decide whether to accept that stale sample. We'll come back to this.

### the proposed approach

Signal keeps readable state behind an `Arc<RwLock<AppState>>`, but sends every post-startup mutation to `AppState` through one bounded [`mpsc`](https://docs.rs/tokio/latest/tokio/sync/mpsc/) channel.

The relevant types look like this:

```rust
#[derive(Clone)]
struct RuntimeHandle {
    sender: mpsc::Sender<AppEvent>,
    state: Arc<RwLock<AppState>>,
}

enum AppEvent {
    Config(ConfigEvent),
    Throughput(ThroughputSample),
    Connectivity(ConnectivitySample),
    InterfaceSnapshot(NetworkInterfaceSnapshot),
}

enum ConfigEvent {
    SelectedInterfaceChanged(String),
}
```

`RuntimeHandle` is the small public surface around the runtime. Its fields are private. A caller can ask for a snapshot or submit a supported change:

```rust
impl RuntimeHandle {
    async fn snapshot(&self) -> AppState {
        self.state.read().await.clone()
    }

    async fn set_selected_interface(
        &self,
        interface_id: String,
    ) -> Result<(), String> {
        self.sender
            .send(AppEvent::Config(
                ConfigEvent::SelectedInterfaceChanged(interface_id),
            ))
            .await
            .map_err(|err| err.to_string())
    }
}
```

At startup, the app creates one state value and one channel:

```rust
let state = Arc::new(RwLock::new(initial_state));
let (sender, receiver) = mpsc::channel(256);

start_event_reducer(state.clone(), receiver);
start_throughput_sampler(state.clone(), sender.clone());
start_connectivity_sampler(state.clone(), sender.clone());
start_interface_sampler(state.clone(), sender.clone());
```

The samplers read the configuration from `state`. Their output goes back into `sender`. The receiver belongs to a single reducer.

I think of this as a single-writer runtime. There may be many event producers and state readers, but the reducer is the one intentional writer to `AppState`.

### why one reducer matters

The reducer is an ordinary Tokio task with a loop:

```rust
while let Some(event) = receiver.recv().await {
    let mut state = state.write().await;

    match event {
        AppEvent::Config(
            ConfigEvent::SelectedInterfaceChanged(interface_id),
        ) => {
            state.select_interface(interface_id);
        }
        AppEvent::Throughput(sample) => {
            state.throughput_history.push(sample);
        }
        AppEvent::Connectivity(sample) => {
            state.connectivity_history.push(sample);
        }
        AppEvent::InterfaceSnapshot(snapshot) => {
            state.latest_interface_snapshot = Some(snapshot);
        }
    }
}
```

The real reducer does more than this shortened version. It validates throughput samples, trims in-memory history, stores samples in SQLite and emits updates to the Tauri frontend.

Only the reducer owns the receiver, so it handles one event at a time. The `RwLock` is still needed because samplers and the UI read state concurrently. Code holding the raw lock can break this convention; a `StateReader` keeps that lock away from collectors.

This gives a configuration change one home. The reducer can check that an interface exists, update the selected value, persist it and refresh the live snapshot in a known order. If we later decide that switching interfaces should clear the graph, there is one place to add that rule.

### choosing the right primitive

You do not need an `mpsc` channel and reducer in every Rust program.

If configuration is loaded once at startup, use `Arc<Config>`. There is no mutation to coordinate.

`Arc<RwLock<T>>` is a good fit when tasks read on their own schedule and occasionally need a fresh snapshot. Keep the guards short. Also consider a `Mutex` when the protected section is tiny or writes are common. An `RwLock` has more machinery and only helps when concurrent reads are actually useful.

Tokio's [`watch`](https://docs.rs/tokio/latest/tokio/sync/watch/) channel fits when consumers need the latest configuration and should wake when it changes. A watch channel retains one value. If the producer sends `en0`, then `en7`, then `en8` before a slow consumer wakes up, that consumer may observe only `en8`. For configuration, that can be exactly right.

`mpsc` fits when every message must be considered in order by one owner. Its bounded variant also gives you backpressure. It can work alongside `watch`: send commands to the owner through `mpsc`, then publish the accepted configuration through `watch`. Workers may skip intermediate settings, while the owner still considers every requested transition.

Atomics fit small independent values. An `AtomicBool` works for a stop flag that workers poll. An `AtomicU64` can hold a sampling interval that workers reload. Once several fields must change together, one configuration snapshot is easier to reason about.

Start with what each reader must observe. If only the newest value matters, updates may be coalesced. If every change matters, put it on a queue.

### closing thoughts

It's been a fun exercise towards what I'd like to call, "thinking in Rust". Signal was a way for me to flex those muscles. 

Happy hacking!