---
title: Migrate from RequireJS to webpack
date: 2017-08-14
description: It describes needed steps to migrate a project from RequireJS to webpack.
type: post
---

I started this year a small [Backbone][backbone] [project][library-web-backbone-es5-requirejs] used by me to learn front end development. It uses a combination of [Apache][apache] and [RequireJS][requirejs] configuration to locate and deliver the scripts to the browser. [RequireJS][requirejs] is used to modularize the code and provide dependencies:

index.html:
```html
<!DOCTYPE html>
<html>
<head/>
<body>

<div class="page-header">
    <header id="header-div" class="header"></header>
    <link rel="stylesheet" type="text/css" href="/css/library.css" />
</div>
<div class="page-content">
    <div id="content-div" class="content"></div>
</div>

<script data-main="/js/Library.js" src="/js/lib/requirejs/require.js"></script>

</body>
</html>
```

Library.js:
```javascript
requirejs.config({
    baseUrl: '/js',
    paths: {
        text: 'lib/requirejs-text/text',
        jquery: 'lib/jquery/dist/jquery',
        i18n: 'lib/jquery-i18n-properties/jquery.i18n.properties',
        underscore: 'lib/underscore/underscore',
        backbone: 'lib/backbone/backbone'
    },
    shim: {
        i18n: {
            deps :['jquery']
        }
    }
});

define(function(require) {
    'use strict';

    require('i18n');
    jQuery.i18n.properties({
        name:'Messages',
        path:'/js/bundle/',
        mode:'map',
        checkAvailableLanguages: true,
        async: true,
        callback: function() {
            var LibraryRouter = require('routers/LibraryRouter');
            new LibraryRouter();
            Backbone.history.start({
                pushState: true,
            });
        }
    });
});
```

and [Apache][apache] to locate those sources on my disc:

/etc/apache2/sites-available/000-default.conf:
```xml
<VirtualHost *:80>
    Define library-web-bower /media/fastdata/work/library-web/bower_components
    <Directory "${library-web-bower}">
        Require all granted
    </Directory>

    ProxyPass /js/lib/jquery-i18n-properties !
    Alias /js/lib/jquery-i18n-properties ${library-web-bower}/jquery-i18n-properties

    Define library-web-yarn /media/fastdata/work/library-web/node_modules
    <Directory "${library-web-yarn}">
        Require all granted
    </Directory>
    ProxyPass /js/lib !
    Alias /js/lib ${library-web-yarn}

    Define library-web /media/fastdata/work/library-web/src/main/resources/public
    <Directory "${library-web}">
        Require all granted
    </Directory>

    ProxyPass /js !
    Alias /js ${library-web}/js

    ProxyPass /css !
    Alias /css ${library-web}/css

    ProxyPass /img !
    Alias /img ${library-web}/img

    ProxyPassMatch ^/books/(.*)$ !
    AliasMatch ^/books/(.*)$ ${library-web}/index.html

    ProxyPass /books !
    Alias /books ${library-web}/index.html

    ProxyPass /users http://localhost:8080/users
    ProxyPassReverse /users http://localhost:8080/users

    ProxyPass / !
    Alias / ${library-web}/index.html
</VirtualHost>
``` 

This setup works really well, especially for a small project like this one, but it was time to move on to [webpack][webpack] and my intention was to remove [RequireJS][requirejs] configuration, add the [webpack][webpack] one and change the code only if it is really, really needed.

The first step was to add a package manager but this was already done in a [previous post][javascript-package-managers-for-java-programmers]. I chose to use [Yarn][yarn] and I still had to use [Bower][bower] as a post install script.

package.json:
```json
{
  "name": "library-backbone",
  "version": "1.0.0",
  "main": "/js/Library.js",
  "repository": "git@github.com:vasileboris/library-backbone.git",
  "author": "vasile boris <boris@espressoprogrammer.com>",
  "license": "MIT",
  "dependencies": {
    "backbone": "^1.3.3",
    "jquery": "^3.2.1",
    "requirejs": "^2.3.3",
    "requirejs-text": "^2.0.15"
  },
  "scripts": {
    "postinstall": "bower install"
  }
}
```

The next step was to add needed dependencies for [webpack][webpack] and apply necessary changes to the project:

