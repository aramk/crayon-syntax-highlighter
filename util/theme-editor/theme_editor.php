<?php

class CrayonThemeEditorWP {

	public static function init() {
		self::admin_scripts();
	}
	
	public static function admin_scripts() {
		global $CRAYON_VERSION;
		$settings = array(
			// Only things the theme editor needs
		);
		wp_enqueue_script('cssjson_js', plugins_url(CRAYON_CSSJSON_JS, dirname(dirname(__FILE__))), $CRAYON_VERSION);
		wp_enqueue_script('crayon_theme_editor', plugins_url(CRAYON_THEME_EDITOR_JS, dirname(dirname(__FILE__))), array('jquery', 'jquery-ui', 'crayon_util_js', 'cssjson_js'), $CRAYON_VERSION);
		wp_localize_script('crayon_theme_editor', 'CrayonThemeEditorSettings', $settings);
	}

}

if (defined('ABSPATH')) {
	add_action('init', 'CrayonThemeEditorWP::init');
}

?>
