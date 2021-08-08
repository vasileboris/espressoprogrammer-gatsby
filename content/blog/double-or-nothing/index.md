---
title: Double or nothing
date: "2016-02-29"
type: post
---

![Featured imaged][featured-image]

You are working on a new feature where you need to use [decimal][decimal] numbers and you know from requirements that calculations must be precise. If you are new to java or if your knowledge cache needs a refresh, you search and read a tutorial about [floating point numbers][nutsandbolts-datatypes]. You know what kind of values you need to handle in your program, you check [their types, formats and values][fp-types-formats-values] and then suddenly you wonder [why don’t your numbers add up?][fp-gui]. You read again the [tutorial][nutsandbolts-datatypes] and you finally understand that:

> * float: The float data type is a single-precision 32-bit IEEE 754 floating point. As with the recommendations for byte and short, use a float (instead of double) if you need to save memory in large arrays of floating point numbers. This data type should never be used for precise values, such as currency. For that, you will need to use the java.math.BigDecimal class instead. Numbers and Strings covers BigDecimal and other useful classes provided by the Java platform.
> * The double data type is a double-precision 64-bit IEEE 754 floating point. For decimal values, this data type is generally the default choice. As mentioned above, this data type should never be used for precise values, such as currency.

You now have the knowledge about these primitives and you can decide when and how to use them or you can even go to extremes and decide that [java float and double primitive types are evil and don’t use them anymore][fp-are-evil]. There are so many resources about this subject that it is really hard to come with something new. The only thing that I want to check now is how fast or slow simple calculations with these types are when compared with the more precise [BigDecimal][BigDecimal]. In order to do this I prepared a [jmh][jmh] [benchmark][ep-fp-benchmark]:

```java
package com.espressoprogrammer.jmh;

import org.openjdk.jmh.annotations.*;

import java.math.BigDecimal;
import java.util.concurrent.TimeUnit;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Thread)
public class FloatingPointOperations {

    private int scale = 2;

    float fOp1 = 123.45f;
    float fOp2 = 543.21f;

    double dOp1 = 123.45d;
    double dOp2 = 543.21d;

    BigDecimal bdOp1 = new BigDecimal("123.45");
    BigDecimal bdOp2 = new BigDecimal("543.21");

    @Benchmark
    public void baseline() {
    }

    /*
     * Addition
     */

    @Benchmark
    public float measureAddFloat() {
        return fOp1 + fOp2;
    }

    @Benchmark
    public double measureAddDouble() {
        return dOp1 + dOp2;
    }

    @Benchmark
    public BigDecimal measureAddBigDecimal() {
        return bdOp1.add(bdOp2);
    }

    /*
     * Subtraction
     */

    @Benchmark
    public float measureSubFloat() {
        return fOp1 - fOp2;
    }

    @Benchmark
    public double measureSubDouble() {
        return dOp1 - dOp2;
    }

    @Benchmark
    public BigDecimal measureSubBigDecimal() {
        return bdOp1.subtract(bdOp2);
    }

    /*
     * Multiplication
     */

    @Benchmark
    public float measureMultFloat() {
        return fOp1 * fOp2;
    }

    @Benchmark
    public double measureMultDouble() {
        return dOp1 * dOp2;
    }

    @Benchmark
    public BigDecimal measureMultBigDecimal() {
        return bdOp1.multiply(bdOp2);
    }

    /*
     * Division
     */

    @Benchmark
    public float measureDivFloat() {
        return fOp1 / fOp2;
    }

    @Benchmark
    public double measureDivDouble() {
        return dOp1 / dOp2;
    }

    @Benchmark
    public BigDecimal measureDivBigDecimal() {
        return bdOp1.divide(bdOp2, scale, BigDecimal.ROUND_HALF_UP);
    }

    /*
     * All
     */

    @Benchmark
    public float measureAllFloat() {
        return fOp1 * fOp2 + fOp1 / fOp2 - fOp2 / fOp1 + fOp2 * fOp1;
    }

    @Benchmark
    public double measureAllDouble() {
        return dOp1 * dOp2 + dOp1 / dOp2 - dOp2 / dOp1 + dOp2 * dOp1;
    }

    @Benchmark
    public BigDecimal measureAllBigDecimal() {
        return bdOp1.multiply(bdOp2)
                .add(bdOp1.divide(bdOp2,scale, BigDecimal.ROUND_HALF_UP))
                .subtract(bdOp2.divide(bdOp1, scale, BigDecimal.ROUND_HALF_UP))
                .add(bdOp2.multiply(bdOp1));
    }


}
```

