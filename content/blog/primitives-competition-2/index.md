---
title: Primitives competition (2)
date: 2016-02-01
type: post
---

![Featured imaged][featured-image]

In [previous post][primitives-competition-1] about primitives I checked how fast usual operations perform on different types of integral primitives. Initially I thought that one post on allocation space would be enough but after doing some research I realised that there is enough room for two. In this one I will write about allocation on stack frame during method calls.

I didn't have experience on doing this kind of investigation so I searched about information on this subject. I found a very good post about [JVM Internals][jvm-internals] written by [James D Bloom][jamesdbloom] and I used it to understand what I have to do.

One of the situations in which we use integral primitives is when we declare and initialize them as local variables and then do some calculations.
I prepared a simple example that looks like the one below:

```java
package com.espressoprogrammer.competition.primitives.stack;

public class ByteFields {

    public static void main(String... args) {
        byte value1 = 10;
        byte value2 = 20;

        byte result = (byte) (value1 + value2);
    }

}
```

In the same package I created similar classes for the other integral primitives and I uploaded them on [github][github-primitives-stack-code]. In order to see how this code is compiled into bytecode I used

```
javap -c -l  target/classes/com/espressoprogrammer/competition/primitives/stack/ByteFields.class
```

and the relevant bytecode is

```
public static void main(java.lang.String...);
  Code:
     0: bipush        10
     2: istore_1
     3: bipush        20
     5: istore_2
     6: iload_1
     7: iload_2
     8: iadd
     9: i2b
    10: istore_3
    11: return
  LineNumberTable:
    line 6: 0
    line 7: 3
    line 9: 6
    line 10: 11
  LocalVariableTable:
    Start  Length  Slot  Name   Signature
        0      12     0  args   [Ljava/lang/String;
        3       9     1 value1   B
        6       6     2 value2   B
       11       1     3 result   B
```

The complete bytecode for this class and for the other classes can be checked on [github][github-primitives-stack-bytecode]. The first thing I noticed is that bytecode for byte, short and int examples is almost identical. The only exception is on line 9 which casts from int to byte and short. [Bytecode instructions][byte-code-instructions] use [operand stack][jvm-operand-stack] to perform our simple sum operation and in this case it is easy to understand them:

* lines 0: and 2: initialize value1
* lines 3: and 5: initialize value2
* lines 6: 7: and 8: perform the sum
* line 9 casts int result in byte
* line 10 stores the result in result variable

[LocalVariableTable][jvm-local-variable-table] is also almost identical for byte, short and int and it is because these types need one slot (4 bytes) and long needs two slots (8 bytes).

My conclusion is that for local variables there isn't a real difference between byte, short and int. All instances occupy the same space (4 bytes) and the operations are the same.

Environment:
java version "1.8.0_66"
Java(TM) SE Runtime Environment (build 1.8.0_66-b17)
Java HotSpot(TM) 64-Bit Server VM (build 25.66-b17, mixed mode)

Image credit: [Wokandapix][Wokandapix-614097], CC0 Public Domain

[featured-image]: rock-1110705_640.jpg
[primitives-competition-1]: /primitives-competition-1 "Primitives competition (1)"
[jvm-internals]: http://blog.jamesdbloom.com/JVMInternals.html "JVM Internals"
[jamesdbloom]: https://about.me/jamesdbloom "James D Bloom"
[github-primitives-stack-code]: https://github.com/vasileboris/espressoprogrammer/tree/master/competition/src/main/java/com/espressoprogrammer/competition/primitives/stack
[github-primitives-stack-bytecode]: https://github.com/vasileboris/espressoprogrammer/tree/master/competition/src/main/results/com/espressoprogrammer/competition/primitives/stack
[jvm-local-variable-table]: http://blog.jamesdbloom.com/JVMInternals.html#local_variables_array "Local Variables Array"
[jvm-operand-stack]: http://blog.jamesdbloom.com/JVMInternals.html#operand_stack "Operand Stack"
[byte-code-instructions]: https://en.wikipedia.org/wiki/Java_bytecode_instruction_listings "Java bytecode instruction listings"
[Wokandapix-614097]: https://pixabay.com/en/users/Wokandapix-614097/