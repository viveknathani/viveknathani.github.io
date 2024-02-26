«««
title: designing data intensive applications
»»»


# designing data intensive applications

1. goal is to make systems that are reliable, scalable, and maintainable.
2. data models: relational, document, graph, triple store.
3. appending to a file is generally very efficient, most databases internally use a log, which is an append-only data file.
4. an index is an additional data structure that is derived from your primary data.
5. a well-chosen index can speed up your read queries, but every index will slow down your writes.
6. simplest index is the hash index. for a DB that stores key-value pairs on disk, a hash index can be an in-memory map for every key to its corresponding byte offset in the data file. only caveat here is that the entire index stays in memory so it has limitations w.r.t. the available RAM. apparently, this is also what bitcask does.
7. TODO: read the bitcask paper and implement a mini version of it.
8. if you just keep appending to a file, you will eventually run out of space on the disk. solution: break the log into segments of a certain size. when the size has reached, start writing in a new file. later, perform compaction on all these segments. throw away duplicate keys in the log. only keep the most recent update for each key. after this, size of the segments will reduce. merge these segments. compaction and merging can happen in background. each segment gets it's own in-memory hash table.
9. binary format is typically the best for logs.
10. also, the term "log" is used here in a more general sense to represent records of data than just limiting it to the idea of application logs.
11. deleting a record from this DB requires a special deletion record to be added which is sometimes called as the tombstone. key will get discarded during the merging process.
12. checksums can prevent having partially written records - see how.
13. control concurrency here by having a single writer thread.
14. range queries are a mess in this structure - you will have to lookup all the keys in a given range in your hash table.
15. new idea - store keys in sorted order in the segment file. makes merging process efficient - use mergesort.
16. you no longer need to keep the index of all the keys in memory - you will have a sparse index.
17. the file that stores the sorted key-value pairs is called the SSTable (sorted string table).
18. maintaining a sorted structure on disk is possible but it is easier to maintain it in memory using a red black tree or an AVL tree. when the size of the tree reaches a threshold, write it out to disk.
19. the in memory balanced tree is often called as the memtable.
20. combination of the memtable + SSTable is called as the log structured merge tree. they are an efficient altenrative to B+ trees as they scale writes better.
21. gkcs made a good video on LSM.
22. another form of index is the b-tree. b-trees keep key-value pairs sorted by key.
23. b-trees break the database down into fixed-size blocks or pages and read or write one page at a time.
24. since b-trees have to overwrite a page on disk with new data, it can happen that the data gets corrupted in event of a database crash. to make it resilient, b-trees uses an additional structure on disk - the write ahead log.
25. concurrency in writing to b-trees is solved by using latches (lightweight locks).
26. TODO: implement a b-tree and read about it's optimizations.
27. compare b-trees with LSM trees.
28. you can have your own indexes in a table - the secondary indexes.
29. seondary indexes can be clustered (store the entire row as the value)  or non clustered (store reference to the row as value) or covering (store only a few columns).
30. multi-column indexes have keys that represent more than one column.
31. you can also have a fuzzy index to support full-text search.
32. use OLAP instead of OLTP for analytical queries at scale. data warehouse over a database.
33. the interface language to a data warehouse is mostly SQL. and the data model of a data warehouse is mostly relational.
34. to speed up queries in OLAP - the storage of data can be column-oriented instead of row-oriented.
35. an idea that keeps coming up frequently is that you can compress blocks/pages/columns of data to save disk space.
36. chapter-3 needs to be read multiple times in order to fully internalise what is truly going on. great book!
37. replication - keep a copy of the same data on multiple machines. why? be geographically closer to your users, allow system to be available if some parts have failed, scale out the number of machines that can serve read queries.
38. popular algorithms: single-leader, multi-leader, leaderless.
39. in a leader based approach - the leader is the one where writes happen. and other "follower" nodes just get their copies updated.
40. replication can be: synchronous, asynchronous, semi-synchronous (copy to one node in sync and to rest async).
41. mostly, replication is fast. but under heavy workloads, it can slow down. seen this at Investmint a couple of times.
42. when you want to setup a new follower, take a snapshot of the existing data and capture the timestamp. copy the data to your new node. next, use the timestamp to get all updates after this in the database log. in postgres, instead of timestamp, log sequence numbers are used. in mysql, they are called as binlog coordinates.
43. when a node goes down: if it is a follower, it just needs to catch-up with the new updates whenever it is back. when it is a leader who has failed, it may require manual intervention. a new leader needs to be chosen and the system needs to be configured to use the new leader. it is possible that the new leader might be a little out of sync with the leader who died. this can lead to discarding of some data. this can be undesirable for some systems. github ran into this problem because they had auto incrementing ids in their system and the sequencing got messed up because the leader went down and the best possible was a little out of sync. in some situations, two nodes might believe that they are the leader. this is called a split brain situation. in general, choosing a new leader is usually ver hard. some companies prefer to just do this manually.
44. replication log implementation: statement, WAL shipping, logical row based, trigger based
45. workarounds for replication lag: have a read-after-write consistency guarantee, do monotonic reads, do consistent prefix reads.
46. multi leader replication is hard and rarely needed. one usecase where it is required: having multiple data centers in different geographies. you need to think about stuff like conflict resolution (which has a lot in parallel with the problem of implementing realtime collaborative editing). clients that support offline operations in multiple devices have a similar multi leader pattern. checkout couchdb.
47. ways for resolving write conflict: last write wins, or show merged values, or let the application resolve it instead of doing it in the DB layer (bucardo and couchdb let you do this).
48. areas of research in conflict resolution: conflict free replicated datatypes (CRDTs), meregable persistent data structures, operational transformation (used behind etherpad and google docs).
48. leaderless replication - the idea existed in the earlier days but became fashionable after amazon adopted it. writing to all nodes happens in parallel. reading from all happens in parallel too. once items are fetched, the one with the latest version number is considered to be valid.
49. strategies for fixing out-of-sync nodes: read repair, anti entropy.
50. if there are n replicas, every write must be confirmed by w nodes to be considered successful, and we must query at least r nodes for each read. as long as w + r > n, we can expect to get an up-to-date value. reads and writes that obey these r and w values are called quorum reads and writes. n, w, and r are typically configurable. if fewer than w or r nodes are available, writes or reads return an error.
51. limitations of quorum consistency - sloppy quorums, concurrent writes, concurrent read and write, no rollback of values in case of partial failure.
52. dynamo-style databases are handled for cases that can tolerate eventual consistency.
53. monitoring is harder in leaderless replication.
54. fix sloppy quorums by "hinted handoff". although, sloppy quorums increase write availability.
55. leaderless replication is helpful in multi datacenter operations.
56. look into the algorithm to determine if two operations are concurrent or whether one happened before the other.
57. version vectors help in concurrent writes too.
58. sharding: watch the gkcs video.
59. transactions: group several reads and writes into one logical unit. either you commit, or rollback.
60. they have a cost: can decrease performance slightly, make systems less available.
61. the NoSQL guys dislike it, call it the "antithesis of scalability".
62. the safety guarantees of transactions are defined by ACID - atomicity, consistency, isolation, durability.
63. atomicity: all or nothing behaviour.
64. consistency: in context of ACID, it means keep the system in a "good state". however, the invariants of a system depend on the application, not on the database. so consistency in ACID is just there, without much importance.
65. isolation: two transactions are unaware about each other's existence.
66. durability: a promise that once a transaction has been commited, any data it has written will not be forgotten. however, nothing in perfect. disks can crash or get corrupt at a later point in time. unless you have backups, nothing can save you.
67. TODO: explore storage systems.
