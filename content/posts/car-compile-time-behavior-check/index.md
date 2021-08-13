---
title: I wish my car had compile time behavior check
date: 2015-12-22
type: post
---

![Featured imaged][featured-image]

This weekend I had a revelation on one disadvantage of interpreted languages over compiled ones. It is very well explained on [wikipedia][wikipedia]:

> Without static type-checking, which is usually performed by a compiler, programs can be less reliable, because type checking eliminates a class of programming errors.

Christmas is coming and we did some preparations this weekend. We bought the Christmas tree and a lot of groceries. I put the tree inside my car and the groceries in the trunk. When I arrived at home I stopped in front of my place and in the same time another neighbor arrived. [Murphy][murphy] was there for me. I didn't want my neighbor to wait too much because of me so I did the the following in a hurry:

```
open car's back right door
  extract the Christmas tree
// what do you think is missing here?

open trunk
  extract groceries
close trunk

start car
// ViolentDoorClosedByPillar runtime exception
park car
```

Just before to arrive in the parking place, I heard a big noise. Because I forgot that I leaved with my door open, I didn't even realized what happened. I had to go to a place with more light and examine the car to notice my accomplishment. And that's why I wish my car had compile time behavior check.

Image credit: [Gerd Altmann][geralt-9301], CC0 Public Domain

[featured-image]: programming-books.jpg
[wikipedia]: https://en.wikipedia.org/wiki/Interpreted_language "Interpreted language"
[murphy]: https://en.wikipedia.org/wiki/Murphy%27s_law "Murphy's law"
[geralt-9301]: https://pixabay.com/en/users/geralt-9301/