---
title: Migrate from Redux-Thunk to Saga
date: 2018-06-11
description: This post explains what needs to be done to migrate from redux-thunk to saga.
type: post
---

I wanted to try [redux-saga][redux-saga] in one of my [learning projects][library-web] but I got confused about how [generators][mdn-generator] are used to do async operations. First I had to understand them so I [used generators][use-generators-async-operations] in [my project][library-web-generators]. Now that I have an overview about them, it's time to move on [redux-saga][redux-saga].

Before going into [redux-saga][redux-saga] code, I'll extract relevant usages of [react][react], [redux][redux] and [redux-thunk][redux-thunk] from [my project][library-web-redux].

## Current implementation with [redux-thunk][redux-thunk]

### Dispatch action

[CurrentReadingSessionComponent.js][library-web-thunk-currentreadingsessioncomponent]

```javascript
import { fetchBookAction } from 'actions/BookAction';

retrieveBook() {
    this.props.dispatch(fetchBookAction(this.props.bookUuid))
}
```

### Create action

[BookAction.js][library-web-thunk-bookaction]

```javascript
import { fetchBook } from 'api/BookApi';
import { receiveMessageAction } from 'actions/MessageAction';

export const RECEIVE_BOOK = 'RECEIVE_BOOK';

export function fetchBookAction(uuid) {
    return function (dispatch) {
        fetchBook(uuid)
            .then(response => dispatch(receiveBookAction(response.data)))
            .catch(error => dispatch(receiveMessageAction(error)));
    }
}

export function receiveBookAction(book) {
    return {
        type: RECEIVE_BOOK,
        payload: book
    }
}
```

fetchBookAction function is the place where [redux-thunk][redux-thunk] is used so that instead of returning a simple action object, it returns another function that receives dispatch function as the first parameter. In this way [redux-thunk][redux-thunk] delays the dispatch of the original action by first getting the data asynchronous and only when data is ready we dispatch another action with the result.

### Fetch data

[BookApi.js][library-web-thunk-bookapi]

```javascript
import axios from 'axios';
import user from 'User';
import localizer from 'utils/Localizer';

export const BOOKS_ENDPOINT = `/users/${user.id}/books`;

export function fetchBook(uuid) {
    return new Promise((resolve, reject) => {
        axios.get(`${BOOKS_ENDPOINT}/${uuid}`)
            .then(response => resolve(response))
            .catch(error => reject(localizer.localize('book-retrieve-error', error.response.status)))
    });
}
```

### Update state

[BookReducer.js][library-web-thunk-bookreducer]

```javascript
import { RECEIVE_BOOK } from 'actions/BookAction';

export function book(book = null, action) {
    switch(action.type) {
        case RECEIVE_BOOK:
            return action.payload;
        default:
            return book;
    }
}
```

### Create the store

[LibraryRouter.js][library-web-thunk-libraryrouter]

```javascript
import {
    createStore,
    applyMiddleware
} from 'redux';
import { currentReadingSessionReducer }  from 'reducers/CurrentReadingSessionReducer';
import thunk from 'redux-thunk'
import { composeWithDevTools } from 'redux-devtools-extension';

this.store = createStore(currentReadingSessionReducer, composeWithDevTools(applyMiddleware(thunk)));
```

### Connect the store to react component

[CurrentReadingSessionComponent.js][library-web-thunk-currentreadingsessioncomponent]

```javascript
import { connect } from 'react-redux';

const mapStateToProps = state => {
    return state
};

export default connect(mapStateToProps)(CurrentReadingSessionComponent);
```

## Use [redux-saga][redux-saga] instead of [redux-thunk][redux-thunk]

In order to follow easier the changes, I'll extract relevant code samples after adding [redux-saga][redux-saga] in this project. Please note that I'll focus only in the updates, code that did not change will not be added again.

### Create action

[BookAction.js][library-web-saga-bookaction]

```javascript
export const FETCH_BOOK = 'FETCH_BOOK';
export const RECEIVE_BOOK = 'RECEIVE_BOOK';

export function fetchBookAction(uuid) {
    return {
        type: FETCH_BOOK,
        payload: uuid
    }
}

export function receiveBookAction(book) {
    return {
        type: RECEIVE_BOOK,
        payload: book
    }
}
```

Async calls are not started anymore on action dispatch. `fetchBookAction(action)` returns a plain action object.

