---
title: From React to React Native, a practical example
date: 2019-08-21
description: It describes the steps I used to migrate a web React application to mobile with React Native and Expo.
type: post
---

## What to expect

* Why this post?
* The original project, the idea
* The choices and preparation
* The solution implemented with [React Native][react-native] and [Expo][expo-io]
* Published app
* Conclusion

## Why this post?

My experience with [React Native][react-native] and [Expo][expo-io] was not straightforward, I had few challenges and **frustrations** and I wanted to share with you how I resolved them.

## The original project, the idea

I started to work with JavaScript in 2017 so I needed a way to learn. I created a small solution to track my reading progress with React, Redux & Saga and Spring Boot: [library-web][library-web], [library-resources][library-resources] and [library-api][library-api]. Deploying live such a stack seemed too much for one person, a mobile solution looked simpler and the natural choice was [React Native][react-native].

## The choices and preparation

I followed [Getting Started][react-native-getting-started]:

* Expo CLI Quickstart - Advertised as "If you are coming from a web background"
* React Native CLI Quickstart - Advertised as "If you are familiar with native development"

Initially I wanted to reuse some [java code][library-api] so I went with the second option.

### React Native CLI Quickstart

I installed [Android Studio][android-studio], [Watchman][watchman] and I configured the ANDROID_HOME environment variable:

```
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$ANDROID_HOME/platform-tools:$PATH
export PATH=$ANDROID_HOME/emulator:$PATH
export PATH=$ANDROID_HOME/tools/bin:$PATH
export PATH=$ANDROID_HOME/tools:$PATH
```

I generated [the sample project][awesomeproject-rn-cli] and I got lost. Setup looked complex for a beginner: React Native, Android, Gradle, React Native + Android. If everything works from the start, that's great but if something is not working I would not know which part to check first. I see it appropriate for the ones who know more about React Native and Android.

### Expo CLI Quickstart

I chose "blank - minimal dependencies to run and an empty root component" and it looked [familiar again][myreads-00-app-structure].

### Common for both

You should:

* know how to start an emulator and connect a real device. I recommend to start an emulator from command line like

```
emulator -list-avds
emulator -avd Pixel_2_XL_API_26
```

* know how to deploy the app on emulator and a real device
* know how to debug the code

Watch out for:

* You have enough hardware resources. I noticed that 8Gb are not enough, my system run really, really slow. 16Gb is much better.
* I found a possible alternative: [Android_x86 with VirtualBox][virtual-box-android-x86] but I did not manage to install it.
* I had to comment out the last two lines from Android SDK bash setup, see more on [Android SDK command line issue][android-sdk-emulator-command-line-issue]

```
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$ANDROID_HOME/platform-tools:$PATH
export PATH=$ANDROID_HOME/emulator:$PATH
#export PATH=$ANDROID_HOME/tools/bin:$PATH
#export PATH=$ANDROID_HOME/tools:$PATH
```

## The solution implemented with [React Native][react-native] and [Expo][expo-io]

I wanted to keep as much as possible from [library-web][library-web] so the steps were:

* Create a new project: [MyReads][myreads]
* Configure [i18next][i18next]
* Migrate presentational components
* Migrate redux code
* Migrate container components
* Remove API calls and used local storage

### Configure [i18next][i18next]

I decided to go with json translation files, the default file format for [i18next][i18next], to make things simpler:

```json
{
  "app-title": "My Reads",
  ...
}
```  

Translation files loading logic was added in `Localizer.js`:

```JavaScript
import i18next from 'i18next';
import messages from "/translations/Messages";

const Localizer = {

    init: function(callback) {
        i18next.init({
            lng: "en",
            fallbackLng: "en",
            interpolation: {
                prefix: "{",
                suffix: "}"
            },
            resources: {
                en: {
                    translation: messages
                }
            },
            debug: true
        }, () => callback());
    },

    localize: function (key, ...args) {
        const values = args.reduce((values, value, idx) => ({
            ...values,
            [idx]: value
        }) , {});
        return i18next.t(key, values);
    }

};

export default Localizer;
```

and application entry point depends on it:

```JavaScript
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import localizer from '/utils/Localizer';
import { fetchBooks } from '/api/BookApi';

export default class App extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            isI18nInitialized: false,
            books: []
        }
    }

    render() {
        const { isI18nInitialized, books } = this.state;

        if(!isI18nInitialized) {
            return null;
        }
        return (
            <View style={styles.container}>
                <Text>{localizer.localize('books-search-text')}</Text>
                {books.map( book => (<Text>{book.title}</Text>))}
            </View>
        );
    }

    componentDidMount() {
        localizer.init(() => {
            fetchBooks().then((response) => {
               this.setState({
                   isI18nInitialized: true,
                   books: response.data
               })
            });
        });
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
```

In this step the implementation of the render method contains dummy code to make sure that translation logic works.

I also used [babel-root-slash-import][babel-root-slash-import] to have absolute imports and I replace it later with [babel-plugin-module-resolver][babel-plugin-module-resolver].

Original source code: [MyReads 01-configure-i18next tag][myreads-01-configure-i18next]

### Migrate presentational components

The next step was to migrate the presentational components, like the one that display the error messages:

```JavaScript
import React from 'react';
import PropTypes from 'prop-types';
import { Text, StyleSheet } from 'react-native';
import appStyles from '/styles/AppStyles';

const styles = StyleSheet.create({
    message: {
        color: 'white',
        backgroundColor: 'red'
    },
});

const MessageComponent = props => {
    const { message } = props;
    return message && (
        <Text style={[appStyles.text, styles.message]}>{message}</Text>
    );
};

MessageComponent.propTypes = {
    message: PropTypes.string
};

export default MessageComponent;
```

and render it several times in `App.js`:

```JavaScript
render() {
    const { isI18nInitialized, inputValue } = this.state;

    return isI18nInitialized && (
        <View style={appStyles.vertical}>
            <MessageComponent key={1} message="This is message 1"/>
            <MessageComponent key={2} message="This is message 2"/>
            <MessageComponent key={3} message="This is message 3"/>
            <Text style={[appStyles.text]}>{localizer.localize('books-search-text')}</Text>
            <MessageComponent key={4} message="This is message 4"/>
            <MessageComponent key={5} message="This is message 5"/>
            <MessageComponent key={6} message="This is message 6"/>
        </View>
    );
}
```

After I deployed the app I noticed an issue with android status bar, it was covered completely by my application:

![android status bar covered image][my-reads-android-status-bar-covered.png]

Original source code: [MyReads 02-migrate-first-component tag][myreads-02-migrate-first-component]

The fix was to use a margin for Android platform:

```JavaScript
import { StyleSheet, Platform } from 'react-native';
import { Constants } from 'expo';

const appStyles = StyleSheet.create({
    app: {
        marginTop: 'android' === Platform.OS ? Constants.statusBarHeight : 0
    }
});

export default appStyles;
```

```JavaScript
render() {
    const { isI18nInitialized, inputValue } = this.state;

    return isI18nInitialized && (
        <View style={[appStyles.app, appStyles.vertical]}>
            <MessageComponent key={1} message="This is message 1"/>
            <MessageComponent key={2} message="This is message 2"/>
            <MessageComponent key={3} message="This is message 3"/>
            <Text style={[appStyles.text]}>{localizer.localize('books-search-text')}</Text>
            <MessageComponent key={4} message="This is message 4"/>
            <MessageComponent key={5} message="This is message 5"/>
            <MessageComponent key={6} message="This is message 6"/>
        </View>
    );
}
```

![android status bar visible image][my-reads-android-status-bar-visible.png]

Original source code: [MyReads 03-configure-app-top-margin tag][myreads-03-configure-app-top-margin]

I continued with [flexbox layout][react-native-flexbox] and I had the next headache. My understanding was that I have to use `flex: 1` for every component that needs to layout it's children with flexbox so I defined the following styles:

```JavaScript
import { StyleSheet, Platform } from 'react-native';
import { Constants } from 'expo';
import appColors from "./AppColors";
import appSizes from "./AppSizes";

const appStyles = StyleSheet.create({
    container: {
        flex: 1,
    },

    horizontal: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },

    vertical: {
        flexDirection: 'column',
        flexWrap: 'nowrap',
        justifyContent: 'flex-start',
    },

    resultSingle: {
        width: appSizes.resultWidth(),
        margin: appSizes.margin,
    }
});

export default appStyles;
```

