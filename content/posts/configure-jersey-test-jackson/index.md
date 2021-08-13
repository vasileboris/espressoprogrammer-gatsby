---
title: Configure jersey test to use jackson
date: 2016-07-18
type: post
---

After [my previous post][spring-rest-docs-jersey-example] I thought that there were no more surprises and I would be able to document an already existing endpoint that I had written in the past. How wrong I was. I updated [my example][greeting-service-spring-jersey] to be similar with that endpoint so that I could explain what happened.

The first difference is that the endpoint returns a list of greetings:

```java
@Component
@Path("/greeting")
public class GreetingService {

    private static final String template = "Hello, %s!";
    private final AtomicLong counter = new AtomicLong();

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<Greeting> greeting(@QueryParam("name") @DefaultValue("World") String name) {
        return Arrays.asList(new Greeting(counter.incrementAndGet(), String.format(template, name)));
    }

}
```

The second difference is that [spring][spring] is used instead of [spring-boot][spring-boot] and the application is deployed as a [war file][war-file] in [tomcat][tomcat]. The important project files are listed below:

web.xml:
```xml
<!DOCTYPE web-app PUBLIC "-//Sun Microsystems, Inc.//DTD Web Application 2.3//EN" "http://java.sun.com/dtd/web-app_2_3.dtd" >

<web-app>
    <display-name>greeting-service</display-name>

    <context-param>
        <param-name>contextConfigLocation</param-name>
        <param-value>classpath:applicationContext.xml</param-value>
    </context-param>

    <listener>
        <listener-class>org.springframework.web.context.ContextLoaderListener</listener-class>
    </listener>
    <listener>
        <listener-class>org.springframework.web.context.request.RequestContextListener</listener-class>
    </listener>

    <servlet>
        <servlet-name>Jersey Spring Servlet</servlet-name>
        <servlet-class>com.sun.jersey.spi.spring.container.servlet.SpringServlet</servlet-class>
        <init-param>
            <param-name>com.sun.jersey.config.property.resourceConfigClass</param-name>
            <param-value>com.sun.jersey.api.core.PackagesResourceConfig</param-value>
        </init-param>
        <init-param>
            <param-name>com.sun.jersey.config.property.packages</param-name>
            <param-value>com.espressoprogrammer.hello;org.codehaus.jackson.jaxrs</param-value>
        </init-param>
    </servlet>

    <servlet-mapping>
        <servlet-name>Jersey Spring Servlet</servlet-name>
        <url-pattern>/*</url-pattern>
    </servlet-mapping>
</web-app>
```

applicationContext.xml:
```xml
<?xml version="1.0" encoding="UTF-8"?>

<beans xmlns="http://www.springframework.org/schema/beans"
       xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
       xmlns:context="http://www.springframework.org/schema/context"
       xsi:schemaLocation="http://www.springframework.org/schema/beans
	    http://www.springframework.org/schema/beans/spring-beans.xsd
		http://www.springframework.org/schema/context
		http://www.springframework.org/schema/context/spring-context.xsd">

    <context:component-scan base-package="com.espressoprogrammer.hello"/>

</beans>
```

```java
@XmlRootElement
public class Greeting {

    private long id;
    private String content;

    public Greeting() {
    }

    public Greeting(long id, String content) {
        this.id = id;
        this.content = content;
    }

    public void setId(long id) {
        this.id = id;
    }

    public long getId() {
        return id;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getContent() {
        return content;
    }

}
```

```java
@Component
@Path("/greeting")
public class GreetingService {

    private static final String template = "Hello, %s!";
    private final AtomicLong counter = new AtomicLong();

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public List<Greeting> greeting(@QueryParam("name") @DefaultValue("World") String name) {
        return Arrays.asList(new Greeting(counter.incrementAndGet(), String.format(template, name)));
    }

}
```

The third difference is that endpoint is tested with [jersey api client][jersey-api-client]:

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath:/test-applicationContext.xml"})
public class GreetingServiceJerseyClientOldTest extends JerseyTest {
    private static final String JERSEY_TEST_PORT_SYSTEM_PROPERTY = "jersey.test.port";
    private static final Integer JERSEY_TEST_PORT = 8080;

