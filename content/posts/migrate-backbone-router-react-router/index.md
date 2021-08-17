---
title: Migrate from Backbone Router to React Router
date: 2018-08-02
description: This post explains what needs to be done to migrate from Backbone router to React router.
type: post
---

## Current implementation with [Backbone Router][backbonejs-router]

### Static routing

In my [playground][library-web] I'm using a salsa of [Backbone][backbonejs] and [React][reactjs] for two reasons: real life projects are like this, a combination of old and new and I was just too lazy to rewrite everything in [React][reactjs].

I kept the old static [Backbone routing][backbonejs-router] implemented by LibraryRouter.js

```javascript
import Backbone from 'backbone';
import HeaderView from 'views/HeaderView';
import LibraryView from 'views/LibraryView';

let LibraryRouter = Backbone.Router.extend({
    routes: {
        'books' : 'manageBooks',
        'books/:bookUuid': 'manageCurrentReadingSession'
    },

    initialize: function () {
        this.headerView = new HeaderView();
        this.headerView.render();

        this.libraryView = new LibraryView();
        if('/' === window.location.pathname) {
            this.manageBooks();
        }
    },

    manageBooks: function () {
        this.libraryView.manageBooks();
    },

    manageCurrentReadingSession: function (bookUuid) {
        this.libraryView.manageCurrentReadingSession(bookUuid);
    }

});

export default LibraryRouter;
```
and I loaded root [React][reactjs] component from a [Backbone view][backbonejs-view] implemented in ReadingSessionsView.js

```javascript
import Backbone from 'backbone';
import React from 'react';
import ReactDOM from 'react-dom';
import { render } from 'react-dom';
import CurrentReadingSessionComponent from 'components/CurrentReadingSessionComponent';

const ReadingSessionsView = Backbone.View.extend({
    tagName: 'div',

    initialize: function (bookUuid) {
        this.bookUuid = bookUuid;
    },

    render: function () {
        render(
            <CurrentReadingSessionComponent bookUuid={this.bookUuid}/>,
            this.el
        );
        return this;
    },

    remove() {
        ReactDOM.unmountComponentAtNode(this.el);
        Backbone.View.prototype.remove.call(this);
    }
});

export default ReadingSessionsView;
```

### Navigation

I had to initialize [Backbone history][backbonejs-history] first in Library.js, application's entry point

```javascript
import LibraryRouter from 'routers/LibraryRouter';

jQuery.i18n.properties({
    name: 'Messages',
    path: '/js/bundle/',
    mode: 'map',
    checkAvailableLanguages: true,
    async: true,
    callback: function() {
        new LibraryRouter();
        Backbone.history.start({
            pushState: true,
        });
    }
});

```

and then I was able to use it in HeaderView.js

```javascript
import  _ from 'underscore';
import Backbone from 'backbone';
import templateHtml from 'text!templates/Header.html';

const HeaderView = Backbone.View.extend({
    el: '#header-div',

    template: _.template(templateHtml),

    events: {
        'click #books-link': 'manageBooks'
    },

    render: function () {
        this.$el.html(this.template());
        return this;
    },

    manageBooks: function (e) {
        e.preventDefault();
        Backbone.history.navigate('/books', {trigger: true});
    }

});

export default HeaderView;

```
and in BookView.js

```javascript
readBook: function (e) {
    e.preventDefault();
    history.push('/books/' + this.book.get('uuid'));
},
```

## Use [React Router][react-router] instead of [Backbone Router][backbonejs-router]

In order to use [React Router][react-router] instead of [Backbone Router][backbonejs-router] I had to change the loading order because:

* [React Router][react-router] is using [React components][reactjs]
* Routing takes place as [your app is rendering][react-dynamic-routing]

I followed [React Router guides][react-router-guides] and the steps applied to [my react branch][library-web-react] are below.

### Dependencies

I added [react-router-dom][react-router-dom] and [react-router-history][react-router-history]. If [my project][library-web-react] had only [React][reactjs] components, only the first dependency was needed. Since I still keep some [Backbone][backbonejs] code, I had to use the second one too but this makes things more interesting.

### Dynamic Routing

The most dramatic changes were done in LibraryRouter.js that switched from static routing to dynamic routing

```javascript
import React from 'react';
import {
    Router,
    Route,
    Redirect,
    Switch
} from 'react-router-dom';
import HeaderComponent from 'components/HeaderComponent';
import LibraryViewComponent from 'components/LibraryViewComponent';
import CurrentReadingSessionComponent from 'components/CurrentReadingSessionComponent';
import history from 'routers/History';

const LibraryRouter = () => (
    <Router history={history}>
        <div>
            <div className="page-header">
                <HeaderComponent/>
            </div>
            <div className="page-content">
                <Switch>
                    <Route exact path="/books" component={LibraryViewComponent}/>
                    <Route path="/books/:uuid" component={ ({ match }) => (
                        <CurrentReadingSessionComponent bookUuid={match.params.uuid}/>
                    )}/>
                    {/*
                        Without Switch I saw the following warning in console:
                        Warning: You tried to redirect to the same route you're currently on: "/books"
                    */}
                    <Redirect exact from="/" to="/books"/>
                </Switch>
            </div>
        </div>
    </Router>
);

export default LibraryRouter;
``` 

