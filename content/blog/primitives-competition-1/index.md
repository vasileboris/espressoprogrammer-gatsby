---
title: Primitives competition (1)
date: "2016-01-18"
type: post
---

![Featured imaged][featured-image]

Java has byte, short, int, char and long integral primitive types and [Java language specification][jls-primitive-types] describes them very well:

> The integral types are byte, short, int, and long, whose values are 8-bit, 16-bit, 32-bit and 64-bit signed two's-complement integers, respectively, and char, whose values are 16-bit unsigned integers representing UTF-16 code units

I found these types mentioned in all java materials that I read but I saw in practice int and long most of the time. The logical question is if we really need all of them. Common sense tells me that I should check from two perspectives: storage usage and operations speed. I need more time to prepare a test for storage usage so I started with operations speed.

I selected the following operations based on how often I saw them in code

> * The multiplicative operators *, /, and % (§15.17)
* The additive operators + and - (§15.18)
* The increment operator ++, both prefix (§15.15.1) and postfix (§15.14.2)
* The decrement operator --, both prefix (§15.15.2) and postfix (§15.14.3)

and I prepared a [jmh][jmh] benchmark:

```java
@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.NANOSECONDS)
@State(Scope.Thread)
public class IntegralPrimitivesOperations {

    byte bOp1 = 64;
    byte bOp2 = 21;

    @Benchmark
    public void baseline() {
    }

    /*
     * Addition
     */

    @Benchmark
    public byte measureAddByte() {
        return (byte) (bOp1 + bOp2);
    }

    //... similar code for short, int, char and long

    /*
     * Subtraction
     */

    @Benchmark
    public byte measureSubByte() {
        return (byte) (bOp1 - bOp2);
    }

    //... similar code for short, int, char and long

    /*
     * Multiplication
     */

    @Benchmark
    public byte measureMultByte() {
        return (byte) (bOp1 * bOp2);
    }

    //... similar code for short, int, char and long

    /*
     * Division
     */

    @Benchmark
    public byte measureDivByte() {
        return (byte) (bOp1 / bOp2);
    }

    //... similar code for short, int, char and long

    /*
     * Modulo
     */

    @Benchmark
    public byte measureModByte() {
        return (byte) (bOp1 % bOp2);
    }

    //... similar code for short, int, char and long

    /*
     * Increment
     */

    @Benchmark
    public byte measureIncByte() {
        return ++bOp1;
    }

    //... similar code for short, int, char and long

    /*
     * Decrement
     */

    @Benchmark
    public byte measureDecByte() {
        return --bOp1;
    }

    //... similar code for short, int, char and long

    /*
     * All
     */

    @Benchmark
    public byte measureAllByte() {
        return (byte) (++bOp1 * bOp2 + bOp1 / --bOp2 - --bOp1 % bOp2 + bOp2 * ++bOp1 - ++bOp2 / bOp1 + bOp2 % --bOp1);
    }

    //... similar code for short, int, char and long
}
```

I did not include all methods in this code excerpt, original code is available on [github][github-ipo]. I ran this benchmark three times and the results are:

