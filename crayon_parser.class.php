<?php
require_once ('global.php');
require_once (CRAYON_LANGS_PHP);

/*	Manages parsing the syntax for any given language, constructing the regex, and validating the
	elements. */
class CrayonParser {
	// Properties and Constants ===============================================
	const CASE_INSENSITIVE = 'CASE_INSENSITIVE';
	const MULTI_LINE = 'MULTI_LINE';
	const SINGLE_LINE = 'SINGLE_LINE';
	const ALLOW_MIXED = 'ALLOW_MIXED';
	//const NO_END_TAG = '(?![^<]*>)'; // No longer used
	const HTML_CHAR = 'HTML_CHAR';
	const HTML_CHAR_REGEX = '<|>|(&([\w-]+);?)|[ \t]+';
	const CRAYON_ELEMENT = 'CRAYON_ELEMENT';
	const CRAYON_ELEMENT_REGEX = '\{\{crayon-internal:[^\}]*\}\}';
	const CRAYON_ELEMENT_REGEX_CAPTURE = '\{\{crayon-internal:([^\}]*)\}\}';

	private static $modes = array(self::CASE_INSENSITIVE => TRUE, self::MULTI_LINE => TRUE, self::SINGLE_LINE => TRUE, self::ALLOW_MIXED => TRUE);

	// Methods ================================================================
	private function __construct() {}

	/**
	 * Parse all languages stored in CrayonLangs.
	 * Avoid using this unless you must list the details in language files for all languages.
	 * @return array Array of all loaded CrayonLangs.
	 */
	public static function parse_all() {
		$langs = CrayonResources::langs()->get();
		if (empty($langs)) {
			return FALSE;
		}
		foreach ($langs as $lang) {
			self::parse($lang->id());
		}
		return $langs;
	}

	/*	Read a syntax file and parse the regex rules within it, this may require several other
		files containing lists of keywords and such to be read. Updates the parsed elements and
		regex in the CrayonLang with the given $id. */
	public static function parse($id) {
		// Verify the language is loaded and has not been parsed before
		if ( !($lang = CrayonResources::langs()->get($id)) ) {
			CrayonLog::syslog("The language with id '$id' was not loaded and could not be parsed.");
			return FALSE;
		} else if ($lang->is_parsed()) {
			return;
		}
		// Read language file
		$path = CrayonResources::langs()->path($id);
        CrayonLog::debug('Parsing language ' . $path);
		if ( ($file = CrayonUtil::lines($path, 'wcs')) === FALSE ) {
            CrayonLog::debug('Parsing failed ' . $path);
			return FALSE;
		}

		// Extract the language name
		$name_pattern = '#^[ \t]*name[ \t]+([^\r\n]+)[ \t]*#mi';
		preg_match($name_pattern, $file, $name);
		if (count($name) > 1) {
			$name = $name[1];
			$lang->name($name);
			$file = preg_replace($name_pattern, '', $file);
		} else {
			$name = $lang->id();
		}

		// Extract the language version
		$version_pattern = '#^[ \t]*version[ \t]+([^\r\n]+)[ \t]*#mi';
		preg_match($version_pattern, $file, $version);
		if (count($version) > 1) {
			$version = $version[1];
			$lang->version($version);
			$file = preg_replace($version_pattern, '', $file);
		}

		// Extract the modes
		$mode_pattern = '#^[ \t]*(' . implode('|', array_keys(self::$modes)) . ')[ \t]+(?:=[ \t]*)?([^\r\n]+)[ \t]*#mi';
		preg_match_all($mode_pattern, $file, $mode_matches);
		if (count($mode_matches) == 3) {
			for ($i = 0; $i < count($mode_matches[0]); $i++) {
				$lang->mode($mode_matches[1][$i], $mode_matches[2][$i]);
			}
			$file = preg_replace($mode_pattern, '', $file);
		}

		/* Add reserved Crayon element. This is used by Crayon internally. */
		$crayon_element = new CrayonElement(self::CRAYON_ELEMENT, $path, self::CRAYON_ELEMENT_REGEX);
		$lang->element(self::CRAYON_ELEMENT, $crayon_element);

		// Extract elements, classes and regex
		$pattern = '#^[ \t]*([\w:]+)[ \t]+(?:\[([\w\t ]*)\][ \t]+)?([^\r\n]+)[ \t]*#m';
		preg_match_all($pattern, $file, $matches);

		if (!empty($matches[0])) {
			$elements = $matches[1];
			$classes = $matches[2];
			$regexes = $matches[3];
		} else {
			CrayonLog::syslog("No regex patterns and/or elements were parsed from language file at '$path'.");
		}

		// Remember state in case we encounter catchable exceptions
		$error = FALSE;
		for ($i = 0; $i < count($matches[0]); $i++) {
			// References
			$name = &$elements[$i];
			$class = &$classes[$i];
			$regex = &$regexes[$i];
			$name = trim(strtoupper($name));
			// Ensure both the element and regex are valid
			if (empty($name) || empty($regex)) {
				CrayonLog::syslog("Element(s) and/or regex(es) are missing in '$path'.");
				$error = TRUE;
				continue;
			}
			// Look for fallback element
			$pieces = explode(':', $name);
			if (count($pieces) == 2) {
				$name = $pieces[0];
				$fallback = $pieces[1];
			} else if (count($pieces) == 1) {
				$name = $pieces[0];
				$fallback = '';
			} else {
				CrayonLog::syslog("Too many colons found in element name '$name' in '$path'");
				$error = TRUE;
				continue;
			}
			// Create a new CrayonElement
			$element = new CrayonElement($name, $path);
			$element->fallback($fallback);
			if (!empty($class)) {
				// Avoid setting known css to blank
				$element->css($class);
			}
			if ($element->regex($regex) === FALSE) {
				$error = TRUE;
				continue;
			}
			// Add the regex to the element
			$lang->element($name, $element);
			$state = $error ? CrayonLang::PARSED_ERRORS : CrayonLang::PARSED_SUCCESS;
			$lang->state($state);
		}

		/* Prevents < > and other html entities from being printed as is, which could lead to actual html tags
		 * from the printed code appearing on the page - not good. This can also act to color any HTML entities
		 * that are not picked up by previously defined elements.
		 */
		$html = new CrayonElement(self::HTML_CHAR, $path, self::HTML_CHAR_REGEX);
		$lang->element(self::HTML_CHAR, $html);
	}