Do not forget to add a scale and a rounding mode to [BigDecimal's divide][BigDecimal-divide] method, otherwise you will search for clues about [BigDecimal and “java.lang.ArithmeticException: Non-terminating decimal expansion”][BigDecimal-ArithmeticException].

The results of  this test were not a big surprise with BigDecimal calculations being the slowest:

```
Benchmark                                      Mode  Cnt   Score    Error  Units
FloatingPointOperations.baseline               avgt   10   0.331 ±  0.012  ns/op

FloatingPointOperations.measureAddBigDecimal   avgt   10  11.618 ±  1.754  ns/op
FloatingPointOperations.measureAddDouble       avgt   10   2.871 ±  0.098  ns/op
FloatingPointOperations.measureAddFloat        avgt   10   2.934 ±  0.131  ns/op

FloatingPointOperations.measureAllBigDecimal   avgt   10  95.048 ± 13.347  ns/op
FloatingPointOperations.measureAllDouble       avgt   10   9.038 ±  0.155  ns/op
FloatingPointOperations.measureAllFloat        avgt   10   4.584 ±  0.039  ns/op

FloatingPointOperations.measureDivBigDecimal   avgt   10  27.309 ±  2.724  ns/op
FloatingPointOperations.measureDivDouble       avgt   10   4.641 ±  0.210  ns/op
FloatingPointOperations.measureDivFloat        avgt   10   3.182 ±  0.039  ns/op

FloatingPointOperations.measureMultBigDecimal  avgt   10  11.956 ±  2.377  ns/op
FloatingPointOperations.measureMultDouble      avgt   10   2.902 ±  0.049  ns/op
FloatingPointOperations.measureMultFloat       avgt   10   2.950 ±  0.157  ns/op

FloatingPointOperations.measureSubBigDecimal   avgt   10  11.120 ±  1.160  ns/op
FloatingPointOperations.measureSubDouble       avgt   10   2.945 ±  0.096  ns/op
FloatingPointOperations.measureSubFloat        avgt   10   2.893 ±  0.084  ns/op
```

What is a surprise for me is why more calculations with double (see measureAllDouble) take twice as much as the ones with float (see measureAllFloat) when single calculations take almost the same time. Do you have an idea?

Image credit: [Steve Morissette][morissettes-976310], CC0 Public Domain

[featured-image]: foot-race-776446_640.jpg
[decimal]: https://en.wikipedia.org/wiki/Decimal "Decimal"
[nutsandbolts-datatypes]: https://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html "Primitive Data Types"
[fp-types-formats-values]: https://docs.oracle.com/javase/specs/jls/se8/html/jls-4.html#jls-4.2.3 "Floating-Point Types, Formats, and Values"
[fp-gui]: http://floating-point-gui.de/ "Why don’t my numbers add up?"
[ncg-goldberg]: http://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html "What Every Computer Scientist Should Know About Floating-Point Arithmetic"
[fp-are-evil]: https://computingat40s.wordpress.com/java-float-and-double-primitive-types-are-evil-dont-use-them/ "Java float and double primitive types are evil. Don’t use them."
[BigDecimal]: https://docs.oracle.com/javase/8/docs/api/java/math/BigDecimal.html "Class BigDecimal"
[BigDecimal-divide]: https://docs.oracle.com/javase/8/docs/api/java/math/BigDecimal.html#divide-java.math.BigDecimal-int-int- "divide"
[BigDecimal-ArithmeticException]: https://jaydeepm.wordpress.com/2009/06/04/bigdecimal-and-non-terminating-decimal-expansion-error/ "BigDecimal and “java.lang.ArithmeticException: Non-terminating decimal expansion”"
[jmh]: http://openjdk.java.net/projects/code-tools/jmh/ "Code Tools: jmh"
[ep-fp-benchmark]: https://github.com/vasileboris/espressoprogrammer/blob/master/jmh-examples/src/main/java/com/espressoprogrammer/jmh/FloatingPointOperations.java
[morissettes-976310]: https://pixabay.com/en/users/morissettes-976310/