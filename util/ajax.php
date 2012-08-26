<?php

// Used to send requests to db from jQuery

require_once('../crayon_wp.class.php');
crayon_die_if_not_php($_GET['wp_load'], 'wp-load');
require_once($_GET['wp_load']);

CrayonSettingsWP::load_settings(true);

$allowed = array(CrayonSettings::HIDE_HELP, CrayonSettings::TINYMCE_USED);

foreach ($allowed as $allow) {
	if ( array_key_exists($allow, $_GET) ) {
		CrayonGlobalSettings::set($allow, $_GET[$allow]);
		CrayonSettingsWP::save_settings();
	}	
}

?>