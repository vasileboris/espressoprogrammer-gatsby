---
title: Spring REST Docs example (2)
date: 2017-01-02
description: It is a spring restdocs example that shows how to document path parameters, request fields, response fields and response headers.
type: post
---

Last year I found out about [spring restdocs][spring-restdocs], I really liked the idea so I created a [small example][greeting-service] and I wrote a [post][spring-rest-docs-example] about it. That example is a simple REST service that exposes one resource and allows only GET operation on it. Last week I started a [personal project][library] that is also a REST service but exposes more resources and allows more HTTP operations on them so it is much better suited for a post about [spring restdocs][spring-restdocs]. In previous [post][spring-rest-docs-example] I described all steps needed to setup a project for [spring restdocs][spring-restdocs] so in this one I will not repeat them and I will focus only in differences between them.

The first difference is related with how to run [junit][junit] tests in a [spring-boot][spring-boot] project. In version **1.3.5.RELEASE** it was like below:

```java
@RunWith(SpringJUnit4ClassRunner.class)
@SpringApplicationConfiguration(classes = Application.class)
@WebAppConfiguration
public class GreetingControllerTest {
}
```

and in version **1.4.3.RELEASE** it changed to:

```java
@RunWith(SpringRunner.class)
@SpringBootTest(webEnvironment= SpringBootTest.WebEnvironment.RANDOM_PORT)
public class BooksControllerTest {
}
```

The second difference is how `RestDocumentation` junit rule is configured with the output directory into which generated snippets should be written. It changed from:

```java
@Rule
public RestDocumentation restDocumentation = new RestDocumentation("target/generated-snippets");
```

into:

```java
@Rule
public JUnitRestDocumentation restDocumentation = new JUnitRestDocumentation("target/generated-snippets");
```

In previous [post][spring-rest-docs-example] I documented **request parameters** and **response fields**, in this post I will document **path parameters**, **request fields**, **response fields** and **response headers**.

One of the resources of this project is `/users/{user}/books` which:

* returns all books for provided user on GET operation
* adds a new book for provided user on POST operation

## Return all books for provided user