```
Benchmark                                      Mode  Cnt   Score   Error  Score   Error  Score   Error  Units
IntegralPrimitivesOperations.baseline          avgt   10   0.319 ± 0.001  0.320 ± 0.001  0.319 ± 0.001  ns/op

IntegralPrimitivesOperations.measureAddByte    avgt   10   2.816 ± 0.014  2.819 ± 0.013  2.813 ± 0.010  ns/op
IntegralPrimitivesOperations.measureAddChar    avgt   10   2.823 ± 0.077  2.819 ± 0.070  2.809 ± 0.008  ns/op
IntegralPrimitivesOperations.measureAddInt     avgt   10   2.597 ± 0.006  2.596 ± 0.015  2.593 ± 0.005  ns/op
IntegralPrimitivesOperations.measureAddLong    avgt   10   2.592 ± 0.008  2.593 ± 0.005  2.612 ± 0.058  ns/op
IntegralPrimitivesOperations.measureAddShort   avgt   10   2.840 ± 0.066  2.815 ± 0.006  2.833 ± 0.066  ns/op

IntegralPrimitivesOperations.measureSubByte    avgt   10   2.829 ± 0.068  2.778 ± 0.011  2.794 ± 0.072  ns/op
IntegralPrimitivesOperations.measureSubChar    avgt   10   2.814 ± 0.023  2.787 ± 0.036  2.776 ± 0.010  ns/op
IntegralPrimitivesOperations.measureSubInt     avgt   10   2.593 ± 0.007  2.643 ± 0.008  2.646 ± 0.026  ns/op
IntegralPrimitivesOperations.measureSubLong    avgt   10   2.628 ± 0.174  2.654 ± 0.007  2.659 ± 0.005  ns/op
IntegralPrimitivesOperations.measureSubShort   avgt   10   2.811 ± 0.003  2.740 ± 0.014  2.740 ± 0.010  ns/op

IntegralPrimitivesOperations.measureIncByte    avgt   10   2.866 ± 0.148  2.814 ± 0.008  2.824 ± 0.036  ns/op
IntegralPrimitivesOperations.measureIncChar    avgt   10   2.805 ± 0.100  2.806 ± 0.007  2.814 ± 0.043  ns/op
IntegralPrimitivesOperations.measureIncInt     avgt   10   2.630 ± 0.008  2.592 ± 0.010  2.593 ± 0.015  ns/op
IntegralPrimitivesOperations.measureIncLong    avgt   10   2.649 ± 0.003  2.606 ± 0.012  2.642 ± 0.181  ns/op
IntegralPrimitivesOperations.measureIncShort   avgt   10   2.747 ± 0.033  2.828 ± 0.038  2.808 ± 0.009  ns/op

IntegralPrimitivesOperations.measureDecByte    avgt   10   2.774 ± 0.007  2.777 ± 0.008  2.781 ± 0.015  ns/op
IntegralPrimitivesOperations.measureDecChar    avgt   10   2.804 ± 0.084  2.787 ± 0.016  2.782 ± 0.009  ns/op
IntegralPrimitivesOperations.measureDecInt     avgt   10   2.807 ± 0.100  2.643 ± 0.021  2.642 ± 0.015  ns/op
IntegralPrimitivesOperations.measureDecLong    avgt   10   2.747 ± 0.077  2.659 ± 0.008  2.663 ± 0.006  ns/op
IntegralPrimitivesOperations.measureDecShort   avgt   10   2.837 ± 0.091  2.758 ± 0.072  2.764 ± 0.094  ns/op

IntegralPrimitivesOperations.measureMultByte   avgt   10   2.863 ± 0.030  2.841 ± 0.007  2.938 ± 0.074  ns/op
IntegralPrimitivesOperations.measureMultChar   avgt   10   2.842 ± 0.004  2.864 ± 0.075  2.943 ± 0.042  ns/op
IntegralPrimitivesOperations.measureMultInt    avgt   10   2.608 ± 0.032  2.600 ± 0.016  2.768 ± 0.258  ns/op
IntegralPrimitivesOperations.measureMultLong   avgt   10   2.781 ± 0.179  2.603 ± 0.010  2.753 ± 0.188  ns/op
IntegralPrimitivesOperations.measureMultShort  avgt   10   2.892 ± 0.071  2.841 ± 0.008  2.836 ± 0.003  ns/op

IntegralPrimitivesOperations.measureDivByte    avgt   10   5.099 ± 0.067  4.843 ± 0.016  4.844 ± 0.016  ns/op
IntegralPrimitivesOperations.measureDivChar    avgt   10   5.292 ± 0.045  4.998 ± 0.020  4.986 ± 0.009  ns/op
IntegralPrimitivesOperations.measureDivInt     avgt   10   5.010 ± 0.045  4.924 ± 0.056  4.845 ± 0.012  ns/op
IntegralPrimitivesOperations.measureDivLong    avgt   10  11.712 ± 0.270 11.210 ± 0.028 11.264 ± 0.069  ns/op
IntegralPrimitivesOperations.measureDivShort   avgt   10   5.188 ± 0.077  4.847 ± 0.020  4.846 ± 0.013  ns/op

IntegralPrimitivesOperations.measureModByte    avgt   10   4.843 ± 0.006  4.845 ± 0.010  4.864 ± 0.033  ns/op
IntegralPrimitivesOperations.measureModChar    avgt   10   4.853 ± 0.019  4.838 ± 0.006  4.855 ± 0.081  ns/op
IntegralPrimitivesOperations.measureModInt     avgt   10   4.886 ± 0.147  4.854 ± 0.015  5.026 ± 0.236  ns/op
IntegralPrimitivesOperations.measureModLong    avgt   10  11.357 ± 0.146 11.268 ± 0.030 11.566 ± 0.186  ns/op
IntegralPrimitivesOperations.measureModShort   avgt   10   4.941 ± 0.185  4.870 ± 0.036  5.095 ± 0.136  ns/op

IntegralPrimitivesOperations.measureAllByte    avgt   10  16.537 ± 0.100 16.549 ± 0.060 16.651 ± 0.075  ns/op
IntegralPrimitivesOperations.measureAllChar    avgt   10  13.803 ± 0.080 13.813 ± 0.071 13.842 ± 0.106  ns/op
IntegralPrimitivesOperations.measureAllInt     avgt   10  13.830 ± 0.022 13.855 ± 0.044 13.869 ± 0.101  ns/op
IntegralPrimitivesOperations.measureAllLong    avgt   10  41.685 ± 0.250 41.739 ± 0.320 41.740 ± 0.153  ns/op
IntegralPrimitivesOperations.measureAllShort   avgt   10  16.091 ± 0.051 16.125 ± 0.203 16.122 ± 0.282  ns/op
```

Most of the operations performed similarly except / and % on long type and last
relatively complex expression that included all other operations.
The fact that division operations are more expensive on long type is not such a big surprise as the results of the last expression on byte and short. The same operations done isolated run in similar amount of time and done together take a bit longer. It can be from widening and cast between byte/short and int:

> If an integer operator other than a shift operator has at least one operand of type long, then the operation is carried out using 64-bit precision, and the result of the numerical operator is of type long. If the other operand is not long, it is first widened (§5.1.5) to type long by numeric promotion (§5.6).

> Otherwise, the operation is carried out using 32-bit precision, and the result of the numerical operator is of type int. If either operand is not an int, it is first widened to type int by numeric promotion.

These results are not enough to jump to a conclusion, let's see in the next post what the difference from the storage perspective is.

Environment:
java version "1.8.0_66"
Java(TM) SE Runtime Environment (build 1.8.0_66-b17)
Java HotSpot(TM) 64-Bit Server VM (build 25.66-b17, mixed mode)

Image credit: [morzaszum][morzaszum-1241839], CC0 Public Domain

[featured-image]: spot-862274_640.jpg
[jls-primitive-types]: https://docs.oracle.com/javase/specs/jls/se8/html/jls-4.html#jls-4.2 "4.2. Primitive Types and Values"
[jmh]: http://openjdk.java.net/projects/code-tools/jmh/ "Code Tools: jmh"
[github-ipo]: https://github.com/vasileboris/espressoprogrammer/blob/master/jmh-examples/src/main/java/com/espressoprogrammer/jmh/IntegralPrimitivesOperations.java
[morzaszum-1241839]: https://pixabay.com/en/users/morzaszum-1241839/