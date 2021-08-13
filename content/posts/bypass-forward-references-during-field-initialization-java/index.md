---
title: Bypass forward references during field initialization in Java
date: 2016-04-25
type: post
---

![Featured imaged][featured-image]

A typical scenario when creating a new class is to declare and initialize some fields:

```java
public class Values {

    private int value1 = 1;
    private int value2 = 2;

}
```

I realize that initial values of these fields are correlated and I update the code:

```java
public class CorrelatedValues {

    private int value1 = 1;
    private int value2 = value1 + 1;

}
```

If I'm not careful, I can even try:

```java

public class ForwardReferences {

    private int value1 = value2 + 1;
    private int value2 = 1;

}
```

but this won't compile because it is a [forward reference during field initialization][forward-references-during-field-initialization]:
> * The declaration of an instance variable in a class or interface C appears textually after a use of the instance variable;
> * The use is a simple name in either an instance variable initializer of C or an instance initializer of C;
> * The use is not on the left hand side of an assignment;
> * C is the innermost class or interface enclosing the use.

It is easy to understand even without this documentation because it's commons sense. I need to declare a variable before I can use it. This was clear for me until I saw this code:

```java
public class DeclarationAndInitializationGoCrazy {

    private int value = this.value + 1;

    public static void main(String... args) {
        System.out.println(new DeclarationAndInitializationGoCrazy().value);
    }

}
```

Surprisingly this code compiles and displays:

```
1
```

The question is why is this working? I would expect a compile time error. After reading more careful the rules about [forward reference during field initialization][forward-references-during-field-initialization], the catch is on the second line:
> * The use is a simple name in either an instance variable initializer of C or an instance initializer of C;

In this example I'm using ```this.value``` and not the simple name ```value``` and that's why it works. What really happens when creating a new instance of ```DeclarationAndInitializationGoCrazy``` is:

* Field ```value``` is set to default value 0
* Field ```value``` is initialized with 0 + 1 which is 1

I can go really crazy and try something like:

```java
public class DeclarationAndInitializationReallyGoCrazy {

    private int value1 = this.value2 + 1;
    private int value2 = this.value1 + 1;

    public static void main(String... args) {
        System.out.println(new DeclarationAndInitializationReallyGoCrazy().value1);
        System.out.println(new DeclarationAndInitializationReallyGoCrazy().value2);
    }

}
```

that compiles and displays:

```
1
2
```

It is the same explanation as on previous example:

* Fields ```value1```  and ```value2``` are set to default value 0
* Field ```value1``` is initialized with 0 + 1 which is 1
* Field ```value2``` is initialized with 1 + 1 which is 2

I don't see now any practical reason why I would do this in a real project code, at least it was a fun thing to do.

Image credit: [cristofer angello caballero thorne][cristoferangello0-741405], CC0 Public Domain

[featured-image]: cat-633081_640.jpg
[forward-references-during-field-initialization]: https://docs.oracle.com/javase/specs/jls/se8/html/jls-8.html#jls-8.3.3 "Forward References During Field Initialization"
[cristoferangello0-741405]: https://pixabay.com/en/users/cristoferangello0-741405/