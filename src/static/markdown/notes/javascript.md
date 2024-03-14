«««
title: javascript
»»»

# javascript

javascript
1. use MDN as your reference
2. object-oriented. No distinction between types of objects. Inheritance is through the prototype mechanism, and properties and methods can be added to any object dynamically.
3. javascript cannot automatically write to disk
4. it is standardized at ECMA international - the standardized version is called ECMAScript and companies can use the open spec to develop their own implementations.
5. the ECMAScript specification does not describe the Document Object Model (DOM).
6. many JS engines exists - spidermonkey by firefox, v8 by chrome.
7. there are some pretty interesting web APIs available - https://developer.mozilla.org/en-US/docs/Web/API 
8. var  - declares a variable, optionally initializing it to a value
9. let - declares a block-scoped, local variable, optionally initializing it to a value
10. const - declares a block-scoped, read-only named constant
11. you can declare variables to unpack values using the destructuring assignment syntax
12. undeclared variables lead to ReferenceError
13. declared but unassigned variables get the value, undefined which is a primitive value in this language
14. typeof undefined returns undefined
15. const declarations always need an initializer, else lead to SyntaxError
16. scope types - global, module, function, block
17. var-declared variables are hoisted, meaning you can refer to the variable anywhere in its scope, even if its declaration isn't reached yet. You can see var declarations as being "lifted" to the top of its function or global scope. however, if you access a variable before it's declared, the value is always undefined, because only its declaration is hoisted, but not its initialization.
18. a variable declared with let, const, or class is said to be in a "temporal dead zone" (TDZ) from the start of the block until code execution reaches the place where the variable is declared and initialized. while inside the TDZ, the variable has not been initialized with a value, and any attempt to access it will result in a ReferenceError.
19. unlike var declarations, which only hoist the declaration but not its value, function declarations are hoisted entirely — you can safely call the function anywhere in its scope.
20. data types - Number, BigInt, String, Boolean, Symbol, undefined, null
21. typeof null is object
22. comparison with null and undefined is pretty non-intuitive
23. null == undefined returns true
24. null === undefined returns false
25. loop - basic for, do..while, while, for..in, for…of
26. all objects have a special property [[Prototype]], that is either null or references another object.
27. if you assign obj1 to obj2’s __proto__ value, obj2 will have all properties of obj1. obj2 has basically inherited obj1.
28. __proto__ is a historical getter/setter for [[Prototype]]
29. since it is a little outdated, it is suggested to use Object.getPrototypeOf/Object.setPrototypeOf
30. no matter where the method is found: in an object or its prototype. In a method call, this is always the object before the dot
31. *Object.keys only returns own keys but for...in returns both own and inherited keys*
32. obj.hasOwnProperty for checking if property is own
33. new objects can be created with a constructor function, like new F()
34. every function has the "prototype" property even if we don’t supply it.
35. Object has a default toString method - returns “[object Object]”
36. read up on extending errors, can be pretty helpful
37. closures - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures 
38. event based programming in the browser is a pretty good example of closures
39. this is fucking weird - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this
40. sorting of array happens in-place
41. to sort the elements in an array without mutating the original array, use toSorted()
42. typed arrays are made up of Buffers and Views - useful stuff but read about them when you need them
43. garbage collection algorithms - reference counting (not used by any existing engine implementations), mark-and-sweep
44. built-in eval function allows to execute a string of code
45. javascript is single threaded and synchronous
46. at low-level, all info is stored as key-value pairs in what we call as variable environment
47. at low-level, all code is executed in thread of execution
48. thread of execution + variable environment = execution context
49. new function invoke => new execution context created
50. call stack maintains the order of execution of execution contexts
51. hoisting: variable declarations are scanned and made undefined, function declarations are scanned and made available
52. global space: anything that is not in a function, is in global space
53. variables present in global space can be accessed by window object
54. in global space, window === this
55. undefined is like a placeholder till a variable is assigned some value
56. undefined does not mean not defined
57. javascript is loosely typed or weakly typed, types have flexibliity 
58. not a good practice to explicitly assign undefined to a variable
59. let and const are hoisted but allocated memory in place different than the window object, cannot be accessed until initialized, hence lie in temporal dead zone
60. prefer const over let over var
61. a block is defined by {}
62. let and const are block-scoped
63. shadowing: giving a variable in a child scope the name of a variable in the outer scope
64. closure: function + its lexical environment
65. use of closure: module design pattern, currying, once, memoize, maintain state in async, setTimeout, iterator
66. function statement/declaration: normally defined function fun() {}
67. function expresssion: created and assigned to a variable
68. anonymous function: function without a name
69. named function expression: function with a name, assigned to a variable, but not accessible in global scope with that function name, only by the variable name
70. functions in javascript are first-class: used as values, can be passed as arguments, can be executed inside a closure function, can be returned
71. callback function: function passed as argument to another function
72. things which take time can block the main thread
73. event loop = call stack + microtask queue + callback queue
74. microtask queue: promises, mutation observers
75. microtask queue > callback queue: this can lead to starvation of functions in callback queue
76. higher-order function: take another function as argument or return a function
77. be comfortable with map, filter, and reduce
78. promise: do some work, then resolve it or reject it. user of your promise has to write callbacks for then, catch, finally
79. promise states: pending, fulfilled, rejected
80. settled state = fulfilled or rejected
81. promise API: all, allSettled, race, any, resolve, value
82. async/await: wait for a promise to settle
83. nodejs talk by ryan dahl - https://www.youtube.com/watch?v=EeYvFl7li9E&ab_channel=JSConf 
84. concurrent request handling - https://stackoverflow.com/questions/34855352/how-in-general-does-node-js-handle-10-000-concurrent-requests 
85. the learn section - https://nodejs.org/en/learn/ 
86. when is it single threaded - https://www.youtube.com/watch?v=gMtchRodC2I&ab_channel=HusseinNasser 
87. libuv - https://www.youtube.com/watch?v=_c51fcXRLGw&ab_channel=node.js 
88. you don’t know node - https://www.youtube.com/watch?v=NLtL-EEclRc&ab_channel=JSConf 
89. profiling - https://www.youtube.com/watch?v=ASv8188AkVk&ab_channel=InfoQ 
