---
title: Spring REST Docs example
date: 2016-06-13
type: post
---

![Featured imaged][featured-image]

This year in May I attended the [Spring I/O][spring-io-2016] conference where I heard about [Spring REST docs][spring-restdocs]. Two things captured my attention:

* Documentation is generated from unit tests
* Tests fail if documentation is not done properly.

After the conference I checked out [Spring REST docs reference][spring-restdocs-reference] and I created a [sample REST service][greeting-service] to see it in practice. The code is very simple and it is the classic *Hello World*.

```java
public class Greeting {

    private final long id;
    private final String content;

    public Greeting(long id, String content) {
        this.id = id;
        this.content = content;
    }

    public long getId() {
        return id;
    }

    public String getContent() {
        return content;
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

[Spring REST docs][spring-restdocs] uses [Asciidoctor][asciidoctor] to generate the documentation so configuring [maven][maven] is the first step.

```xml
<plugin>
    <groupId>org.asciidoctor</groupId>
    <artifactId>asciidoctor-maven-plugin</artifactId>
    <version>1.5.2</version>
    <executions>
        <execution>
            <id>generate-docs</id>
            <phase>prepare-package</phase>
            <goals>
                <goal>process-asciidoc</goal>
            </goals>
            <configuration>
                <backend>html</backend>
                <doctype>book</doctype>
                <attributes>
                    <snippets>${project.build.directory}/generated-snippets</snippets>
                </attributes>
                <sourceDirectory>src/docs/asciidocs</sourceDirectory>
                <outputDirectory>target/generated-docs</outputDirectory>
            </configuration>
        </execution>
    </executions>
