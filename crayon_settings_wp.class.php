<?php
require_once ('global.php');
require_once (CRAYON_LANGS_PHP);
require_once (CRAYON_THEMES_PHP);
require_once (CRAYON_FONTS_PHP);
require_once (CRAYON_SETTINGS_PHP);

/*  Manages global settings within WP and integrates them with CrayonSettings.
 CrayonHighlighter and any non-WP classes will only use CrayonSettings to separate
 the implementation of global settings and ensure any system can use them. */
class CrayonSettingsWP {
	// Properties and Constants ===============================================

	// A copy of the current options in db
	private static $options = NULL;
	// Posts containing crayons in db
	private static $crayon_posts = NULL;
	// An array of cache names for use with Transients API
	private static $cache = NULL;
	// Array of settings to pass to js
	private static $js_settings = NULL;
	private static $admin_page = '';
	private static $is_fully_loaded = FALSE;
	
	const SETTINGS = 'crayon_fields';
	const FIELDS = 'crayon_settings';
	const OPTIONS = 'crayon_options';
	const POSTS = 'crayon_posts';
	const CACHE = 'crayon_cache';
	const GENERAL = 'crayon_general';
	const DEBUG = 'crayon_debug';
	const ABOUT = 'crayon_about';
	
	// Used on submit
	const LOG_CLEAR = 'log_clear';
	const LOG_EMAIL_ADMIN = 'log_email_admin';
	const LOG_EMAIL_DEV = 'log_email_dev';

	private function __construct() {}

	// Methods ================================================================

	public static function admin_load() {
		self::$admin_page = $admin_page = add_options_page('Crayon Syntax Highlighter '.crayon__('Settings'), 'Crayon', 'manage_options', 'crayon_settings', 'CrayonSettingsWP::settings');
		add_action("admin_print_scripts-$admin_page", 'CrayonSettingsWP::admin_scripts');
		add_action("admin_print_styles-$admin_page", 'CrayonSettingsWP::admin_styles');
		// Register settings, second argument is option name stored in db
		register_setting(self::FIELDS, self::OPTIONS, 'CrayonSettingsWP::settings_validate');
		add_action("admin_head-$admin_page", 'CrayonSettingsWP::admin_init');
		// Register settings for post page
		add_action("admin_print_styles-post-new.php", 'CrayonSettingsWP::admin_styles');
		add_action("admin_print_styles-post.php", 'CrayonSettingsWP::admin_styles');
				
		// TODO depreciated since WP 3.3, remove eventually
		global $wp_version;
		if ($wp_version >= '3.3') {
			add_action("load-$admin_page", 'CrayonSettingsWP::help_screen');
		} else {
			add_filter('contextual_help', 'CrayonSettingsWP::cont_help', 10, 3);
		}
	}
	
	public static function admin_styles() {
		global $CRAYON_VERSION;
		wp_enqueue_style('crayon_admin_style', plugins_url(CRAYON_STYLE_ADMIN, __FILE__), array(), $CRAYON_VERSION);
		wp_enqueue_style('crayon_theme_editor_style', plugins_url(CRAYON_THEME_EDITOR_STYLE, __FILE__), array(), $CRAYON_VERSION);
	}

	public static function admin_scripts() {
		global $CRAYON_VERSION;
		wp_enqueue_script('crayon_util_js', plugins_url(CRAYON_JS_UTIL, __FILE__), array('jquery'), $CRAYON_VERSION);
		wp_enqueue_script('crayon_admin_js', plugins_url(CRAYON_JS_ADMIN, __FILE__), array('jquery', 'crayon_util_js'), $CRAYON_VERSION);
		wp_enqueue_script('crayon_jquery_popup', plugins_url(CRAYON_JQUERY_POPUP, __FILE__), array('jquery'), $CRAYON_VERSION);
		wp_enqueue_script('cssjson_js', plugins_url(CRAYON_CSSJSON_JS, __FILE__), $CRAYON_VERSION);
		wp_enqueue_script('crayon_js', plugins_url(CRAYON_JS, __FILE__), array('jquery', 'crayon_jquery_popup', 'crayon_util_js'), $CRAYON_VERSION);
		if (CRAYON_THEME_EDITOR) {
			wp_enqueue_script('crayon_theme_editor', plugins_url(CRAYON_THEME_EDITOR_JS, __FILE__), array('jquery', 'cssjson_js'), $CRAYON_VERSION);
		}
		// XXX Must come after
		self::init_js_settings();
	}
	
	public static function init_js_settings() {
		// TODO Create a global CrayonSyntaxSettings object here
		self::load_settings(TRUE);
		if (!self::$js_settings) {
			self::$js_settings = array(
					'prefix' => CrayonSettings::PREFIX,
					'setting' => CrayonSettings::SETTING,
					'selected' => CrayonSettings::SETTING_SELECTED,
					'changed' => CrayonSettings::SETTING_CHANGED,
					'special' => CrayonSettings::SETTING_SPECIAL,
					'orig_value' => CrayonSettings::SETTING_ORIG_VALUE 
					);
		}
		wp_localize_script('crayon_admin_js', 'CrayonSyntaxSettings', self::$js_settings);
		CrayonThemeEditorWP::admin_scripts();
	}

