---
title: String  concatenation for logging
date: 2015-12-16
type: post
---

![Featured imaged][featured-image]

I had a discussion with one of my colleagues some time ago and he insisted that logging is not needed since we should write an application without bugs. If there are no bugs, why somebody would ever need to spend time reading logs? I really want to write applications without bugs and to read a good book instead of a log file but I'm not that skilled yet. Until then I rely on relevant log messages to find out what is happening in a test system or even in production.

If you use [slf4j][slf4j] in your project, you should log messages with code similar as

```java
LOGGER.info("User {} bought {} items from product {}", user, qty, product);
```

If you are not that lucky and you have to use [log4j][log4j], you will see a lot of

```java
LOGGER.info("User " + user + " bought " + qty + " items from product " + product);
```

or better

```java
LOGGER.info(String.format("User %s bought %d items from product %s", user, qty, product));
```

I saw a lot of [log4j][log4j] usages lately so I was curious what impact has string concatenation on the performance. I have to admit that I also wanted to play with [jmh][jmh]. My goal with this test is to check what happens if I concatenate few strings like in above code samples and no more. I looked over [jmh examples][jmh-examples] and I wrote this test:

```java
package com.espressoprogrammer.jmh;

import org.openjdk.jmh.annotations.*;

import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Thread)
public class StringManipulation {

    String user = "User";

    String product = "Product";

    int qty = 1;

    @Benchmark
    public void baseline() {
    }

    @Benchmark
    public String stringConcatenation() {
        return "User " + user + " bought " + qty + " items from product " + product;
    }

    @Benchmark
    public String stringBuilder() {
        return new StringBuilder("User ").append(user)
                .append(" bought ").append(qty)
                .append(" items from product ").append(product).toString();
    }

    @Benchmark
    public String stringFormat() {
        return String.format("User %s bought %d items from product %s", user, qty, product);
    }

}
```

Test was run with:

```
java -jar target/benchmarks.jar StringManipulation -wi 5 -i 10 -f 1
```

and the results are:

```
Benchmark                               Mode  Cnt     Score    Error  Units
StringManipulation.baseline             avgt   10     0.329 ±  0.004  ns/op
StringManipulation.stringBuilder        avgt   10    40.122 ±  0.638  ns/op
StringManipulation.stringConcatenation  avgt   10    40.230 ±  0.386  ns/op
StringManipulation.stringFormat         avgt   10  1138.975 ± 11.813  ns/op
```

I will not go into details regarding [jmh][jmh], it is much better to check directly on the source.

My intention was to check how much time (`@BenchmarkMode(Mode.AverageTime)`) is spent doing one of above string concatenation operations.
I added the `baseline` method to know how much time is needed to do 'nothing'. Methods `stringBuilder` and `stringConcatenation` run in the same time because `StringBuilder` is used in concatenation as [String javadoc][string-javadoc] mentions:

> The Java language provides special support for the string concatenation operator ( + ), and for conversion of other objects to strings. String concatenation is implemented through the StringBuilder(or StringBuffer) class and its append method. String conversions are implemented through the method toString, defined by Object and inherited by all classes in Java.

It looks like `stringFormat` is quite slower when compared with simple concatenation and not all the time the code is more readable. My conclusion here is that when few strings are concatenated, code clarity should be more important than code 'optimization'.

Image credit: [He Lee][helee54-pixabay], CC0 Public Domain

[featured-image]: strings.jpg
[log4j]: https://logging.apache.org/log4j/1.2/ "Apache log4j™ 1.2"
[slf4j]: http://www.slf4j.org/ "Simple Logging Facade for Java (SLF4J)"
[jmh]: http://openjdk.java.net/projects/code-tools/jmh/ "JMH is a Java harness for building, running, and analysing nano/micro/milli/macro benchmarks written in Java and other languages targetting the JVM."
[jmh-examples]: http://hg.openjdk.java.net/code-tools/jmh/file/tip/jmh-samples/src/main/java/org/openjdk/jmh/samples/
[string-javadoc]: https://docs.oracle.com/javase/8/docs/api/java/lang/String.html "Class String"
[helee54-pixabay]: https://pixabay.com/en/users/helee54-28218/
