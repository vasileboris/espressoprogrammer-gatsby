---
title: Use generators for async operations
date: 2018-01-29
description: This is an example on how to use Generators for async operations.
type: post
---

I'm using [react][react], [redux][redux] and [redux-thunk][redux-thunk] in one of my [learning projects][library-web] and recently I wanted to try [redux-saga][redux-saga] and see in practice the advantages, if any, of using it instead of [redux-thunk][redux-thunk]. I started with [saga tutorial][saga-tutorial] and I got confused about how [generators][mdn-generator] are used to do async operations. Instead of jumping ahead and replace [redux-thunk][redux-thunk] with [redux-saga][redux-saga], I thought that it is much better to understand how [generators][mdn-generator] can be used with [promises][mdn-promise] without any other helper library.

In my [learning project][library-web] I have multiple branches and [one of them][library-web-async-promises] uses only [react][react] with [promises][mdn-promise]. A sample async code of one my [components][library-web-async-promises-component] looks like

```javascript
onAddDateReadingSessionClick() {
    validateDateReadingSession(this.state.dateReadingSession)
        .then(() => createDateReadingSession(this.props.bookUuid, this.state.currentReadingSession.uuid, this.state.dateReadingSession))
        .then(() => this.successOnAddDateReadingSession())
        .catch(error => this.errorOnApiOperation(error));
}
```

Both `validateDateReadingSession` and `createDateReadingSession` return [promises][mdn-promise] so we can chain them with `then` and `catch` methods. How can we use [generators][mdn-generator] to simplify this code? Before answering to this question we need to take a closer look on how [generators][mdn-generator] work.

```javascript
function *generateEvenNumbers() {
    yield 0;
    yield 2;
    yield 4;
    yield 6;
    yield 8;
    yield 10;
}

let evenNumbers = generateEvenNumbers();

console.log(evenNumbers.next());
//>{value: 0, done: false}

console.log(evenNumbers.next());
//>{value: 2, done: false}

console.log(evenNumbers.next());
//>{value: 4, done: false}

console.log(evenNumbers.next());
//>{value: 6, done: false}

console.log(evenNumbers.next());
//>{value: 8, done: false}

console.log(evenNumbers.next());
//>{value: 10, done: false}

console.log(evenNumbers.next());
//>{value: undefined, done: true}
```

In this example we have a generator that return the first six even numbers. When we call the generator with

```javascript
let evenNumbers = generateEvenNumbers();
```

we obtain an [iterator][mdn-iterator] instance on which we can call the `next` method. At this moment the code inside the [generator][mdn-generator] was not executed yet. The first call to the `next` method

```javascript
console.log(evenNumbers.next());
```

causes the code inside the [generator][mdn-generator] to run up to the first `yield` statement

```javascript
yield 0;
```

and that value is the result of the `next` method

```javascript
//>{value: 0, done: false} 
```

The second call to the `next` method resumes the execution inside the [generator][mdn-generator] and continues up to the next `yield` statement

```javascript
yield 2;
```

and that value is the result of the `next` method
```javascript
//>{value: 2, done: false}
```

This continues up to the last `yield` statement and after that each call to the `next` method will return

```javascript
//>{value: undefined, done: true}
```

which states that there is no point to continue since we retrieved all possible values.

At this moment we can send values out of the generator and then wait for the next `next` method call but we also need to receive values in and to signal errors when execution resumes to be able to fully support async operations.

Sending values in the generator can be done by passing a value parameter to the [next][mdn-generator-next] method and that value will be the result of the previous `yield` operation where execution resumed.

```javascript
function *generateEvenNumbers() {
    let zero = yield 0;
    let two = yield zero + 2;
    let four = yield two + 2;
    let six = yield four + 2;
    let eight = yield six + 2;
    yield eight + 2;
}

let evenNumbers = generateEvenNumbers();

let result = evenNumbers.next();
console.log(result);
//>{value: 0, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: 2, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: 4, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: 6, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: 8, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: 10, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: undefined, done: true}
```

