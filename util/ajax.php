<?php

// Used to send requests to db from jQuery

require_once ($_GET['crayon_wp']);
require_once ($_GET['wp_load']);

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