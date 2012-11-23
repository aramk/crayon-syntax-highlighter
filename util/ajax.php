<?php

// Depreciated since 1.14

// Used to send requests to db from jQuery

require_once('../crayon_wp.class.php');

CrayonSettingsWP::load_settings(true);

$allowed = array(CrayonSettings::HIDE_HELP);

foreach ($allowed as $allow) {
	if ( array_key_exists($allow, $_GET) ) {
		CrayonGlobalSettings::set($allow, $_GET[$allow]);
		CrayonSettingsWP::save_settings();
	}
}

?>
