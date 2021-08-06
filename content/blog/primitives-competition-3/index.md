---
title: Primitives competition (3)
date: "2016-02-15"
type: post
---

![Featured imaged][featured-image]

The last thing I want to discuss about integral primitives is what happens when we use them as fields in our classes. A typical example looks like this:

```java
package com.espressoprogrammer.competition.primitives.heap;

public class ByteField {

    //16
    private byte a1;

}
```

I created similar classes for short, byte and long and I uploaded them on [github][github-primitives-heap-code]. I know how much memory java needs to represent one field of each primitive type but I want to know what really happens in backstage when objects are allocated. I found a good post about the [memory structure][java-object-header] of a java object and relevant information is:

* Every object has a header and member fields
* Every object is 8 byte aligned in memory
* In 64 bit JVM with heap less than 32 Gb
* Header has 12 bytes
* Array header has 16 bytes. It needs 4 extra bytes for length.
* A reference is 4 bytes by default.

Based on the above information I can calculate the real memory consumption of prepared sample objects but I would prefer to have a tool that does this for me. In this way I can double check if my understanding is right. I found [jamn][jamn] which provides a class, MemoryMeter, that can be used for this job:

```java
package com.espressoprogrammer.competition.primitives.heap;

import org.github.jamm.MemoryMeter;

public class FieldsCompetition {

    public static void main(String... args) {
        MemoryMeter memoryMeter = new MemoryMeter().enableDebug();

        System.out.println("ByteField : " + memoryMeter.measureDeep(new ByteField()));
        System.out.println("ShortField: " + memoryMeter.measureDeep(new ShortField()));
        System.out.println("IntField  : " + memoryMeter.measureDeep(new IntField()));
        System.out.println("LongField : " + memoryMeter.measureDeep(new LongField()));
    }

}
```

After running this competition the results are:

```
root [com.espressoprogrammer.competition.primitives.heap.ByteField] 16 bytes (16 bytes)

ByteField : 16


root [com.espressoprogrammer.competition.primitives.heap.ShortField] 16 bytes (16 bytes)

ShortField: 16


root [com.espressoprogrammer.competition.primitives.heap.IntField] 16 bytes (16 bytes)

IntField  : 16


root [com.espressoprogrammer.competition.primitives.heap.LongField] 24 bytes (24 bytes)

LongField : 24
```

Without knowing the background of memory allocation I would be really surprised that the first three objects take the same amount of memory but the explanation is quite simple:

* ByteField needs 12 bytes (header) + 1 byte (byte) + 3 bytes (8 byte alignment)
* ShortField needs 12 bytes (header) + 2 bytes (short) + 2 bytes (8 byte alignment)
* IntField needs 12 bytes (header) + 4 bytes (int)
* LongField needs 12 bytes (header) + 8 bytes (long) + 4 bytes (8 byte alignment)

My conclusion after checking real memory allocation is that we need to measure what really happens in the background and not sacrifice the semantics of our application for a potential optimization.

In [first post][primitives-competition-1] on primitives competition we found that most of the operations performed similarly except / and % on long type and last relatively complex expression that included all other operations. In [second post][primitives-competition-2] I concluded that for local variables there isn’t a real difference between byte, short and int. All instances occupy the same space (4 bytes) and the operations are the same.

Based on all these conclusions there is no real difference between byte, short and int when used in mentioned situations. So why should we care about them? According to [primitive data types tutorial][nutsandbolts-datatypes] we should use these types like below:

> * byte: The byte data type can be useful for saving memory in large arrays, where the memory savings actually matters. They can also be used in place of int where their limits help to clarify your code; the fact that a variable's range is limited can serve as a form of documentation.
* short: As with byte, the same guidelines apply: you can use a short to save memory in large arrays, in situations where the memory savings actually matters.
* int: Use the Integer class to use int data type as an unsigned integer.
* long: Use this data type when you need a range of values wider than those provided by int.

The advice is to use byte and short in large arrays. It's time for a new competition to check it. I prepared test classes like this:

```java
package com.espressoprogrammer.competition.primitives.heap;

public class ByteArray {

    private byte[] array;

    public ByteArray(int size) {
        this.array = new byte[size];
    }

}
```
I created similar classes for short, byte and long and I uploaded them on [github][github-primitives-heap-code]. I used [jamn][jamn] MemoryMeter class:

```java
package com.espressoprogrammer.competition.primitives.heap;

import org.github.jamm.MemoryMeter;

public class ArraysCompetition {

    public static void main(String... args) {
        MemoryMeter memoryMeter = new MemoryMeter().enableDebug();

        int size = Integer.parseInt(args[0]);
        System.out.println("ByteArray  : " + memoryMeter.measureDeep(new ByteArray(size)));
        System.out.println("ShortArray : " + memoryMeter.measureDeep(new ShortArray(size)));
        System.out.println("IntArray   : " + memoryMeter.measureDeep(new IntArray(size)));
        System.out.println("LongArray  : " + memoryMeter.measureDeep(new LongArray(size)));
    }

}
```

and when array is created with 1000 elements the results are:

```
root [com.espressoprogrammer.competition.primitives.heap.ByteArray] 1.01 KB (16 bytes)
  |
  +--array [byte[]] 1016 bytes (1016 bytes)

ByteArray  : 1032


root [com.espressoprogrammer.competition.primitives.heap.ShortArray] 1.98 KB (16 bytes)
  |
  +--array [short[]] 1.97 KB (1.97 KB)

ShortArray : 2032


root [com.espressoprogrammer.competition.primitives.heap.IntArray] 3.94 KB (16 bytes)
  |
  +--array [int[]] 3.92 KB (3.92 KB)

IntArray   : 4032


root [com.espressoprogrammer.competition.primitives.heap.LongArray] 7.84 KB (16 bytes)
  |
  +--array [long[]] 7.83 KB (7.83 KB)

LongArray  : 8032
```

* ByteArray needs 12 bytes (header) + 4 bytes (array reference) + 16 bytes (array header) + 1000 bytes (byte elements)
* ShortArray needs 12 bytes (header) + 4 bytes (array reference) + 16 bytes (array header) + 2000 bytes (short elements)
* IntArray needs 12 bytes (header) + 4 bytes (array reference) + 16 bytes (array header) + 4000 bytes (int elements)
* LongArray needs 12 bytes (header) + 4 bytes (array reference) + 16 bytes (array header) + 8000 bytes (long elements)

Now  the difference between these primitives is very clear. You could say that all I had to do is to read [primitive data types tutorial][nutsandbolts-datatypes]. It is true, but I had no idea what the meaning of *where the memory savings actually matters* is.

Environment:
java version "1.8.0_66"
Java(TM) SE Runtime Environment (build 1.8.0_66-b17)
Java HotSpot(TM) 64-Bit Server VM (build 25.66-b17, mixed mode)

Image credit: [Jarosław Bialik][echosystem-437254], CC0 Public Domain

[featured-image]: dock-441989_640.jpg
[github-primitives-heap-code]: https://github.com/vasileboris/espressoprogrammer/tree/master/competition/src/main/java/com/espressoprogrammer/competition/primitives/heap
[java-object-header]: http://arturmkrtchyan.com/java-object-header "Java Object Header"
[jamn]: https://github.com/jbellis/jamm "Java Agent for Memory Measurements"
[primitives-competition-1]: /primitives-competition-1 "Primitives competition (1)"
[primitives-competition-2]: /primitives-competition-2 "Primitives competition (2)"
[nutsandbolts-datatypes]: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html "Primitive Data Types"
[echosystem-437254]: https://pixabay.com/en/users/echosystem-437254/ "Jarosław Bialik"