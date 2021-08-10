---
title: JavaScript package managers for Java programmers
date: 2017-05-22
description: In this article you will find my opinion about JavaScript package managers such as bower and yarn.
type: post
---

![Featured imaged][featured-image]

When I worked with Java projects I never thought too much about dependencies management. I started to build projects with [ant][ant], I used to make it work but I never liked it because I had to manually manage the dependencies and the configuration was too verbose and error prone. [Maven][maven] was like a breath of fresh air compared with [ant][ant]. Dependencies were handled automatically and the configuration was almost none for simple projects. Even if I would like to use something else, I will have to choose between three options: [maven][maven], [gradle][gradle] and [ant][ant] with [ivy][ivy].

This year I started a new journey as writing front end code with JavaScript. I created a [personal project][library-backbone] and in the begging I manually downloaded needed JavaScript libraries. After the project started to take shape I wanted to automatically handle dependencies management and here the fun begun. If you don't believe me just google for `JavaScript dependency management` and you' find articles like [11 Dependency Management Tools for Web Developers][manage-dependencies-tools-webdev] or even better [13 best front-end package managers as of 2017 - Slant][front-end-package-managers]. Anyway, [the first result][how-to-manage-client-side-javascript-dependencies] that came from this search was:

> Bower is a package manager for the web. Bower lets you easily install assets such as images, CSS and JavaScript, and manages dependencies.

I already knew about [npm][npm] and after a search for `bower vs npm` bower seemed like [the right choice][difference-between-grunt-npm-and-bower-package-json-vs-bower-json] because:

> Npm and Bower are both dependency management tools. But the main difference between both is npm is used for installing Node js modules but bower js is used for managing front end components like html, css, js etc.

I jumped ahead on [bower's site][bower], I followed [the instructions][bower-install] to install it and then to add [needed libraries][bower-install-packages]. In the end I had two new files added to my project:

* bower.json - The relevant information regarding this post is in `dependencies` section:

```json
{
  "name": "library-backbone",
  "homepage": "https://github.com/vasileboris/library-backbone",
  "authors": [
    "vasile boris <boris@espressoprogrammer.com>"
  ],
  "description": "",
  "main": "",
  "license": "",
  "private": true,
  "ignore": [
    "**/.*",
    "node_modules",
    "src/main/external-resources/public/js/lib",
    "test",
    "tests"
  ],
  "dependencies": {
    "requirejs": "^2.3.3",
    "jquery": "^3.2.1",
    "text": "^2.0.15",
    "jquery.i18n": "^1.0.4",
    "jquery-i18n-properties": "^1.2.3",
    "underscore": "^1.8.3",
    "backbone": "^1.3.3"
  }
}
```

* .bowerrc - I needed the `directory` attribute to install the libraries in a custom folder instead of the default `bower_components`:

```json
{
  "directory": "src/main/external-resources/public/js/lib"
}
```

The installation and configuration for this projects was a matter of 1 or 2 hours and it went without issues. The only funny aspect is that bower is a npm package itself. I wanted to find out more about it and then I noticed on [bower][bower] site that:

> ...psst! While Bower is maintained, we recommend yarn and webpack for new front-end projects!

I just started to use a JavaScript package manager and it was already deprecated. [Ant][ant] had its first release in 2000 and it is still relevant, [bower][bower] was released in 2012 and it is already gone. Now I understand [why JavaScript development is crazy][why-js-development-is-crazy].

I spent some time on google figuring out what I should do next and I decided to use [yarn][yarn] for the following reasons:

* It is compatible with [npm][npm] registry
* It is backed up by facebook and google
* It has its own life by having an installer for each operating system and not just beeing another npm package. What would you feel about [gradle][gradle] if you would need [ant][ant] or [maven][maven] to install it?

[Installing][yarn-install] and [using][yarn-usage] was easy and the result was a new file named package.json. I had only one problem, I didn't find [jQuery.i18n.properties][jquery-i18n-properties] in [yarn repository][yarn] so I had to keep both [yarn][yarn] and [bower][bower] and bower is called as a post install script.

* bower.json:

```json
{
  "name": "library-backbone",
  "homepage": "https://github.com/vasileboris/library-backbone",
  "authors": [
    "vasile boris <boris@espressoprogrammer.com>"
  ],
  "description": "",
  "main": "",
  "license": "MIT",
  "private": true,
  "ignore": [
    "**/.*",
    "node_modules",
    "bower_components",
    "test",
    "tests"
  ],
  "dependencies": {
    "jquery-i18n-properties": "^1.2.3"
  }
}
```

* package.json:

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

This is what I found until now on using JavaScript package managers, I hope that you enjoyed it and I'm waiting you to read my future posts.

[featured-image]: javascript-package-managers-programmer-656x700.png
[ant]: http://ant.apache.org/
[maven]: https://maven.apache.org/
[gradle]: https://gradle.org/
[ivy]: http://ant.apache.org/ivy/
[library-backbone]: https://github.com/vasileboris/library-backbone
[manage-dependencies-tools-webdev]: http://www.hongkiat.com/blog/manage-dependencies-tools-webdev/
[front-end-package-managers]: https://www.slant.co/topics/1488/~front-end-package-managers
[how-to-manage-client-side-javascript-dependencies]: http://stackoverflow.com/questions/12893046/how-to-manage-client-side-javascript-dependencies
[npm]: https://www.npmjs.com/
[difference-between-grunt-npm-and-bower-package-json-vs-bower-json]: http://stackoverflow.com/questions/21198977/difference-between-grunt-npm-and-bower-package-json-vs-bower-json
[bower]: https://bower.io/
[bower-install]: https://bower.io/#install-bower
[bower-install-packages]: https://bower.io/#install-packages
[why-js-development-is-crazy]: http://www.planningforaliens.com/blog/2016/04/11/why-js-development-is-crazy/
[yarn]: https://yarnpkg.com/en/
[yarn-blog-post]: https://code.facebook.com/posts/1840075619545360
[yarn-install]: https://yarnpkg.com/en/docs/install
[yarn-usage]: https://yarnpkg.com/en/docs/usage
[jquery-i18n-properties]: https://github.com/jquery-i18n-properties/jquery-i18n-properties