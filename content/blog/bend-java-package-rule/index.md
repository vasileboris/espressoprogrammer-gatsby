---
title: Bend java package rule
date: "2015-12-07"
type: post
---

![Featured imaged][featured-image]

When we create java classes, we group them in packages so that we can manage them properly. We are using file systems to store our classes and we learned to map a package name to a corresponding folder:

* Oracle java tutorial [summary package][oracle-tutorial-summary-package]:
> The path names for a package's source and class files mirror the name of the package.
* Java language specification [host support for packages][jls-host-support-packages]:
> Under this simple organization of packages, an implementation of the Java SE platform would transform a package name into a pathname by concatenating the components of the package name, placing a file name separator (directory indicator) between adjacent components.

I followed this rule and never thought to break it. A few years ago I was involved in a big refactoring for one project and we managed somehow to move few java files in a package that did not matched the folder structure. IntelliJ Idea did not complained, code was compiled and run. Nobody from our side noticed it because we all used Idea and the issue was discovered by the client because somebody used Eclipse. We fixed the issue by moving the classes into the right folders, we wondered a little bit and then we forgot.

I remembered these days about that issue and I discussed with my colleagues about it. We did not have a common understanding; some said that the code should not compile, others thought that even it it compiles, it will fail at runtime. I decided to check and share the findings.

I created the following files:

```
src
└── main
    └── java
        └── com
            └── espressoprogrammer
                └── naming
                    └── packagename
                        ├── DifferentPackageThanPath.java
                        ├── SamePackageAsPath.java
                        └── test
                            └── PackageNameTest.java
```

SamePackageAsPath - A class that behaves as expected, with package name in  mirrored folder structure:

```java
package com.espressoprogrammer.naming.packagename;

public class SamePackageAsPath {
}
```

DifferentPackageThanPath - A class that is in the same folder as SamePackageAsPath but with a different package:

```java
package com.espressoprogrammer.naming.differentpackagename;

public class DifferentPackageThanPath {
}
```

PackageNameTest - A class used to instantiate the other two classes. I used another package so that I need import statements:

```java
package com.espressoprogrammer.naming.packagename.test;

import com.espressoprogrammer.naming.differentpackagename.DifferentPackageThanPath;
import com.espressoprogrammer.naming.packagename.SamePackageAsPath;

public class PackageNameTest {

    public static void main(String... args) {
        printSomeClassInfo(new SamePackageAsPath());
        printSomeClassInfo(new DifferentPackageThanPath());
    }

    private static void printSomeClassInfo(Object object) {
        System.out.println("----------------------- ");
        System.out.println("  getClass().getName(): " + object.getClass().getName());
        System.out.println("getPackage().getName(): " + object.getClass().getPackage().getName());
    }

}
```

I use [Intellij Idea 15 community edition][intellij-idea-community] and it fails to compile above code but it compiles perfectly from command line. It also runs and the result is:

```
----------------------- 
  getClass().getName(): com.espressoprogrammer.naming.packagename.SamePackageAsPath
getPackage().getName(): com.espressoprogrammer.naming.packagename
----------------------- 
  getClass().getName(): com.espressoprogrammer.naming.differentpackagename.DifferentPackageThanPath
getPackage().getName(): com.espressoprogrammer.naming.differentpackagename
```

I also wanted to find out what happens if I add the following classes directly in `src/main/java` where classes with default package should exist but use package names:

```java
package com.espressoprogrammer.naming.packagename.one;

public class PackageNameOne {
}
```

```java
package com.espressoprogrammer.naming.packagename.two;

public class PackageNameTwo {
}
```

```java
package com.espressoprogrammer.naming.packagename.zero;

import com.espressoprogrammer.naming.packagename.one.PackageNameOne;
import com.espressoprogrammer.naming.packagename.two.PackageNameTwo;

public class PackageNameTest {

    public static void main(String... args) {
        printSomeClassInfo(new PackageNameOne());
        printSomeClassInfo(new PackageNameTwo());
    }

    private static void printSomeClassInfo(Object object) {
        System.out.println("----------------------- ");
        System.out.println("  getClass().getName(): " + object.getClass().getName());
        System.out.println("getPackage().getName(): " + object.getClass().getPackage().getName());
    }

}
```

Again Idea failed to compile but everthing compiled and run perfectly from command line:

```
-----------------------
  getClass().getName(): com.espressoprogrammer.naming.packagename.one.PackageNameOne
getPackage().getName(): com.espressoprogrammer.naming.packagename.one
-----------------------
  getClass().getName(): com.espressoprogrammer.naming.packagename.two.PackageNameTwo
getPackage().getName(): com.espressoprogrammer.naming.packagename.two
```

The complete file structure for both java and class files is:

```
.
├── pom.xml
├── samples.iml
├── src
│   ├── main
│   │   └── java
│   │       ├── com
│   │       │   └── espressoprogrammer
│   │       │       ├── naming
│   │       │       │   └── packagename
│   │       │       │       ├── DifferentPackageThanPath.java
│   │       │       │       ├── SamePackageAsPath.java
│   │       │       │       └── test
│   │       │       │           ├── PackageNameTest.java
│   │       │       │           └── PackageNameTest.txt
│   │       │       └── source-tree.txt
│   │       ├── PackageNameOne.java
│   │       ├── PackageNameTest.java
│   │       ├── PackageNameTest.txt
│   │       └── PackageNameTwo.java
│   └── test
│       └── java
│           └── com
│               └── espressoprogrammer
└── target
    └── classes
        └── com
            └── espressoprogrammer
                └── naming
                    ├── differentpackagename
                    │   └── DifferentPackageThanPath.class
                    └── packagename
                        ├── one
                        │   └── PackageNameOne.class
                        ├── SamePackageAsPath.class
                        ├── test
                        │   └── PackageNameTest.class
                        ├── two
                        │   └── PackageNameTwo.class
                        └── zero
                            └── PackageNameTest.class

```

My conclusion is that the rule to mirror package name to folder structure is for generated class files and not for the sources. What is your opinion on this?

A similar discussion can be read on [stack overflow][stack-overflow-package-folder-not-mapped].

Image credit: [PublicDomainPictures][pixabay-publicdomainpictures], CC0 Public Domain

[featured-image]: coffee-beans-package.jpg
[oracle-tutorial-summary-package]: https://docs.oracle.com/javase/tutorial/java/package/summary-package.html "Summary of Creating and Using Packages"
[jls-host-support-packages]: https://docs.oracle.com/javase/specs/jls/se8/html/jls-7.html#jls-7.2 "7.2. Host Support for Packages"
[intellij-idea-community]: https://www.jetbrains.com/idea/
[stack-overflow-package-folder-not-mapped]: http://stackoverflow.com/questions/8395916/package-name-is-different-than-the-folder-structure-but-still-java-code-compiles "Package name is different than the folder structure but still Java code compiles"
[pixabay-publicdomainpictures]: https://pixabay.com/en/users/PublicDomainPictures-14/