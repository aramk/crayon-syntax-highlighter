<?php

require_once (CRAYON_ROOT_PATH . 'crayon_settings_wp.class.php');

class CrayonTagEditorWP {

	public static $settings = null;

	public static function init() {
		// Hooks
		if (CRAYON_TAG_EDITOR) {
			self::addbuttons();
			CrayonSettingsWP::load_settings(TRUE);
			if (is_admin()) {
				// XXX Only runs in wp-admin
				add_action('admin_print_scripts-post-new.php', 'CrayonTagEditorWP::enqueue_resources');
				add_action('admin_print_scripts-post.php', 'CrayonTagEditorWP::enqueue_resources');
				add_filter('tiny_mce_before_init', 'CrayonTagEditorWP::init_tinymce');
				// Must come after
				add_action("admin_print_scripts-post-new.php", 'CrayonSettingsWP::init_js_settings');
				add_action("admin_print_scripts-post.php", 'CrayonSettingsWP::init_js_settings');
			} else if ( CrayonGlobalSettings::val(CrayonSettings::TAG_EDITOR_FRONT) ) {
				// XXX This will always need to enqueue, but only runs on front end
				add_action('wp', 'CrayonTagEditorWP::enqueue_resources');
				add_filter('tiny_mce_before_init', 'CrayonTagEditorWP::init_tinymce');
				// Must come after
				add_action("wp", 'CrayonSettingsWP::init_js_settings');
			}
		}
	}

	public static function init_settings() {

		if (!self::$settings) {
			// Add settings
			self::$settings = array(
					'url' => plugins_url(CRAYON_TE_CONTENT_PHP, __FILE__),
					'home_url' => home_url(),
					'css' => 'crayon-te',
					'used' => CrayonGlobalSettings::val(CrayonSettings::TINYMCE_USED),
					'used_setting' => CrayonSettings::TINYMCE_USED,
					'ajax_url' => plugins_url(CRAYON_AJAX_PHP, dirname(dirname(__FILE__))),
					'css_selected' => 'crayon-selected',
					'code_css' => '#crayon-code',
					'url_css' => '#crayon-url',
					'url_info_css' => '#crayon-te-url-info',
					'lang_css' => '#crayon-lang',
					'title_css' => '#crayon-title',
					'mark_css' => '#crayon-mark',
					'range_css' => '#crayon-range',
					'inline_css' => 'crayon-inline',
					'inline_hide_css' => 'crayon-hide-inline',
					'inline_hide_only_css' => 'crayon-hide-inline-only',
					'hl_css' => '#crayon-highlight',
					'switch_html' => '#content-html',
					'switch_tmce' => '#content-tmce',
					'tinymce_button' => 'a.mce_crayon_tinymce',
					'submit_css' => '#crayon-te-ok',
					'cancel_css' => '#crayon-te-cancel',
					'content_css' => '#crayon-te-content',
					'dialog_title_css' => '#crayon-te-title',
					'submit_wrapper_css' => '#crayon-te-submit-wrapper',
					'data_value' => 'data-value',
					'attr_sep' => CrayonGlobalSettings::val_str(CrayonSettings::ATTR_SEP),
					'css_sep' => '_',
					'fallback_lang' => CrayonGlobalSettings::val(CrayonSettings::FALLBACK_LANG),
					'dialog_title_add' => crayon__('Add Crayon Code'),
					'dialog_title_edit' => crayon__('Edit Crayon Code'),
					'submit_add' => crayon__('Add'),
					'submit_edit' => crayon__('Save'),
					'bar' => '#crayon-te-bar',
					'bar_content' => '#crayon-te-bar-content',
					'extensions' => CrayonResources::langs()->extensions_inverted()
			);
		}
	}

	public static function init_tinymce($init) {
		$init['extended_valid_elements'] .= ',pre[*],code[*],iframe[*]';
		return $init;
	}

	public static function addbuttons() {
		// Add only in Rich Editor mode
		//if ( get_user_option('rich_editing') == 'true') {
		add_filter('mce_external_plugins', 'CrayonTagEditorWP::add_plugin');
		add_filter('mce_buttons', 'CrayonTagEditorWP::register_buttons');
	}

	public static function enqueue_resources() {
		global $CRAYON_VERSION;
		self::init_settings();

		wp_enqueue_style('crayon_fancybox', plugins_url(CRAYON_CSS_FANCYBOX, dirname(dirname(__FILE__))), array(), $CRAYON_VERSION);
		wp_enqueue_script('crayon_fancybox', plugins_url(CRAYON_JS_FANCYBOX, dirname(dirname(__FILE__))), array('jquery'), $CRAYON_VERSION);

		wp_enqueue_script('crayon_util_js', plugins_url(CRAYON_JS_UTIL, dirname(dirname(__FILE__))), array('jquery'), $CRAYON_VERSION);
		wp_enqueue_script('crayon_admin_js', plugins_url(CRAYON_JS_ADMIN, dirname(dirname(__FILE__))), array('jquery', 'crayon_util_js'), $CRAYON_VERSION);
		wp_enqueue_script('crayon_te_js', plugins_url(CRAYON_TE_JS, __FILE__), array('crayon_admin_js', 'thickbox', 'crayon_fancybox'), $CRAYON_VERSION);
		wp_enqueue_script('crayon_qt_js', plugins_url(CRAYON_QUICKTAGS_JS, __FILE__), array('quicktags','crayon_te_js'), $CRAYON_VERSION, TRUE);
		wp_localize_script('crayon_te_js', 'CrayonTagEditorSettings', self::$settings);
	}

	public static function register_buttons($buttons) {
		array_push($buttons, 'separator', 'crayon_tinymce');
		return $buttons;
	}

	// Load the TinyMCE plugin : editor_plugin.js (wp2.5)
	public static function add_plugin($plugin_array) {
		$plugin_array['crayon_tinymce'] = plugins_url(CRAYON_TINYMCE_JS, __FILE__);
		return $plugin_array;
	}

}

if (defined('ABSPATH') /*&& is_admin()*/) {
	add_action('init', 'CrayonTagEditorWP::init');
}

?>