```java
@GetMapping(value = "/users/{user}/books")
public ResponseEntity<List<Book>> getUserBooks(@PathVariable("user") String user)  {
    try {
        logger.debug("Look for books for user {}", user);

        List<Book> userBooks = booksDao.getUserBooks(user);
        return new ResponseEntity<>(userBooks, HttpStatus.OK);
    } catch (Exception ex) {
        logger.error("Error on looking for books", ex);
        return new ResponseEntity(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

This method needs to document **path parameters** and **response fields**:

```java
@Test
public void getUserBooks() throws Exception {
    ArrayList<Book> books = new ArrayList<>();
    books.add(getBook("1e4014b1-a551-4310-9f30-590c3140b695.json"));
    when(booksDao.getUserBooks(JOHN_DOE_USER)).thenReturn(books);

    this.mockMvc.perform(get("/users/{user}/books", JOHN_DOE_USER))
        .andExpect(status().isOk())
        .andExpect(content().contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
        .andExpect(jsonPath("$[0].uuid", is("1e4014b1-a551-4310-9f30-590c3140b695")))
        .andExpect(jsonPath("$[0].isbn10", is("1-61729-310-5")))
        .andExpect(jsonPath("$[0].isbn13", is("978-1-61729-310-8")))
        .andExpect(jsonPath("$[0].title", is("Get Programming with JavaScript")))
        .andExpect(jsonPath("$[0].authors[0].firstName", is("John R.")))
        .andExpect(jsonPath("$[0].authors[0].lastName", is("Larsen")))
        .andExpect(jsonPath("$[0].pages", is(406)))
        .andDo(document("{class-name}/{method-name}",
            pathParameters(parameterWithName("user").description("User id")),
            responseFields(
                fieldWithPath("[].uuid").description("UUID used to identify a book"),
                fieldWithPath("[].isbn10").description("10 digits ISBN (optional)").optional(),
                fieldWithPath("[].isbn13").description("13 digits ISBN (optional)").optional(),
                fieldWithPath("[].title").description("Book title"),
                fieldWithPath("[].authors").description("Book authors (optional)").optional(),
                fieldWithPath("[].authors[].firstName").description("First name"),
                fieldWithPath("[].authors[].firstName").description("Last name"),
                fieldWithPath("[].pages").description("Number of pages")
            )));
}
```

and generated documentation looks like:

[![retrieve-user-books-image][retrieve-user-books-image]][retrieve-user-books-image]

## Add a new book for provided user on POST operation

```java
@PostMapping(value = "/users/{user}/books")
public ResponseEntity createUserBook(@PathVariable("user") String user,
                                     @RequestBody Book book)  {
    try {
        logger.debug("Add new book for user {}", user);

        if(hasUseTheBook(user, book)) {
            ErrorResponse errorResponse = new ErrorResponse(DATA_VALIDATION,
                asList(new ErrorCause(asList("isbn10", "isbn13"), "book.isbn.exists")));

            return new ResponseEntity(errorResponse ,HttpStatus.FORBIDDEN);
        }

        String uuid = booksDao.createUserBook(user, book);
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add(HttpHeaders.LOCATION, String.format("/users/%s/books/%s", user, uuid));
        return new ResponseEntity(httpHeaders, HttpStatus.CREATED);
    } catch (Exception ex) {
        logger.error("Error on adding new book", ex);
        return new ResponseEntity(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

This method needs to document **path parameters**, **field fields**, **response headers** and **response fields**:

```java
@Test
public void createUserBook() throws Exception {
    Book book = getBook("1e4014b1-a551-4310-9f30-590c3140b695-request.json");
    when(booksDao.getUserBook(JOHN_DOE_USER, book.getUuid())).thenReturn(Optional.empty());
    when(booksDao.createUserBook(JOHN_DOE_USER, book)).thenReturn("1e4014b1-a551-4310-9f30-590c3140b695");

    this.mockMvc.perform(post("/users/{user}/books", JOHN_DOE_USER)
            .content(getBookJson("1e4014b1-a551-4310-9f30-590c3140b695-request.json"))
            .contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
        .andExpect(status().isCreated())
        .andExpect(header().string(HttpHeaders.LOCATION, "/users/" + JOHN_DOE_USER + "/books/1e4014b1-a551-4310-9f30-590c3140b695"))
        .andDo(document("{class-name}/{method-name}",
            pathParameters(parameterWithName("user").description("User id")),
            requestFields(
                fieldWithPath("isbn10").description("10 digits ISBN (optional)").optional(),
                fieldWithPath("isbn13").description("13 digits ISBN (optional)" ).optional(),
                fieldWithPath("title").description("Book title"),
                fieldWithPath("authors").description("Book authors (optional)").optional(),
                fieldWithPath("authors[].firstName").description("First name"),
                fieldWithPath("authors[].firstName").description("Last name"),
                fieldWithPath("pages").description("Number of pages")
            ),
            responseHeaders(
                headerWithName(HttpHeaders.LOCATION).description("New added book resource")
            )));
}

@Test
public void createExistingUserBook() throws Exception {
    Book book = getBook("1e4014b1-a551-4310-9f30-590c3140b695.json");
    when(booksDao.getUserBooks(JOHN_DOE_USER)).thenReturn(Arrays.asList(book));

    this.mockMvc.perform(post("/users/{user}/books", JOHN_DOE_USER)
        .content(getBookJson("1e4014b1-a551-4310-9f30-590c3140b695-request.json"))
        .contentType(MediaType.APPLICATION_JSON_UTF8_VALUE))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("type", is("DATA_VALIDATION")))
        .andExpect(jsonPath("causes[0].causes[0]", is("isbn10")))
        .andExpect(jsonPath("causes[0].causes[1]", is("isbn13")))
        .andExpect(jsonPath("causes[0].key", is("book.isbn.exists")))
        .andDo(document("{class-name}/{method-name}",
            responseFields(
                fieldWithPath("type").description("Error type"),
                fieldWithPath("causes").description("Error causes"),
                fieldWithPath("causes[].causes")
                    .description("Error causes (OPTIONAL). If present, it contains the name of the fields related with this error.")
                    .optional(),
                fieldWithPath("causes[].key")
                    .description("Error key. This should be used to locate the right translation for the error")
            )));
}
```

and generated documentation looks like:

[![add-user-book-image][add-user-book-image]][add-user-book-image]

All the other resources and operations from this project are similar with these two and it does not make sense to repeat the information. I hope you found this post usefull and if you want all details, you can check [the code][library] and <a href="/html/posts/spring-rest-docs-example-2/library-api-guide.html" target="_blank">the entire generated documentation</a>.

[spring-restdocs]: https://projects.spring.io/spring-restdocs/
[spring-rest-docs-example]: /spring-rest-docs-example
[greeting-service]: https://github.com/vasileboris/espressoprogrammer/tree/master/greeting-service
[library]: https://github.com/vasileboris/library
[junit]: http://junit.org/
[spring-boot]: https://projects.spring.io/spring-boot/
[retrieve-user-books-image]: /images/posts/spring-rest-docs-example-2/retrieve-user-books.png
[add-user-book-image]: /images/posts/spring-rest-docs-example-2/add-user-book.png
