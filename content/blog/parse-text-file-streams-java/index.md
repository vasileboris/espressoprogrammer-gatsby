---
title: Parse text file with streams in Java
date: 2016-08-08
description: A simple and working example on how to parse a text file with streams in Java.
type: post
---

One of the simplest programming tasks for a java programmer is to read a text file and then parse the lines for later processing. Even if this is quite simple, I never liked it. Dealing with [input streams][java-inputstream] and [readers][java-reader] is like handling an onion. We have to take care of tons of layers even before we start to do the actual work and when we are done we have tears in our eyes. The next step is reading the file line by line and process them and when all the line are read, we need to close used resources. Closing resources was another source of problems but this was solved in Java 7 with [try-with-resources statement][java-try-with-resources]. I prepared [an example][foods-composition-github] that reads a file from classpath, parses each line into an object and adds those objects into a list:

```java
public List<Abbrev> parseFile(String fileName) {
    logger.info("Parsing {} file", fileName);
    List<Abbrev> values = new LinkedList<>();
    try (BufferedReader br =  new BufferedReader(new InputStreamReader(getAbbrevInputStream(fileName), StandardCharsets.ISO_8859_1))) {
        String line;
        while((line = br.readLine()) != null) {
            values.add(parseLine(line));
        }
    } catch (Exception ex)  {
        logger.error("Failed to parse ABBREV.txt file", ex);
    }
    return values;
}
```

The real actual work is parsing the line from `parseLine(String line)` method and filling the result list, all the other code deals with file reading process. One way to improve this is using [Java 8 streams][java-streams]:

```java
public List<Abbrev> parseFile(String fileName) {
    logger.info("Parsing {} file", fileName);
    try (Stream<String> stream = Files.lines(Paths.get(getAbbrevURI(fileName)), StandardCharsets.ISO_8859_1)) {
        return stream.map(this::parseLine).collect(Collectors.toList());
    } catch (Exception ex) {
        logger.error("Failed to parse ABBREV.txt file", ex);
    }
    return new LinkedList<>();
}
```

We don't have to take care anymore of reading the lines, those are provided as a [stream][java-stream] of String instances and processing them is done declaratively with [map][java-stream-map] and [collect][java-stream-collect].

[java-inputstream]: https://docs.oracle.com/javase/8/docs/api/java/io/InputStream.html
[java-reader]: https://docs.oracle.com/javase/8/docs/api/java/io/Reader.html
[java-try-with-resources]: https://docs.oracle.com/javase/tutorial/essential/exceptions/tryResourceClose.html
[java-streams]: https://docs.oracle.com/javase/8/docs/api/java/util/stream/package-summary.html
[java-stream]: https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html
[java-stream-map]: https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html#map-java.util.function.Function-
[java-stream-collect]: https://docs.oracle.com/javase/8/docs/api/java/util/stream/Stream.html#collect-java.util.stream.Collector-
[foods-composition-github]: https://github.com/vasileboris/espressoprogrammer/tree/master/foods-composition