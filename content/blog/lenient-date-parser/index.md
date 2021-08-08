---
title: Lenient date parser
date: "2016-05-10"
type: post
---

Little strokes fell great oaks. We have a similar saying in Romanian and I remembered it after I saw that this code

```java
public static void main(String... args) throws ParseException {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");

        System.out.println(dateFormat.parse("2016-17-09"));
}
```

does not complain and displays

```
Tue May 09 00:00:00 EEST 2017
```

The explanation is simple and is caused by a small detail in [`SimpleDateFormat`][simpledateformat-api] api that is [setting lenient][simpledateformat-setlenient-api] field:

>Specify whether or not date/time parsing is to be lenient. With lenient parsing, the parser may use heuristics to interpret inputs that do not precisely match this object's format. With strict parsing, inputs must match this object's format.
This method is equivalent to the following call.
>
    getCalendar().setLenient(lenient)

>This leniency value is overwritten by a call to setCalendar().

If the purpose of above code is to validate the date, setting the lenient field to false
```java
public static void main(String... args) throws ParseException {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");

        dateFormat.setLenient(false);
        System.out.println(dateFormat.parse("2016-17-09"));
}
```

fixes the problem

```
Exception in thread "main" java.text.ParseException: Unparseable date: "2016-17-09"
	at java.text.DateFormat.parse(DateFormat.java:366)
	at com.espressoprogrammer.samples.parser.date.LenientDateParser.main(LenientDateParser.java:13)
	at sun.reflect.NativeMethodAccessorImpl.invoke0(Native Method)
	at sun.reflect.NativeMethodAccessorImpl.invoke(NativeMethodAccessorImpl.java:62)
	at sun.reflect.DelegatingMethodAccessorImpl.invoke(DelegatingMethodAccessorImpl.java:43)
	at java.lang.reflect.Method.invoke(Method.java:498)
	at com.intellij.rt.execution.application.AppMain.main(AppMain.java:144)
```

It's very easy to miss this kind of problems especially if a code like this is hidden in some useful methods somewhere in a common project. The solution to avoid these issues is simple but often overlooked. All we need is to add unit tests and even if we miss some detail from api, a failed test will force us to read it again.

[simpledateformat-api]: https://docs.oracle.com/javase/8/docs/api/java/text/SimpleDateFormat.html "Class SimpleDateFormat"
[simpledateformat-setlenient-api]: https://docs.oracle.com/javase/8/docs/api/java/text/DateFormat.html#setLenient-boolean-