	// Validates regex and accesses data stored in a CrayonElement
	public static function validate_regex($regex, $element) {
		if (is_string($regex) && @get_class($element) == CRAYON_ELEMENT_CLASS) {
			// If the (?alt) tag has been used, insert the file into the regex
			$file = self::regex_match('#\(\?alt:(.+?)\)#', $regex);
			if ( count($file) == 2 ) {
				// Element 0 has full match, 1 has captured groups
				for ($i = 0; $i < count($file[1]); $i++) {
					$file_lines = CrayonUtil::lines(dirname($element->path()) . crayon_s() . $file[1][$i], 'rcwh');
					if ($file_lines !== FALSE) {
						$file_lines = implode('|', $file_lines);
						// If any spaces exist, treat them as whitespace
						$file_lines = preg_replace('#[ \t]+#msi', '\s+', $file_lines);
						$regex = str_replace($file[0][$i], "(?:$file_lines)", $regex);
					} else {
						CrayonLog::syslog("Parsing of '{$element->path()}' failed, an (?alt) tag failed for the element '{$element->name()}'" );
						return FALSE;
					}
				}
			}

			// If the (?default:element) function is used, replace the regex with the default, if exists
			$def = self::regex_match('#\(\?default(?:\:(\w+))?\)#', $regex);
			if ( count($def) == 2 ) {
				// Load default language
				$default = CrayonResources::langs()->get(CrayonLangs::DEFAULT_LANG);
				// If default has not been loaded, we can't use it, skip the element
				if (!$default) {
					CrayonLog::syslog(
							"Could not use default regex in the element '{$element->name()}' in '{$element->path()}'");
					return FALSE;
				}
				for ($i = 0; $i < count($def[1]); $i++) {
					// If an element has been provided
					$element_name = ( !empty($def[1][$i]) ) ? $def[1][$i] : $element->name();
					if (($default_element = $default->element($element_name)) != FALSE) {
						$regex = str_replace($def[0][$i], '(?:' . $default_element->regex() .')', $regex);
					} else {
						CrayonLog::syslog("The language at '{$element->path()}' referred to the Default Language regex for element '{$element->name()}', which did not exist.");
                        if (CRAYON_DEBUG) {
                            CrayonLog::syslog("Default language URL: " . CrayonResources::langs()->url(CrayonLangs::DEFAULT_LANG));
                            CrayonLog::syslog("Default language Path: " . CrayonResources::langs()->path(CrayonLangs::DEFAULT_LANG));
                        }
						return FALSE;
					}
				}
			}

			// If the (?html) tag is used, escape characters in html (<, > and &)
			$html = self::regex_match('#\(\?html:(.+?)\)#', $regex);
			if ( count($html) == 2 ) {
				for ($i = 0; $i < count($html[1]); $i++) {
					$regex = str_replace($html[0][$i], htmlentities($html[1][$i]), $regex);
				}
			}

			// Ensure all parenthesis are atomic to avoid conflicting with element matches
			$regex = CrayonUtil::esc_atomic($regex);

			// Escape #, this is our delimiter
			$regex = CrayonUtil::esc_hash($regex);

			// Test if regex is valid
			if (@preg_match("#$regex#", '') === FALSE) {
				CrayonLog::syslog("The regex for the element '{$element->name()}' in '{$element->path()}' is not valid.");
				return FALSE;
			}

			return $regex;
		} else {
			return '';
		}
	}

	public static function validate_css($css) {
		if (is_string($css)) {
			// Remove dots in CSS class and convert to lowercase
			$css = str_replace('.', '', $css);
			$css = strtolower($css);
			$css = explode(' ', $css);
			$css_str = '';
			foreach ($css as $c) {
				if (!empty($c)) {
					$css_str .= $c . ' ';
				}
			}
			return trim($css_str);
		} else {
			return '';
		}
	}

	public static function regex_match($pattern, $subject) {
		if (preg_match_all($pattern, $subject, $matches)) {
			return $matches;
		}
		return array();
	}

	public static function modes() {
		return self::$modes;
	}

	public static function is_mode($name) {
		return is_string($name) && array_key_exists($name, self::$modes);
	}
}
?>