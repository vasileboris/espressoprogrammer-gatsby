---
title: Parallel stream vs sequential stream vs for-each loop processing in java 8
date: 2016-08-22
description: I created a jmh benchmark that compares the performance of sequential / parallel streams vs for-each loop.
type: post
---

I had a discussion with another java programmer about processing collections with java 8 streams and she mentioned that she prefers classical loops because streams are slower. This is the perfect start for a hot debate about which one is better and the best way to continue it is to have facts. In previous [post][parse-text-file-streams-java] I parsed a pretty large text file into a [list][java-list-javadoc] so I decided to extend [foods parsing code][foods-composition-github] and process this list in three ways: the old fashion for-each loop, sequential stream and parallel stream. The result list after parsing contains almost 9000 elements and the processing consists in computing the number of calories in a common household measure like the tablespoon starting from the number of calories in 100g.

Each line from the original file is saved in an instance of

```kotlin
/**
 * It contains values from ABBREV.txt file
 */
data class Abbrev(val ndbNo: String,
                  val shrtDesc: String,
                  val energKcal: Int) {

    var gmWt1 : Double = 0.0;
    var gmWtDesc1 : String = "";
    var gmWt2 : Double = 0.0;
    var gmWtDesc2 : String = "";

}
```

the result of the transformation is kept in an instance of

```kotlin
/**
 * It contains Kilo calories for 100g, and common house hold weights
 */
data class AbbrevKcal(val ndbNo: String,
                      val energKcal: Int,
                      val gmWt1Kcal: Double,
                      val gmWt2Kcal: Double) {

}
``` 

and the transformation is done by

```kotlin
fun convert(abbrev: Abbrev): AbbrevKcal = AbbrevKcal(
        abbrev.ndbNo,
        abbrev.energKcal,
        abbrev.energKcal * abbrev.gmWt1 / 100,
        abbrev.energKcal * abbrev.gmWt2 / 100)
```

I used [kotlin][kotlin] to implement needed [data classes][kotlin-data-classes] because in kotlin is very easy to define them and it is also very easy to mix kotlin with java. I used [jmh][jmh] to create the benchmark and the code is below:

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Thread)
public class KCalConverter {

    List<Abbrev> abbrevs = new StreamAbbrevParser().parseFile("/sr28abbr/ABBREV.txt");

    @Benchmark
    public void baseline() {
    }

    @Benchmark
    public void forEachConvert(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = new ArrayList<>(abbrevs.size());
        for(Abbrev abbrev : abbrevs) {
            abbrevKcals.add(ConverterKt.convert(abbrev));
        }
        blackhole.consume(abbrevKcals);
    }

    @Benchmark
    public void sequentialStreamConvert(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = abbrevs.stream()
            .map(ConverterKt::convert)
            .collect(Collectors.toList());
        blackhole.consume(abbrevKcals);
    }

    @Benchmark
    public void parallelStreamConvert(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = abbrevs.parallelStream()
            .map(ConverterKt::convert)
            .collect(Collectors.toList());
        blackhole.consume(abbrevKcals);
    }

    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder()
            .include(KCalConverter.class.getSimpleName())
            .warmupIterations(25)
            .measurementIterations(100)
            .forks(1)
            .build();

        new Runner(opt).run();
    }

}
```

I was ready to see [impressive results][jmh-KCalConverter-ABBREV-25x100] for parallel processing but I was disappointed because it looked like:

```
Benchmark                                     Mode  Cnt         Score        Error  Units
KCalConverter.baseline                        avgt  100         0.324 ±      0.001  ns/op
KCalConverter.forEachConvert                  avgt  100    184953.601 ±    988.417  ns/op
KCalConverter.parallelStreamConvert           avgt  100    167660.485 ±   1993.920  ns/op
KCalConverter.sequentialStreamConvert         avgt  100    189933.029 ±   2779.487  ns/op
```

After few minutes of thought I realised that the actual processing is too simple and it runs fast even in sequential way. I artficially "improved" it to use `BigDecimal`:

```kotlin
fun complexConvert(abbrev: Abbrev): AbbrevKcal = AbbrevKcal(
        abbrev.ndbNo,
        abbrev.energKcal,
        BigDecimal(abbrev.energKcal).multiply(BigDecimal(abbrev.gmWt1)).divide(BigDecimal(100)).toDouble(),
        BigDecimal(abbrev.energKcal).multiply(BigDecimal(abbrev.gmWt2)).divide(BigDecimal(100)).toDouble())
