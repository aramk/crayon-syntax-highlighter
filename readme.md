# Crayon Syntax Highlighter

Supports multiple languages, themes, fonts, highlighting from a URL, local file or post text.

Written in PHP and jQuery. Crayon is a Wordpress plugin, but can be used in any PHP environment.

[View Demo](aksandbox.webege.com) | [Twitter](http://twitter.com/#!/crayonsyntax)

## Download

* [Beta Development Releases](https://github.com/aramkocharyan/crayon-syntax-highlighter/zipball/master)
* [Stable Releases](http://wordpress.org/extend/plugins/crayon-syntax-highlighter/)

## Tag Editor

The Tag Editor makes adding code, changing settings and all that much easier with a simple dialog. I'd recommend it over the manual approach, since you can fine-tune the Crayon after the editor generates it :)

### Pre-formatted Tags

You can also use `<pre class="attributes" title="something">...</pre>` so that:

* Disabling Crayon still presents the code as pre-formatted text and is readable
* Enforces proper encoding of entities (&lt; in HTML view and not <)
* The code snippets are reusable with other syntax highlighters

The Tag Editor generates tags like these. Attributes names are separated from values by either `:` (default) or `_`. E.g. `<pre class="lang:php theme:twilight mark:1,2-4" title="something">...</pre>` You can optionally provide the following attributes:

### Attributes

lang | Specify a Language ID, these are the folders in the langs directory and appears in the list of Languages in Settings. | `lang="java"`

## Licence

Crayon is released under the GPLv2 licence. See `readme.txt`.

## Documentation & Download

* http://aramk.com/projects/crayon-syntax-highlighter/
* http://wordpress.org/extend/plugins/crayon-syntax-highlighter/
