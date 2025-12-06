«««
title: more than 1
»»»

# more-than-1

we rarely want applications to process things 1 at a time. if systems are to do more stuff, how will that work fundamentally?

### thread
- a thread is very much like a separate process, except that threads actually live in the same address space and thus can access the same data
- each thread has it own private set of registers
- when switching from one thread to another, a context switch must take place
- b/w context switch in processes, state of the process is stored in process control blocks. similarly, you have thread control blocks here.
- though, each thread will have its own stack.
- why threads?
    - they solve for parallelism.
    - they avoid blocking program process due to slow I/O
- a critical section is a piece of code that accesses a shared resource, usually a variable or data structure.
- when two or more threads try to update the same resource at the same time, it leads to non-deterministic outcomes - creating a race condition
- to avoid this, threads must use mutual exclusion primitives
- thread API
    - pthread_create -  for creating threads
    - pthread_join - suspends execution of the calling thread until the target thread terminates unless the target thread has already terminated.
- what happens to a thread if you kill the program - most resources are released but some (but very imp ones) become a victim of memory leaks
- kernel vs user
    - a kernel thread is a lightweight unit of kernel scheduling
    - threads are sometimes implemented in userspace libraries, thus called user threads. The kernel is unaware of them, so they are managed and scheduled in userspace.
    - however, the use of blocking system calls in user threads (as opposed to kernel threads) can be problematic. If a user thread or a fiber performs a system call that blocks, the other user threads and fibers in the process are unable to run until the system call returns. a typical example of this problem is when performing I/O: most programs are written to perform I/O synchronously. when an I/O operation is initiated, a system call is made, and does not return until the I/O operation has been completed. In the intervening period, the entire process is "blocked" by the kernel and cannot run, which starves other user threads and fibers in the same process from executing.
- hardware
    - until the early 2000s, most desktop computers had only one single-core CPU, with no support for hardware threads. a "hardware thread" is a physical CPU or core. So, a 4 core CPU can genuinely support 4 hardware threads at once - the CPU really is doing 4 things at the same time. ne hardware thread can run many software threads. In modern operating systems, this is often done by time-slicing - each thread gets a few milliseconds to execute before the OS schedules another thread to run on that CPU. Since the OS switches back and forth between the threads quickly, it appears as if one CPU is doing more than one thing at once, but in reality, a core is still running only one hardware thread, which switches between many software threads.
    - a graphics processing unit (GPU) is a specialized electronic circuit initially designed to accelerate computer graphics and image processing (either on a video card or embedded on motherboards, mobile phones, personal computers, workstations, and game consoles). after their initial design, GPUs were found to be useful for non-graphic calculations involving embarrassingly parallel problems due to their parallel structure. other non-graphical uses include the training of neural networks and cryptocurrency mining.
- thread pools
    - a popular programming pattern involving threads is that of thread pools where a set number of threads are created at startup that then wait for a task to be assigned. when a new task arrives, it wakes up, completes the task and goes back to waiting. this avoids the relatively expensive thread creation and destruction functions for every task performed and takes thread management out of the application developer's hand and leaves it to a library or the operating system that is better suited to optimize thread management. 
- as thread context switch on modern CPUs can cost up to 1 million CPU cycles (http://ithare.com/infographics-operation-costs-in-cpu-clock-cycles/) , it makes writing efficient multithreading programs difficult. In particular, special attention has to be paid to avoid inter-thread synchronization from being too frequent.
- an algorithm is called non-blocking if failure or suspension of any thread cannot cause failure or suspension of another thread
- producer consumer problem (or the bounded buffer problem) - producers generate data items and place them in a buffer; consumers grab said items from the buffer and consume them in some way. because the bounded buffer is a shared resource, we must of course require synchronized access to it, lest a race condition arise.

### fibers
-  a fiber is a particularly lightweight thread of execution. like threads, fibers share address space. however, fibers use cooperative multitasking while threads use preemptive multitasking. threads often depend on the kernel's thread scheduler to preempt a busy thread and resume another thread; fibers yield themselves to run another fiber while executing.

### locks
- provide mutual exclusion to a critical section
- API
    - pthread_mutex_lock
    - pthread_mutex_unlock
- adding locks to a data structure to make it usable by threads makes the structure “thread safe”

### condition variable
- useful when some sort of signaling has to take place b/w threads. example, if one thread is waiting for another to do something before it can continue.
- API
    - pthread_cond_wait
    - pthread_cond_signal
    - pthread_cond_broadcast
    - pthread_cond_init
    - pthread_cond_destroy

### semaphore
- a semaphore is a variable or abstract data type used to control access to a common resource by multiple threads and avoid critical section problems in a concurrent system such as a multitasking operating system.
- semaphores can also be used for signalling b/w thread
- hence a semaphore = lock + conditional variable in one
- they can be more complex to use

### concurrency vs parallelism
- concurrency is about managing multiple tasks by switching between them, while parallelism is about actually doing multiple tasks at the same time

### event based concurrency
- the crux: “how can we build a concurrent server without using threads, and thus retain control over concurrency as well as avoid some of the problems that seem to plague multi-threaded applications?”
- you collect all the waiting events and process them one by one. when a handler processes an event, it is the only activity taking place in the system.
- how exactly does an event-based server determine which events are taking place, in particular with regards to network and disk I/O? Specifically, how can an event server tell if a message has arrived for it? it lets you check whether descriptors can be read from as well as written to; the former lets a server determine that a new packet has arrived and is in need of processing, whereas the latter lets the service know when it is OK to reply (i.e., the outbound queue is not full).
- poll() examines a set of file descriptors to see if some of them are ready for I/O or if certain events have occurred on them.
- what if an event requires that you issue a system call that might block? to overcome this limit, many modern operating systems have introduced new ways to issue I/O requests to the disk system, referred to generically as asynchronous I/O. when async IO completes, “signals” are issued.
- event based programming requires manual stack management
- what is still difficult with events - 
    - work great on single core CPUs, run into problems on multi core CPUs
    - paging causes blocking
    - event based code can be hard to manage
- when node.js performs an I/O operation, like reading from the network, accessing a database or the filesystem, instead of blocking the thread and wasting CPU cycles waiting, Node.js will resume the operations when the response comes back.

### green thread
- a green thread is a thread that is scheduled by a runtime library or virtual machine (VM) instead of natively by the underlying operating system (OS). green threads emulate multithreaded environments without relying on any native OS abilities, and they are managed in user space instead of kernel space, enabling them to work in environments that do not have native thread support.
- green threads share a single operating system thread through co-operative concurrency and can therefore not achieve parallelism performance gains like operating system threads.
- the main benefit of coroutines and green threads is ease of implementation.
- goroutines are like green threads but not exactly green threads. they are more similar to being a M:N thread scheduler. they map M light-weight threads to N kernel threads. important talks - https://www.youtube.com/watch?v=-K11rY57K7k&ab_channel=Hydra, https://www.youtube.com/watch?v=KBZlN0izeiY&t=536s&ab_channel=GopherAcademy

### further reading
- if you come back here and wish to read some theoretically interesting laws - check amdahl’s law and gustafson’s law.
