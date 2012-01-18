=== Crayon Syntax Highlighter ===
Contributors: akarmenia
Donate link: http://bit.ly/crayondonate
Tags: syntax highlighter, syntax, highlighter, highlighting, crayon, code highlighter
Requires at least: 3.0
Tested up to: 3.3.1
Stable tag: trunk

Syntax Highlighter supporting multiple languages, themes, fonts, highlighting from a URL, local file or post text.

== Description ==

A Syntax Highlighter built in PHP and jQuery that supports customizable languages and themes.
It can highlight from a URL, a local file or Wordpress post text. Crayon makes it easy to manage Language files and define
custom language elements with regular expressions.
It also supports some neat features like:

* Toggled plain code
* Toggled line numbers
* Copy/paste code
* Open code in a new window (popup)
* Remote request caching
* Multiple language highlighting in a single Crayon
* Mini Tags like [php][/php]
* Plain Tag ([plain]...[/plain]) for quick &lt;pre&gt;&lt;code&gt;...&lt;/code&gt;&lt;/pre&gt;
* &lt;pre&gt; tag support
* Mobile/touchscreen device detection
* Mouse event interaction (showing plain code on double click, toolbar on mouseover)
* Tab sizes
* Code title
* Toggled toolbar
* Striped lines
* Line marking (for important lines)
* Starting line number (default is 1)
* Local directory to search for local files
* File extension detection
* Live Preview in settings
* Dimensions, margins, alignment and CSS floating
* Extensive error logging

**Supported Languages**

Languages are defined in language files using Regular Expressions to capture elements.
See http://ak.net84.net/projects/crayon-language-file-specification/ to learn how to make your own.

* Default Langauge (one size fits all, highlights generic code)
* C
* C#
* C++
* CSS
* HTML (XML/XHTML)
* Monkey
* Java
* JavaScript
* Objective-C
* PHP
* Python
* Shell (Unix)
* Visual Basic

Live Demo: <a href="http://bit.ly/poKNqs" target="_blank">http://bit.ly/poKNqs</a>

Short How-To: <a href="http://ak.net84.net/projects/crayon-syntax-highlighter/" target="_blank">http://ak.net84.net/projects/crayon-syntax-highlighter/</a>

Please Thank Me With <a href="http://ak.net84.net/files/donate.php" target="_blank">Coffee</a>!

**International Languages**

