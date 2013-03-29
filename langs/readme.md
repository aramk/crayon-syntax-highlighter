# Crayon Language Files

By Aram Kocharyan, <http://aramk.com/>

## Known Elements

These are known, recognised and highlighted by Crayon. You can defined others, but if you want to highlight them, you must add your custom CSS class into a Theme file. The CSS classes are in square brackets, but have a "crayon-" prefix added to them to avoid conflicts.

* `COMMENT [c]`
* `STRING [s]`
* `PREPROCESSOR [p]`
* `TAG [ta]`
* `KEYWORD [k]`
    * `STATEMENT [st]`
    * `RESERVED [r]`
    * `TYPE [t]`
    * `MODIFIER [m]`
* `IDENTIFIER [i]`
    * `ENTITY [e]`
    * `VARIABLE [v]`
* `CONSTANT [cn]`
* `OPERATOR [o]`
* `SYMBOL [sy]`
* `NOTATION [n]`
* `FADED [f]`
* `HTML_CHAR [h]`

## Rules

### Global

* Whitespace must be used to separate element names, css classes and regex
* Must be defined on a single line

### Elements

* Defined as `ELEMENT_NAME [css] REGEX` on a single line, in that order only
* Names cannot contain whitespace (must match `[-_a-zA-Z]+[-_a-zA-Z0-9]*`).
* When defining an unknown element, you can specify a fallback with a colon:
    * e.g. `MAGIC_WORD:KEYWORD [mg] \bmagic|words|here\b`
    * If the Theme doesn't support the '.mg' class, it will still highlight using the `KEYWORD` class from the Known Elements section.
    * Add support for the '.mg' class by adding it at the bottom of the Theme CSS file, after the fallback
* If duplicate exists, it replaces previous

### CSS

* CSS classes are defined in [square brackets], they are optional.
* No need to use '.' in class name. All characters are converted to lowercase and dots removed.
* If you use a space, then two classes are applied to the element matches e.g. [first second]
* If not specified, either default is used (if element is known), or element name is used
* Class can be applied to multiple elements
* Class should be valid: `[-_a-zA-Z]+[-_a-zA-Z0-9]*`
* If class is invalid, element is still parsed, error reported

### Regex

* Written as per normal, without delimiters or escaping
* Applied in the order they appear in the file. If language has reserved keywords, these should be higher than variables
* Whitespace around regex is ignored - only first character to last forms regex
* If single space is intended, use \s to avoid conflict with whitespace used for separation e.g. `TEST [t] \s\s\shello`

### Comments

* can be added to this file using `#`, `//` or `/* */`
* `//`, `#` and `/*` must be the first non-whitespace characters on that line
* The `*/` must be on a line by itself

## Special Functions 

* Written inside regex, replaced by their outputs when regex is parsed.

### (?alt:file.txt)

* Import lines from a file and separate with alternation. e.g. `catdog|dog|cat`
* File should list words from longest to shortest to avoid clashes

### (?default) or (?default:element_name)

* Substitute regex with Default language's regex for that element, or a specific element given after a colon.

### (?html:somechars)

* Convert somechars to html entities. e.g. `(?html:<>"'&)` becomes `&lt;&gt;&quot;&amp;`.

## Aliases

The `aliases.txt` contains aliases in the following structure. They are case insensitive:

	Format: id alias1 alias2 ...
	Example: c# cs csharp

Specifying the alias will use the original language, though it's recommended to use the original if manually specifying the language to reduce confusion and length.

## Extensions

Crayon can autodetect a language when highlighting local or remote files with extensions. The `extensions.txt` file uses the following format:

	Format: ID EXTENSION1 EXTENSION2 ...
	Example: python py pyw pyc pyo pyd

## Delimiters

Certain languages have tags which separate content in that language with that of another. An example is PHP's `<?php ?>` tags and the `<script>` and `<style>` tags in XHTML and CSS. The `delimiters.txt` file contains regex to capture delimiters that allow code with  mixed highlighting. The format of these is:

	Format: id REGEX1 REGEX2 ...
	Example: php <\?(?:php)?.*?\?\>
