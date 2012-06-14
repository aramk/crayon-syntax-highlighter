<?php

// Used to send requests to db from jQuery

require_once(dirname(dirname(__FILE__)) . '/crayon_wp.class.php');
require_once(CrayonSettingsWP::wp_load_path());

CrayonSettingsWP::load_settings(true);
//echo json_encode(CrayonGlobalSettings::get());

$allowed = array(CrayonSettings::HIDE_HELP, CrayonSettings::TINYMCE_USED);

//var_dump($_GET);

foreach ($allowed as $allow) {
	if ( array_key_exists($allow, $_GET) ) {
		CrayonGlobalSettings::set($allow, $_GET[$allow]);
		CrayonSettingsWP::save_settings();
	}	
}

?>