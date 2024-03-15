«««
title: javascript
»»»

# go
1. a rune literal represents a rune constant, an integer value identifying a Unicode code point
2. a string literal represents a string constant obtained from concatenating a sequence of characters
3. raw vs interpreted string literals
4. strings are immutable in go
5. byte is an alias for uint8
6. rune is an alias for int32
7. int is 32-bit or 64-bit depending upon environment
8. for is go’s only looping construct
9. range iterates over elements in a variety of data structures
10. variadic functions can be called with any number of trailing arguments
11. go supports closues
12. the blog on strings - https://go.dev/blog/strings
13. size of an array is fixed in go
14. slice is a data structure describing a contiguous section of an array, slice is not an array, it is what describes a piece of an array
15. it has a length variable and a pointer to the first value of the array
16. however, a slice in itself is a value to the underlying array, not a pointer. this matters. dig why - https://go.dev/blog/slices
17. slice has a third component inside it called the capacity - it is the max possible value for length
18. concurrency is not parallelism - https://www.youtube.com/watch?v=oV9rvDllKEg&ab_channel=gnbitcom 
19. understand package sync by usage
20. concurrency patterns 1 - https://www.youtube.com/watch?v=f6kdp27TYZs&ab_channel=GoogleforDevelopers 
21. concurrency patterns 2 - https://www.youtube.com/watch?v=QDDwwePbDtw&ab_channel=GoogleforDevelopers 
