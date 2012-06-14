<?php

require_once (dirname(dirname(__FILE__)) . '/crayon_wp.class.php');
require_once (CrayonWP::wp_load_path());

echo '<link rel="stylesheet" href="', plugins_url(CRAYON_STYLE, dirname(__FILE__)),
	'?ver=', $CRAYON_VERSION, '" type="text/css" media="all" />';
echo '<div id="content">';

CrayonSettingsWP::load_settings(); // Run first to ensure global settings loaded

$crayon = CrayonWP::instance();

// Settings to prevent from validating
$preview_settings = array();

// Load settings from GET and validate
foreach ($_GET as $key => $value) {
//	echo $key, ' ', $value , '<br/>';
	if (!in_array($key, $preview_settings)) {
		$_GET[$key] = CrayonSettings::validate($key, $value);
	}
}
$crayon->settings($_GET);
if (!isset($crayon_preview_dont_override_get) || !$crayon_preview_dont_override_get) {
	$settings = array(CrayonSettings::TOP_SET => TRUE, CrayonSettings::TOP_MARGIN => 10, 
			CrayonSettings::BOTTOM_SET => FALSE, CrayonSettings::BOTTOM_MARGIN => 0);
	$crayon->settings($settings);
}

// Print the theme CSS
$theme_id = $crayon->setting_val(CrayonSettings::THEME);
if ($theme_id != NULL) {
	echo CrayonResources::themes()->get_css($theme_id);
}

$font_id = $crayon->setting_val(CrayonSettings::FONT);
if ($font_id != NULL /*&& $font_id != CrayonFonts::DEFAULT_FONT*/) {
	echo CrayonResources::fonts()->get_css($font_id);
}

// Load custom code based on language
$lang = $crayon->setting_val(CrayonSettings::FALLBACK_LANG);
$path = crayon_pf( dirname(__FILE__) . '/sample/' . $lang . '.txt', FALSE );

if ($lang && @file_exists($path)) {
	$crayon->url($path);
} else {
	$code = "
// A sample class
class Human {
	private int age = 0;
	public void birthday() {
		age++;
		print('Happy Birthday!');
	}
}
";
	$crayon->code($code);
}
$crayon->title('Sample Code');
$crayon->marked('5-7');
$crayon->output($highlight = true, $nums = true, $print = true);
echo '</div>';
crayon_load_plugin_textdomain();

?>