	public static function settings() {
		if (!current_user_can('manage_options')) {
			wp_die(crayon__('You do not have sufficient permissions to access this page.'));
		}
		
		// Go through and find all Crayons in posts on each reload
		self::scan_and_save_posts();
		
		?>

<script type="text/javascript">
	jQuery(document).ready(function() {
		CrayonSyntaxAdmin.init();
	});
</script>

		
<div id="crayon-main-wrap" class="wrap">

<div id="icon-options-general" class="icon32"><br>
</div>
<h2>Crayon Syntax Highlighter <?php crayon_e('Settings'); ?></h2>
<?php self::help(); ?>
<form action="options.php" method="post"><?php
		settings_fields(self::FIELDS);
		?>

		<?php
		do_settings_sections(self::SETTINGS);
		?>

<p class="submit"><input type="submit" name="submit" id="submit"
	class="button-primary" value="<?php
		crayon_e('Save Changes');
		?>"> <input type="submit"
	name="<?php
		echo self::OPTIONS;
		?>[reset]" id="reset"
	class="button-primary" value="<?php
		crayon_e('Reset Settings');
		?>"></p>
</form>
</div>

<div id="crayon-theme-editor-wrap" class="wrap" url="<?php echo plugins_url(CRAYON_THEME_EDITOR_CONTENT_PHP, __FILE__); ?>"></div>

<?php
	}

	// Load the global settings and update them from the db
	public static function load_settings($just_load_settings = FALSE) {
		if (self::$options === NULL) {
			// Load settings from db
			if (!(self::$options = get_option(self::OPTIONS))) {
				self::$options = CrayonSettings::get_defaults_array();
				update_option(self::OPTIONS, self::$options);
			}
			// Initialise default global settings and update them from db
			CrayonGlobalSettings::set(self::$options);
		}
		
		if (!self::$is_fully_loaded && !$just_load_settings) {
			// Load everything else as well
			// Load all available languages and themes
			CrayonResources::langs()->load();
			CrayonResources::themes()->load();
			
			// For local file loading
			// This is used to decouple WP functions from internal Crayon classes
			CrayonGlobalSettings::site_http(home_url());
			CrayonGlobalSettings::site_path(ABSPATH);
			CrayonGlobalSettings::plugin_path(plugins_url('', __FILE__));
			
			// Ensure all missing settings in db are replaced by default values
			$changed = FALSE;
			foreach (CrayonSettings::get_defaults_array() as $name => $value) {
				// Add missing settings
				if (!array_key_exists($name, self::$options)) {
					self::$options[$name] = $value;
					$changed = TRUE;
				}
			}
			// A setting was missing, update options
			if ($changed) {
				update_option(self::OPTIONS, self::$options);
			}
			
			self::$is_fully_loaded = TRUE;
		}
	}
	
	public static function get_settings() {
		return get_option(self::OPTIONS);
	}
	
	// Saves settings from CrayonGlobalSettings, or provided array, to the db
	public static function save_settings($settings = NULL) {
		if ($settings === NULL) {
			$settings = CrayonGlobalSettings::get_array();
		}
		update_option(self::OPTIONS, $settings);
	}
	
	// Crayons posts
	public static function load_posts() {
		if (self::$crayon_posts === NULL) {
			// Load from db
			if (!(self::$crayon_posts = get_option(self::POSTS))) {
				// Posts don't exist! Scan for them. This will fill self::$crayon_posts
				self::$crayon_posts = CrayonWP::scan_posts();
				update_option(self::POSTS, self::$crayon_posts);
			}
		}
		return self::$crayon_posts;
	}
	
	public static function scan_and_save_posts() {
		self::save_posts(CrayonWP::scan_posts());
	}
	
	public static function save_posts($posts = NULL) {
		if ($posts === NULL) {
			$posts = self::$crayon_posts;
		}
		update_option(self::POSTS, $posts);
		self::load_posts();
	}
	
	public static function add_post($id) {
		self::load_posts();
		if (!in_array($id, self::$crayon_posts)) {
			self::$crayon_posts[] = $id;
		}
		self::save_posts();
	}
	
	public static function remove_post($id) {
		self::load_posts();
		$key = array_search($id, self::$crayon_posts);
		if ($key === false) {
			return;
		}
		unset(self::$crayon_posts[$key]);
		self::save_posts();
	}
	
	// Cache
	public static function add_cache($name) {
		self::load_cache();
		if (!in_array($name, self::$cache)) {
			self::$cache[] = $name;
		}
		self::save_cache();
	}
	
	public static function remove_cache($name) {
		self::load_cache();
		$key = array_search($name, self::$cache);
		if ($key === false) {
			return;
		}
		unset(self::$cache[$key]);
		self::save_cache();
	}
	
	public static function clear_cache() {
		self::load_cache();
		foreach (self::$cache as $name) {
			delete_transient($name);
		}
		self::$cache = array();
		self::save_cache();
	}
	
	public static function load_cache() {
		// Load cache from db
		if (!(self::$cache = get_option(self::CACHE))) {
			self::$cache = array();
			update_option(self::CACHE, self::$cache);
		}
	}
	
	public static function save_cache() {
		update_option(self::CACHE, self::$cache);
		self::load_cache();
	}
	
	// Paths
	
