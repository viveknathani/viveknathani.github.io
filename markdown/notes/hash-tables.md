«««
title: hash-tables
»»»

# hash tables

1. i know enough about usage. some notes on underlying implementations.
2. approaches for implementing: do it by chaining, do it by open-addressing.
3. an array A of length m is filled with n elements. m >= n. and a (k,v) pair gets stored at A[h(k)] = v. h(x) is the hash function.
4. load factor alpha = (number of entries) / (number of buckets);
5. if load factor reaches alpha-max or alpha-max/4, hash table is resized.
6. separate chaining - store a linked list at each array index. items that collide are chained in the list.
7. the linked list of separate chaining implementation may not be cache-conscious due to spatial locality—locality of reference—when the nodes of the linked list are scattered across memory, thus the list traversal during insert and search may entail CPU cache inefficiencies. in cache-conscious variants, a dynamic array 
8. probing is kinda messed up imo - you get the hash and you then you use some sequence to find the best index for insertion tho it benefits on the locality front.
9. this is really cool - https://github.com/golang/go/blob/master/src/runtime/map.go 