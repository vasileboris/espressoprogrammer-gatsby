---
title: Why I like MarkDown?
date: "2015-11-08"
type: post
---

Back is 1994 I saw [Forrest Gump][forrest-gump] and one of the lines that I remember is:

> My momma always said, "Life was like a box of chocolates. You never know what you're gonna get."

At that time I was quite young and I didn't get it that well but in the meantime I grew up or at least I think I do.

This year I was involved in reviewing one technical book were I read a mention about [Asciidoctor][asciidoctor] community. I never thought that ascii codes could ever get sick so I checked what is all about immediately. What I found is that

> AsciiDoc is two things:
> 1. A mature, plain-text writing format for authoring notes, articles, documentation, books, ebooks, web pages, slide decks, blog posts, man pages and more.
> 2. A text processor and toolchain for translating AsciiDoc documents into various formats (called backends), including HTML, DocBook, PDF and ePub.

For the first time I liked something about documentation. For me and for the programmers I know, the main problem with documentation is that we have to write it. Then we have to use tools like [Microsoft Word][microsoft-word] that we don't understand enough to create a proper document. With Asciidoctor we can just write plain text and then transform it in other formats like HTML, PDF or ePub. If the [Java slogan][java-slogan] is **write once, run anywhere**, Asciidoctor equivalent would be **write once, read anywhere**.

This sounds quite good and while reading further on [what is asciidoc][what-is-asciidoc] I found a mention about [Markdown][markdown], one of the alternatives. I became curious again and I searched for more information. On official site I found that:

> Thus, “Markdown” is two things: (1) a plain text formatting syntax; and (2) a software tool, written in Perl, that converts the plain text formatting to HTML. See the [Syntax][markdown-syntax] page for details pertaining to Markdown’s formatting syntax. You can try it out, right now, using the online [Dingus][markdown-dingus].

I have now two ways to write documentation in text and convert it later in HTML at least but which one to choose? At first Markdown does not look like a good alternative mainly because the site is very old (from 2004!!!) but after I searched further I started to prefer it and the reasons are:

* It looks like there is the preferred way by programmers to write documentation. Just look for files with .md or .MD extensions in projects you work on
* I found that is possible to activate markdown support in WordPress. I checked how to do it and I installed and configured [Jetpack][jetpack].
* [GitHub][github] uses it across the site for issues, comments and pull requests.
* It is possible to host a blog with [Jekyll][jekyll] and [Poole][poole] on [GitHub Pages][github-pages], see details on [Minimal Blog Using Jekyll, Github Pages, and poole][jekyll-github-pages-poole]. I also tried it and this post can be found hosted on [GitHub Pages version of this post][github-why-like-markdown].

The result of this investigation is that I write my posts in markdown and I can use the same source in two places: here on this blog and on [GitHub Pages version of this blog][github-vasileboris].

So, why I mentioned the box of chocolates? I started with reading the biography of one of the authors of a book and I ended liking writing documentation. I never imaged this could be even possible.

[forrest-gump]: http://www.imdb.com/title/tt0109830/?ref_=ttqt_qt_tt "Forrest Gump"
[asciidoctor]: http://asciidoctor.org/ "A fast text processor & publishing toolchain for converting AsciiDoc to HTML5, DocBook & more."
[microsoft-word]: https://products.office.com/en/word "Microsot Word"
[java-slogan]: https://en.wikipedia.org/wiki/Write_once,_run_anywhere "Write once, run anywhere"
[what-is-asciidoc]: http://asciidoctor.org/docs/what-is-asciidoc/ "What is AsciiDoc?"
[markdown]: https://daringfireball.net/projects/markdown/ "text-to-HTML conversion tool for web writers"
[markdown-syntax]: https://daringfireball.net/projects/markdown/syntax "Markdown: Syntax"
[markdown-dingus]: https://daringfireball.net/projects/markdown/dingus "Markdown: Dingus"
[jetpack]: https://wordpress.org/plugins/jetpack/ "Your WordPress, Simplified."
[jekyll]: http://jekyllrb.com/ "Transform your plain text into static websites and blogs."
[poole]: https://github.com/poole/poole "Poole"
[github]: https://github.com/ "GitHub"
[github-pages]: https://pages.github.com/ "Websites for you and your projects."
[jekyll-github-pages-poole]: http://joshualande.com/jekyll-github-pages-poole/ "How I Created a Beautiful and Minimal Blog Using Jekyll, Github Pages, and poole"
[github-why-like-markdown]: http://vasileboris.github.io/why-like-markdown/ "Why like markdown"
[github-vasileboris]: http://vasileboris.github.io "Espresso Programmer"