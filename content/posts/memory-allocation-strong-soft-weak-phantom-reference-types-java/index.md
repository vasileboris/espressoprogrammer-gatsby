---
title: Memory allocation with Strong, Soft, Weak And Phantom reference types in Java
date: 2016-04-11
type: post
---

Memory management in java is easy in most of the cases. All we have to do is to create the instances we need, do some kind of processing and then clear all references to them so that java GC can do the dirty job of cleaning the memory. We cannot control when cleaning will take place, we can at most suggest it by calling `System.gc()`. This is what I learned and also what I saw in in the code I've been in contact with. The ugly truth is it is not exactly true. It is like in real life when not knowing the law is not an excuse to break it. We can have a little bit more control in the lifetime of created objects by using references classes from package `java.lang.ref`: `SoftReference`, `WeakReference` and `PhantomReference`. With the help of these classes the definition of reachability extends from

> An object is reachable if it can be reached by active references.

to

> * An object is strongly reachable if it can be reached by some thread without traversing any reference objects. A newly-created object is strongly reachable by the thread that created it.
> * An object is softly reachable if it is not strongly reachable but can be reached by traversing a soft reference.
> * An object is weakly reachable if it is neither strongly nor softly reachable but can be reached by traversing a weak reference. When the weak references to a weakly-reachable object are cleared, the object becomes eligible for finalization.
> * An object is phantom reachable if it is neither strongly, softly, nor weakly reachable, it has been finalized, and some phantom reference refers to it.
> * Finally, an object is unreachable, and therefore eligible for reclamation, when it is not reachable in any of the above ways.

as it is explained in [package-summary for java.lang.ref][ref-package-summary]. There are plenty of materials on the web with details about these classes, like [Types Of References In Java : Strong, Soft, Weak And Phantom][types-of-references-in-java-strong-soft-weak-and-phantom] or [Java Reference Objects or How I Learned to Stop Worrying and Love OutOfMemoryError][java-reference-objects] so I would not repeat the same information. All of them explain very well how to use them and in which context and made me curious to dig more. These examples used these references classes in isolation and I felt that if I would create an example with all of them, I will understand memory allocation and cleanup much better.

This [example][references-example] is a spring boot web application that does the following:

1. It creates a predefined number of objects and adds them to a list. The default value for this number of objects is 10. This list represents the regular strong reference type we all use in our programs. For each of this object it creates a `SoftReference` and adds it to another list.
2. Step 1 is done in a similar way to create `WeekReference` and `PhantomReference` reference types.
3. It starts to fill the heap by inserting dummy strings to a list. The purpose is to see when above reference types are deallocated. This will continue until the program finishes.
4. Strong references list is cleaned after a predefined amount of time. It defaults to 5 seconds.
5. After `WeekReference` and `PhantomReference` instances are collected by GC, it repeats steps 1 and 2.
6. Steps 4 and 5 are repeated for a predefined amount of times. It defaults to 2.
7. It waits until all `SoftReference`, `WeekReference` and `PhantomReference` are collected by GC.
8. It generates a graph that contains the evolution of the memory usage and the number of all types of references over time.

Please note that:
* In order to generate the graph, I used [hsqldb][hsqldb] to insert memory usage and the number of instances during the program execution. Because this example has a memory leak on purpose and also uses an in memory database, it is possible to receive `OutOfMemoryError` when run multiple times.
* When I run this program I set up the heap size to 512Mb. I noticed that in this way the program does not take too long to fill the heap with those dummy strings and also this value is enough for [hsqldb][hsqldb] to keep all needed data.

A picture is worth a thousand words so here is the result of the program:

[![References][references-image]][references-image]

1. Objects and corresponding reference types are created.
2. It keeps strong references in memory for 5 seconds.
3. Strong references are cleared.
4. Referred objects by `WeekReference` and `PhantomReference` are garbage collected.
5. A new set of objects and corresponding reference types are created.
6. It keeps strong references in memory for 5 seconds.
7. Strong references are cleared.
8. Referred objects by `WeekReference` and `PhantomReference` are garbage collected.
9. Last set of objects and corresponding reference types are created.
10. It keeps strong references in memory for 5 seconds.
11. Strong references are cleared.
12. Referred objects by `WeekReference` and `PhantomReference` are garbage collected.
13. Program consumed almost all available memory, referred objects by `SoftReference` are garbage collected.

This example helped me to understand much better how memory management is done when using these types of references.

[ref-package-summary]: https://docs.oracle.com/javase/8/docs/api/java/lang/ref/package-summary.html "Package java.lang.ref"
[types-of-references-in-java-strong-soft-weak-and-phantom]: http://javaconceptoftheday.com/types-of-references-in-java-strong-soft-weak-and-phantom/ "Types Of References In Java : Strong, Soft, Weak And Phantom"
[java-reference-objects]: http://www.kdgregory.com/index.php?page=java.refobj "Java Reference Objects or How I Learned to Stop Worrying and Love OutOfMemoryError"
[references-example]: https://github.com/vasileboris/espressoprogrammer/tree/master/references
[hsqldb]: http://hsqldb.org/ "HSQLDB - 100% Java Database"
[references-image]: /images/posts/memory-allocation-strong-soft-weak-phantom-reference-types-java/references.png
