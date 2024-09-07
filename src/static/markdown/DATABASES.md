«««
title: databases
»»»

# databases

I am a big fan of databases. The knowledge around this is scattered. This page is an attempt to encapsulate stuff that I find interesting in an order that I think will help the reader develop the right mental model.

1. data models
- [hierarchical](https://en.wikipedia.org/wiki/Hierarchical_database_model)
- [network](https://en.wikipedia.org/wiki/Network_model)
- [relational](https://en.wikipedia.org/wiki/Relational_model)
2. normalization, connection pooling, enums, pagination
- [normalization](https://en.wikipedia.org/wiki/Database_normalization)
- [connection pooling](https://en.wikipedia.org/wiki/Connection_pool)
- [enums](https://vivekn.dev/notes/database-admin#enums)
- [no offset](https://use-the-index-luke.com/no-offset)
3. memory and disk
- [what every programmer should know about memory](https://people.freebsd.org/~lstewart/articles/cpumemory.pdf)
- [disk](https://en.wikipedia.org/wiki/Disk_storage)
- [what every programmer should know about SSDs](http://databasearchitects.blogspot.com/2021/06/what-every-programmer-should-know-about.html)
4. hash tables and linked lists
- [hash tables](https://github.com/rust-lang/rust/tree/9afe7136958edaa403f0b0eb00f0353c125b7352/library/std/src/collections/hash)
- [linked list](https://github.com/rust-lang/rust/blob/9afe7136958edaa403f0b0eb00f0353c125b7352/library/alloc/src/collections/linked_list.rs)
5. trees
- [primer](https://en.wikipedia.org/wiki/Tree_(data_structure))
- [b-tree](https://en.wikipedia.org/wiki/B-tree)
6. indexing
- [stackoverflow](https://stackoverflow.com/questions/1108/how-does-database-indexing-work)
7. LSM + SST
- [jordan has no life's video](https://www.youtube.com/watch?v=ciGAVER_erw&ab_channel=Jordanhasnolife)
9. btrees vs LSM+SST
- [usenix](https://www.usenix.org/publications/loginonline/revisit-b-tree-vs-lsm-tree-upon-arrival-modern-storage-hardware-built)
10. replication, sharding, transactions, clocks, consistency
- DDIA chapter 5-9
13. memcached, redis
- [redis source](https://github.com/redis/redis)
- [memcached source](https://github.com/memcached/memcached)
14. dynamo, dynamodb, mongodb, cassandra, etcd
- [dynamo paper](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)
- [dynamodb paper](https://www.usenix.org/system/files/atc22-elhemali.pdf)
- [mongodb source](https://github.com/mongodb/mongo/tree/master)
- [cassandra source](https://github.com/apache/cassandra)
- [etcd source](https://github.com/etcd-io/etcd)
15. cockroachdb, tigerbeetle
- [cockroachdb source](https://github.com/cockroachdb/cockroach)
- [tigerbeetle source](https://github.com/tigerbeetle/tigerbeetle)
16. distributed hash tables
- [primer](https://en.wikipedia.org/wiki/Distributed_hash_table)
17. aurora
- [aurora paper](https://pages.cs.wisc.edu/~yxy/cs839-s20/papers/aurora-sigmod-18.pdf)
18. clickhouse, timescale
- [clickhouse architecture blog post](https://clickhouse.com/docs/en/development/architecture)
- [timescaledb architecture](https://github.com/timescale/docs.timescale.com-content/blob/master/introduction/architecture.md)
19. graph databases
- [primer](https://en.wikipedia.org/wiki/Graph_database)
20. geospatial databases
- [primer](https://en.wikipedia.org/wiki/Spatial_database)
21. which database to use
- [TODO - write this on your own]