I'm using [Router][react-router-api-router] and not [BrowserRouter][react-router-api-browserrouter] as it is recommened in [Basic Components][react-royter-basic-components] because I need to use [React Router History][react-router-history] from [Backbone][backbonejs] code as well. I will get back to this a little bit later when I'll discuss about navigation.

The root component of the application is now the [Router][react-router-api-router] and since now routing and rendering are done together, I had to change the html template, index.html, of the application from

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Library application</title>
    <link rel="stylesheet" type="text/css" href="/css/library.css"/>
</head>
<body>

<div class="page-header">
    <header id="header-div" class="header"></header>
</div>
<div class="page-content">
    <div id="content-div" class="content"></div>
</div>

</body>
</html>

```

to

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8"/>
    <title>Library application</title>
    <link rel="stylesheet" type="text/css" href="/css/library.css"/>
</head>
<body>

<div id="app-div"></div>

</body>
</html>

```

and the application's entry point, Library.js to

```javascript
import React from 'react';
import { render } from 'react-dom';
import LibraryRouter from 'routers/LibraryRouter';

jQuery.i18n.properties({
    name: 'Messages',
    path: '/js/bundle/',
    mode: 'map',
    checkAvailableLanguages: true,
    async: true,
    callback: function() {
        render(<LibraryRouter/>, document.getElementById('app-div'));
    }
});
```

HeaderComponent should be displayed in all situations so it doesn't need a Route component. Switch is not really needed in my case but without it the Redirect displayed the following warning in the console

```
Warning: You tried to redirect to the same route you're currently on: "/books"
```
even if  I used the `exact` attribute.

### Loading order

When [Backbone router][backbonejs-router] was used, I loaded a [React component][reactjs] from a [Backbone view][backbonejs-view]

```javascript
import Backbone from 'backbone';
import React from 'react';
import ReactDOM from 'react-dom';
import { render } from 'react-dom';
import CurrentReadingSessionComponent from 'components/CurrentReadingSessionComponent';

const ReadingSessionsView = Backbone.View.extend({
    tagName: 'div',

    initialize: function (bookUuid) {
        this.bookUuid = bookUuid;
    },

    render: function () {
        render(
            <CurrentReadingSessionComponent bookUuid={this.bookUuid}/>,
            this.el
        );
        return this;
    },

    remove() {
        ReactDOM.unmountComponentAtNode(this.el);
        Backbone.View.prototype.remove.call(this);
    }
});

export default ReadingSessionsView;
```

This is not needed anymore and actually I have to do the opposite now

```javascript
import React from 'react';
import LibraryView from 'views/LibraryView';

class LibraryViewComponent extends React.Component {
    render() {
        return (
            <div id="content-div" className="content"></div>
        );
    }

    componentDidMount() {
        const libraryView = new LibraryView();
        libraryView.manageBooks();
    }

}

export default LibraryViewComponent;	
```

### Navigation

I still have a [Backbone view][backbonejs-view] so I cannot use the [Link][react-router-api-link] component there. The rescue comes from [React router history][react-router-history] which is initialized in History.js

```javascript
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

export default history;
```

and used in BookView.js

```javascript
readBook: function (e) {
    e.preventDefault();
    history.push('/books/' + this.book.get('uuid'));
}
```
and in LibraryRouter.js where is passed as a custom `history` property to the [Router][react-router-api-router] component

```javascript
<Router history={history}>
```
Originally the header was implemented as a [Backbone view][backbonejs-view] but I wanted to try the [Link][react-router-api-link] component so I migrated it to a [React component][reactjs]

```javascript
import React from 'react';
import { Link } from 'react-router-dom';

function HeaderComponent () {
    return (
        <header id="header-div" className="header">
            <div>
                <Link to='/books'>
                    <img src="/img/logo.svg" alt="Book Library" className="img-logo"/>
                </Link>
            </div>
        </header>
    );
}

export default HeaderComponent;
```

## [Redux][redux] integration

I had only two places that needed changes for [Redux][redux] integration. The first one is related with [Store][redux-store] initialisation in LibraryRouter.js and is specific for each type of [async flow][redux-async] used.

### [Redux thunk][redux-thunk] [integration][library-web-react-redux]