The first call to the `next` method

```javascript
let result = evenNumbers.next();
```

causes the code inside the [generator][mdn-generator] to run up to the first `yield` statement

```javascript
let zero = yield 0;
```

the returned value is the result of the `next` method and will be assigned to `result` variable.

```javascript
console.log(result);
//>{value: 0, done: false} 
```

The second call to the `next` method

```javascript
result = evenNumbers.next(result.value);
```

resumes the execution inside the [generator][mdn-generator] with the value returned earlier, variable `zero` is initialized with the value passed in and the next `yield` statement sends a new value out

```javascript
let two = yield zero + 2;
```

which is the result of the `next` method

```javascript
console.log(result);
//>{value: 2, done: false}
```

This continues up to the last `yield` statement like in the previous execution flow. Because the value passed in the [generator][mdn-generator] replaces the value of the previous `yield` statement, there is no point to pass in a value for the first `next` method.

We have a way now to pass values in the [generator][mdn-generator] when execution resumes, we need to be able to signal errors too. This is done by calling `throw` [generator][mdn-generator] method. If in the previous example we do something like

```javascript
evenNumbers.throw('a new error condition');
```

execution will abruptly end with that error

```javascript
//>VM4027:1 Uncaught a new error condition
``` 

One solution is to use `try / catch` in the [generator][mdn-generator] and decide what to do next

```javascript
function *generateEvenNumbers() {
    let zero;
    try {
        zero = yield 0;
    } catch(error) {
        console.log(error);
        zero = 0;        
    }
    let two = yield zero + 2;
    let four = yield two + 2;
    let six = yield four + 2;
    let eight = yield six + 2;
    yield eight + 2;
}

let evenNumbers = generateEvenNumbers();

let result = evenNumbers.next();
console.log(result);
//>{value: 0, done: false}

result = evenNumbers.throw("Something bad happened along the way");
console.log(result);
//>Something bad happened along the way
//>{value: 2, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: 4, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: 6, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: 8, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: 10, done: false}

result = evenNumbers.next(result.value);
console.log(result);
//>{value: undefined, done: true}
```

The first call to the `next` method

```javascript
let result = evenNumbers.next();
```

causes the code inside the [generator][mdn-generator] to run up to the first `yield` statement

```javascript
let zero = yield 0;
```

the returned value is the result of the `next` method and will be assigned to `result` variable.

```javascript
console.log(result);
//>{value: 0, done: false} 
```

Now we don't use `next` method but instead we signal an error with `throw` method

```javascript
result = evenNumbers.throw("Something bad happened along the way");
```

which resumes the execution inside the [generator][mdn-generator] with the signalled error, that error is caught and logged and we start over with a new value for `zero` variable. Execution continues up to the next `yield` statement


```javascript
try {
    zero = yield 0;
} catch(error) {
    console.log(error);
    zero = 0;        
}
let two = yield zero + 2;
```

which is the result of the `next` method

```javascript
console.log(result);
//>{value: 2, done: false}
```

This continues up to the last `yield` statement like in the previous execution flows.

We have everything we need now, let's see how we can change bellow code

```javascript
onAddDateReadingSessionClick() {
    validateDateReadingSession(this.state.dateReadingSession)
        .then(() => createDateReadingSession(this.props.bookUuid, this.state.currentReadingSession.uuid, this.state.dateReadingSession))
        .then(() => this.successOnAddDateReadingSession())
        .catch(error => this.errorOnApiOperation(error));
}
```

to benefit from the usage of [generators][mdn-generator]. As I mentioned before `validateDateReadingSession` and `createDateReadingSession` methods return [promises][mdn-promise]. If we want to avoid the usage of callbacks in `onAddDateReadingSessionClick` method, we have to transform it in a generator and `yield` the promises

