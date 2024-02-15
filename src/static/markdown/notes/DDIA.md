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