	public static function wp_root_path() {
		return preg_replace('#wp\-content.*#', '', CRAYON_ROOT_PATH);
	}
	
	public static function wp_load_path() {
		return self::wp_root_path() . 'wp-load.php';
	}

	public static function admin_init() {
		// Load default settings if they don't exist
		self::load_settings();
		
		// Update db
		CrayonWP::update();
		
		// General
		// Some of these will the $editor arguments, if TRUE it will alter for use in the Tag Editor 
		self::add_section(self::GENERAL, crayon__('General'));
		self::add_field(self::GENERAL, crayon__('Theme'), 'theme');
		self::add_field(self::GENERAL, crayon__('Font'), 'font');
		self::add_field(self::GENERAL, crayon__('Metrics'), 'metrics');
		self::add_field(self::GENERAL, crayon__('Toolbar'), 'toolbar');
		self::add_field(self::GENERAL, crayon__('Lines'), 'lines');
		self::add_field(self::GENERAL, crayon__('Code'), 'code');
		self::add_field(self::GENERAL, crayon__('Tags'), 'tags');
		self::add_field(self::GENERAL, crayon__('Languages'), 'langs');
		self::add_field(self::GENERAL, crayon__('Files'), 'files');
		self::add_field(self::GENERAL, crayon__('Tag Editor'), 'tag_editor');
		self::add_field(self::GENERAL, crayon__('Misc'), 'misc');

		// Debug
		self::add_section(self::DEBUG, crayon__('Debug'));
		self::add_field(self::DEBUG, crayon__('Errors'), 'errors');
		self::add_field(self::DEBUG, crayon__('Log'), 'log');
		// ABOUT

		self::add_section(self::ABOUT, crayon__('About'));
		$image = '<div id="crayon-logo">

			<img src="' . plugins_url(CRAYON_LOGO, __FILE__) . '" /><br/></div>';
		self::add_field(self::ABOUT, $image, 'info');
	}

	// Wrapper functions

	private static function add_section($name, $title, $callback = NULL) {
		$callback = (empty($callback) ? 'blank' : $callback);
		add_settings_section($name, $title, 'CrayonSettingsWP::' . $callback, self::SETTINGS);
	}

	private static function add_field($section, $title, $callback, $args = array()) {
		$unique = preg_replace('#\\s#', '_', strtolower($title));
		add_settings_field($unique, $title, 'CrayonSettingsWP::' . $callback, self::SETTINGS, $section, $args);
	}

	// Validates all the settings passed from the form in $inputs

	public static function settings_validate($inputs) {
		// Load current settings from db
		self::load_settings(TRUE);
		
		global $CRAYON_EMAIL;
		// When reset button is pressed, remove settings so default loads next time
		if (array_key_exists('reset', $inputs)) {
			self::clear_cache();
			return array();
		}
		// Clear the log if needed
		if (array_key_exists(self::LOG_CLEAR, $_POST)) {
			CrayonLog::clear();
		}
		// Send to admin
		if (array_key_exists(self::LOG_EMAIL_ADMIN, $_POST)) {
			CrayonLog::email(get_bloginfo('admin_email'));
		}
		// Send to developer
		if (array_key_exists(self::LOG_EMAIL_DEV, $_POST)) {
			CrayonLog::email($CRAYON_EMAIL, get_bloginfo('admin_email'));
		}

		// Clear the cache
		if (array_key_exists('crayon-cache-clear', $_POST)) { 
			self::clear_cache();
		}
		
		// Validate inputs
		foreach ($inputs as $input => $value) {
			// Convert all array setting values to ints
			$inputs[$input] = CrayonSettings::validate($input, $value);
			// Clear cache when changed
			if ($input == CrayonSettings::CACHE && $value != CrayonGlobalSettings::val(CrayonSettings::CACHE)) {
				self::clear_cache();
			}
		}
		
		// If settings don't exist in input, set them to default
		$global_settings = CrayonSettings::get_defaults();

		$ignored = array(CrayonSettings::HIDE_HELP, CrayonSettings::TINYMCE_USED);
		
		foreach ($global_settings as $setting) {
			// XXX Ignore some settings
			if ( in_array($setting->name(), $ignored) ) {
				$inputs[$setting->name()] = CrayonGlobalSettings::val($setting->name());
				continue;				
			}
			
			// If boolean setting is not in input, then it is set to FALSE in the form
			if (!array_key_exists($setting->name(), $inputs)) {
				// For booleans, set to FALSE (unchecked boxes are not sent as POST)
				if (is_bool($setting->def())) {
					$inputs[$setting->name()] = FALSE;
				} else {
					/*  For array settings, set the input as the value, which by default is the
					 default index */
					if (is_array($setting->def())) {
						$inputs[$setting->name()] = $setting->value();
					} else {
						$inputs[$setting->name()] = $setting->def();
					}
				}
			}
		}
		
		return $inputs;
	}

	// Section callback functions

	public static function blank() {} // Used for required callbacks with blank content

	// Input Drawing ==========================================================
	