</plugin>
```

Relevant information from this configuration is:

* phase - If it is set to `prepare-package` documentation is available to be [packaged][spring-restdocs-reference-maven-packaging]. [Spring boot][spring-boot] can serve it as [static content][serving-static-web-content-with-spring-boot] when application is running.
* sourceDirectory - This is where [Asciidoctor][asciidoctor] documentation templates can be found. I'll get back to them later.
* snippets - This attribute specifies the place where tests will generate documentation snippets. This attribute is used in [Asciidoctor][asciidoctor] templates to include generated snippets in the documentation.
* outputDirectory - It specifies where final documentation is generated.

The next step is to create the test class:

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

Documentation is done in two steps by this test class:

* First step is [setting up Spring MVC test][setting-started-documentation-snippets-setup].
* `restDocumentation` junit rule is configured with the output directory into which generated snippets should be written.
* `mockMvc` needs to know about this configuration and this is done by the static `documentationConfiguration()` method on `org.springframework.restdocs.mockmvc.MockMvcRestDocumentation`.
* The second step is to document how the API should be used. This is done in each test method by static `document()` method on the same `org.springframework.restdocs.mockmvc.MockMvcRestDocumentation`.

The first test method `greetingGetWithProvidedContent` tests what happens if the greeting service is called with `name` parameter set:

* The first parameter specifies the folder name where snippets for this method will be generated. In this case it is [parameterized][documentating-your-api-parameterized-output-directories] by the class and method names with `{class-name}/{method-name}`. The result is `greeting-controller-test/greeting-get-with-provided-content`.
* `requestParameters` documents request parameters and generates `request-parameters.adoc` snippet.
* `responseFields` documents response fields and generates `response-fields.adoc` snippet. All response fields need to appear in generated response, otherwise the test fails. `optionalContent` field is not returned in our result and I marked it as optional to demonstrate this possibility. It can happen in practice for a field to be returned only in certain situations.

The second test method `greetingGetWithDefaultContent()` tests what happens if the greeting service is called without `name` parameter. In this case it makes sense to  document only what is different:

* `responseFields` documents only `content` field because its value changes in this situation. To avoid documenting `id` parameter again I marked it as ignored.

Documentation snippets are generated now by test classes, we need a way to merge it all together. This is where our [Asciidoctor][asciidoctor] skills are needed. We need to create [a file][greeting-service-api-guide-adoc] in `src/docs/asciidocs` folder (see `sourceDirectory` from `asciidoctor-maven-plugin` configuration):

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

The most important aspect is how to [include generated snippets][working-with-asciidoctor-including-snippets]. Each test method generates by [default][documenting-your-api-default-snippets] three snippets:

* curl-request.adoc - Contains a sample `curl` command to access tested resource
* http-request.adoc - Contains the request used by the test method
* http-response.adoc - Contains the response generated by the test method

Besides these three default snippets our test methods generate two additional snippets:

* request-parameters.adoc - Contains a table with documented request parameters
* response-fields.adoc - Contains a table with documented response fields

After running `mvn clean package` <a href="/html/blog/spring-rest-docs-example/greeting-service-api-guide.html" target="_blank">generated documentation</a> can be found in `target/generated-docs` folder:

![generated documentation][greeting-service-api-guide-image]

We generated the documentation, so let's check now  what happens when our documenting code is out of sync with the implementation.

First scenario is to change request parameter from `name` to `content`. I updated the controller and how test accesses the resource but I missed to update the documenting code.

```java
@RequestMapping(method = RequestMethod.GET)
public Greeting greeting(@RequestParam(value="content", defaultValue="World") String content) {
    return new Greeting(counter.incrementAndGet(), String.format(template, content));
}
```

```java
@Test
public void greetingGetWithProvidedContent() throws Exception {

    this.mockMvc.perform(get("/greeting"). param("content", "Everybody"))
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
```

The test fails with:

```
org.springframework.restdocs.snippet.SnippetException:
Request parameters with the following names were not documented: [content].
Request parameters with the following names were not found in the request: [name]

```

The second scenario is to miss to document a field. In `greetingGetWithDefaultContent()` I will not document `id` field:

```java
@Test
public void greetingGetWithDefaultContent() throws Exception {

    this.mockMvc.perform(get("/greeting"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
            .andExpect(jsonPath("$.content", is("Hello, World!")))
            .andDo(document("{class-name}/{method-name}",
                    responseFields(fieldWithPath("content").description("When name is not provided, this field contains the default value")
            )));

}
```

Test fails with:

```
org.springframework.restdocs.snippet.SnippetException: The following parts of the payload were not documented:
{
  "id" : 1
}
```

The last scenario is to document a field that is not returned. I will remove `optional()` from documenting `optionalContent` field on `greetingGetWithProvidedContent()` method:

```java
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
                            fieldWithPath("optionalContent").description("Greeting's optional content").type(JsonFieldType.STRING)
            )));

}
```

Test fails with:

```
org.springframework.restdocs.snippet.SnippetException:
Fields with the following paths were not found in the payload: [optionalContent]
```

I didn't use [Spring REST docs][spring-restdocs] to document real production code but I'm planning to give it a try.

[featured-image]: greeting-service-api-guide-700x426.png
[spring-io-2016]: /spring-io-2016-conference
[spring-restdocs]: http://projects.spring.io/spring-restdocs/
[greeting-service]: https://github.com/vasileboris/espressoprogrammer/tree/master/greeting-service
[spring-restdocs-reference]: http://docs.spring.io/spring-restdocs/docs/1.0.x/reference/html5/
[asciidoctor]: http://asciidoctor.org/
[maven]: https://maven.apache.org
[spring-restdocs-reference-maven-packaging]: http://docs.spring.io/spring-restdocs/docs/1.0.x/reference/html5/#getting-started-build-configuration-maven-packaging
[spring-boot]: http://projects.spring.io/spring-boot/
[serving-static-web-content-with-spring-boot]: https://spring.io/blog/2013/12/19/serving-static-web-content-with-spring-boot
[setting-started-documentation-snippets-setup]: http://docs.spring.io/spring-restdocs/docs/1.0.x/reference/html5/#getting-started-documentation-snippets-setup
[documentating-your-api-parameterized-output-directories]: http://docs.spring.io/spring-restdocs/docs/1.0.x/reference/html5/#documentating-your-api-parameterized-output-directories
[working-with-asciidoctor-including-snippets]: http://docs.spring.io/spring-restdocs/docs/1.0.x/reference/html5/#working-with-asciidoctor-including-snippets
[documenting-your-api-default-snippets]: http://docs.spring.io/spring-restdocs/docs/1.0.x/reference/html5/#documenting-your-api-default-snippets
[greeting-service-api-guide]: /html/blog/spring-rest-docs-example/greeting-service-api-guide.html
[greeting-service-api-guide-adoc]: https://github.com/vasileboris/espressoprogrammer/blob/master/greeting-service/src/docs/asciidocs/api-guide.adoc
[greeting-service-api-guide-image]: /images/blog/spring-rest-docs-example/greeting-service-api-guide.png