package.json:
```json
{
  "name": "library-backbone",
  "version": "1.0.0",
  "main": "/js/Library.js",
  "repository": "git@github.com:vasileboris/library-backbone.git",
  "author": "vasile boris <boris@espressoprogrammer.com>",
  "license": "MIT",
  "dependencies": {
    "backbone": "^1.3.3",
    "jquery": "^3.2.1",
    "raw-loader": "^0.5.1"
  },
  "scripts": {
    "postinstall": "bower install",
    "build": "webpack",
    "dev": "webpack --watch"
  },
  "devDependencies": {
    "clean-webpack-plugin": "^0.1.16",
    "html-webpack-plugin": "^2.29.0",
    "webpack": "^3.4.1"
  }
}
```

* [RequireJS][requirejs] was removed.
* [webpack][webpack], [raw-loader][raw-loader], [clean-webpack-plugin][clean-webpack-plugin] and [html-webpack-plugin][html-webpack-plugin] were added. See webpack.config bellow for why these plugins and [raw-loader][raw-loader] are needed.

index.html:
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

* script tag was removed. It will be added dynamically by webpack.

Library.js:
```javascript
define(function(require) {
    'use strict';

    require('i18n');
    jQuery.i18n.properties({
        name:'Messages',
        path:'/js/bundle/',
        mode:'map',
        checkAvailableLanguages: true,
        async: true,
        callback: function() {
            var LibraryRouter = require('routers/LibraryRouter');
            new LibraryRouter();
            Backbone.history.start({
                pushState: true,
            });
        }
    });
});
```

* [RequireJS][requirejs] configuration is not needed anymore.

webpack.config.js:
```javascript
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');

module.exports = {
    resolve: {
        modules: ['src/main/resources/public/js', 'node_modules', 'bower_components'],
        descriptionFiles: ['package.json', 'bower.json'],
        alias: {
            i18n: 'jquery-i18n-properties'
        }
    },
    resolveLoader: {
        alias: {
            text: 'raw-loader'
        }
    },
    context: __dirname + '/src/main/resources/public/js',
    entry: [
        'Library.js'
    ],
    output: {
        path: __dirname + '/dist/public',
        publicPath: '/',
        filename: 'index.js'
    },
    devtool: 'source-map',
    plugins: [
        new CleanWebpackPlugin(['dist']),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: '../index.html'
        }),
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery'
        })
    ]
};
```
* I added `resolve.modules` and `resolve.descriptionFiles` to locate bower components.
* I added `src/main/resources/public/js` to `resolve.modules` to be able to use `require` with full path to the script: `Books = require('collections/Books')`
* `alias` is obvious. I did not wanted to change `require('i18n');` with `require('jquery-i18n-properties');`.
* [raw-loader][raw-loader] imports files as a string and by using `text` as its alias I could import backbone templates in the same way: `searchBooksHtml = require('text!templates/SearchBooks.html')`.
* I added `context` to change the path [webpack][webpack] uses to locate sources files.
* `entry` specifies the script that loads the application and `output` the output bundle script. I also added `devtool` to be able to debug the application.
* `CleanWebpackPlugin` deletes dist folder at every build.
* `HtmlWebpackPlugin` is used to generate a bundle html file based on a template. In this case it will add the bundle script file: `<script type="text/javascript" src="/index.js"></script></body>`.
* `webpack.ProvidePlugin` will load automatically jquery whenever it detects it as free variable in a module, in this case it is needed by jquery-i18n-properties.

This application is not complicated and migration went quite smooth. I hope you'll find something useful for your project migration.

[backbone]: http://backbonejs.org/
[library-web-backbone-es5-requirejs]: https://github.com/vasileboris/library-web/tree/backbone-es5-requirejs
[apache]: https://httpd.apache.org/
[requirejs]: http://requirejs.org/
[webpack]: https://webpack.js.org/
[javascript-package-managers-for-java-programmers]: /javascript-package-managers-for-java-programmers/
[yarn]: https://yarnpkg.com/en/
[bower]: https://bower.io/
[raw-loader]: https://github.com/webpack-contrib/raw-loader
[clean-webpack-plugin]: https://github.com/johnagan/clean-webpack-plugin
[html-webpack-plugin]: https://github.com/jantimon/html-webpack-plugin