---
title: Fork/Join example in java
date: 2016-10-10
description: I created a fork/join example by extending ForkJoinTask to transform the elements from a list.
type: post
---

It's been almost two months since my activities forked away from this blog, now it's time to join back. In [previous post][parallel-stream-vs-sequential-stream-vs-loop-processing-java-8], I compared three different ways to transform the elements from a list that included the classical for/each, sequential and parallel stream processing. It would be nice to see how fork/join framework competes against parallel stream but until then, let's add the code.

The basic idea of the fork/join framework is to split the work into smaller pieces until those are small enough to run sequentially, run them concurrently and wait for results:

```java
public class ForkJoinConverter<T, R> extends RecursiveTask<List<R>> {
    private static final int THRESHOLD = 1_000;

    private final List<T> values;
    private final Function<T, R> map;

    public ForkJoinConverter(List<T> values, Function<T, R> map) {
        this.values = values;
        this.map = map;
    }

    @Override
    protected List<R> compute() {
        if(values.size() <= THRESHOLD) {
            return computeSequentially();
        }

        int halfSize = values.size() / 2;
        ForkJoinConverter<T, R> leftConverter = new ForkJoinConverter<T, R>(values.subList(0, halfSize), map);
        leftConverter.fork();
        ForkJoinConverter<T, R> rightConverter = new ForkJoinConverter<T, R>(values.subList(halfSize, values.size()), map);
        rightConverter.fork();

        List<R> leftResults = leftConverter.join();
        List<R> rightResults = rightConverter.join();
        return mergeResults(leftResults, rightResults);
    }

    private List<R> computeSequentially() {
        List<R> results = new ArrayList<R>(values.size());
        for(T value : values) {
            results.add(map.apply(value));
        }
        return results;
    }

    private List<R> mergeResults(List<R> leftResults, List<R> rightResults) {
        ArrayList<R> results = new ArrayList<>(leftResults.size() + rightResults.size());
        results.addAll(leftResults);
        results.addAll(rightResults);
        return results;
    }

}
```

Let's match the explanation above with the code:

* split the work into smaller pieces until those are small enough to run sequentially
```java
@Override
protected List<R> compute() {
    if(values.size() <= THRESHOLD) {
        return computeSequentially();
    }

    int halfSize = values.size() / 2;
    ForkJoinConverter<T, R> leftConverter = new ForkJoinConverter<T, R>(values.subList(0, halfSize), map);
    ForkJoinConverter<T, R> rightConverter = new ForkJoinConverter<T, R>(values.subList(halfSize, values.size()), map);

    ...
}

private List<R> computeSequentially() {
    List<R> results = new ArrayList<R>(values.size());
    for(T value : values) {
        results.add(map.apply(value));
    }
    return results;
}

```

* run them concurrently
```java
@Override
protected List<R> compute() {
    ...

    leftConverter.fork();
    rightConverter.fork();

    ...
}
```

* wait for results
```java
@Override
protected List<R> compute() {
    ...

    List<R> leftResults = leftConverter.join();
    List<R> rightResults = rightConverter.join();
    return mergeResults(leftResults, rightResults);
}

private List<R> mergeResults(List<R> leftResults, List<R> rightResults) {
    ArrayList<R> results = new ArrayList<>(leftResults.size() + rightResults.size());
    results.addAll(leftResults);
    results.addAll(rightResults);
    return results;
}
```

In order to run this code, we need to create a shared [ForkJoinPool][fork-join-pool-javadoc] instance and call [`invoke`][fork-join-pool-invoke-javadoc] method with an instance of `ForkJoinConverter`.


```java
public class ForkJoinConverterTest {
    private static final ForkJoinPool FORK_JOIN_POOL = new ForkJoinPool();
    private static final Logger logger = LoggerFactory.getLogger(ForkJoinConverterTest.class);

    public static void main(String... args) {
        AbbrevParser abbrevParser = new StreamAbbrevParser();
        Instant start = Instant.now();
        List<Abbrev> abbrevs = abbrevParser.parseFile("/sr28abbr/ABBREV.txt");
        Instant end = Instant.now();
        logger.info ("parsed {} foods: in {} nanoseconds", abbrevs.size(), Duration.between(start, end).getNano());

        start = Instant.now();
        List<AbbrevKcal> abbrevKcals = FORK_JOIN_POOL.invoke(new ForkJoinConverter<>(abbrevs, ConverterKt::convert));
        end = Instant.now();
        logger.info ("convert {} foods: in {} nanoseconds with ConverterKt::convert", abbrevKcals.size(), Duration.between(start, end).getNano());

        start = Instant.now();
        List<AbbrevKcal> abbrevKcalsComplex = FORK_JOIN_POOL.invoke(new ForkJoinConverter<>(abbrevs, ConverterKt::complexConvert));
        end = Instant.now();
        logger.info ("convert {} foods: in {} nanoseconds with ConverterKt::complexConvert", abbrevKcalsComplex.size(), Duration.between(start, end).getNano());
    }
```

Each `ForkJoinConverter` instance uses a thread from the [ForkJoinPool][fork-join-pool-javadoc] shared instance to execute its code. One small optimization that can be done to minimize the usages of those threads is to fork only one `ForkJoinConverter` instance and call directly `compute` method on the other `ForkJoinConverter` instance.

```java
public class OptimisedForkJoinConverter<T, R> extends RecursiveTask<List<R>> {

    ...

    @Override
    protected List<R> compute() {
        if(values.size() <= THRESHOLD) {
            return computeSequentially();
        }

        int halfSize = values.size() / 2;
        OptimisedForkJoinConverter<T, R> leftConverter = new OptimisedForkJoinConverter<T, R>(values.subList(0, halfSize), map);
        leftConverter.fork();
        OptimisedForkJoinConverter<T, R> rightConverter = new OptimisedForkJoinConverter<T, R>(values.subList(halfSize, values.size()), map);

        List<R> rightResults = rightConverter.compute();
        List<R> leftResults = leftConverter.join();
        return mergeResults(leftResults, rightResults);
    }

    ...

}
```
Make sure that `rightConverter.compute()` is called before `leftConverter.join()` in order to have concurrent executions of left and right converters.

I do not know now when writing our own fork/join algorithm would be better than using parallel streams, for the moment I would choose the streams just because it is simpler to use.

[parallel-stream-vs-sequential-stream-vs-loop-processing-java-8]: /parallel-stream-vs-sequential-stream-vs-loop-processing-java-8
[fork-join-pool-javadoc]: https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinPool.html
[fork-join-pool-invoke-javadoc]: https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ForkJoinPool.html#invoke-java.util.concurrent.ForkJoinTask-