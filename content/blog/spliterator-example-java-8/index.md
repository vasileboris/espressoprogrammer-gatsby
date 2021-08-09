---
title: Spliterator example in java 8
date: 2016-12-02
description: I created a Spliterator example to help processing the elements from a list.
type: post
---

In [Fork/Join example in java][fork-join-example-java] I transformed the elements from a list using [fork/join framework][forkjoin-javadoc]. The elements were split in half and processed in parallel until the chunk was small enough to be processed sequentially. This work of partitioning and then traversing the elements of a source is what [Spliterator][spliterator-javadoc] is doing for a living. The first step was to change [ForkJoinConverter][ForkJoinConverter-espressoprogrammer] into [ForkJoinSpliteratorConverter][ForkJoinSpliteratorConverter-espressoprogrammer] to use a [spliterator][spliterator-javadoc]. Relevant differences are in `compute()` and `computeSequentially()` methods that changed from:

```java
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
```

into:

```java
@Override
protected List<R> compute() {
    if(spliterator == null) {
        return new ArrayList<>();
    }

    if(spliterator.estimateSize() <= THRESHOLD) {
        return computeSequentially();
    }

    ForkJoinSpliteratorConverter<T, R> leftConverter = new ForkJoinSpliteratorConverter<T, R>(spliterator.trySplit(), map);
    leftConverter.fork();
    ForkJoinSpliteratorConverter<T, R> rightConverter = new ForkJoinSpliteratorConverter<T, R>(spliterator, map);
    rightConverter.fork();

    List<R> leftResults = leftConverter.join();
    List<R> rightResults = rightConverter.join();
    return mergeResults(leftResults, rightResults);
}

private List<R> computeSequentially() {
    List<R> results = new ArrayList<>((int) spliterator.estimateSize());
    spliterator.forEachRemaining(t -> results.add(map.apply(t)));
    return results;
}
```

By using default [Spliterator][spliterator-javadoc] created by [List.spliterator()][list-spliterator-javadoc] method, the code actually increased in complexity so the next step was to implement my own [spliterator][ThresholdSpliterator-espressoprogrammer]:

```java
public class ThresholdSpliterator<T> implements Spliterator<T> {
    public static final int THRESHOLD = 1_000;

    private final List<T> values;
    private int index;
    private final int endIndex;

    public ThresholdSpliterator(List<T> values) {
        this(values, 0, values.size());
    }

    private ThresholdSpliterator(List<T> values, int index, int endIndex) {
        this.values = values;
        this.index = index;
        this.endIndex = endIndex;
    }

    @Override
    public boolean tryAdvance(Consumer<? super T> consumer) {
        if(index < endIndex) {
            consumer.accept(values.get(index));
            index++;
            return index < endIndex;
        }

        return false;
    }

    @Override
    public Spliterator<T> trySplit() {
        if(index < endIndex && size() > THRESHOLD) {

            int middleIndex = index + size() / 2;
            Spliterator<T> spliterator = new ThresholdSpliterator<>(values, index, middleIndex);
            index = middleIndex;
            return spliterator;
        }

        return null;
    }

    @Override
    public long estimateSize() {
        return size();
    }

    private int size() {
        return endIndex - index;
    }

    @Override
    public int characteristics() {
        return ORDERED + SIZED + SUBSIZED + NONNULL;
    }
}
```

The logic that checks the **THRESHOLD** before splitting is handled here so now the new [fork/join converter][ForkJoinThresholdSpliteratorConverter-espressoprogrammer] is a little bit simpler:

```java
@Override
protected List<R> compute() {
    if(spliterator == null) {
        return new ArrayList<>();
    }

    Spliterator<T> firstHalfSpliterator = spliterator.trySplit();
    if(firstHalfSpliterator == null) {
        return computeSequentially();
    }

    ForkJoinThresholdSpliteratorConverter<T, R> leftConverter = new ForkJoinThresholdSpliteratorConverter<>(firstHalfSpliterator, map);
    leftConverter.fork();
    ForkJoinThresholdSpliteratorConverter<T, R> rightConverter = new ForkJoinThresholdSpliteratorConverter<>(spliterator, map);
    rightConverter.fork();

    List<R> leftResults = leftConverter.join();
    List<R> rightResults = rightConverter.join();
    return mergeResults(leftResults, rightResults);
}

private List<R> computeSequentially() {
    List<R> results = new ArrayList<>((int) spliterator.estimateSize());
    spliterator.forEachRemaining(t -> results.add(map.apply(t)));
    return results;
}
```

Also the same [spliterator][ThresholdSpliterator-espressoprogrammer] code can be used with streams:

```java
List<AbbrevKcal> abbrevKcals = StreamSupport.stream(new ThresholdSpliterator<>(abbrevs), true)
    .map(ConverterKt::complexConvert)
    .collect(Collectors.toList());

```

In a future post, I will check the performance of this spliterator so stay tuned.

[fork-join-example-java]: /fork-join-example-java
[forkjoin-javadoc]: https://docs.oracle.com/javase/tutorial/essential/concurrency/forkjoin.html
[spliterator-javadoc]: https://docs.oracle.com/javase/8/docs/api/java/util/Spliterator.html
[ForkJoinConverter-espressoprogrammer]: https://github.com/vasileboris/espressoprogrammer/blob/master/foods-composition/src/main/java/com/espressoprogrammer/foodscomposition/converter/ForkJoinConverter.java
[ForkJoinSpliteratorConverter-espressoprogrammer]: https://github.com/vasileboris/espressoprogrammer/blob/master/foods-composition/src/main/java/com/espressoprogrammer/foodscomposition/converter/ForkJoinSpliteratorConverter.java
[list-spliterator-javadoc]: https://docs.oracle.com/javase/8/docs/api/java/util/List.html#spliterator--
[ThresholdSpliterator-espressoprogrammer]: https://github.com/vasileboris/espressoprogrammer/blob/master/foods-composition/src/main/java/com/espressoprogrammer/foodscomposition/converter/ThresholdSpliterator.java
[ForkJoinThresholdSpliteratorConverter-espressoprogrammer]: https://github.com/vasileboris/espressoprogrammer/blob/master/foods-composition/src/main/java/com/espressoprogrammer/foodscomposition/converter/ForkJoinThresholdSpliteratorConverter.java
