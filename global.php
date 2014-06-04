<?php

// Switches
define('CRAYON_DEBUG', FALSE);

define('CRAYON_TAG_EDITOR', TRUE);
define('CRAYON_THEME_EDITOR', TRUE);

define('CRAYON_MINIFY', TRUE);

// Constants

// General definitions
define('CRAYON_DOMAIN', 'crayon-syntax-highlighter');

// These are overridden by functions since v1.1.1
$CRAYON_VERSION = '1.1.1';
$CRAYON_DATE = '27th September, 2011';
$CRAYON_AUTHOR = 'Aram Kocharyan';
$CRAYON_AUTHOR_SITE = 'http://aramk.com';
$CRAYON_DONATE = 'http://bit.ly/crayondonate';
$CRAYON_WEBSITE = 'https://github.com/aramk/crayon-syntax-highlighter';
$CRAYON_EMAIL = 'crayon.syntax@gmail.com';
$CRAYON_TWITTER = 'http://twitter.com/crayonsyntax';
$CRAYON_GIT = 'http://github.com/aramk/crayon-syntax-highlighter';
$CRAYON_PLUGIN_WP = 'http://wordpress.org/extend/plugins/crayon-syntax-highlighter';

// XXX Used to name the class

define('CRAYON_HIGHLIGHTER', 'CrayonHighlighter');
define('CRAYON_ELEMENT_CLASS', 'CrayonElement');
define('CRAYON_SETTING_CLASS', 'CrayonSetting');

// Directories

define('CRAYON_DIR', crayon_pf(basename(dirname(__FILE__))));
define('CRAYON_LANG_DIR', crayon_s('langs'));
define('CRAYON_THEME_DIR', crayon_s('themes'));
define('CRAYON_FONT_DIR', crayon_s('fonts'));
define('CRAYON_UTIL_DIR', crayon_s('util'));
define('CRAYON_CSS_DIR', crayon_s('css'));
define('CRAYON_CSS_SRC_DIR', CRAYON_CSS_DIR . crayon_s('src'));
define('CRAYON_CSS_MIN_DIR', CRAYON_CSS_DIR . crayon_s('min'));
define('CRAYON_JS_DIR', crayon_s('js'));
define('CRAYON_JS_SRC_DIR', CRAYON_JS_DIR . crayon_s('src'));
define('CRAYON_JS_MIN_DIR', CRAYON_JS_DIR . crayon_s('min'));
define('CRAYON_TRANS_DIR', crayon_s('trans'));
define('CRAYON_THEME_EDITOR_DIR', crayon_s('theme-editor'));
define('CRAYON_TAG_EDITOR_DIR', crayon_s('tag-editor'));

// Paths

define('CRAYON_ROOT_PATH', crayon_pf(dirname(__FILE__)));
define('CRAYON_LANG_PATH', CRAYON_ROOT_PATH . CRAYON_LANG_DIR);
define('CRAYON_THEME_PATH', CRAYON_ROOT_PATH . CRAYON_THEME_DIR);
define('CRAYON_FONT_PATH', CRAYON_ROOT_PATH . CRAYON_FONT_DIR);
define('CRAYON_UTIL_PATH', CRAYON_ROOT_PATH . CRAYON_UTIL_DIR);
define('CRAYON_TAG_EDITOR_PATH', CRAYON_ROOT_PATH . CRAYON_UTIL_DIR . CRAYON_TAG_EDITOR_DIR);
define('CRAYON_THEME_EDITOR_PATH', CRAYON_ROOT_PATH . CRAYON_UTIL_DIR . CRAYON_THEME_EDITOR_DIR);

// Files

define('CRAYON_LOG_FILE', CRAYON_ROOT_PATH . 'log.txt');
define('CRAYON_TOUCH_FILE', CRAYON_UTIL_PATH . 'touch.txt');
define('CRAYON_LOG_MAX_SIZE', 50000); // Bytes

define('CRAYON_README_FILE', CRAYON_ROOT_PATH . 'readme.txt');
define('CRAYON_LANG_EXT', CRAYON_LANG_PATH . 'extensions.txt');
define('CRAYON_LANG_ALIAS', CRAYON_LANG_PATH . 'aliases.txt');
define('CRAYON_LANG_DELIM', CRAYON_LANG_PATH . 'delimiters.txt');
define('CRAYON_HELP_FILE', CRAYON_UTIL_PATH . 'help.htm');

