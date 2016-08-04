# Crayon Syntax Highlighter

Supports multiple languages, themes, fonts, highlighting from a URL, local file or post text.

![snapshot](https://raw.githubusercontent.com/aramk/crayon-syntax-highlighter/master/screenshots/screenshot-2.png)

Written in PHP and jQuery. Crayon is a Wordpress plugin, but can be used in any PHP environment.

## Download
* [Beta Development Releases](https://github.com/aramk/crayon-syntax-highlighter/zipball/master)
* [Stable Releases](https://wordpress.org/plugins/crayon-syntax-highlighter/)

## Tag Editor

The Tag Editor makes adding code, changing settings and all that much easier with a simple dialog. I'd recommend it over the manual approach, since you can fine-tune the Crayon after the editor generates it :)

### Pre-formatted Tags

You can also use `<pre class="attributes" title="something">...</pre>` so that:

* Disabling Crayon still presents the code as pre-formatted text and is readable
* Enforces proper encoding of entities (&lt; in HTML view and not <)
* The code snippets are reusable with other syntax highlighters

The Tag Editor generates tags like these. Attributes names are separated from values by either `:` (default) or `_`. E.g. `<pre class="lang:php theme:twilight mark:1,2-4" title="something">...</pre>` You can optionally provide the following attributes:

### Attributes

Name | Description | Example
----|----|----
lang | Specify a Language ID, these are the folders in the langs directory and appears in the list of Languages in Settings. | `lang="java"`
url | Load a file from the web or a local path. You give a relative local path instead of absolute (see Files). For languages with defined extensions (see Languages in Settings) you don't even need to provide the lang attribute, as this will be detected if your file ends with it, as in the example. | `url="http://example.com/code.java"` or `url="java/code.java"`
title | Give a title for your code snippet. Appears in the toolbar. | `title="Sample"`
mark | Mark some lines as important so they appear highlighted. You can specify single numbers, comma separted, a range, or a combination. | `mark="5-10,12"`
range | Specify the range of lines from the input code to use in the output. You can specify a single number or a single range.	| `range="3-5", range="3"`

## Mixed Highlighting

You can even mix code together like on a real HTML page, by having `<script>`, `<style>` and `<?php...?>` tags all in a single Crayon and setting the language to HTML.

## Languages

Language information is found here in the Wordpress Admin: *Settings > Crayon > Languages > Show Languages* You can customise and create new languages and define how to capture each element (keywords, comments, strings, etc.) with regular expressions. Languages are structured `langs/lang-name/lang-name.txt`. Take a look at `langs/default/default.txt` and check out the neat regex of the default/generic language. See the [readme](langs/readme.md) in `langs/readme.md` for more information about the language file syntax.

You can add custom languages in `wp-content/uploads/crayon-syntax-highlighter/languages` with the same format as those in the plugin directory and they will remain after plugin updates.

## Themes

Crayon comes with built-in Themes to style your code. See a sample of the current set of themes. Themes are structured `themes/theme-name/theme-name.css`. If you know CSS, take a look at `themes/default/default.css` to get an idea of how they work and how you can change/create them. The specification for CSS classes is here.

You can add custom themes in `wp-content/uploads/crayon-syntax-highlighter/themes` with the same format as those in the plugin directory and they will remain after plugin updates. This is where user themes are stored when you customise stock themes in the Theme Editor.

## Comments

You can enable support for Crayon comments by adding TinyMCE to the comment box. Add this code at the end of your theme's `functions.php` file. This requires at least version 3.3 of Wordpress.

```php
add_filter('comment_form_defaults', 'tinymce_comment_enable');
function tinymce_comment_enable ( $args ) {
    ob_start();
    wp_editor('', 'comment', array('tinymce'));
    $args['comment_field'] = ob_get_clean();
    return $args;
}
```
	
Then enable these settings in *Wordpress Admin > Settings > Crayon*:

* "Display the Tag Editor in any TinyMCE instances on the frontend (e.g. bbPress)"
* "Allow Crayons inside comments"

## Internationalization

Crayon comes translated in several languages already, and if yours is included it will translate Crayon given you've followed instructions about how to show [Wordpress in Your Language](http://codex.wordpress.org/WordPress_in_Your_Language). If Crayon doesn't support your language or you'd like to help improve it:

* Download [POEdit](http://www.poedit.net/). Add `..` to the source paths under catalog preferences, and `crayon__`, `crayon_n` and `crayon_e` under source keywords.
* Update and start making translations.
* Send the `.po` file to me at <crayon.syntax@gmail.com> and give me your name and a URL to your blog for credit. Alternatively, fork this repo and make a push request :)

## Fonts

You can define fonts and font-sizes within Themes, but you can also override the theme's font with those inside `fonts/` and also provide `@font-face` fonts just like in themes - it's just CSS after all.

You can add custom fonts in `wp-content/uploads/crayon-syntax-highlighter/fonts` with the same format as those in the plugin directory and they will remain after plugin updates.

## Disable Highlighting

You can temporarily disable highlighting for a piece of code using the `highlight="false"` attribute. You can also prevent Crayon from touching any kind of tag by using the `crayon="false"` attribute. If using pre tags, put `crayon:false` in the class.

## Minification

Crayon's CSS and JavaScript resources is already minified (see `css` and `js`).

<!--

### Use in Other Environments

TODO

### Other Uses in Wordpress

TODO

-->

## Settings

Crayon is versatile so you can override *global settings* for individual Crayons with attributes. The **Tag Editor** lets you do all this using a simple dialog!

Setting | Allowed Value | Description
--------|---------------|------------
theme | string | ID of the theme to use
font | string | ID of the font to use
font-size | number > 0 | Custom font size in pixels
min-height/max-height | number > 0 followed by px/% | Minimum/maximum height in units
height | number > 0 followed by px/% | Height in units
min-width/max-width | number > 0 followed by px/% | Minimum/maximum width in units
width | number > 0 followed by px/% | Width in units
toolbar | true/false/"always" | Show or hide the toolbar. "always" shows always (without mouseover).
top-margin | number >= 0 | Top margin in pixels
bottom-margin | number >= 0 | Bottom margin in pixels
left-margin | number >= 0 | Left margin in pixels
right-margin | number >= 0 | Right margin in pixels
h-align | "none/left/right/center" | Horizontal alignment
float-enable | true/false | Allow floating elements to surround Crayon
toolbar-overlay | true/false | Overlay the toolbar on code rather than push it down when possible
toolbar-hide | true/false | Toggle the toolbar on single click when it is overlayed
toolbar-delay | true/false | Delay hiding the toolbar on MouseOut
show-title | true/false | Display the title when provided
show-lang | "found/always/never" | When to display the language.
striped | true/false | Display striped code lines
marking | true/false | Enable line marking for important lines
nums | true/false | Display line numbers by default
nums-toggle | true/false | Enable line number toggling
plain | true/false | Enable plain code. Disabling will also disable plain toggling and copy/paste which use the plain code.
crayon | false | Prevent from turning the tag into a Crayon.
highlight | true/false | Prevent from highlighting the code, treats it as plain text instead.
plain-toggle | true/false | Enable plain code toggling
show-plain-default | true/false | Show the plain code by default instead of the highlighted code
copy | true/false | Enable code copy/paste
popup | true/false | Enable opening code in a window
scroll | true/false | Show scrollbar on mouseover
tab-size | number >= 0 | Tab size
trim-whitespace | true/false | Trim the whitespace around the code
mixed | true/false | Enable mixed highlighting (multiple languages in code)
show_mixed | true/false | Show the mixed highlighting plus sign
start-line | number >= 0 | When to start line numbers from
fallback-lang | string | ID of the language to use when none is detected
local-path | string | Local path to load file from
touchscreen | true/false | Disable mouse gestures for touchscreen devices (eg. MouseOver)
disable-anim | true/false | Disable animations
runtime | true/false | Disable runtime stats
error-log | true/false | Log errors for individual Crayons
error-log-sys | true/false | Log system-wide errors
error-msg-show | true/false | Display custom message for errors
error-msg | string | The error message to show for errors
mixed | true/false | Allow mixed languages using delimiters and tags

## Legacy Tags

Using the legacy tag  `[crayon attributes] some code [/crayon]` is possible but I **highly recommend** using `<pre>` tags instead. You can also **convert** legacy tags automatically in the Wordpress settings screen.

### Mini Tags

Using Mini Tags like `[php]some code[/php]` is supported but also deprecated in favour of `<pre>` tags.

## Licence

Crayon is released under the GPLv3 licence. See `license.txt`.
