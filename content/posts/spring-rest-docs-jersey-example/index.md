---
title: Spring REST Docs with Jersey example
date: 2016-06-27
type: post
---

![Featured imaged][featured-image]

In [previous post][spring-rest-docs-example] I discussed about [Spring REST docs][spring-restdocs] and I mentioned that I’m planning to give it a try. I was so enthusiastic when playing with [Spring REST docs][spring-restdocs] that I forgot that we are using [Jersey][jersey]. At first I was disappointed but then I started to look for a solution. The first hope come from [Stack Overflow][stackoverflow] where I found that [it is possible to use Spring Restdocs with Jersey application][stackoverflow-jersey-spring-restdocs]. I dug more and I updated my [greeting service][greeting-service-jersey] to use [Jersey][jersey].

The first change was in pom.xml that was updated from:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.restdocs</groupId>
        <artifactId>spring-restdocs-mockmvc</artifactId>
    </dependency>
    <dependency>
        <groupId>com.jayway.jsonpath</groupId>
        <artifactId>json-path</artifactId>
        <scope>test</scope>
    </dependency>
</dependencies>
```

to

```xml
<properties>
    <jersey.test.framework.version>1.19</jersey.test.framework.version>
    <jersey.test.framework.provider.grizzly2.version>2.23.1</jersey.test.framework.provider.grizzly2.version>
    <spring.restdocs.restassured.version>1.1.0.RELEASE</spring.restdocs.restassured.version>
    <spring.restdocs.core.version>1.1.0.RELEASE</spring.restdocs.core.version>
    <system.rules.version>1.16.0</system.rules.version>
    <asciidoctor.maven.plugin.version>1.5.2</asciidoctor.maven.plugin.version>
</properties>

<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-jersey</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-test</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>com.sun.jersey.jersey-test-framework</groupId>
        <artifactId>jersey-test-framework-core</artifactId>
        <version>${jersey.test.framework.version}</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.glassfish.jersey.test-framework.providers</groupId>
        <artifactId>jersey-test-framework-provider-grizzly2</artifactId>
        <version>${jersey.test.framework.provider.grizzly2.version}</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.springframework.restdocs</groupId>
        <artifactId>spring-restdocs-restassured</artifactId>
        <version>${spring.restdocs.restassured.version}</version>
        <scope>test</scope>
    </dependency>
    <!-- It fails with spring-restdocs-core from spring-restdocs-restassured -->
    <dependency>
        <groupId>org.springframework.restdocs</groupId>
        <artifactId>spring-restdocs-core</artifactId>
        <version>${spring.restdocs.core.version}</version>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>com.github.stefanbirkner</groupId>
        <artifactId>system-rules</artifactId>
        <version>${system.rules.version}</version>
        <scope>test</scope>
    </dependency>
</dependencies>
```

I had to explicitly add `org.springframework.restdocs:spring-restdocs-core` with version 1.1.0.RELEASE because the transitive included one with version 1.0.1.RELEASE caused the following problems:

* `org.springframework.restdocs.RestDocumentation` does not implement `org.springframework.restdocs.RestDocumentationContextProvider`
* `org.springframework.restdocs.restassured.RestAssuredRestDocumentation#documentationConfiguration()` does not compile when an `org.springframework.restdocs.RestDocumentation` instance is sent as its parameter:

```
[ERROR] /media/data/Work/espressoprogrammer-code/greeting-service-jersey/src/test/java/com/espressoprogrammer/hello/GreetingServiceTest.java:[59,56]
incompatible types: org.springframework.restdocs.RestDocumentation cannot be converted to org.springframework.restdocs.RestDocumentationContextProvider
```

After I explicitly added `org.springframework.restdocs:spring-restdocs-core` with version 1.1.0.RELEASE I was able to compile.

Code was updated also like bellow.

```java
@SpringBootApplication
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }

}
```

changed to:

```java
@SpringBootApplication
public class Application extends SpringBootServletInitializer {

    public static void main(String[] args) {
        new Application()
                .configure(new SpringApplicationBuilder(Application.class))
                .run(args);
    }

}
```

```java
@RestController
@RequestMapping("/greeting")
public class GreetingController {

    private static final String template = "Hello, %s!";
    private final AtomicLong counter = new AtomicLong();

    @RequestMapping(method = RequestMethod.GET)
    public Greeting greeting(@RequestParam(value="name", defaultValue="World") String name) {
        return new Greeting(counter.incrementAndGet(), String.format(template, name));
    }

}
```

