---
title: Surprised by a promotion
date: "2015-11-24"
type: post
---

Each week I receive the weekly email from [Java Code Geeks][jkg] and almost all the time I spent few minutes checking what's going on in the programming world. Last week they grab my attention much better than the other times, who doesn't want to read [10 Things You Didn’t Know About Java][10-things-don't-know-java]? The entire post is worth reading but for me the most mind blowing part was the section about conditional expression. Why? Because it looks so simple on the surface but it does more than we think.

## Conditional expression

In the most simple form it looks like:

```java
result = condition ? value1 : value2
```

and I saw it used inlined in expressions where the code is still readable:

```java
return condition ? value1 : value2
```

It looks pretty simple, the code is clear, what could go wrong?

What do you think the code bellow will display?

```java
Object o1 = true ? new Integer(1) : new Double(2.0);
System.out.println(o1);
System.out.println(o1.getClass());
```

The condition is always true, you could say that the result is:

```
1
class java.lang.Integer
```

but if you run the code you will see:

```
1.0
class java.lang.Double
```

Why on earth is this happening? It is because you received a promotion, but not the one you are expecting for. If you check [Conditional operator specification][jls-conditional-operator], you'll find that in our case the result type of this conditional expression is `bnp(Integer,Double)` where `bnp(..) means to apply binary numeric promotion`. If it is still confusing, check [Binary Numeric Promotion][jls-binary-numeric-promotion] and it will be clear:

>When an operator applies binary numeric promotion to a pair of operands, each of which must denote a value that is convertible to a numeric type, the following rules apply, in order:
>
>1. If any operand is of a reference type, it is subjected to unboxing conversion (§5.1.8).
>2. Widening primitive conversion (§5.1.2) is applied to convert either or both operands as specified by the following rules:
>  * If either operand is of type double, the other is converted to double.

We have unboxing from Integer to int, widening primitive conversion from int do double and boxing from double to Double. Please don't go, there is another surprise here. Usually the operands are the results of other expressions and because they are references they can be null also:

```java
Integer value1 = new Integer(1);
Double value2 = new Double(2.0);
if(true) value1 = null;
Object o1 = true ? value1 : value2; //line 8
System.out.println(o1);
```

You could say that `null` will be printed but you'll be again surprised by

```
Exception in thread "main" java.lang.NullPointerException
	at Test.main(Test.java:8)
```

The reason is that before widening primitive conversion, we have unboxing from Integer to int, in our case from null to int.

I never thought that a simple expression like this can cause so much trouble. It is the proof that strong essences are kept in small bottles.

[jkg]: http://www.javacodegeeks.com/ "Java Code Geeks"
[10-things-don't-know-java]: http://www.javacodegeeks.com/2014/11/10-things-you-didnt-know-about-java.html "10 Things You Didn’t Know About Java"
[jls-conditional-operator]: https://docs.oracle.com/javase/specs/jls/se8/html/jls-15.html#jls-15.25 "Conditional Operator ? :"
[jls-binary-numeric-promotion]: https://docs.oracle.com/javase/specs/jls/se8/html/jls-5.html#jls-5.6.2 "Binary Numeric Promotion"
