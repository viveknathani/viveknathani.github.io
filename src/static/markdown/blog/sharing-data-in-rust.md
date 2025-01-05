«««
title: sharing data in rust
»»»

# sharing data in Rust

January 2025

We are interested in looking at various ways to share data in Rust under various conditions. This deserves a summarized understanding because Rust is powerful but also complex. [This book](https://marabos.nl/atomics/) is a great resource to have in your library and the post often takes ideas from it.

### read access to all threads with no dynamic allocation, no mutation
Use the `static` keyword for this. This variable is owned by the entire program instead of an individual thread. Useful for truly immutable data or lazily initialized global data shared across threads. Use synchronization primitives like `Mutex` or `RwLock` to provide mutable access to the data.

### absolute freedom like C
Use raw pointers - `*const T` and `*mut T`. This is useful and sometimes the only way to do things but it will usually lead to unsafe code.

### write to an internal property of a struct without making the struct instance mutable
Use `Cell` or `RefCell` for this. Bot allow you to mutate data even when it's behind an immutable reference. 

`Cell` works for simple, `Copy` types like integers, booleans, etc. `RefCell` works for non-Copy types like `String` and `Vec`.

`RefCell` also allows you to borrow the data mutably at runtime. This is useful when you can't determine at compile time whether you need mutable access to the data.

`Cell` is a bit faster than `RefCell` because it doesn't do runtime checks. `RefCell` panics at runtime if you violate the borrowing rules.

<i>Limitation: both work only for single-threaded code only. For `Cell`, the escape hatch here is to use `UnsafeCell` but it does not guarantee thread safety.</i>

### read and write access across threads
This involves the idea of locking.

The job of a `Mutex` is to ensure threads have exclusive access to some data by temporarily blocking other threads that try to access it at the same time. It has two states: locked and unlocked. Locking is an explicit action performed by `lock()`. Unlocking is implicit and happens when the mutex goes out of scope. This is why it's important to ensure that the mutex goes out of scope as soon as possible. A common runtime bug is to keep the lock in scope for too long. Prevent this by doing your work inside a scope.

`RwLock` has three states: read-locked, write-locked, and unlocked. It allows multiple readers or one writer at a time. This is useful when you have a large data structure and you want to allow multiple threads to read it at the same time. The writer blocks all readers and writers.

### lock-free, thread-safe, and efficient operations
Use `AtomicBool`, `AtomicIsize`, `AtomicUsize`, etc. for lock-free, thread-safe, and efficient operations. They are useful for simple types like integers and booleans. They are not useful for complex types like `String` and `Vec`.

Common patterns: `load`, `store`, `swap`, `compare_and_swap`, `fetch_add`, `fetch_sub`, etc.

Atomics avoid the overhead of a `Mutex` or a context switch because they operate at the hardware level, ensuring synchronization without blocking.

Common usecases: Keeping a global counter, toggling a flag, or accessing a single value across threads.

### if you think of the flow of your data like a river
Channels are one of the most idiomatic ways to share data between threads in Rust. They allow safe, synchronized, and structured communication by transferring ownership of data from one thread to another. The standard library provides multi-producer, single-consumer channels (mpsc). You can create a channel with `std::sync::mpsc::channel()` which returns a `(Sender, Receiver)` pair. Threads can send data using the Sender and receive data using the Receiver.