changed to:

```java
@Component
@Path("/greeting")
public class GreetingService {

    private static final String template = "Hello, %s!";
    private final AtomicLong counter = new AtomicLong();

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Greeting greeting(@QueryParam("name") @DefaultValue("World") String name) {
        return new Greeting(counter.incrementAndGet(), String.format(template, name));
    }

}
```

```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = Application.class)
@WebAppConfiguration
public class GreetingControllerTest {

    @Rule
    public RestDocumentation restDocumentation = new RestDocumentation("target/generated-snippets");

    @Autowired
    private WebApplicationContext context;

    private MockMvc mockMvc;

    @Before
    public void setUp(){
        this.mockMvc = MockMvcBuilders.webAppContextSetup(this.context)
                .apply(documentationConfiguration(this.restDocumentation))
                .build();
    }

    @Test
    public void greetingGetWithProvidedContent() throws Exception {

        this.mockMvc.perform(get("/greeting"). param("name", "Everybody"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
                .andExpect(jsonPath("$.content", is("Hello, Everybody!")))
                .andDo(document("{class-name}/{method-name}",
                        requestParameters(parameterWithName("name").description("Greeting's target")),
                        responseFields(fieldWithPath("id").description("Greeting's generated id"),
                                fieldWithPath("content").description("Greeting's content"),
                                fieldWithPath("optionalContent").description("Greeting's optional content").type(JsonFieldType.STRING).optional()
                )));

    }

    @Test
    public void greetingGetWithDefaultContent() throws Exception {

        this.mockMvc.perform(get("/greeting"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
                .andExpect(jsonPath("$.content", is("Hello, World!")))
                .andDo(document("{class-name}/{method-name}",
                        responseFields(fieldWithPath("id").ignored(),
                                fieldWithPath("content").description("When name is not provided, this field contains the default value")
                )));

    }

}
```

changed to:

```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = Application.class)
public class GreetingServiceTest extends JerseyTest {
    private static final Integer JERSEY_CONTAINER_PORT = 8080;

    @Rule
    public final ProvideSystemProperty myPropertyHasMyValue = new ProvideSystemProperty("jersey.config.test.container.port", JERSEY_CONTAINER_PORT.toString());

    @Rule
    public JUnitRestDocumentation restDocumentation = new JUnitRestDocumentation("target/generated-snippets");

    @Test
    public void greetingGetWithProvidedContent() throws Exception {
        given()
                .port(JERSEY_CONTAINER_PORT)
                .filter(documentationConfiguration(this.restDocumentation))
                .filter(document("{class-name}/{method-name}",
                        requestParameters(parameterWithName("name").description("Greeting's target")),
                        responseFields(fieldWithPath("id").description("Greeting's generated id"),
                                fieldWithPath("content").description("Greeting's content"),
                                fieldWithPath("optionalContent").description("Greeting's optional content").type(JsonFieldType.STRING).optional()
                        )))
                .accept(MediaType.APPLICATION_JSON.toString())
                .get("/greeting?name={id}", "Everybody")
                .then()
                .statusCode(HttpStatus.OK.value())
                .assertThat().contentType(equalTo(MediaType.APPLICATION_JSON.toString()))
                .assertThat().body("content", equalTo("Hello, Everybody!"));
    }

    @Test
    public void greetingGetWithDefaultContent() throws Exception {
        given()
                .port(JERSEY_CONTAINER_PORT)
                .filter(documentationConfiguration(this.restDocumentation))
                .filter(document("{class-name}/{method-name}",
                        responseFields(fieldWithPath("id").ignored(),
                                fieldWithPath("content").description("When name is not provided, this field contains the default value"))))
                .accept(MediaType.APPLICATION_JSON.toString())
                .get("/greeting")
                .then()
                .statusCode(HttpStatus.OK.value())
                .assertThat().contentType(equalTo(MediaType.APPLICATION_JSON.toString()))
                .assertThat().body("content", equalTo("Hello, World!"));
    }

    @Override
    public ResourceConfig configure() {
        return new ResourceConfig(GreetingService.class);
    }

}
```

I had to use `org.springframework.restdocs.JUnitRestDocumentation` because `org.springframework.restdocs.RestDocumentation` is deprecated in `org.springframework.restdocs:spring-restdocs-core` with version 1.1.0.RELEASE.

