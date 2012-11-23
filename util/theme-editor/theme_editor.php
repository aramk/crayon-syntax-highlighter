<?php

class CrayonThemeEditorWP {

	public static function init() {
		self::admin_scripts();
	}
	
	public static function admin_scripts() {
		global $CRAYON_VERSION;
		$themes_ = CrayonResources::themes()->get();
		$themes = array();

		foreach ($themes_ as $theme) {
			$themes[$theme->id()] = $theme->name();
		}

		$settings = array(
				'themes' => $themes,
				'themes_url' => plugins_url(CRAYON_THEME_DIR, dirname(dirname(__FILE__)))
		);
		wp_enqueue_script('cssjson_js', plugins_url(CRAYON_CSSJSON_JS, dirname(dirname(__FILE__))), $CRAYON_VERSION);
		wp_enqueue_script('crayon_theme_editor', plugins_url(CRAYON_THEME_EDITOR_JS, dirname(dirname(__FILE__))), array('jquery', 'crayon_util_js', 'cssjson_js'), $CRAYON_VERSION);
		wp_localize_script('crayon_theme_editor', 'CrayonThemeEditorSettings', $settings);
	}

}

if (defined('ABSPATH')) {
	add_action('init', 'CrayonThemeEditorWP::init');
}

?>
