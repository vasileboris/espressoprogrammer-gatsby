---
title: Recursive class initialization in Java
date: 2015-12-01
type: post
---

It is common for a class to have constant values defined as class fields (static and final) and then used in instances fields like in code bellow:

```java
public class Initialization {
    private static final Boolean DONE = Boolean.TRUE;

    private boolean done = DONE;

    public boolean isDone() {
        return done;
    }

    public static void main(String... args) {
        System.out.println("isDone(): "  + new Initialization().isDone());
    }
}
```

We all know that static fields are initialized first and then the instance ones, so it is no surprise until now. To be even more clear, I updated the code by adding code blocks with print statements:

```java
public class Initialization {
    private static final Boolean DONE;
    static {
        System.out.println("setting up DONE");
        DONE = Boolean.TRUE;
        System.out.println("DONE: " + DONE);
    }

    private boolean done;
    {
        System.out.println("setting up done");
        done = DONE;
        System.out.println("done: " + done);
    }

    public boolean isDone() {
        return done;
    }

    public static void main(String... args) {
        System.out.println("isDone(): "  + new Initialization().isDone());
    }
}
```

that displays:

```
setting up DONE
DONE: true
setting up done
done: true
isDone(): true
```

It is what we all expected so why I bother with posting about such simple things? It is because [Elvis lives again][youtube-elvis-lives-again]. I get into trouble if I add a singleton instance at the beginning of the class:

```java
public class RecursiveInitialization {
    private static final RecursiveInitialization TROUBLE = new RecursiveInitialization(); //line 2

    private static final Boolean DONE;
    static {
        System.out.println("setting up DONE");
        DONE = Boolean.TRUE;
        System.out.println("DONE: " + DONE);
    }

    private boolean done;
    {
        System.out.println("setting up done");
        done = DONE; //line 14
        System.out.println("done: " + done);
    }

    public boolean isDone() {
        return done;
    }

    public static void main(String... args) {
        System.out.println("isDone(): "  + TROUBLE.isDone());
    }
}
```

The only difference is that we are using that singleton instance so I would expect the same result but instead I get:

```
setting up done
Exception in thread "main" java.lang.ExceptionInInitializerError
Caused by: java.lang.NullPointerException
	at RecursiveInitialization.<init>(RecursiveInitialization.java:14)
	at RecursiveInitialization.<clinit>(RecursiveInitialization.java:2)
```

In order to understand what happens we need to read [When Initialization Occurs][jls-when-initialization-occurs]:

>A class or interface type T will be initialized immediately before the first occurrence of any one of the following:
>
>* T is a class and an instance of T is created.
* T is a class and a static method declared by T is invoked.

and [Detailed Initialization Procedure][jls-detailed-Initialization-Procedure], step 3:

>For each class or interface C, there is a unique initialization lock LC. The mapping from C to LC is left to the discretion of the Java Virtual Machine implementation. The procedure for initializing C is then as follows:
>
>1. Synchronize on the initialization lock, LC, for C. This involves waiting until the current thread can acquire LC.
2. If the Class object for C indicates that initialization is in progress for C by some other thread, then release LC and block the current thread until informed that the in-progress initialization has completed, at which time repeat this step.
3. If the Class object for C indicates that initialization is in progress for C by the current thread, then this must be a recursive request for initialization. Release LC and complete normally.

After reading above sections, my understanding is that the following happens:

1. RecursiveInitialization class is initialized because its main method is called.
2. TROUBLE is a static field so it is initialized.
3. TROUBLE is an instance of RecursiveInitialization so RecursiveInitialization should be initialized. There is already a class initialization in progress, so it completes normally. Instance field done is initialized with unboxed value of DONE, which is null and we receive that NullPointerException.

A simple fix is to move the singleton declaration and instantion after the static block:

```java
public class RecursiveInitialization {
    private static final Boolean DONE;
    static {
        System.out.println("setting up DONE");
        DONE = Boolean.TRUE;
        System.out.println("DONE: " + DONE);
    }

    private static final RecursiveInitialization TROUBLE = new RecursiveInitialization();

    private boolean done;
    {
        System.out.println("setting up done");
        done = DONE;
        System.out.println("done: " + done);
    }

    public boolean isDone() {
        return done;
    }

    public static void main(String... args) {
        System.out.println("isDone(): "  + TROUBLE.isDone());
    }
}
```

and everything gets back to normal:

```
setting up DONE
DONE: true
setting up done
done: true
isDone(): true
```

If this subjects interests you and you need more information about it, here is [another example][another-example].

After seeing what can happen if I don't pay attention to initialization details, I will be more careful in such situations.

[youtube-elvis-lives-again]: http://www.youtube.com/watch?v=wDN_EYUvUq0&t=24m55s "Advanced Topics in Programming Languages: Java Puzzlers,..."
[jls-when-initialization-occurs]: http://docs.oracle.com/javase/specs/jls/se7/html/jls-12.html#jls-12.4.1 "12.4.1. When Initialization Occurs"
[jls-detailed-Initialization-Procedure]: http://docs.oracle.com/javase/specs/jls/se7/html/jls-12.html#jls-12.4.2 "12.4.2. Detailed Initialization Procedure"
[another-example]: http://www.pixelstech.net/article/1429149847-Recursive-class-initialization-in-Java "Recursive class initialization in Java"