// Minified
define('CRAYON_JS_MIN', CRAYON_JS_MIN_DIR . 'crayon.min.js');
define('CRAYON_JS_TE_MIN', CRAYON_JS_MIN_DIR . 'crayon.te.min.js');

// Source
define('CRAYON_JQUERY_POPUP', CRAYON_JS_SRC_DIR . 'jquery.popup.js');
define('CRAYON_JS', CRAYON_JS_SRC_DIR . 'crayon.js');
define('CRAYON_JS_ADMIN', CRAYON_JS_SRC_DIR . 'crayon_admin.js');
define('CRAYON_JS_UTIL', CRAYON_JS_SRC_DIR . 'util.js');
define('CRAYON_CSSJSON_JS', CRAYON_JS_SRC_DIR . 'cssjson.js');

define('CRAYON_CSS_JQUERY_COLORPICKER', CRAYON_JS_DIR . 'jquery-colorpicker/jquery.colorpicker.css');
define('CRAYON_JS_JQUERY_COLORPICKER', CRAYON_JS_DIR . 'jquery-colorpicker/jquery.colorpicker.js');
define('CRAYON_JS_TINYCOLOR', CRAYON_JS_DIR . 'tinycolor-min.js');
define('CRAYON_TAG_EDITOR_JS', 'crayon_tag_editor.js');
define('CRAYON_COLORBOX_JS', 'colorbox/jquery.colorbox-min.js');
define('CRAYON_COLORBOX_CSS', 'colorbox/colorbox.css');
define('CRAYON_TAG_EDITOR_PHP', CRAYON_TAG_EDITOR_PATH . 'crayon_tag_editor_wp.class.php');
define('CRAYON_TINYMCE_JS', 'crayon_tinymce.js');
define('CRAYON_QUICKTAGS_JS', 'crayon_qt.js');
define('CRAYON_STYLE', CRAYON_CSS_SRC_DIR . 'crayon_style.css');
define('CRAYON_STYLE_ADMIN', CRAYON_CSS_SRC_DIR . 'admin_style.css');
define('CRAYON_STYLE_GLOBAL', CRAYON_CSS_SRC_DIR . 'global_style.css');
define('CRAYON_STYLE_MIN', CRAYON_CSS_MIN_DIR . 'crayon.min.css');
define('CRAYON_LOGO', CRAYON_CSS_DIR . 'images/crayon_logo.png');
define('CRAYON_DONATE_BUTTON', CRAYON_CSS_DIR . 'images/donate.png');
define('CRAYON_THEME_EDITOR_PHP', CRAYON_THEME_EDITOR_PATH . 'theme_editor.php');
define('CRAYON_THEME_EDITOR_JS', CRAYON_UTIL_DIR . CRAYON_THEME_EDITOR_DIR . 'theme_editor.js');
define('CRAYON_THEME_EDITOR_STYLE', CRAYON_UTIL_DIR . CRAYON_THEME_EDITOR_DIR . 'theme_editor.css');
define('CRAYON_THEME_EDITOR_BUTTON', CRAYON_CSS_DIR . 'images/theme_editor.png');

// PHP Files
define('CRAYON_FORMATTER_PHP', CRAYON_ROOT_PATH . 'crayon_formatter.class.php');
define('CRAYON_HIGHLIGHTER_PHP', CRAYON_ROOT_PATH . 'crayon_highlighter.class.php');
define('CRAYON_LANGS_PHP', CRAYON_ROOT_PATH . 'crayon_langs.class.php');
define('CRAYON_PARSER_PHP', CRAYON_ROOT_PATH . 'crayon_parser.class.php');
define('CRAYON_SETTINGS_PHP', CRAYON_ROOT_PATH . 'crayon_settings.class.php');
define('CRAYON_THEMES_PHP', CRAYON_ROOT_PATH . 'crayon_themes.class.php');
define('CRAYON_FONTS_PHP', CRAYON_ROOT_PATH . 'crayon_fonts.class.php');
define('CRAYON_RESOURCE_PHP', CRAYON_ROOT_PATH . 'crayon_resource.class.php');
define('CRAYON_UTIL_PHP', CRAYON_UTIL_DIR . 'crayon_util.class.php');
define('CRAYON_EXCEPTIONS_PHP', CRAYON_UTIL_DIR . 'exceptions.php');
define('CRAYON_TIMER_PHP', CRAYON_UTIL_DIR . 'crayon_timer.class.php');
define('CRAYON_LOG_PHP', CRAYON_UTIL_DIR . 'crayon_log.class.php');