	private static function textbox($args) {
		$id = '';
		$size = 40;
		$margin = FALSE;
		$preview = 1;
		$break = FALSE;
		extract($args); 
		
		echo '<input id="', CrayonSettings::PREFIX, $id, '" name="', self::OPTIONS, '[', $id, ']" class="'.CrayonSettings::SETTING.'" size="', $size, '" type="text" value="',
			self::$options[$id], '" style="margin-left: ', ($margin ? '20px' : '0px'), ';" crayon-preview="', ($preview ? 1 : 0), '" />', ($break ? CRAYON_BR : '');
	}

	private static function checkbox($args, $line_break = TRUE, $preview = TRUE) {
		if (empty($args) || !is_array($args) || count($args) != 2) {
			return;
		}
		$id = $args[0];
		$text = $args[1];
		$checked = (!array_key_exists($id, self::$options)) ? FALSE : self::$options[$id] == TRUE;
		$checked_str = $checked ? ' checked="checked"' : ''; 
		echo '<input id="', CrayonSettings::PREFIX, $id, '" name="', self::OPTIONS, '[', $id, ']" type="checkbox" class="'.CrayonSettings::SETTING.'" value="1"', $checked_str,
			' crayon-preview="', ($preview ? 1 : 0), '" /> ', '<span>', $text, '</span>', ($line_break ? CRAYON_BR : '');
	}

	// Draws a dropdown by loading the default value (an array) from a setting
	private static function dropdown($id, $line_break = TRUE, $preview = TRUE, $echo = TRUE, $resources = NULL) {
		if (!array_key_exists($id, self::$options)) {
			return;
		}
		$resources = $resources != NULL ? $resources : CrayonGlobalSettings::get($id)->def();
		
		$return = '<select id="'.CrayonSettings::PREFIX.$id.'" name="'.self::OPTIONS.'['.$id.']" class="'.CrayonSettings::SETTING.'" crayon-preview="'.($preview ? 1 : 0).'">';
		foreach ($resources as $k=>$v) {
			$return .='<option value="'.$k.'" '.selected(self::$options[$id], $k, FALSE).'>'.$v.'</option>';
		}
		$return .= '</select>'.($line_break ? CRAYON_BR : '');
		if ($echo) {
			echo $return;
		} else {
			return $return;
		}
	}
	
	private static function info_span($name, $text) {
		echo '<span id="', $name, '-info">', $text,'</span>';
	}
	
	private static function span($text) {
		echo '<span>', $text,'</span>';
	}

	// General Fields =========================================================
	public static function help() {
		global $CRAYON_WEBSITE;
		if (CrayonGlobalSettings::val(CrayonSettings::HIDE_HELP)) {
			return;
		}
		$url = plugins_url(CRAYON_AJAX_PHP, __FILE__) . '?' . CrayonSettings::HIDE_HELP . '=1';
		$web = $CRAYON_WEBSITE;
		echo '
<div id="crayon-help" class="updated settings-error crayon-help">
	<p><strong>Howdy, coder!</strong> Thanks for using Crayon. Use <strong>help</strong> on the top of this page to learn how to use the shortcode and basic features, or check out my <a href="#info">Twitter & Email</a>. For online help and info, visit <a target="_blank" href="'.$web,'">here</a>. <a class="crayon-help-close" url="'.$url.'">X</a></p>
</div>
';
	}
	
	public static function get_crayon_help_file() {
	// Load help
		if ( ($help = @file_get_contents(CRAYON_HELP_FILE)) !== FALSE) {
			$help = str_replace('{PLUGIN}', CrayonGlobalSettings::plugin_path(), $help);
		} else {
			$help = 'Help failed to load... Try <a href="#info">these</a> instead.';
		}
		return $help;
	}
	
	public static function help_screen() {
		$screen = get_current_screen();

	    if ($screen->id != self::$admin_page) {
	        return;
	    }
	    
	    // Add my_help_tab if current screen is My Admin Page
	    $screen->add_help_tab( array(
	        'id'		=> 'crayon_help_tab',
	        'title'		=> crayon__('Crayon Help'),
	        'content'	=> self::get_crayon_help_file() // TODO consider adding tranlations for help
	    ) );
	}
	
	// XXX Depreciated since WP 3.3 
	public static function cont_help($contextual_help, $screen_id, $screen) {
		if ($screen_id == self::$admin_page) {
			return self::get_crayon_help_file();
		}
		return $contextual_help;
	}