```
= Greeting REST Service API Guide
:doctype: book
:icons: font
:source-highlighter: highlightjs
:toc: left
:toclevels: 4
:sectlinks:

= Resources

== Greeting REST Service

The Greeting provides the entry point into the service.

=== Accessing the greeting GET with provided content

==== Request structure

include::{snippets}/greeting-controller-test/greeting-get-with-provided-content/http-request.adoc[]

==== Request parameters

include::{snippets}/greeting-controller-test/greeting-get-with-provided-content/request-parameters.adoc[]

==== Response fields

include::{snippets}/greeting-controller-test/greeting-get-with-provided-content/response-fields.adoc[]

==== Example response

include::{snippets}/greeting-controller-test/greeting-get-with-provided-content/http-response.adoc[]

==== CURL request

include::{snippets}/greeting-controller-test/greeting-get-with-provided-content/curl-request.adoc[]

=== Accessing the greeting GET with default content

==== Request structure

include::{snippets}/greeting-controller-test/greeting-get-with-default-content/http-request.adoc[]

==== Response fields

include::{snippets}/greeting-controller-test/greeting-get-with-default-content/response-fields.adoc[]

==== Example response

include::{snippets}/greeting-controller-test/greeting-get-with-default-content/http-response.adoc[]

==== CURL request

include::{snippets}/greeting-controller-test/greeting-get-with-default-content/curl-request.adoc[]
```

changed to:

```
= Greeting REST Service API Guide
Jersey implementation;
:doctype: book
:icons: font
:source-highlighter: highlightjs
:toc: left
:toclevels: 4
:sectlinks:

= Resources

== Greeting REST Service

The Greeting provides the entry point into the service.

=== Accessing the greeting GET with provided content

==== Request structure

include::{snippets}/greeting-service-test/greeting-get-with-provided-content/http-request.adoc[]

==== Request parameters

include::{snippets}/greeting-service-test/greeting-get-with-provided-content/request-parameters.adoc[]

==== Response fields

include::{snippets}/greeting-service-test/greeting-get-with-provided-content/response-fields.adoc[]

==== Example response

include::{snippets}/greeting-service-test/greeting-get-with-provided-content/http-response.adoc[]

==== CURL request

include::{snippets}/greeting-service-test/greeting-get-with-provided-content/curl-request.adoc[]

=== Accessing the greeting GET with default content

==== Request structure

include::{snippets}/greeting-service-test/greeting-get-with-default-content/http-request.adoc[]

==== Response fields

include::{snippets}/greeting-service-test/greeting-get-with-default-content/response-fields.adoc[]

==== Example response

include::{snippets}/greeting-service-test/greeting-get-with-default-content/http-response.adoc[]

==== CURL request

include::{snippets}/greeting-service-test/greeting-get-with-default-content/curl-request.adoc[]

```

The only major change here was that `include::{snippets}/greeting-controller-test` changed to `include::{snippets}/greeting-service-test` because I renamed the test class.

I had to add:

```java
@Component
public class JerseyConfig extends ResourceConfig {

    public JerseyConfig() {
        register(GreetingService.class);
    }

}
```

and an empty `applicationContext.xml` in `src/test/resources` otherwise Jersey test fails:

```xml
<?xml version="1.0" encoding="UTF-8"?>

<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xsi:schemaLocation="
       http://www.springframework.org/schema/beans   http://www.springframework.org/schema/beans/spring-beans.xsd">

</beans>
```
After running `mvn clean package` <a href="/html/posts/spring-rest-docs-jersey-example/greeting-service-jersey-api-guide.html" target="_blank">generated documentation</a> can be found in `target/generated-docs` folder:

![generated documentation][greeting-service-jersey-api-guide-image]

This is still a very simple example, hopefully these were the last surprises and now I can give it a try with real production code.

[featured-image]: greeting-service-jersey-api-guide-700x427.png
[spring-rest-docs-example]: /spring-rest-docs-example
[spring-restdocs]: http://projects.spring.io/spring-restdocs/
[jersey]: https://jersey.java.net/
[stackoverflow]: http://stackoverflow.com
[stackoverflow-jersey-spring-restdocs]: http://stackoverflow.com/questions/35068860/is-it-possible-to-use-spring-restdocs-with-jersey-application
[greeting-service-jersey]: https://github.com/vasileboris/espressoprogrammer/tree/master/greeting-service-jersey
[greeting-service-jersey-api-guide-image]: /images/posts/spring-rest-docs-jersey-example/greeting-service-jersey-api-guide.png
