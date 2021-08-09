---
title: Fork/Join vs parallel stream in java 8
date: 2016-10-17
description: I created a jmh benchmark that compares the performance of fork/join framework with parallel streams.
type: post
---

I wrote the code for [Fork/Join example in java][fork-join-example-java] to update the benchmarks from [Parallel stream vs sequential stream vs for-each loop processing in java 8][parallel-stream-vs-sequential-stream-vs-loop-processing-java-8]. I wanted to see how my fork/join converter algorithm competes against parallel streams.

The first change was to split original `KCalConverter` into two classes:
* `KCalConverter` - it uses `ConverterKt::convert` to convert `Abbrev` into `AbbrevKcal`
* `KCalComplexConverter` - it uses `ConverterKt::complexConvert` to convert `Abbrev` into `AbbrevKcal`

The second change was to add the code that benchmarks fork/join converter:

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 25)
@Measurement(iterations = 100)
@Fork(1)
@State(Scope.Thread)
public class KCalConverter {
    private static final ForkJoinPool FORK_JOIN_POOL = new ForkJoinPool();

    ....

    @Benchmark
    public void forkJoin(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = FORK_JOIN_POOL
            .invoke(new ForkJoinConverter<>(abbrevs, ConverterKt::convert));
        blackhole.consume(abbrevKcals);
    }

    @Benchmark
    public void optimizedForkJoin(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = FORK_JOIN_POOL
            .invoke(new OptimisedForkJoinConverter<>(abbrevs, ConverterKt::convert));
        blackhole.consume(abbrevKcals);
    }

    ....

}
```

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@Warmup(iterations = 25)
@Measurement(iterations = 100)
@Fork(1)
@State(Scope.Thread)
public class KCalComplexConverter {
    private static final ForkJoinPool FORK_JOIN_POOL = new ForkJoinPool();

    ....

    @Benchmark
    public void forkJoin(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = FORK_JOIN_POOL
            .invoke(new ForkJoinConverter<>(abbrevs, ConverterKt::complexConvert));
        blackhole.consume(abbrevKcals);
    }

    @Benchmark
    public void optimizedForkJoin(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = FORK_JOIN_POOL
            .invoke(new OptimisedForkJoinConverter<>(abbrevs, ConverterKt::complexConvert));
        blackhole.consume(abbrevKcals);
    }

    ....

```

The [results][jmh-KCalConverter-ABBREV-25x100-2] of running this [code][foods-composition-github] are close to the results of running parallel stream converters

```
Benchmark                                     Mode  Cnt         Score        Error  Units
KCalComplexConverter.baseline                 avgt  100         0.319 ±      0.001  ns/op
KCalComplexConverter.forEach                  avgt  100  11541983.918 ±  47910.490  ns/op
KCalComplexConverter.forkJoin                 avgt  100   4345528.181 ± 158831.288  ns/op
KCalComplexConverter.optimizedForkJoin        avgt  100   4442540.461 ±  14930.689  ns/op
KCalComplexConverter.parallelStream           avgt  100   3948992.905 ±  14356.138  ns/op
KCalComplexConverter.sequentialStream         avgt  100  11215930.523 ±  36304.261  ns/op
KCalConverter.baseline                        avgt  100         0.319 ±      0.001  ns/op
KCalConverter.forEach                         avgt  100    185872.027 ±    540.608  ns/op
KCalConverter.forkJoin                        avgt  100    279747.373 ±    782.190  ns/op
KCalConverter.optimizedForkJoin               avgt  100    276145.068 ±    721.628  ns/op
KCalConverter.parallelStream                  avgt  100    247095.791 ±   8086.997  ns/op
KCalConverter.sequentialStream                avgt  100    174839.696 ±   4043.731  ns/op
```

and reinforces the conclusion from [Fork/Join example in java][fork-join-example-java] to choose the streams just because it is simpler to use.

[fork-join-example-java]: /fork-join-example-java
[parallel-stream-vs-sequential-stream-vs-loop-processing-java-8]: /parallel-stream-vs-sequential-stream-vs-loop-processing-java-8
[foods-composition-github]: https://github.com/vasileboris/espressoprogrammer/tree/master/foods-composition
[jmh-KCalConverter-ABBREV-25x100-2]: https://github.com/vasileboris/espressoprogrammer/blob/master/foods-composition/src/main/results/jmh-KCalConverter-ABBREV-25x100-2.txt
