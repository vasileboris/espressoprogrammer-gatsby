---
title: Migrate from jQuery.i18n.properties to i18next
date: 2018-12-03
description: This post explains what needs to be done to migrate from jQuery.i18n.properties to i18next.
type: post
---

## Previous implementation

In previous implementation of [my project][backbone-es6-webpack-react] I used a mix of [Backbone][backbonejs] and [React][reactjs] and translations were handled by [jQuery.i18n.properties][jquery-i18n-properties]. Initialization was done before the first render:

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

translation files were kept in `/js/bundle` folder in `.properties` files with the default English values in `Messages.properties`:

```
books-search-text=ISBN / Title / Author
book-retrieve-error=Error on retrieve book: API responded with {0}!
...
```	

and the actual translation logic was in a common function:

```javascript
import i18n from 'i18n';

export default {
    localize: function (key) {
        return jQuery.i18n.prop.apply(jQuery.i18n, arguments);
    }
};
```

that took the key and the dynamic values used in the translations for that key. An actual example on how I used it is:

```javascript
localizer.localize('books-search-text');
localizer.localize('book-retrieve-error', error.response.status);
```

After I migrated [my project][es6-webpack-react] completely to [React][reactjs], I wanted to get rid of [jQuery.i18n.properties][jquery-i18n-properties] and [jQuery][jquery] and use something different. The first obvious choice was [React Intl][react-intl] since it is one of the most used i18n solutions in [React][reactjs] but I did not like it because it looked like that I had to change too much to accommodate it. I wouldn't mind if the replacement had a completely different way to initialize itself but my expectations for the new library were:

* to have support for `.properties` file, I just didn't want to use a different format.

* to have a similar way to use load translations so that I had to change only the `localize` function and everything else kept as it is.

The first library that appeared to have this was [i18next][i18next] and the steps are below.

## Use [i18next][i18next] instead of [jQuery.i18n.properties][jquery-i18n-properties]

### Dependencies

I had to add two new npm packages:

* [i18next][i18next-npm] - This is obvious, it has the core functionality.
* [i18next-fetch-backend][i18next-fetch-backend-npm] -  It loads resources from a backend server using the [fetch][fetch-api] API.

### Configuration

```javascript
import React from 'react';
import { render } from 'react-dom';
import LibraryRouter from 'routers/LibraryRouter';
import i18next from 'i18next';
import Fetch from 'i18next-fetch-backend';
import PROP from 'utils/PROP';

i18next
    .use(Fetch)
    .init({
        backend: {
            loadPath: lng => {
                const suffix = 'en' !== lng ? `_${lng}` : '';
                return `/js/bundle/Messages${suffix}.properties`
            },
            parse: data => PROP.parse(data)
        },
        lng: "en",
        fallbackLng: "en",
        interpolation: {
            prefix: "{",
            suffix: "}"
        },
        debug: true
    }, () => {
        render(<LibraryRouter/>, document.getElementById('app-div'));
    });
```
* backend - I chose to load resources asynchronously because of the possibility to keep the name and the content of files unchanged.
* loadPath - It can be a string or a function with the language the first parameter. The second parameter is the namespace but since I'm not using it in my project, I omited it. I chose to use the function just to be able to make a difference between English, with the default `Messages.properties` file, and the rest of the locales that have the locale as the file suffix name like `Messages_ro.properties`.
* parse - A function that receives the content of the file and returns an object that has the file keys mapped as the object properties and the file translations mapped as the object properties values. Default format for [i18next][i18next] property files is `json` so I had to write a small utility, `PROP.js`, that does a similar job as `JSON` JavaScript object.

```javascript
export default {
    parse: function (properties) {
        return properties.split('\n')
            .filter(line => '' !== line.trim())
            .map(line => line.split('='))
            .map(tokens => ({
                [tokens[0]]: tokens[1]
            }))
            .reduce((properties, property) => ({
                ...properties,
                ...property
            }), {})
    }
};
```
* lng - Language to use.
* fallbackLng - Language to use if translations in user language are not available.
* interpolation - Configuration used to diferentiate between regular text and dynamic values placeholders. Since in [jQuery.i18n.properties][jquery-i18n-properties] I used something like `{0}` I had to override default configurations for `prefix` and `suffix`.

### Code changes

Translation common logic was updated to:

```
import i18n from 'i18next';

const Localizer = {

    localize: function (key, ...args) {
        const values = args.reduce((values, value, idx) => ({
            ...values,
            [idx]: value
        }) , {});
        return i18n.t(key, values);
    }

};

export default Localizer;
```
Above logic was need to accommodate the migration from a usage like:

```javascript
localizer.localize('book-retrieve-error', error.response.status);
```

to:

```javascript
i18n.t('book-retrieve-error', {0: error.response.status});
```
as [i18next][i18next] expects.

### Conclusion

I liked that the needed changes were small and I could replace [jQuery.i18n.properties][jquery-i18n-properties] with [i18next][i18next] easily without changing too much of existing code. This is how a mature library should look like.

[jquery-i18n-properties]: https://www.npmjs.com/package/jquery-i18n-properties
[i18next]: https://www.i18next.com/
[backbone-es6-webpack-react]: https://github.com/vasileboris/library-web/tree/backbone-es6-webpack-react
[es6-webpack-react]: https://github.com/vasileboris/library-web/tree/es6-webpack-react
[reactjs]: https://reactjs.org/
[backbonejs]: http://backbonejs.org/
[jquery]: https://jquery.com/
[react-intl]: https://github.com/yahoo/react-intl
[i18next-npm]: https://www.npmjs.com/package/i18next
[i18next-fetch-backend-npm]: https://www.npmjs.com/package/i18next-fetch-backend
[fetch-api]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[i18next-interporlation]: https://www.i18next.com/translation-function/interpolation