* French
* German
* Italian
* Spanish
* Japanese (thanks to @west_323)
* Russian (thanks to minimus - http://simplelib.com)
* Help from translators at improving/adding to this list greatly appreciated!  

**Articles**

These are helpful for discovering new features.

* <a href="http://ak.net84.net/projects/mixed-language-highlighting-in-crayon/" target="_blank">Mixed Language Highlighting in Crayon</a>
* <a href="http://ak.net84.net/projects/mini-tags-in-crayon/" target="_blank">Mini Tags And Plain Tags In Crayon</a>
* <a href="http://ak.net84.net/projects/enqueuing-themes-and-fonts-in-crayon/" target="_blank">Enqueuing Themes and Fonts in Crayon</a> 

**Planned Features**

* Ruby support (feel free to add before me!)
* Highlighting in sentences
* Theme Editor
* Visual Editor Support

== Installation ==

Download the .zip of the plugin and extract the contents. Upload it to the Wordpress plugin directory and activate the plugin.
You can change settings and view help under <strong>Settings > Crayon</strong> in the Wordpress Admin.

== Frequently Asked Questions ==

= How do I use this thing? =

<code>[crayon lang="php"] your code [/crayon]</code>
<code>[crayon url="http://example.com/code.txt" /]</code>
<code>[crayon url="/local-path-defined-in-settings/code.java" /]</code>

You can use &lt;pre&gt;:

<code>&lt;pre lang="php"&gt; your code &lt;/crayon&gt;</code>

You can also use Mini Tags:

<code>[php theme="twilight"]your code[/php]</code>

Please see the contextual help under <strong>Settings > Crayon</strong> for quick info about languages, themes, etc.

= I need help, now! =

Contact me at http://twitter.com/crayonsyntax or crayon.syntax@gmail.com.

== Screenshots ==

1. Classic theme.
2. Twilight theme.

== Changelog ==

= 1.8.0 =
* Theme Editor coming soon!

= 1.7.16 =
* Running out of revision numbers!
* Fixed a bug causing default-theme from loading as a font
* Fixed an issue where the js used to remove inline styles before opening in another window was missing the /g regex modifier
* Cleaned up loading and event handling in crayon.js
* Fixed a bug causing code popup to fail
* Improved CSS language
* Improved JS language by adding regex syntax, yay!
* Fixed issues with resizing Crayon and dimensions

= 1.7.15 =
* Fixed a bug prevented fonts and themes with spaces from being enqueued. Thanks to Fredrik Nygren.
* Improved handling of id's and names of resources.

= 1.7.14 =
* Fixed a bug that could potentially cause a PHP warning when reading the log when not permitted to do so. 

= 1.7.13 =
* Fixed a bug causing my settings and donate links to be appended to all plugins in the list. Thanks to Ben.

= 1.7.12 =
* Added Russian translation thanks to minimus (http://simplelib.com)
* Added Consolas Font

= 1.7.11 =
* Added the option of either enqueuing themes and fonts (efficient) or printing them before the Crayon each time when enqueuing fails
* Thanks to http://www.adostudio.it/ for finding the bugs
* Improved theme and font handling
* Improved theme detection and Crayon capturing

= 1.7.10 =
* Fixed a visual artifact of loading that caused the plain code to be partially visible

= 1.7.9 =
* Added Monkey language thanks to https://github.com/devolonter/

= 1.7.8 =
* Fixed a JavaScript bug in admin preventing language list loading
* Fixed an issue causing plain code to load invisible the first time if set to default view 
* Added translations for 1.7.7 features

= 1.7.7 =
* Added plain code toggling and ability to set plain code as default view
* Minor improvements to Objective-C
* Fixed some JavaScript bugs in the admin preview
* Fixed copy/paste key combinations. Thanks to http://wordpress.org/support/profile/nickelfault.

= 1.7.6 =
* Added highlight support for catching multiple exceptions in Java

= 1.7.5 =
* Removed jQuery.noConflict() from crayon.js. This must have been causing some trouble if anything used $.

= 1.7.4 =
* Added namespacing to crayon.js to prevent conflicts

= 1.7.3 =
* Added Mini Tags and Plain Tags into Crayon. http://bit.ly/rRZuzk
* Fixed a bug causing RSS feeds to contain malformed HTML of Crayons, now it shows plain code with correct indentations. Thanks to Артём.
* Updated help in Settings and http://ak.net84.net/projects/crayon-syntax-highlighter/

= 1.7.2 =
* Fixed a bug that prevented foreign languages from being initialised and used. Thanks to @west_323 for finding it.  

= 1.7.1 =
* Renamed Japanese GNU language code from ja_JP to ja.

= 1.7.0 =
* Added the ability to highlight multiple languages in a single Crayon! http://bit.ly/ukwts2
* A bunch of language improvements, a few CSS improvements, etc.

= 1.6.6 =
* Fixed a bug causing international Unicode characters being garbled in the title (thanks to simplelib.com!)
* Fixed a bug that prevented strings from being highlighted

= 1.6.5 =
* Fixed a bug causing international Unicode characters being garbled

= 1.6.4 =
* Added user submitted Japanese language support. Thanks to @west_323!
* &lt;pre&gt;&lt;/pre&gt; tags are now captured as Crayons. This can be turned off in Settings > Crayon > Code.
* You can remove prevent capturing individual &lt;pre&gt; tags the same way as Crayons: $&lt;pre&gt; ... &lt;/pre&gt;
* This method of preventing the &lt;pre&gt; tag should be used if your code contains &lt;pre&gt; tags (nested &lt;pre&gt; tags) - otherwise it will cause conflicts.
* Keep in mind that &lt;pre&gt; tags should not be editted in Visual Mode. Crayon will display all code as it appears in the HTML view of the post editor, where you can make code changes and use the tab key etc. If you want to use the Visual editor reguarly and are running into problems, consider loading the code form a file using the 'url' attribute. 
* I have removed the ability to have spacing between the starting and ending square brackets, so [crayon...] is valid but [ crayon ... ] is not.
The same applies to &lt;pre&gt; tags (not &lt; pre &gt;). The reason is to improve performance on posts without Crayons by using strpos and not regex functions like preg_match, and also it's better formed.
* Fixed a bug causing Plain Code to display characters as encoded HTML entities
* Removed jQuery 1.7 from /js folder. Now uses the version provided by WP.

= 1.6.3 =
* For those still having issues with CSS and JavaScript not laoding, I have added a new setting in Misc. that will allow you to either attempt to load these resources when needed if you have no issues with your theme or to force them to load on each page.
* Please see: http://ak.net84.net/php/loading-css-and-javascript-only-when-required-in-a-wordpress-plugin/ 

= 1.6.2 =
* Added ability to use and define language aliases. eg. XML -> XHTML, cpp -> c++, py -> python

= 1.6.1 =
* Avoided using $wp_query, $posts instead
* Updated contextual help to be compliant with WP 3.3

= 1.6.0 =
* Added internationalisation with 4 new languages: German, Spanish, French and Italian
* These were translated using Google Translate, so if you speak these languages and would like to improve them,
it's actually quite easy to edit - just contact me via email :)
* More languages will be added as they are demanded 

= 1.5.4 =
* Recommended update for everyone
* Fixed a bug that caused the default theme not to load if was anything but "classic" - Thanks to Ralph!

= 1.5.3 =
* Fixed issue with incorrectly specified theme causing crash
* Email Developer improved

= 1.5.2 =
* Proper enquing of themes via wordpress, should cause no more issues with any themes
* Cached images for toolbar items, no delay on mouseover
* Fixed a minor regex bug in js preventing styles from being removed when in popup

= 1.5.1 =
* Fixed plain code toggle button update

= 1.5.0 =
* Added ability to cache remote code requests for a set period of time to reduce server load. See Settings > Crayon > Misc. You can clear the cache at any time in settings. Set the cache clearing interval to "Immediately" to prevent caching.
* Fixed a bug preventing dropdown settings from being set correctly
* Fixed AJAX settings bug
* Fixed CSS syntax bug for fonts
* Improved code popup, strips style atts
* Added preview code for shell, renamed to 'Shell'
* Code popup window now shows either highlighted or plain code, depending on which is currently visible

= 1.4.4 =
* Revised CSS style printing
* Fixed bugs with the "open in new window" and copy/paste actions
* Upgraded jQuery to 1.7

= 1.4.3 =
* Fixed a bug that caused the help info to remain visible after settings submit

= 1.4.2 =
* Huge overhaul of Crayon detection and highlighting
* IDs are now added to Crayons before detection
* No more identification issues possible
* Highlighting grabs the ID and uses it in JS
* Only detects Crayons in visible posts, performance improved
* This fixes issues with <!--nextpage-->

= 1.4.1 =
* Fixed Preview in settings, wasn't loading code from different languages
* Fixed code toggle button updating for copy/paste
* Added some keywords to c++, changed sample code

= 1.4.0 =
* Added all other global settings for easy overriding: http://ak.net84.net/projects/crayon-settings/
* Fixed issues with variables and entites in language regex
* Added Epicgeeks theme made by Joe Newing of epicgeeks.net 
* Help updated
* Fixed notice on missing jQuery string in settings
* Reduced number of setting reads
* Setting name cleanup
* Added a donate button, would appreciate any support offered and I hope you find Crayon useful
* String to boolean in util fixed

= 1.3.5 =
* Removed some leftover code from popupWindow

= 1.3.4 =
* Added the ability to open the Crayon in an external window for Mobile devices, originally thought it wouldn't show popup  

= 1.3.3 =
* Added the ability to open the Crayon in an external window

= 1.3.2 =
* Added missing copy icon

= 1.3.1 =
* This fixes an issue that was not completely fixed in 1.3.0:
* Removed the lookbehind condition for escaping $ and \ for backreference bug 

= 1.3.0 =
* Recommended upgrade for everyone.
* Major bug fix thanks to twitter.com/42dotno and twitter.com/eriras
* Fixed a bug causing attributes using single quotes to be undetected
* Fixed a bug causing code with dollar signs followed by numbers to be detected as backreferences and replace itself!
* Fixed a bug causing formatting to be totally disregarded.
* Fixed the <!--more--> tag in post_content and the_excerpt by placing crayon detection after all other formatting has taken place
* Added copy and paste, didn't use flash, selects text and asks user to copy (more elegant until they sort out clipboard access)
* Added shell script to languages - use with lang='sh'
* Removed certain usage of heredocs and replaced with string concatenation
* Added 'then' to default statements
* Cleaned up processing of post_queue used for Crayon detection and the_excerpt
* Added focus to plain text to allow easier copy-paste

= 1.2.3 =
* Prevented Crayons from appearing as plain text in excerpts
http://wordpress.org/support/topic/plugin-crayon-syntax-highlighter-this-plugin-breaks-the-tag

= 1.2.2 =
* Fixed the regex for detecting python docstrings. It's a killer, but it works!
(?:(?<!\\)""".*?(?<!\\)""")|(?:(?<!\\)'''.*?(?<!\\)''')|((?<!\\)".*?(?<!\\)")|((?<!\\)'.*?(?<!\\)')

= 1.2.1 =
* Added the feature to specify the starting line number both globally in settings and also using the attribute:
** [crayon start-line="1234"]fun code[/crayon]
* Thanks for the suggestion from travishill:
** http://wordpress.org/support/topic/plugin-crayon-syntax-highlighter-add-the-ability-to-specify-starting-line-number?replies=2#post-2389518

= 1.2.0 =
* Recommended upgrade for everyone.
* Fixed crucial filesystem errors for Windows regarding filepaths and resource loading
* Said Windows bug was causing Live Preview to fail, nevermore.
* Fixed loading based on URL structure that caused wp_remote errors and local paths not being recognised
* Removed redundant dependency on filesystem path slashes
* PHP now fades surrounding HTML

= 1.1.1 =
* Plugin version information is updated automatically

= 1.1.0 =
* Recommended upgrade for everyone running 1.0.3.
* Fixes a bug that causes code become unhighlighted
* Attribute names can be given in any case in shortcodes  
* Fixes settings bug regarding copy constructor for locked settings
* Minor bug fixes and cleanups

= 1.0.3 =
* Added highlight="false" attribute to temporarily disable highlighting.
* Fixed default color of font for twilight font.

= 1.0.2 =
* Minor bug fixes.

= 1.0.1 =
* Fixed a bug that caused Themes not to load for some Crayons due to Wordpress content formatting.

= 1.0.0 =
* Initial Release. Huzzah!

== Upgrade Notice ==

Make sure to upgrade to the latest release when possible, I usually fix bugs on the day and add new features quickly. 

== Donations ==

Thanks to all those who donate to my project!

Nick Weisser (http://www.openstream.ch/), Switzerland
Perry Bonewell (http://pointatthemoon.co.uk/), United Kingdom
