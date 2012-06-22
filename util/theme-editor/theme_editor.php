<?php

$crayon_root_theme = dirname(dirname(dirname(__FILE__))) . '/';
require_once $crayon_root_theme . 'global.php';

class CrayonThemeEditorWP {
	
// 	public static function init() {
// 		self::admin_scripts();
// 	}

	public static function admin_scripts() {
		
		$themes_ = CrayonResources::themes()->get();
		$themes = array();
		
		foreach ($themes_ as $theme) {
			$themes[$theme->id()] = $theme->name();
		}
		
		$settings = array('themes' => $themes);
		wp_localize_script('crayon_theme_editor', 'CrayonThemeEditorSettings', $settings);
	}

}

// if (defined('ABSPATH') && is_admin()) {
// 	add_action('init', 'CrayonThemeEditorWP::init');
// }

?>