and I applied them for my needs, first in a custom component:

```JavaScript
import React from 'react';
import PropTypes from 'prop-types';
import {
    View,
    Text
} from 'react-native';
import localizer from 'utils/Localizer';
import BookFigureComponent from './BookFigureComponent';
import appStyles from 'styles/AppStyles';

function ReadonlyBookComponent(props) {
    const { book } = props;
    if(!book) {
        return null;
    }
    return (
        <View style={[appStyles.resultSingle, appStyles.container, appStyles.vertical]}>
            <BookFigureComponent book={book} size="large"/>
            <Text>{localizer.localize('book-by-label')} {book.authors.join(', ')}</Text>
            <Text>{book.pages} {localizer.localize('book-pages-label')}</Text>
        </View>
    );
}

ReadonlyBookComponent.propTypes = {
    book: PropTypes.shape({
        authors: PropTypes.arrayOf(PropTypes.string).isRequired,
        pages: PropTypes.number.isRequired
    })
};

export default ReadonlyBookComponent;
```

and then on application component:

```JavaScript
render() {
    const { isLocalizerInitialized } = this.state;

    let bookRNIA = {
        title: "React Native In Action",
        image: "https://images.manning.com/720/960/resize/book/2/8a23d37-c21c-491a-a5a9-498b6b54fe6d/Dabit-React-HI.png",
        authors: ["Sir John Whitmore"],
        pages: 320
    };
    return isLocalizerInitialized && (
        <View style={[appStyles.app, appStyles.container, appStyles.horizontal]}>
            <ReadonlyBookComponent book={{...bookRNIA, title: `${bookRNIA.title} 11`}}/>
            <ReadonlyBookComponent book={{...bookRNIA, title: `${bookRNIA.title} 11`}}/>
            <ReadonlyBookComponent book={{...bookRNIA, title: `${bookRNIA.title} 11`}}/>
            <ReadonlyBookComponent book={{...bookRNIA, title: `${bookRNIA.title} 11`}}/>
        </View>
    );
}
```

The result was not the expected one:

![flexbox issue image][myreads-flexbox-issue.png]

After searching for few mornings and trying different things, I noticed that in my case the fix was to use `flex: 1` only at application component and removed for the other components:

```JavaScript
function ReadonlyBookComponent(props) {
    const { book } = props;
    if(!book) {
        return null;
    }
    return (
        <View style={[appStyles.resultSingle, appStyles.vertical]}>
            <BookFigureComponent book={book} size="large"/>
            <Text>{localizer.localize('book-by-label')} {book.authors.join(', ')}</Text>
            <Text>{book.pages} {localizer.localize('book-pages-label')}</Text>
        </View>
    );
}
```

and the result was what I wanted:

![flexbox fixed image][myreads-flexbox-fixed.png]

Original source code: [MyReads 04-flexbox-issue tag][myreads-04-flexbox-issue]

### Migrate Redux code

After I migrated few react components and I got a feeling about how things are working in react native, I wanted to use the other building blocks from the previous project, like redux, when I got the next headache:

![redux integration issue image][myreads-redux-integration-issue.png]

It turned out that it was my mistake, I updated package.json with latest versions of everything. The fix was to pay attention of react native documentation and use the right versions:

```
"react": "16.5.0",
"react-native": "https://github.com/expo/react-native/archive/sdk-32.0.2.tar.gz",
"react-redux": "^6.0.1",
"redux": "^4.0.1",
```

I also noticed that react-redux ^6.0.1 is the max version that works with redux ^4.0.1.

Original source code: [MyReads 06-redux-integration tag][myreads-06-redux-integration]

### Migrate container components

After fixing the redux integration, I did not experienced any other major issues except of my bugs.
Original source code: [MyReads 07-migrate-container-components tag][myreads-07-migrate-container-components]

### Remove API calls and use local storage