	public static function metrics() {
		echo '<div id="crayon-section-metrics" class="crayon-hide-inline">';
		self::checkbox(array(CrayonSettings::HEIGHT_SET, '<span class="crayon-span-50">'.crayon__('Height').' </span>'), FALSE);
		self::dropdown(CrayonSettings::HEIGHT_MODE, FALSE);
		echo ' ';
		self::textbox(array('id' => CrayonSettings::HEIGHT, 'size' => 8));
		echo ' ';
		self::dropdown(CrayonSettings::HEIGHT_UNIT);
		self::checkbox(array(CrayonSettings::WIDTH_SET, '<span class="crayon-span-50">'.crayon__('Width').' </span>'), FALSE);
		self::dropdown(CrayonSettings::WIDTH_MODE, FALSE);
		echo ' ';
		self::textbox(array('id' => CrayonSettings::WIDTH, 'size' => 8));
		echo ' ';
		self::dropdown(CrayonSettings::WIDTH_UNIT);
		$text = array(crayon__('Top Margin') => array(CrayonSettings::TOP_SET, CrayonSettings::TOP_MARGIN),
			crayon__('Bottom Margin') => array(CrayonSettings::BOTTOM_SET, CrayonSettings::BOTTOM_MARGIN),
			crayon__('Left Margin') => array(CrayonSettings::LEFT_SET, CrayonSettings::LEFT_MARGIN),
			crayon__('Right Margin') => array(CrayonSettings::RIGHT_SET, CrayonSettings::RIGHT_MARGIN));
		foreach ($text as $p => $s) {
			$set = $s[0];
			$margin = $s[1];
			$preview = ($p == crayon__('Left Margin') || $p == crayon__('Right Margin'));
			self::checkbox(array($set, '<span class="crayon-span-110">' . $p . '</span>'), FALSE, $preview);
			echo ' ';
			self::textbox(array('id' => $margin, 'size' => 8, 'preview' => FALSE));
			echo '<span class="crayon-span-margin">', crayon__('Pixels'), '</span>', CRAYON_BR;
		}
		echo '<span class="crayon-span" style="min-width: 135px;">'.crayon__('Horizontal Alignment').' </span>';
		self::dropdown(CrayonSettings::H_ALIGN);
		echo '<div id="crayon-subsection-float">';
		self::checkbox(array(CrayonSettings::FLOAT_ENABLE, crayon__('Allow floating elements to surround Crayon')), FALSE, FALSE);
		echo '</div>';
		echo '<span class="crayon-span-100">' . crayon__('Inline Margin') . '</span>';
		self::textbox(array('id' => CrayonSettings::INLINE_MARGIN, 'size' => 2));
		echo '<span class="crayon-span-margin">', crayon__('Pixels'), '</span>';
		echo '</div>';
	}

	public static function toolbar() {
		echo '<div id="crayon-section-toolbar" class="crayon-hide-inline">';
		self::span(crayon__('Display the Toolbar').' ');
		self::dropdown(CrayonSettings::TOOLBAR);
		echo '<div id="crayon-subsection-toolbar">';
		self::checkbox(array(CrayonSettings::TOOLBAR_OVERLAY, crayon__('Overlay the toolbar on code rather than push it down when possible')));
		self::checkbox(array(CrayonSettings::TOOLBAR_HIDE, crayon__('Toggle the toolbar on single click when it is overlayed')));
		self::checkbox(array(CrayonSettings::TOOLBAR_DELAY, crayon__('Delay hiding the toolbar on MouseOut')));
		echo '</div>';
		self::checkbox(array(CrayonSettings::SHOW_TITLE, crayon__('Display the title when provided')));
		self::span(crayon__('Display the language').' ');
		self::dropdown(CrayonSettings::SHOW_LANG);
		echo '</div>';
	}

	public static function lines() {
		echo '<div id="crayon-section-lines" class="crayon-hide-inline">';
		self::checkbox(array(CrayonSettings::STRIPED, crayon__('Display striped code lines')));
		self::checkbox(array(CrayonSettings::MARKING, crayon__('Enable line marking for important lines')));
		self::checkbox(array(CrayonSettings::NUMS, crayon__('Display line numbers by default')));
		self::checkbox(array(CrayonSettings::NUMS_TOGGLE, crayon__('Enable line number toggling')));
		self::span(crayon__('Start line numbers from').' ');
		self::textbox(array('id' => CrayonSettings::START_LINE, 'size' => 2, 'break' => TRUE));
		echo '</div>';
	}

	public static function langs() {
		echo '<a name="langs"></a>';
		// Specialised dropdown for languages
		if (array_key_exists(CrayonSettings::FALLBACK_LANG, self::$options)) {
			if (($langs = CrayonParser::parse_all()) != FALSE) {
				self::span(crayon__('When no language is provided, use the fallback').': ');
				self::dropdown(CrayonSettings::FALLBACK_LANG,FALSE,TRUE,TRUE,$langs);
				// Information about parsing
				$parsed = CrayonResources::langs()->is_parsed();
				$count = count($langs);
				echo '</select>', CRAYON_BR, ($parsed ? '' : '<span class="crayon-error">'), 
					sprintf(crayon_n('%d language has been detected.', '%d languages have been detected.', $count), $count), ' ',
					$parsed ? crayon__('Parsing was successful') : crayon__('Parsing was unsuccessful'),
					($parsed ? '. ' : '</span>');
				// Check if fallback from db is loaded
				$db_fallback = self::$options[CrayonSettings::FALLBACK_LANG]; // Fallback name from db

				if (!CrayonResources::langs()->is_loaded($db_fallback) || !CrayonResources::langs()->exists($db_fallback)) {
					echo '<br/><span class="crayon-error">', sprintf(crayon__('The selected language with id %s could not be loaded'), '<strong>'.$db_fallback.'</strong>'), '. </span>';
				}
				// Language parsing info
				echo CRAYON_BR, '<div id="crayon-subsection-lang-info"><div><a id="show-lang" class="button-primary" onclick="CrayonSyntaxAdmin.show_langs(\'', plugins_url(CRAYON_LIST_LANGS_PHP, __FILE__),
					'\');">', crayon__('Show Languages'), '</a></div></div>';
			} else {
				echo 'No languages could be parsed.';
			}
		}
	}

