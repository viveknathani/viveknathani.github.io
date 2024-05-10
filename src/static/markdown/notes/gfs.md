«««
title: gfs
»»»

# google file system

- does not implement a standard API such as POSIX
- other than usual operations, they support two more: snapshot and record append
- snapshot creates a copy of the file or a directory tree at low cost
- record append allows multiple clients to append to the same file concurrently while guarenteeing atomicity 
    - this helps in many way merge algorithms and producer-consumer queues
- one cluster has a single master and multiple chunkservers
- files are divided into fixed-size chunks, each chunk is identified by an immutable and globally unique 64-bit chunkhandle (kinda like an ID) assigned by master
- for reliability, each chunk is replicated on multiple chunkservers
- master contains all filesystem metadata
- file data is not cached, clients only cache metadata
- even tho a master exists, read and write operations take place directly b/w the chunkserver and the client
- read operation:
    - client knows filename and byte offset -> converts byte offset into chunk index -> possible because chunk size is known
    - master uses filename and chunk index to return chunkhandle and location of replicas where this chunk is available
    - client sends request to one of the replicas, mostly the closest one to get the actual chunk
    - chunk size is 64MB
- write operation:
    - client splits it write into multiple chunks
    - master returns the relevant chunkservers (primary + replicas) and chunk ids
    - client pushes data to all replicas
    - but replicas don’t write to disk yet, they hold it in memory, in LRU cache
    - replicas send ACK, client now sends request to primary
    - primary writes to disk and forwards write request to replicas
- all metadata in master is stored in-memory
- master maintains less than 64 bytes of data, for each 64MB chunk. the file namespace data requires less than 64 bytes per file because it stores file names compactly using prefix compression.
- operation log contains a historical record of critical metadata changes.
- GFS applications can accommodate the relaxed consistency model with a few simple techniques already needed for other purposes: relying on appends rather than overwrites, checkpointing, and writing self-validating, self-identifying records
- garbage collection process is lazy
- data integrity is taken care of by checksumming
- diagnostic tooling support is built-in, logging has minimal overhead
- GFS assumes that a large number of components are unreliable, hence fault tolerance is baked in.