// Script time

define('CRAYON_LOAD_TIME', 'Load Time');
//define('CRAYON_PARSE_TIME', 'Parse Time');
define('CRAYON_FORMAT_TIME', 'Format Time');

// Printing

define('CRAYON_BR', "<br />");
define('CRAYON_NL', "\r\n");
define('CRAYON_BL', CRAYON_BR . CRAYON_NL);
define('CRAYON_DASH', "==============================================================================");
define('CRAYON_LINE', "------------------------------------------------------------------------------");

// Load utilities

require_once (CRAYON_UTIL_PHP);
require_once (CRAYON_TIMER_PHP);
require_once (CRAYON_LOG_PHP);

// Turn on the error & exception handlers
//crayon_handler_on();

// GLOBAL FUNCTIONS

// Check for forwardslash/backslash in folder path to structure paths
function crayon_s($url = '') {
    $url = strval($url);
    if (!empty($url) && !preg_match('#(\\\\|/)$#', $url)) {
        return $url . '/';
    } else if (empty($url)) {
        return '/';
    } else {
        return $url;
    }
}

// Returns path using forward slashes, slash added at the end
function crayon_pf($url, $slash = TRUE) {
    $url = trim(strval($url));
    if ($slash) {
        $url = crayon_s($url);
    }
    return str_replace('\\', '/', $url);
}

// Returns path using back slashes
function crayon_pb($url) {
    return str_replace('/', '\\', crayon_s(trim(strval($url))));
}

// Get/Set plugin information
function crayon_set_info($info_array) {
    global $CRAYON_VERSION, $CRAYON_DATE, $CRAYON_AUTHOR, $CRAYON_WEBSITE;
    if (!is_array($info_array)) {
        return;
    }
    crayon_set_info_key('Version', $info_array, $CRAYON_VERSION);
    if (($date = @filemtime(CRAYON_README_FILE)) !== FALSE) {
        $CRAYON_DATE = date("jS F, Y", $date);
    }
    crayon_set_info_key('AuthorName', $info_array, $CRAYON_A);
    crayon_set_info_key('PluginURI', $info_array, $CRAYON_WEBSITE);
}

function crayon_set_info_key($key, $array, &$info) {
    if (array_key_exists($key, $array)) {
        $info = $array[$key];
    } else {
        return FALSE;
    }
}

function crayon_vargs(&$var, $default) {
    $var = isset($var) ? $var : $default;
}

// Checks if the input is a valid PHP file and matches the $valid filename
function crayon_is_php_file($filepath, $valid) {
    $path = pathinfo(crayon_pf($filepath));
    return is_file($filepath) && $path['extension'] === 'php' && $path['filename'] === $valid;
}

// Stops the script if crayon_is_php_file() returns false or a remote path is given
function crayon_die_if_not_php($filepath, $valid) {
    if (!crayon_is_php_file($filepath, $valid) || crayon_is_path_url($filepath)) {
        die("[ERROR] '$filepath' is not a valid PHP file for '$valid'");
    }
}

function crayon_is_path_url($path) {
    $parts = parse_url($path);
    return isset($parts['scheme']) && strlen($parts['scheme']) > 1;
}

// LANGUAGE TRANSLATION FUNCTIONS

function crayon_load_plugin_textdomain() {
    if (function_exists('load_plugin_textdomain')) {
        load_plugin_textdomain(CRAYON_DOMAIN, false, CRAYON_DIR . CRAYON_TRANS_DIR);
    }
}

function crayon__($text) {
    if (function_exists('__')) {
        return __($text, CRAYON_DOMAIN);
    } else {
        return $text;
    }
}

function crayon_e($text) {
    if (function_exists('_e')) {
        _e($text, CRAYON_DOMAIN);
    } else {
        echo $text;
    }
}

function crayon_n($singular, $plural, $count) {
    if (function_exists('_n')) {
        return _n($singular, $plural, $count, CRAYON_DOMAIN);
    } else {
        return $count > 1 ? $plural : $singular;
    }
}

function crayon_x($text, $context) {
    if (function_exists('_x')) {
        return _x($text, $context, CRAYON_DOMAIN);
    } else {
        return $text;
    }
}

?>