	public static function theme($editor = FALSE) {
		$db_theme = self::$options[CrayonSettings::THEME]; // Theme name from db
		if (!array_key_exists(CrayonSettings::THEME, self::$options)) {
			$db_theme = '';
		}
		$themes_array = CrayonResources::themes()->get_array();
		self::dropdown(CrayonSettings::THEME,FALSE,TRUE,TRUE,$themes_array);
		if ($editor) {
			return;
		}
		// Theme editor
		if (CRAYON_THEME_EDITOR) {
// 			echo '<a id="crayon-theme-editor-button" class="button-primary crayon-admin-button" loading="'. crayon__('Loading...') .'" loaded="'. crayon__('Theme Editor') .'" >'. crayon__('Theme Editor') .'</a></br>';
			echo '<div id="crayon-theme-editor-admin-buttons">',
				'<a id="crayon-theme-editor-edit-button" class="button-primary crayon-admin-button" loading="', crayon__('Loading...'), '" loaded="', crayon__('Edit'), '" >', crayon__('Edit'), '</a>',
				'<a id="crayon-theme-editor-create-button" class="button-primary crayon-admin-button" loading="', crayon__('Loading...'), '" loaded="', crayon__('Create'), '" >', crayon__('Create'), '</a></br></div>';
		}
		// Preview Box
		echo '<div id="crayon-live-preview" url="', plugins_url(CRAYON_PREVIEW_PHP, __FILE__), '"></div>';
		echo '<div id="crayon-preview-info">';
		printf(crayon__('Change the %1$sfallback language%2$s to change the sample code. Lines 5-7 are marked.'), '<a href="#langs">', '</a>');
		echo '</div>';
		// Preview checkbox
		echo '<div style="height:10px;"></div>';
		self::checkbox(array(CrayonSettings::PREVIEW, crayon__('Enable Live Preview')), FALSE, FALSE);
		echo '</select><span class="crayon-span-10"></span>';
		self::checkbox(array(CrayonSettings::ENQUEUE_THEMES, crayon__('Enqueue themes in the header (more efficient).') . ' <a href="http://bit.ly/zTUAQV" target="_blank" class="crayon-question">' . crayon__('?') . '</a>'));
		// Check if theme from db is loaded
		if (!CrayonResources::themes()->is_loaded($db_theme) || !CrayonResources::themes()->exists($db_theme)) {
			echo '<span class="crayon-error">', sprintf(crayon__('The selected theme with id %s could not be loaded'), '<strong>'.$db_theme.'</strong>'), '. </span>';
		}
	}

	public static function font($editor = FALSE) {
		$db_font = self::$options[CrayonSettings::FONT]; // Theme name from db
		if (!array_key_exists(CrayonSettings::FONT, self::$options)) {
			$db_font = '';
		}
		$fonts_array = CrayonResources::fonts()->get_array();
		self::dropdown(CrayonSettings::FONT,FALSE,TRUE,TRUE,$fonts_array);
		echo '<span class="crayon-span-10"></span>';
		self::checkbox(array(CrayonSettings::FONT_SIZE_ENABLE, crayon__('Custom Font Size').' '), FALSE);
		self::textbox(array('id' => CrayonSettings::FONT_SIZE, 'size' => 2));
		echo '<span class="crayon-span-margin">', crayon__('Pixels'), '</span></br>';
		if ((!CrayonResources::fonts()->is_loaded($db_font) || !CrayonResources::fonts()->exists($db_font))) {
			// Default font doesn't actually exist as a file, it means do not override default theme font
			echo '<span class="crayon-error">', sprintf(crayon__('The selected font with id %s could not be loaded'), '<strong>'.$db_font.'</strong>'), '. </span><br/>';
		}
		if ($editor) {
			return;
		}
		echo '<div style="height:10px;"></div>';
		self::checkbox(array(CrayonSettings::ENQUEUE_FONTS, crayon__('Enqueue fonts in the header (more efficient).') . ' <a href="http://bit.ly/zTUAQV" target="_blank" class="crayon-question">' . crayon__('?') . '</a>'));
	}

	public static function code($editor = FALSE) {
		echo '<div id="crayon-section-code-interaction" class="crayon-hide-inline-only">';
		self::checkbox(array(CrayonSettings::PLAIN, crayon__('Enable plain code view and display').' '), FALSE);
		self::dropdown(CrayonSettings::SHOW_PLAIN);
		echo '<span id="crayon-subsection-copy-check">';
		self::checkbox(array(CrayonSettings::PLAIN_TOGGLE, crayon__('Enable plain code toggling')));
		self::checkbox(array(CrayonSettings::SHOW_PLAIN_DEFAULT, crayon__('Show the plain code by default')));
		self::checkbox(array(CrayonSettings::COPY, crayon__('Enable code copy/paste')));
		echo '</span>';
		self::checkbox(array(CrayonSettings::POPUP, crayon__('Enable opening code in a window')));
		self::checkbox(array(CrayonSettings::SCROLL, crayon__('Always display scrollbars')));
		self::span(crayon__('Tab size in spaces').': ');
		self::textbox(array('id' => CrayonSettings::TAB_SIZE, 'size' => 2, 'break' => TRUE));
		echo '</div>';
		
		if (!$editor) {
			self::checkbox(array(CrayonSettings::DECODE, crayon__('Decode HTML entities in code')));
		}
		self::checkbox(array(CrayonSettings::DECODE_ATTRIBUTES, crayon__('Decode HTML entities in attributes')));
		echo '<div class="crayon-hide-inline-only">';
		self::checkbox(array(CrayonSettings::TRIM_WHITESPACE, crayon__('Remove whitespace surrounding the shortcode content')));
		echo '</div>';
		self::checkbox(array(CrayonSettings::MIXED, crayon__('Allow Mixed Language Highlighting with delimiters and tags.') . ' <a href="http://bit.ly/ukwts2" target="_blank" class="crayon-question">' . crayon__('?') . '</a>'));
		echo '<div class="crayon-hide-inline-only">';
		self::checkbox(array(CrayonSettings::SHOW_MIXED, crayon__('Show Mixed Language Icon (+)')));
		echo '</div>';
	}
	