The last step was to remove API calls and use [local storage][react-native-asyncstorage]. In documentation is mentioned that it is deprecated and the suggestion is to use [React Native Community AsyncStorage][react-native-async-storage], but it [doesn't work][react-native-async-storage-expo] with [expo][expo-io].
I added below the logic for book handling to have a sense on what's going on:

```JavaScript
import {AsyncStorage} from 'react-native';
import uuid from 'uuid';
import { isString } from 'utils/TypeCheck';
import {
    buildError,
    getReason
} from 'utils/Error';
import { buildResponse } from 'utils/Response';
import {
    fetchCurrentReadingSessionFromStore,
    deleteCurrentReadingSessionInStore
} from './ReadingSessionAsyncStorage';

const BOOKS_KEY = 'MyReads:Books';

export const fetchBooksFromStore = searchText => {
    return new Promise((resolve, reject) => {
        AsyncStorage.getItem(BOOKS_KEY)
            .then(rawBooks => {
                if(!rawBooks) {
                    resolve(buildResponse([]));
                    return;
                }
                const books = JSON.parse(rawBooks);

                let filteredBooks = books;
                if(searchText && isString(searchText)) {
                    const sanitizedSearchText = searchText.trim().toLowerCase();
                    filteredBooks = Object.values(books)
                        .filter(book =>
                            (book.title && book.title.toLowerCase().includes(sanitizedSearchText))
                            || (book.authors && book.authors.join(',').toLowerCase().includes(sanitizedSearchText))
                        )
                        .reduce((result, book) => ({...result, [book.uuid]: book}), {})
                }
                resolve(buildResponse(Object.values(filteredBooks)));
            })
            .catch(error => {
                reject(error);
            });
    });
};

export const fetchBookFromStore = uuid => {
    return new Promise((resolve, reject) => {
        AsyncStorage.getItem(BOOKS_KEY)
            .then(rawBooks => {
                if(!rawBooks) {
                    rawBooks = '{}';
                }
                const books = JSON.parse(rawBooks);

                if(!books[uuid]) {
                    reject(buildError(404));
                    return;
                }

                resolve(buildResponse(books[uuid]));
            })
            .catch(error => {
                reject(error);
            });
    });
};

export const addBookInStore = book => {
    return new Promise((resolve, reject) => {
        AsyncStorage.getItem(BOOKS_KEY)
            .then(rawBooks => {
                if(!rawBooks) {
                    rawBooks = '{}';
                }
                const books = JSON.parse(rawBooks);

                const savedBook = {...book};
                savedBook.uuid = uuid.v1();
                books[savedBook.uuid] = savedBook;
                AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books))
                    .then( () => {
                        resolve(buildResponse(savedBook));
                    })
                    .catch(error => {
                        reject(error);
                    });
            })
            .catch(error => {
                reject(error);
            });
    });
};

export const updateBookInStore = book => {
    return new Promise((resolve, reject) => {
        AsyncStorage.getItem(BOOKS_KEY)
            .then(rawBooks => {
                const books = JSON.parse(rawBooks);

                if(!books[book.uuid]) {
                    reject(buildError(404));
                    return;
                }

                books[book.uuid] = book;
                AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books))
                    .then( () => {
                        resolve();
                    })
                    .catch(error => {
                        reject(error);
                    });
            })
            .catch(error => {
                reject(error);
            });
    });
};

const safeDeleteBookFromStore = (books, uuid, resolve, reject) => {
    delete books[uuid];
    AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(books))
        .then(() => {
            resolve();
        })
        .catch(error => {
            reject(error);
        });
};

export const deleteBookFromStore = uuid => {
    return new Promise((resolve, reject) => {
        AsyncStorage.getItem(BOOKS_KEY)
            .then(rawBooks => {
                const books = JSON.parse(rawBooks);

                if(!books[uuid]) {
                    reject(buildError(404));
                    return;
                }

                fetchCurrentReadingSessionFromStore(uuid)
                    .then(() => {
                        deleteCurrentReadingSessionInStore(uuid)
                            .then(() => {
                                safeDeleteBookFromStore(books, uuid, resolve, reject);
                            })
                            .catch(error => {
                                reject(error);
                            });
                    })
                    .catch(error => {
                        if(404 === getReason(error)) {
                            safeDeleteBookFromStore(books, uuid, resolve, reject);
                        } else {
                            reject(buildError(500));
                        }
                    });
            })
            .catch(error => {
                reject(error);
            });
    });
};
``` 

Original source code: [MyReads 08-use-local-storage tag][myreads-08-use-local-storage]

## Published app

The can download the final solution from [Google Play][myreads-google-play] for the moment, I do not have yet a build for iOS.

## Conclusion

I had a lot of issues because of my lack of experience. After I fixed the infrastructure problems, I did not experienced any other major headaches. I believe that at least for simple apps that not need platform specific code, [React Native][react-native] and [Expo][expo-io] can be a good match.

[react-native]: https://facebook.github.io/react-native/
[react-native-getting-started]: https://facebook.github.io/react-native/docs/getting-started
[android-sdk-emulator-command-line-issue]: https://github.com/decosoftware/deco-ide/issues/289
[awesomeproject-expo-cli]: https://github.com/vasileboris/espressoprogrammer-blog-code/tree/master/from-react-to-react-native-a-practical-example/AwesomeProject-Expo-CLI
[awesomeproject-rn-cli]: https://github.com/vasileboris/espressoprogrammer-blog-code/tree/master/from-react-to-react-native-a-practical-example/AwesomeProject-RN-CLI
[library-web]: https://github.com/vasileboris/library-web
[library-resources]: https://github.com/vasileboris/library-resources
[library-api]: https://github.com/vasileboris/library-api
[myreads]: https://github.com/vasileboris/MyReads
[virtual-box-android-x86]: https://doc.nuxeo.com/blog/speeding-up-the-android-emulator/
[i18next]: https://www.i18next.com/
[myreads-00-app-structure]: https://github.com/vasileboris/MyReads/releases/tag/00-app-structure
[myreads-01-configure-i18next]: https://github.com/vasileboris/MyReads/releases/tag/01-configure-i18next
[myreads-02-migrate-first-component]: https://github.com/vasileboris/MyReads/releases/tag/02-migrate-first-component
[myreads-03-configure-app-top-margin]: https://github.com/vasileboris/MyReads/releases/tag/03-configure-app-top-margin
[babel-root-slash-import]: https://github.com/mantrajs/babel-root-slash-import
[babel-plugin-module-resolver]: https://github.com/tleunen/babel-plugin-module-resolver
[myreads-04-flexbox-issue]: https://github.com/vasileboris/MyReads/releases/tag/04-flexbox-issue
[myreads-05-redux-integration-issue]: https://github.com/vasileboris/MyReads/releases/tag/05-redux-integration-issue
[myreads-06-redux-integration]: https://github.com/vasileboris/MyReads/releases/tag/06-redux-integration
[myreads-07-migrate-container-components]: https://github.com/vasileboris/MyReads/releases/tag/07-migrate-container-components
[myreads-08-use-local-storage]: https://github.com/vasileboris/MyReads/releases/tag/08-use-local-storage
[react-native-asyncstorage]: https://facebook.github.io/react-native/docs/asyncstorage
[react-native-async-storage]: https://github.com/react-native-community/react-native-async-storage
[react-native-async-storage-expo]: https://github.com/react-native-community/react-native-async-storage/issues/72
[expo-io]: https://expo.io/
[google-play]: https://play.google.com/store/apps
[google-play-console]: https://play.google.com/apps/publish
[android-studio]: https://developer.android.com/studio
[watchman]: https://facebook.github.io/watchman/
[my-reads-android-status-bar-covered.png]: my-reads-android-status-bar-covered.png
[my-reads-android-status-bar-visible.png]: my-reads-android-status-bar-visible.png
[react-native-flexbox]: https://facebook.github.io/react-native/docs/flexbox
[myreads-flexbox-issue.png]: myreads-flexbox-issue.png
[myreads-flexbox-fixed.png]: myreads-flexbox-fixed.png
[myreads-redux-integration-issue.png]: myreads-redux-integration-issue.png
[myreads-google-play]: https://play.google.com/store/apps/details?id=com.espressoprogrammer.myreads