    @BeforeClass
    public static void init() {
        System.setProperty(JERSEY_TEST_PORT_SYSTEM_PROPERTY, JERSEY_TEST_PORT.toString());
    }

    @Rule
    public JUnitRestDocumentation restDocumentation = new JUnitRestDocumentation("target/generated-snippets");

    public GreetingServiceJerseyClientOldTest() {
        super(new WebAppDescriptor.Builder("com.espressoprogrammer.hello")
            .contextPath("greeting-service")
            .contextParam("contextConfigLocation", "classpath:/test-applicationContext.xml")
            .servletClass(SpringServlet.class)
            .contextListenerClass(ContextLoaderListener.class)
            .build());
    }

    @Test
    public void greetingGetWithProvidedContent() throws Exception {
        WebResource webResource = resource().path("greeting");
        ClientResponse response = webResource
            .queryParam("name", "Everybody")
            .accept(MediaType.APPLICATION_JSON)
            .get(ClientResponse.class);
        assertThat(response.getStatus()).isEqualTo(Response.Status.OK.getStatusCode());
        List<Greeting> greetings = response.getEntity(new GenericType<List<Greeting>>(){});
        assertThat(greetings).hasSize(1);
        assertThat(greetings.get(0).getContent()).isEqualTo("Hello, Everybody!");
    }

    @Test
    public void greetingGetWithDefaultContent() throws Exception {
        WebResource webResource = resource().path("greeting");
        ClientResponse response = webResource
            .accept(MediaType.APPLICATION_JSON)
            .get(ClientResponse.class);
        assertThat(response.getStatus()).isEqualTo(Response.Status.OK.getStatusCode());
        List<Greeting> greetings = response.getEntity(new GenericType<List<Greeting>>(){});
        assertThat(greetings).hasSize(1);
        assertThat(greetings.get(0).getContent()).isEqualTo("Hello, World!");
    }

}
```

The first attempt to update the test class to use [spring-restdocs] and [rest-assured] went well until I got to the point of documenting response fields and I noticed that the service is returning:

```json
{"greeting":{"content":"Hello, Everybody!","id":"1"}}
```

instead of the expected:

```json
[{"id":1,"content":"Hello, Everybody!"}]
```

After spending some time and using a lot of **#$@&%*!** I found that in web.xml [jersey][jersey] is configured to use [jackson][jackson]:

```xml
<init-param>
    <param-name>com.sun.jersey.config.property.packages</param-name>
    <param-value>com.espressoprogrammer.hello;org.codehaus.jackson.jaxrs</param-value>
</init-param>
```

The corresponding code from [jersey][jersey] test class is:

```java
public GreetingServiceBadTest() {
     super(new WebAppDescriptor.Builder("com.espressoprogrammer.hello")
         .contextPath("greeting-service")
         .contextParam("contextConfigLocation", "classpath:/test-applicationContext.xml")
         .servletClass(SpringServlet.class)
         .contextListenerClass(ContextLoaderListener.class)
         .build());
 }
```

where I missed to add [jackson][jackson] and [jaxb][jaxb] was used instead. The fix was simple:

```java
public GreetingServiceTest() {
    super(new WebAppDescriptor.Builder("com.espressoprogrammer.hello;org.codehaus.jackson.jaxrs")
        .contextPath("greeting-service")
        .contextParam("contextConfigLocation", "classpath:/test-applicationContext.xml")
        .servletClass(SpringServlet.class)
        .contextListenerClass(ContextLoaderListener.class)
        .build());
}
```

and the response was the expected one:

```json
[{"id":1,"content":"Hello, Everybody!"}]
```

The final test class looks like:

```java
@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations = {"classpath:/test-applicationContext.xml"})
public class GreetingServiceTest extends JerseyTest {
    private static final String JERSEY_TEST_PORT_SYSTEM_PROPERTY = "jersey.test.port";
    private static final Integer JERSEY_TEST_PORT = 8080;

    @BeforeClass
    public static void init() {
        System.setProperty(JERSEY_TEST_PORT_SYSTEM_PROPERTY, JERSEY_TEST_PORT.toString());
    }

    @Rule
    public JUnitRestDocumentation restDocumentation = new JUnitRestDocumentation("target/generated-snippets");

