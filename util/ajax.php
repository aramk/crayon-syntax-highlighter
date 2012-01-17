<?php

// Used to send requests to db from jQuery

require_once(dirname(dirname(__FILE__)) . '/crayon_wp.class.php');
require_once(CrayonSettingsWP::wp_load_path());

CrayonSettingsWP::load_settings(true);

if ( array_key_exists(CrayonSettings::HIDE_HELP, $_GET) && $_GET[CrayonSettings::HIDE_HELP] ) {
	CrayonGlobalSettings::set(CrayonSettings::HIDE_HELP, TRUE);
	CrayonSettingsWP::save_settings();
}

?>