```javascript
*onAddDateReadingSessionClick() {
    try {
        yield validateDateReadingSession(this.state.dateReadingSession);
        yield createDateReadingSession(this.props.bookUuid,
            this.state.currentReadingSession.uuid,
            this.state.dateReadingSession);
        this.successOnAddDateReadingSession();
    } catch(error) {
        this.errorOnApiOperation(error);
    }
}
```

Note that there is no `function` statement in front of `onAddDateReadingSessionClick` because it is part of a [component][library-web-async-generators-component].
We broke the execution flow by yielding a [promise][mdn-promise] but this is not enough, we need another [piece of code][library-web-async-generators-runner] that sends back the values in and resumes the execution of the [generator][mdn-generator]

```javascript
export function run(generator, ...params) {
    const iterator = generator(...params);

    iterate(iterator.next());

    function iterate(result) {
        if(!result.done) {
            const promise = result.value;
            promise
                .then(response => iterate(iterator.next(response ? response.data : undefined)))
                .catch(error => iterator.throw(error));
        }
    }

}
```

and a way to couple [the runner][library-web-async-generators-runner] with the [generator][mdn-generator]

```javascript
<InputDateReadingSessionComponent
    operation={this.state.operation}
    dateReadingSession={this.state.dateReadingSession}
    onInputChange={this.onInputChange}
    onAddButtonClick={() => run(this.onAddDateReadingSessionClick)}
    onUpdateButtonClick={() => run(this.onUpdateDateReadingSessionClick)}/>

```

The execution flow is as follow:

* `onAddButtonClick` is triggered and the code inside it's event handler runs `run(this.onAddDateReadingSessionClick)`
* with `const iterator = generator(...params);` functions generator is called with provided arguments
* `iterate(iterator.next());` does the following
    * `iterator.next()` is called first
    * `validateDateReadingSession(this.state.dateReadingSession)` is executed and the response (a [promise][mdn-promise]), is yielded.
    * iterate method is called with that [promise][mdn-promise] and then it chains it's `then` or `catch` methods.
    * if the [promise][mdn-promise] is resolved, we are calling the `next` method and we pass in the response of the [promise][mdn-promise].
    * if the [promise][mdn-promise] is rejected, we are signalling the error by calling the `throw` method and the error will be caught by the `catch` block.
* The flow repeats until there are no more `yield` statements.

This generator does not use the result of the [promise][mdn-promise]. Bellow is another example that does this

```javascript
*retrieveCurrentReadingSession() {
    try {
        const currentReadingSession = yield fetchCurrentReadingSession(this.props.bookUuid);
        this.successOnRetrieveCurrentReadingSession(currentReadingSession);
    } catch(error) {
        this.errorOnApiOperation(error);
    }
}
```

I do not know if this way of implementing really pays off, I find it more a matter of preference. At least java programmers will be more comfortable with this code.

[react]: https://reactjs.org/

[redux]: https://redux.js.org/
[redux-thunk]: https://github.com/gaearon/redux-thunk
[redux-saga]: https://github.com/redux-saga/redux-saga
[saga-tutorial]: https://redux-saga.js.org/docs/introduction/BeginnerTutorial.html

[mdn-generator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator
[mdn-iterator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols#The_iterator_protocol
[mdn-promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[mdn-generator-next]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator/next

[library-web]: https://github.com/vasileboris/library-web

[library-web-async-promises]: https://github.com/vasileboris/library-web/tree/backbone-es6-webpack-react
[library-web-async-promises-component]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react/src/main/resources/public/js/components/CurrentReadingSessionComponent.js

[library-web-async-generators]: https://github.com/vasileboris/library-web/tree/backbone-es6-webpack-react-generators
[library-web-async-generators-runner]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-generators/src/main/resources/public/js/middleware/PromiseGeneratorRunner.js
[library-web-async-generators-component]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-generators/src/main/resources/public/js/components/CurrentReadingSessionComponent.js