    public GreetingServiceTest() {
        super(new WebAppDescriptor.Builder("com.espressoprogrammer.hello;org.codehaus.jackson.jaxrs")
            .contextPath("greeting-service")
            .contextParam("contextConfigLocation", "classpath:/test-applicationContext.xml")
            .servletClass(SpringServlet.class)
            .contextListenerClass(ContextLoaderListener.class)
            .build());
    }

    @Test
    public void greetingGetWithProvidedContent() throws Exception {
        FieldDescriptor[] greeting = new FieldDescriptor[] {
            fieldWithPath("id").description("Greeting's generated id"),
            fieldWithPath("content").description("Greeting's content"),
            fieldWithPath("optionalContent").description("Greeting's optional content").type(JsonFieldType.STRING).optional()
        };
        given()
            .port(JERSEY_TEST_PORT)
            .filter(documentationConfiguration(this.restDocumentation))
            .filter(document("{class-name}/{method-name}",
                requestParameters(parameterWithName("name").description("Greeting's target")),
                responseFields(fieldWithPath("[]").description("An array of greetings")).andWithPrefix("[].", greeting)))
            .accept(MediaType.APPLICATION_JSON)
        .when()
            .get("/greeting-service/greeting?name={id}", "Everybody")
        .then()
            .statusCode(HttpStatus.OK.value())
            .assertThat().contentType(equalTo(MediaType.APPLICATION_JSON))
            .assertThat().body("content", hasItems("Hello, Everybody!"))
        ;
    }

    @Test
    public void greetingGetWithDefaultContent() throws Exception {
        FieldDescriptor[] greeting = new FieldDescriptor[] {
            fieldWithPath("id").ignored(),
            fieldWithPath("content").description("When name is not provided, this field contains the default value")
        };
        given()
            .port(JERSEY_TEST_PORT)
            .filter(documentationConfiguration(this.restDocumentation))
            .filter(document("{class-name}/{method-name}",
                responseFields(fieldWithPath("[]").description("An array of greetings")).andWithPrefix("[].", greeting)))
            .accept(MediaType.APPLICATION_JSON)
        .when()
            .get("/greeting-service/greeting")
        .then()
            .statusCode(HttpStatus.OK.value())
            .assertThat().contentType(equalTo(MediaType.APPLICATION_JSON))
            .assertThat().body("content", hasItems("Hello, World!"))
        ;
    }

}
```

If [jersey api client][jersey-api-client] is used to test the endpoint, also the client needs to be configured to use [jackson][jackson]:

```java
private static ClientConfig createClientConfig() {
    ClientConfig clientConfig = new DefaultClientConfig();
    clientConfig.getClasses().add(JacksonJaxbJsonProvider.class);
    return clientConfig;
}

public GreetingServiceJerseyClientTest() {
    super(new WebAppDescriptor.Builder("com.espressoprogrammer.hello;org.codehaus.jackson.jaxrs")
        .contextPath("greeting-service")
        .contextParam("contextConfigLocation", "classpath:/test-applicationContext.xml")
        .servletClass(SpringServlet.class)
        .contextListenerClass(ContextLoaderListener.class)
        .clientConfig(createClientConfig())
        .build());
}
```

After making these small changes, I was finally able to document a production endpoint.


[spring-rest-docs-jersey-example]: /spring-rest-docs-jersey-example
[spring-boot]: http://projects.spring.io/spring-boot/
[spring]: https://spring.io/
[tomcat]: http://tomcat.apache.org/
[jersey-api-client]: https://jersey.java.net/nonav/apidocs/1.19/jersey/com/sun/jersey/api/client/package-summary.html
[spring-restdocs]: http://projects.spring.io/spring-restdocs/
[rest-assured]: http://rest-assured.io/
[jersey]: https://jersey.java.net/
[jackson]: http://wiki.fasterxml.com/JacksonHome
[jaxb]: https://jaxb.java.net/
[greeting-service-spring-jersey]: https://github.com/vasileboris/espressoprogrammer/tree/master/greeting-service-spring-jersey
[war-file]: https://en.wikipedia.org/wiki/WAR_(file_format)