```

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Thread)
public class KCalConverter {

    List<Abbrev> abbrevs = new StreamAbbrevParser().parseFile("/sr28abbr/ABBREV.txt");

    @Benchmark
    public void baseline() {
    }

    @Benchmark
    public void forEachConvert(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = new ArrayList<>(abbrevs.size());
        for(Abbrev abbrev : abbrevs) {
            abbrevKcals.add(ConverterKt.convert(abbrev));
        }
        blackhole.consume(abbrevKcals);
    }

    @Benchmark
    public void forEachComplexConvert(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = new ArrayList<>(abbrevs.size());
        for(Abbrev abbrev : abbrevs) {
            abbrevKcals.add(ConverterKt.complexConvert(abbrev));
        }
        blackhole.consume(abbrevKcals);
    }

    @Benchmark
    public void sequentialStreamConvert(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = abbrevs.stream()
            .map(ConverterKt::convert)
            .collect(Collectors.toList());
        blackhole.consume(abbrevKcals);
    }

    @Benchmark
    public void sequentialStreamComplexConvert(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = abbrevs.stream()
            .map(ConverterKt::complexConvert)
            .collect(Collectors.toList());
        blackhole.consume(abbrevKcals);
    }

    @Benchmark
    public void parallelStreamConvert(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = abbrevs.parallelStream()
            .map(ConverterKt::convert)
            .collect(Collectors.toList());
        blackhole.consume(abbrevKcals);
    }

    @Benchmark
    public void parallelStreamComplexConvert(Blackhole blackhole) {
        List<AbbrevKcal> abbrevKcals = abbrevs.parallelStream()
            .map(ConverterKt::complexConvert)
            .collect(Collectors.toList());
        blackhole.consume(abbrevKcals);
    }

    public static void main(String[] args) throws RunnerException {
        Options opt = new OptionsBuilder()
            .include(KCalConverter.class.getSimpleName())
            .warmupIterations(25)
            .measurementIterations(100)
            .forks(1)
            .build();

        new Runner(opt).run();
    }

}
```

and the [results][jmh-KCalConverter-ABBREV-25x100] are:

```
Benchmark                                     Mode  Cnt         Score        Error  Units
KCalConverter.baseline                        avgt  100         0.324 ±      0.001  ns/op
KCalConverter.forEachComplexConvert           avgt  100  11306389.001 ±  61637.238  ns/op
KCalConverter.forEachConvert                  avgt  100    184953.601 ±    988.417  ns/op
KCalConverter.parallelStreamComplexConvert    avgt  100   3902042.888 ±  60230.745  ns/op
KCalConverter.parallelStreamConvert           avgt  100    167660.485 ±   1993.920  ns/op
KCalConverter.sequentialStreamComplexConvert  avgt  100  12033879.972 ± 129120.560  ns/op
KCalConverter.sequentialStreamConvert         avgt  100    189933.029 ±   2779.487  ns/op
```	

In this case the implementation with parallel stream is ~ 3 times faster than the sequential implementations. Also there is no significant difference between fore-each loop and sequential stream processing.

My conclusions after this test are to prefer cleaner code that is easier to understand and to always measure when in doubt.

[parse-text-file-streams-java]: http://espressoprogrammer.com/parse-text-file-streams-java/
[foods-composition-github]: https://github.com/vasileboris/espressoprogrammer/tree/master/foods-composition
[java-list-javadoc]: https://docs.oracle.com/javase/8/docs/api/java/util/List.html
[kotlin]: https://kotlinlang.org/
[kotlin-data-classes]: https://kotlinlang.org/docs/reference/data-classes.html
[jmh]: http://openjdk.java.net/projects/code-tools/jmh/
[jmh-KCalConverter-ABBREV-25x100]: https://github.com/vasileboris/espressoprogrammer/blob/master/foods-composition/src/main/results/jmh-KCalConverter-ABBREV-25x100.txt