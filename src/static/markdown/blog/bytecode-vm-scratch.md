«««
title: the joy of building a bytecode VM from scratch
date: 2025-08-08
draft: true
tags: c, compilers, software
»»»

# the joy of building a bytecode VM from scratch

A few months ago, I was working on [numero](https://numero.vivekn.dev). It is a math expression parser. I thought I was building a calculator. Turns out, I was actually standing at the edge of the compiler rabbit hole.

Parsing led to ASTs. ASTs led to evaluation. Evaluation led to... wait, am I building a language?

While exploring, I came across the excellent books by [Thorsten Ball](https://thorstenball.com/) - [Writing An Interpreter In Go](https://interpreterbook.com/) and [Writing A Compiler In Go](https://compilerbook.com/). They walk you through building a full interpreted programming language in Go, step by step.

Inspired by that, I knew I wanted to build a toy language of my own. Although, copying the implementation file-by-file didn’t sound fun. So to make things interesting: I rewrote the whole thing in C.

It doesn’t support closures. It doesn’t have a garbage collector. It’s definitely still a toy.

But it works! And it compiles to a self-contained executable.

In this post, I’ll walk you through what it took to go from monkey’s source code to an actual executable that feels like magic to me. You'll see why.

## high level design

Let’s zoom out for a moment. What does it even mean to build a language that compiles to a self-contained executable?

```bash
monkey source code → lexer → parser → AST → compiler → bytecode → VM → output
```

I added one final layer:
```
bytecode + runtime stub -> linked together -> native executable
```

It’s not a compiler in the traditional sense (like C → machine code) but it is conceptually kinda similar to how Deno, Bun or Node.js produce self-contained executables for JavaScript.

## designing the stack-based bytecode VM

After I had the compiler emitting bytecode, I needed a way to run it. Enter: the virtual machine.

I went with a stack-based VM, much like the books I was using. It’s the simplest design that gets the job done. Just push values, pop values, execute opcodes. No registers, no optimization, just a tight loop over instructions.

Here's what lives inside the VM struct:

```c
  struct VM {
    Object* constants;     // loaded from bytecode constant pool
    int constantsCount;
    Object* stack;         // evaluation stack for expressions
    int stackCount;
    int sp;               // stack pointer (top of stack)
    Object* globals;      // global variable bindings
    int globalCount;
    Frame* frames;        // call frame stack for functions
    int frameCount;
    int framesIndex;      // current frame depth
  };
```

There’s a fixed-size stack for evaluation, a pool of constants, a globals store, and a frame stack for function calls.

```c
int push(VM *vm, Object *object) {
  if (vm->sp >= STACK_SIZE) {
    fprintf(stderr, "stack overflow: exceeded maximum stack size of %d\n", STACK_SIZE);
    return -1;
  }
  vm->stack[vm->sp] = *object;
  vm->sp++;
  return 0;
}
```

Yes, it’s just an array. Yes, I’ve hit the overflow error more times than I care to admit.

And the loop:
```
while (ip < instructions_len) {
  Opcode op = read_opcode();
  switch (op) {
    case OP_CONSTANT:
      push(constants[read_operand()]);
      break;
    case OP_ADD:
      Object* b = pop();
      Object* a = pop();
      push(add(a, b));
      break;
    ...
  }
}
```

Control flow uses computed jumps. Conditional jumps pop the condition from the stack and test truthiness:

```c
  case OpJumpNotTruthy: {
    int pos = ((unsigned char)instructions[ip + 1] << 8) |
              (unsigned char)instructions[ip + 2];
    currentFrame(vm)->ip += 2;

    Object *condition = pop(vm);
    if (!isTruthy(condition)) {
      currentFrame(vm)->ip = pos - 1;  // -1 because loop will increment
    }
    break;
  }
```

Call frames manage function invocation state. Each frame tracks the compiled function, instruction pointer, and base pointer for local variable access:

```c
  typedef struct {
    CompiledFunction *compiledFunction;
    int ip;           // instruction pointer within this function
    int basePointer;  // stack offset for local variables
  } Frame;
```

The VM maintains a frame stack and switches between frames during function calls. Local variables are accessed by indexing into the evaluation stack relative to the frame's base pointer.

## compiler to bytecode

Now for the compiler which is the part that turns AST into bytecode.

The compiler walks the AST in a single pass, emitting instructions into an instruction buffer. It also tracks a constant pool and symbol tables for scope resolution.
```c
  typedef struct {
    Instructions instructions;  // current compilation scope's bytecode
    Object *constants;         // constant pool (shared across scopes)
    int constantsCount;
    SymbolTable *symbolTable;  // handles global/local/builtin scope resolution
    CompilationScope *scopes;   // stack of compilation scopes for functions
    int scopeIndex;            // current scope depth
  } Compiler;
```

Each compilation scope tracks its own instruction buffer, allowing nested function compilation:

```c
  typedef struct {
    Instructions instructions;
    int instructionsLength;
    EmittedInstruction lastInstruction;    // for optimization passes
    EmittedInstruction previousInstruction;
  } CompilationScope;
```

Symbol table management uses a linked structure for lexical scoping. Global variables get indices in the global store, while locals get stack offsets:

```c
  Symbol define(SymbolTable *symbolTable, char *name) {
    Symbol symbol;
    symbol.name = name;
    symbol.index = symbolTable->numDefinitions;

    if (symbolTable->outer == NULL) {
      symbol.scope = GlobalScope;  // top-level binding
    } else {
      symbol.scope = LocalScope;   // function parameter or local
    }

    symbolTable->numDefinitions++;
    return symbol;
  }
```

Constants stay in a shared pool. Integer literals get stored as objects. Each compiled function also becomes a constant: which makes functions first-class values. A function literal compiles into its own instruction sequence inside a new scope. The result is packed into a `CompiledFunction` object and emitted as a constant.

## producing native executables

This part was my favorite.

Once I had bytecode, I wanted to go further: create real binaries. Binaries you can `chmod +x` and run. Binaries that contain the VM + the program.

Here’s how it works.

Bytecode Serialization
The compiler emits a ByteCode struct that includes the final instruction buffer and constant pool. This is serialized into binary format with type tags:

```c
uint8_t tag = CONST_INTEGER;
write(buf + offset, &tag, 1);
write_le64(buf + offset + 1, obj->integer->value);
```

Strings include a length prefix. Functions include their own instruction slices.

```c
  ByteCode *bc = deserializeBytecode(bytecode, bytecode_len);
  VM *vm = newVM(bc);
  run(vm);
```

The build process takes the compiled bytecode and glues it to the end of a precompiled runtime stub. This stub is just the VM code compiled into a tiny binary that can deserialize and run the program.

Behind the scenes, the build process is split into two parts. 

1. First, I compile a minimal VM stub which a tiny C program that knows how to locate the bytecode at the end of its own binary, deserialize it, and invoke the VM on it. This stub is compiled once and then embedded as a C header. 

2. The compiler (monkeyc) then includes this header, appends the serialized bytecode to it during the build step, and writes out a fully-formed native binary.

This approach lets me avoid dealing with linkers, ELF sections, or fancy binary patching tools. It’s just pure C and a bit of file manipulation. The result is a clean split: the runtime stub is responsible for executing programs, and the compiler is responsible for generating them.

```c
FILE *out = fopen(outputPath, "wb");
fwrite(bin_vm_stub, 1, bin_vm_stub_len, out);
fwrite(BYTECODE_MARKER, 1, strlen(BYTECODE_MARKER), out);
fwrite(bytecode_len, 1, 4, out);
fwrite(bytecode_data, 1, bytecode_len, out);
chmod(outputPath, 0755);
```

When the binary runs, it opens itself, scans for the marker, reads the bytecode, and runs the program:
```c
FILE *self = fopen(argv[0], "rb");
// read file, find marker
ByteCode *bc = deserializeBytecode(...);
VM *vm = newVM(bc);
run(vm);
```

Along the way, I figured that in Linux, we have something called as `/proc/self/exe`. It is a symbolic link that always points to the absolute path of the executable file of the currently running process. I didn't incorporate this but this is so cool!

It’s a bit hacky. But it works and it’s a real binary, with no interpreter or external runtime.

Here’s a MonkeyC program:
```
let square = fn(x) { x * x };
square(4);
```

I can compile this to a .mon file, and then build it like this:
```
$ monkeyc build square.mon -o square
$ ./square
16
```

No runtime, no interpreter, no VM binary next to it. Just one executable file.

It still blows my mind a little.

## what’s next?
If you're interested in contributing or just taking a look, here's the [github link](https://github.com/viveknathani/monkeyc).

Although, my implementation still doesn’t support closures or garbage collection, and it’s far from a general-purpose language. But it works and it taught me more about compilers, memory, and language design than I ever expected.

I guess I will just continue to lurk around compilers.

<i>Need help with your infra/systems software? Hire me! [work@vivekn.dev](mailto:work@vivekn.dev)</i>

Vivek