	public static function tags() {
		self::checkbox(array(CrayonSettings::CAPTURE_MINI_TAG, crayon__('Capture Mini Tags like [php][/php] as Crayons.') . ' <a href="http://bit.ly/rRZuzk" target="_blank" class="crayon-question">' . crayon__('?') . '</a>'));
		self::checkbox(array(CrayonSettings::INLINE_TAG, crayon__('Capture Inline Tags like {php}{/php} inside sentences.') . ' <a href="http://bit.ly/yFafFL" target="_blank" class="crayon-question">' . crayon__('?') . '</a>'));
		self::checkbox(array(CrayonSettings::INLINE_WRAP, crayon__('Wrap Inline Tags') . ' <a href="http://bit.ly/yFafFL" target="_blank" class="crayon-question">' . crayon__('?') . '</a>'));
		self::checkbox(array(CrayonSettings::BACKQUOTE, crayon__('Capture `backquotes` as &lt;code&gt;') . ' <a href="http://bit.ly/yFafFL" target="_blank" class="crayon-question">' . crayon__('?') . '</a>'));
		self::checkbox(array(CrayonSettings::CAPTURE_PRE, crayon__('Capture &lt;pre&gt; tags as Crayons') . ' <a href="http://bit.ly/rRZuzk" target="_blank" class="crayon-question">' . crayon__('?') . '</a>'));
		self::checkbox(array(CrayonSettings::PLAIN_TAG, crayon__('Enable [plain][/plain] tag.') . ' <a href="http://bit.ly/rRZuzk" target="_blank" class="crayon-question">' . crayon__('?') . '</a>'));
	}

	public static function files() {
		echo '<a name="files"></a>';
		echo crayon__('When loading local files and a relative path is given for the URL, use the absolute path'),': ',
			'<div style="margin-left: 20px">', home_url(), '/';
		self::textbox(array('id' => CrayonSettings::LOCAL_PATH));
		echo '</div>', crayon__('Followed by your relative URL.');
	}
	
	public static function tag_editor() {
		$sep = sprintf(crayon__('Use %s to separate setting names from values in the &lt;pre&gt; class attribute'),
						self::dropdown(CrayonSettings::ATTR_SEP, FALSE, FALSE, FALSE));
		echo '<span>', $sep, ' <a href="http://bit.ly/H3xW3D" target="_blank" class="crayon-question">' . crayon__('?') . '</a>', '</span>';
	}

	public static function misc() {
		echo crayon__('Clear the cache used to store remote code requests'),': ';
		self::dropdown(CrayonSettings::CACHE, false);
		echo '<input type="submit" id="crayon-cache-clear" name="crayon-cache-clear" class="button-secondary" value="', crayon__('Clear Now'), '" /><br/>';
		self::checkbox(array(CrayonSettings::EFFICIENT_ENQUEUE, crayon__('Attempt to load Crayon\'s CSS and JavaScript only when needed').'. <a href="http://ak.net84.net/?p=660" target="_blank" class="crayon-question">'.crayon__('?').'</a>'));
		self::checkbox(array(CrayonSettings::SAFE_ENQUEUE, crayon__('Disable enqueuing for page templates that may contain The Loop.') . ' <a href="http://bit.ly/AcWRNY" target="_blank" class="crayon-question">' . crayon__('?') . '</a>'));
		self::checkbox(array(CrayonSettings::COMMENTS, crayon__('Allow Crayons inside comments')));
		self::checkbox(array(CrayonSettings::EXCERPT_STRIP, crayon__('Remove Crayons from excerpts')));
		self::checkbox(array(CrayonSettings::MAIN_QUERY, crayon__('Load Crayons only from the main Wordpress query')));
		self::checkbox(array(CrayonSettings::TOUCHSCREEN, crayon__('Disable mouse gestures for touchscreen devices (eg. MouseOver)')));
		self::checkbox(array(CrayonSettings::DISABLE_ANIM, crayon__('Disable animations')));
		self::checkbox(array(CrayonSettings::DISABLE_RUNTIME, crayon__('Disable runtime stats')));
	}

	// Debug Fields ===========================================================

	public static function errors() {
		self::checkbox(array(CrayonSettings::ERROR_LOG, crayon__('Log errors for individual Crayons')));
		self::checkbox(array(CrayonSettings::ERROR_LOG_SYS, crayon__('Log system-wide errors')));
		self::checkbox(array(CrayonSettings::ERROR_MSG_SHOW, crayon__('Display custom message for errors')));
		self::textbox(array('id' => CrayonSettings::ERROR_MSG, 'size' => 60, 'margin' => TRUE));
	}