### Watch for fetch requests with [redux-saga][redux-saga]

[BookSagas.js][library-web-saga-booksagas]

```javascript
import { call, put, takeLatest } from 'redux-saga/effects';
import { fetchBook } from 'api/BookApi';
import { receiveBookAction, FETCH_BOOK } from 'actions/BookAction';
import { receiveMessageAction } from 'actions/MessageAction';

export function* watchFetchBook() {
    yield takeLatest(FETCH_BOOK, callFetchBook);
}

function* callFetchBook(action) {
    try {
        const bookUuid = action.payload;
        const response = yield call(fetchBook, bookUuid);
        yield put(receiveBookAction(response.data));
    } catch(error) {
        yield put(receiveMessageAction(error));
    }
}
```

The main change is here, in the new added saga functionality. In [redux-thunk][redux-thunk] version this functionality was implemented with [promises chaining][mdn-promise]. Here we have two [generator functions][mdn-generator]:

* `watchFetchBook` uses [takeLatest][redux-saga-api] to monitor for `FETCH_BOOK` action. This is the *watcher* saga.
* `callFetchBook` saga will actually do the work and that's why is called the *worker* saga.

### Use a root saga

[RootSagas.js][library-web-saga-rootsagas]

```javascript
import { all, call } from 'redux-saga/effects';
import { watchFetchBook } from 'sagas/BookSagas';

export default function* rootSaga() {
    yield all([
        call(watchFetchBook)
    ]);
}
```

This is similar with the root reducer and is needed to start watching for dispatched actions that trigger async calls.

### Create the store

[LibraryRouter.js][library-web-saga-libraryrouter]

```javascript
import {
    createStore,
    applyMiddleware
} from 'redux';
import { currentReadingSessionReducer }  from 'reducers/CurrentReadingSessionReducer';
import createSagaMiddleware from 'redux-saga';
import rootSaga from 'sagas/RootSagas';
import { composeWithDevTools } from 'redux-devtools-extension';

const sagaMiddleware = createSagaMiddleware();

this.store = createStore(currentReadingSessionReducer, composeWithDevTools(applyMiddleware(sagaMiddleware)));

sagaMiddleware.run(rootSaga);
```
[redux-saga][redux-saga] middleware replaces corresponding [redux-thunk][redux-thunk] middleware. Here is the place where `rootSaga` is started.

### Conclusion

I see two improvements of using [redux-saga][redux-saga] instead of [redux-thunk][redux-thunk]:

* The start of async calls are separated from actions dispatch.
* Async code is easier to read in this way, at least for me.

[react]: https://reactjs.org/

[redux]: https://redux.js.org/
[redux-thunk]: https://github.com/gaearon/redux-thunk
[redux-saga]: https://github.com/redux-saga/redux-saga
[redux-saga-api]: https://redux-saga.js.org/docs/api/

[mdn-generator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator
[mdn-promise]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise

[use-generators-async-operations]: /use-generators-async-operations

[library-web]: https://github.com/vasileboris/library-web
[library-web-generators]: https://github.com/vasileboris/library-web/tree/backbone-es6-webpack-react-generators
[library-web-redux]: https://github.com/vasileboris/library-web/tree/backbone-es6-webpack-react-redux

[library-web-thunk-currentreadingsessioncomponent]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-redux/src/main/resources/public/js/components/CurrentReadingSessionComponent.js
[library-web-thunk-bookaction]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-redux/src/main/resources/public/js/actions/BookAction.js
[library-web-thunk-bookapi]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-redux/src/main/resources/public/js/api/BookApi.js
[library-web-thunk-bookreducer]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-redux/src/main/resources/public/js/reducers/BookReducer.js
[library-web-thunk-libraryrouter]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-redux/src/main/resources/public/js/routers/LibraryRouter.js

[library-web-saga-bookaction]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-redux-saga/src/main/resources/public/js/actions/BookAction.js
[library-web-saga-booksagas]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-redux-saga/src/main/resources/public/js/sagas/BookSagas.js
[library-web-saga-rootsagas]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-redux-saga/src/main/resources/public/js/sagas/RootSagas.js
[library-web-saga-libraryrouter]: https://github.com/vasileboris/library-web/blob/backbone-es6-webpack-react-redux-saga/src/main/resources/public/js/routers/LibraryRouter.js