```javascript
import React from 'react';
import {
    Router,
    Route,
    Redirect,
    Switch
} from 'react-router-dom';
import {
    createStore,
    applyMiddleware
} from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import thunk from 'redux-thunk'
import { Provider } from 'react-redux';
import { currentReadingSessionReducer }  from 'reducers/CurrentReadingSessionReducer';
import HeaderComponent from 'components/HeaderComponent';
import LibraryViewComponent from 'components/LibraryViewComponent';
import CurrentReadingSessionComponent from 'components/CurrentReadingSessionComponent';
import history from 'routers/History';


const LibraryRouter = function() {
    const store = createStore(currentReadingSessionReducer, composeWithDevTools(applyMiddleware(thunk)));

    return (
        <Router history={history}>
            <div>
                <div className="page-header">
                    <HeaderComponent/>
                </div>
                <div className="page-content">
                    <Switch>
                        <Route exact path="/books" component={LibraryViewComponent}/>
                        <Route path="/books/:uuid" component={({match}) => (
                            <Provider store={store}>
                                <CurrentReadingSessionComponent bookUuid={match.params.uuid}/>
                            </Provider>
                        )}/>
                        {/*
                        Without Switch I saw the following warning in console:
                        Warning: You tried to redirect to the same route you're currently on: "/books"
                        */}
                        <Redirect exact from="/" to="/books"/>
                    </Switch>
                </div>
            </div>
        </Router>
    );
}

export default LibraryRouter;
```

### [Redux saga][redux-saga] [integration][library-web-react-redux-saga]

```javascript
import React from 'react';
import {
    Router,
    Route,
    Redirect,
    Switch
} from 'react-router-dom';
import {
    createStore,
    applyMiddleware
} from 'redux';
import createSagaMiddleware from 'redux-saga';
import rootSaga from 'sagas/RootSagas';
import { composeWithDevTools } from 'redux-devtools-extension';
import { Provider } from 'react-redux';
import { currentReadingSessionReducer }  from 'reducers/CurrentReadingSessionReducer';
import HeaderComponent from 'components/HeaderComponent';
import LibraryViewComponent from 'components/LibraryViewComponent';
import CurrentReadingSessionComponent from 'components/CurrentReadingSessionComponent';
import history from 'routers/History';

const LibraryRouter = function() {
    const sagaMiddleware = createSagaMiddleware();
    const store = createStore(currentReadingSessionReducer, composeWithDevTools(applyMiddleware(sagaMiddleware)));
    sagaMiddleware.run(rootSaga);

    return (
        <Router history={history}>
            <div>
                <div className="page-header">
                    <HeaderComponent/>
                </div>
                <div className="page-content">
                    <Switch>
                        <Route exact path="/books" component={LibraryViewComponent}/>
                        <Route path="/books/:uuid" component={({match}) => (
                            <Provider store={store}>
                                <CurrentReadingSessionComponent bookUuid={match.params.uuid}/>
                            </Provider>
                        )}/>
                        {/*
                        Without Switch I saw the following warning in console:
                        Warning: You tried to redirect to the same route you're currently on: "/books"
                        */}
                        <Redirect exact from="/" to="/books"/>
                    </Switch>
                </div>
            </div>
        </Router>
    );
};

export default LibraryRouter;
	
```

The second one is how CurrentReadingSessionComponent is listening for [Store][redux-store] changes

```javascript
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
...

class CurrentReadingSessionComponent extends React.Component {
...
}

const mapStateToProps = state => {
    return state
};

export default withRouter(connect(mapStateToProps)(CurrentReadingSessionComponent));
``` 

## Conclusion

My application is too small to see a real benefit from combining dynamic routing with rendering but even so I liked how I see in only one place what is rendered and when.

[library-web]: https://github.com/vasileboris/library-web
[backbonejs]: http://backbonejs.org
[reactjs]: https://reactjs.org/
[backbonejs-router]: http://backbonejs.org/#Router
[backbonejs-view]: http://backbonejs.org/#View
[backbonejs-history]: http://backbonejs.org/#History
[react-router]: https://reacttraining.com/react-router/
[react-dynamic-routing]: https://reacttraining.com/react-router/core/guides/philosophy/dynamic-routing
[react-router-guides]: https://reacttraining.com/react-router/web/guides
[library-web-react]: https://github.com/vasileboris/library-web/tree/backbone-es6-webpack-react
[react-router-dom]: https://github.com/ReactTraining/react-router/tree/master/packages/react-router-dom
[react-router-history]: https://github.com/ReactTraining/history
[react-router-api-router]: https://reacttraining.com/react-router/web/api/Router
[react-router-api-browserrouter]: https://reacttraining.com/react-router/web/api/BrowserRouter
[react-royter-basic-components]: https://reacttraining.com/react-router/web/guides/basic-components
[react-router-api-link]: https://reacttraining.com/react-router/web/api/Link
[redux]: https://redux.js.org/
[redux-store]: https://redux.js.org/basics/store
[redux-async]: https://redux.js.org/advanced/asyncflow
[redux-thunk]: https://github.com/reduxjs/redux-thunk
[library-web-react-redux]: https://github.com/vasileboris/library-web/tree/backbone-es6-webpack-react-redux
[redux-saga]: https://github.com/redux-saga/redux-saga
[library-web-react-redux-saga]: https://github.com/vasileboris/library-web/tree/backbone-es6-webpack-react-redux-saga