	public static function log() {
		$log = CrayonLog::log();
		touch(CRAYON_LOG_FILE);
		$exists = file_exists(CRAYON_LOG_FILE);
		$writable = is_writable(CRAYON_LOG_FILE);
		if (!empty($log)) {
			echo '<div id="crayon-log-wrapper">', '<div id="crayon-log"><div id="crayon-log-text">', $log,
				'</div></div>', '<div id="crayon-log-controls">',
				'<input type="button" id="crayon-log-toggle" show_txt="',crayon__('Show Log'),'" hide_txt="',crayon__('Hide Log'),'" class="button-secondary" value="', crayon__('Show Log'), '"> ',
				'<input type="submit" id="crayon-log-clear" name="', self::LOG_CLEAR ,
				'" class="button-secondary" value="', crayon__('Clear Log'), '"> ', '<input type="submit" id="crayon-log-email" name="',
				self::LOG_EMAIL_ADMIN . '" class="button-secondary" value="', crayon__('Email Admin'), '"> ',
				'<input type="submit" id="crayon-log-email" name="', self::LOG_EMAIL_DEV,
				'" class="button-secondary" value="', crayon__('Email Developer'), '"> ', '</div>', '</div>';
		}
		echo '<span', (!empty($log)) ? ' class="crayon-span"' : '', '>', (empty($log)) ? crayon__('The log is currently empty.').' ' : '';
		if ($exists) {
			$writable ? crayon_e('The log file exists and is writable.') : crayon_e('The log file exists and is not writable.');
		} else {
			crayon_e('The log file does not exist and is not writable.');
		}
		echo '</span>';
	}

	// About Fields ===========================================================

	public static function info() {
		global $CRAYON_VERSION, $CRAYON_DATE, $CRAYON_AUTHOR, $CRAYON_TWITTER, $CRAYON_EMAIL, $CRAYON_AUTHOR_SITE, $CRAYON_DONATE;
		echo '<a name="info"></a>';
		$version = '<strong>'.crayon__('Version').':</strong> ' . $CRAYON_VERSION;
		$date = $CRAYON_DATE;
		$developer = '<strong>'.crayon__('Developer').':</strong> ' . '<a href="'.$CRAYON_AUTHOR_SITE.'" target="_blank">' . $CRAYON_AUTHOR . '</a>';
		$translators = '<strong>'.crayon__('Translators').':</strong> ' .
			'Chinese (<a href="http://smerpup.com/" target="_blank">Dezhi Liu</a>, <a href="http://neverno.me/" target="_blank">Jash Yin</a>),
			German (<a href="http://www.technologyblog.de/" target="_blank">Stephan Knau&#223;</a>),
			Lithuanian (<a href="http://www.host1free.com" target="_blank">Vincent G</a>),
			Japanese (<a href="https://twitter.com/#!/west_323" target="_blank">@west_323</a>), 
			Russian (<a href="http://simplelib.com/" target="_blank">Minimus</a>, <a href="http://atlocal.net/" target="_blank">Di_Skyer</a>),
			Turkish (<a href="http://kazancexpert.com" target="_blank">Hakan</a>)';
		
		$links = '<a id="twitter-icon" href="' . $CRAYON_TWITTER . '" target="_blank"></a>
					<a id="gmail-icon" href="mailto:' . $CRAYON_EMAIL . '" target="_blank"></a><div id="crayon-donate"><a href="' . $CRAYON_DONATE . '" target="_blank"><img src="'.plugins_url(CRAYON_DONATE_BUTTON, __FILE__).'"></a></div>';
		
		echo '
		<table id="crayon-info" border="0">
		  <tr>
		    <td>'.$version.' - '.$date.'</td>
		  </tr>
		  <tr>
		    <td>'.$developer.'</td>
		  </tr>
		  <tr>
		  	<td>'.$translators.'</td>
		  </tr>
		  <tr>
		  	<td colspan="2">', crayon__("The result of innumerable hours of hard work over many months. It's an ongoing project, keep me motivated!"), '</td>
		  </tr>
		  <tr>
		    <td colspan="2">'.$links.'</td>
		  </tr>
		</table>';
		
	}
	
	public static function plugin_row_meta($meta, $file) {
		global $CRAYON_DONATE;
		if ($file == CrayonWP::basename()) {
			$meta[] = '<a href="options-general.php?page=crayon_settings">' . crayon__('Settings') . '</a>';
			if (CRAYON_THEME_EDITOR) {
				$meta[] = '<a href="options-general.php?page=crayon_settings&subpage=theme_editor">' . crayon__('Theme Editor') . '</a>';
			}
			$meta[] = '<a href="'.$CRAYON_DONATE.'" target="_blank">' . crayon__('Donate') . '</a>';
		}
		return $meta;
	}
}
// Add the settings menus

if (defined('ABSPATH') && is_admin()) {
	// For the admin section
	add_action('admin_menu', 'CrayonSettingsWP::admin_load');
	add_filter('plugin_row_meta', 'CrayonSettingsWP::plugin_row_meta', 10, 2);
}

?>
