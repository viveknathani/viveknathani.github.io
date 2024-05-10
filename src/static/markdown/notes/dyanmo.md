«««
title: dynamo
»»»

# dynamo

- a key-value store that is highly available, weak on consistency under certain scenarios
- meant to handle cases where a relational structure would not help
- many services on Amazon’s platform that only need primary-key access to a data store - dynamo provides a simple interface for this
- data is partitioned and replicated using consistent hashing
- consistency is facilitated by object versioning
- has a gossip based distributed failure detection and membership protocol
- decentralized system, does not require manual administration
- RDBMS chooses consistency over availability - this was a problem at amazon’s scale
- and many of their services needed to access the data by some sort of ID - no complex querying
- dynamo does not provide isolation guarantees and permits only single key updates
- when trying to assess performance, amazon prioritizes 99.9th percentile over average or median because their goal is to build systems where all the customers have a good experience instead of just the majority
- if consistency is weak, conflicts will happen amongst replicas
- conflicts need resolution - to do it at read time or write time?
- to do it at write time would cause some writes to fail in some scenarios - cannot work with this, hence resolve conflicts during read time
- who resolves conflicts? ideally the application but if app devs don’t want to get into this - the data store will do it with “last write wins” technique
- their design goal was to make it decentralized but they could not adopt a DHT routing based approach of the popular P2P systems because these routing hops introduce high variability in response times hence “dynamo can characterized as a zero hop DHT”
- API - get(key), put(key, context, object)
- applies a MD5 hash on the key to generate a 128-bit identifier, which is used to determine the storage nodes that are responsible for serving the key
- principle advantage of consistent hashing is that departure or arrival of a node only affects its immediate neighbors and other nodes remain unaffected
- they changed the basic consistent algorithm to a version where uniform data and load distribution is possible
- for replication, each key gets a coordinator node
-  list of nodes that is responsible for storing a particular key is called the preference list
- system is designed in a way that every node can determine the preference list of any given key
- dynamo allows for multiple versions of a data object to be present in the system at the same time
- vector clocks are used to determine if two versions are concurrent or causal
- when doing a put operation, you need to specify the version you are trying to update - this is done in the context argument
- temporary failures are handled via hinted handoff
- to detect the inconsistencies between replicas faster and to minimize the amount of transferred data, Dynamo uses Merkle trees - mention of “anti entropy protocol”
- membership problem is solved by using a gossip based protocol
- ALL OF THE ABOVE WAS FOR DYNAMO, NOT DYNAMODB
- they had to make dynamo more accessible and address the limitations of simpledb so they made dynamodb
- dynamodb supports ACID transactions
- has encryption at rest
- data is stored in Tables as items, and can be queried using indices
- dynamodb uses JSON for its syntax
- uses B-trees internally to manage the data
- uses paxos for consensus
