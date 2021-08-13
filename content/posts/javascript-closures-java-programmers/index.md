---
title: JavaScript closures for Java programmers
date: 2017-03-27
description: In this post I emphasize the main difference between JavaScript and Java closures.
type: post
---

I switched recently from back-end programming in Java to front-end programming in JavaScript and even if I know that these two languages are different it is hard for me to not compare them. I believe that if I will be able to correlate similar paradigms, I will understand better both languages and I will be a better programmer.

One of the paradigms heavily used in JavaScript is closure. In my terms a closure is a function that remembers and uses its environment. I will not get into details about when closures are useful, you can find more about them in [mozzila developer network][mdn-closures]. In this post I will cover a concrete example in both JavaScript and Java with the main difference I found between them.

In my example I want to apply a discount for sold goods based on goods type.

```JavaScript
(function() {
    'use strict';

    function calculator(goodsType) {
        var discount = 0.1;
        if('FOOD' === goodsType) {
            discount = 0.2;
        }
        return function(value) {
            return value * (1 - discount);
        }
    }

    var beerDiscountCalculator = calculator('BEER');
    var foodDiscountCalculator = calculator('FOOD');

    console.log('FIRST SELL');
    console.log('BEER(100): ' + beerDiscountCalculator(100));
    console.log('FOOD(100): ' + foodDiscountCalculator(100));

    console.log('SECOND SELL');
    console.log('BEER(100): ' + beerDiscountCalculator(100));
    console.log('FOOD(100): ' + foodDiscountCalculator(100));

    console.log('THIRD SELL');
    console.log('BEER(100): ' + beerDiscountCalculator(100));
    console.log('FOOD(100): ' + foodDiscountCalculator(100));

})();
```

Function `calculator` receives `goodsType` as parameter, it computes the discount for that type of goods and returns a function that will apply it every time without being needed to compute it again. How this example will look in Java? The first and naive 1:1 version looks like:

```Java
package com.espressoprogrammer.closures;

import Java.util.function.Function;

public class BrokenDiscountCalculator {

    private static Function<Double, Double> calculator(String goodsType) {
        Double discount = 0.1;
        if("FOOD".equals(goodsType)) {
            discount = 0.2;
        }
        return v -> v * (1 - discount);
    }

    public static void main(String... args) {
        Function<Double, Double> beerDiscountCalculator = calculator("BEER");
        Function<Double, Double> foodDiscountCalculator = calculator("FOOD");

        System.out.println("FIRST SELL");
        System.out.println("BEER(100): " + beerDiscountCalculator.apply(100.0));
        System.out.println("FOOD(100): " + foodDiscountCalculator.apply(100.0));

        System.out.println("SECOND SELL");
        System.out.println("BEER(100): " + beerDiscountCalculator.apply(100.0));
        System.out.println("FOOD(100): " + foodDiscountCalculator.apply(100.0));

        System.out.println("THIRD SELL");
        System.out.println("BEER(100): " + beerDiscountCalculator.apply(100.0));
        System.out.println("FOOD(100): " + foodDiscountCalculator.apply(100.0));
    }

}
```

It is almost the same but it doesn't work because it fails to compile with:

```
[ERROR] .../js-vs-Java/src/main/Java/com/espressoprogrammer/closures/BrokenDiscountCalculator.Java:[12,30]
local variables referenced from a lambda expression must be final or effectively final
```

The problem is that we are not allowed to change a variable used in a lambda expression and in our case it is the discount variable. This was the reason I decided to write this post because when I learned how to write closures in JavaScript I remembered about this situation. The fix is to change discount variable to be final or effectively final.

```Java
package com.espressoprogrammer.closures;

import Java.util.function.Function;

public class DiscountCalculator {

    private static Function<Double, Double> calculator(String goodsType) {
        Double discount = getDiscount(goodsType);
        return v -> v * (1 - discount);
    }

    private static Double getDiscount(String goodsType) {
        Double discount = 0.1;
        if("FOOD".equals(goodsType)) {
            discount = 0.2;
        }
        return discount;
    }

    public static void main(String... args) {
        Function<Double, Double> beerDiscountCalculator = calculator("BEER");
        Function<Double, Double> foodDiscountCalculator = calculator("FOOD");

        System.out.println("FIRST SELL");
        System.out.println("BEER(100): " + beerDiscountCalculator.apply(100.0));
        System.out.println("FOOD(100): " + foodDiscountCalculator.apply(100.0));

        System.out.println("SECOND SELL");
        System.out.println("BEER(100): " + beerDiscountCalculator.apply(100.0));
        System.out.println("FOOD(100): " + foodDiscountCalculator.apply(100.0));

        System.out.println("THIRD SELL");
        System.out.println("BEER(100): " + beerDiscountCalculator.apply(100.0));
        System.out.println("FOOD(100): " + foodDiscountCalculator.apply(100.0));
    }

}
```

In this case it is effectively final because it is computed in the new `getDiscount` method, it is created and assigned only once in `calculator` method and not changed anymore after that.

The fact that I'm allowed to use a variable that changes its value in JavaScript closures, it means that I can go even further with my example. If I want to change the discount based on how much I sell, I can do this:

```JavaScript
(function() {
    'use strict';

    function calculator(goodsType) {
        var discount = 0.1;
        if('FOOD' === goodsType) {
            discount = 0.2;
        }
        return function(value) {
            var offer = value * (1 - discount);
            discount = discount + 0.01;
            return offer;
        }
    }

    var beerDiscountCalculator = calculator('BEER');
    var foodDiscountCalculator = calculator('FOOD');

    console.log('FIRST SELL');
    console.log('BEER(100): ' + beerDiscountCalculator(100));
    console.log('FOOD(100): ' + foodDiscountCalculator(100));

    console.log('SECOND SELL');
    console.log('BEER(100): ' + beerDiscountCalculator(100));
    console.log('FOOD(100): ' + foodDiscountCalculator(100));

    console.log('THIRD SELL');
    console.log('BEER(100): ' + beerDiscountCalculator(100));
    console.log('FOOD(100): ' + foodDiscountCalculator(100));

})();
```

I change the future discount during the current sell, so that the price of the next sell will be even better.

```
FIRST SELL
BEER(100): 90
FOOD(100): 80
SECOND SELL
BEER(100): 89
FOOD(100): 79
THIRD SELL
BEER(100): 88
FOOD(100): 78
```

Thank you for reading this post and I hope that you found it useful.

[js-vs-Java]: https://github.com/vasileboris/espressoprogrammer/tree/master/js-vs-Java
[mdn-closures]: https://developer.mozilla.org/en/docs/Web/JavaScript/Closures
