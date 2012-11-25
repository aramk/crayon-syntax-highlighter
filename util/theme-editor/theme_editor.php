<?php

class CrayonThemeEditorWP {

	public static function init() {
		self::admin_resources();
	}
	
	public static function admin_resources() {
		global $CRAYON_VERSION;
		$settings = array(
			// Only things the theme editor needs
		);
		wp_enqueue_script('cssjson_js', plugins_url(CRAYON_CSSJSON_JS, dirname(dirname(__FILE__))), $CRAYON_VERSION);
		wp_enqueue_script('jquery_ui_js', plugins_url(CRAYON_JS_JQUERY_UI, dirname(dirname(__FILE__))), array('jquery'), $CRAYON_VERSION);
		wp_enqueue_script('crayon_theme_editor', plugins_url(CRAYON_THEME_EDITOR_JS, dirname(dirname(__FILE__))), array('jquery', 'jquery_ui_js', 'crayon_util_js', 'cssjson_js'), $CRAYON_VERSION);
		wp_localize_script('crayon_theme_editor', 'CrayonThemeEditorSettings', $settings);
		
		wp_enqueue_style('jquery_ui', plugins_url(CRAYON_CSS_JQUERY_UI, dirname(dirname(__FILE__))), array(), $CRAYON_VERSION);
	}

}

if (defined('ABSPATH') && is_admin()) {
	add_action('init', 'CrayonThemeEditorWP::init');
}

?>
