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
	// An array of cache names for use with Transients API
	private static $cache = NULL;
	private static $admin_page = '';
	private static $is_fully_loaded = FALSE;
	
	const SETTINGS = 'crayon_fields';
	const FIELDS = 'crayon_settings';
	const OPTIONS = 'crayon_options';
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
	}

	public static function admin_scripts() {
		global $CRAYON_VERSION;
		//wp_enqueue_script('crayon_jquery', plugins_url(CRAYON_JQUERY, __FILE__), array(), $CRAYON_VERSION);
		wp_enqueue_script('crayon_js', plugins_url(CRAYON_JS, __FILE__), array('jquery'), $CRAYON_VERSION);
		wp_enqueue_script('crayon_admin_js', plugins_url(CRAYON_JS_ADMIN, __FILE__), array('jquery'), $CRAYON_VERSION);
		wp_enqueue_script('crayon_jquery_popup', plugins_url(CRAYON_JQUERY_POPUP, __FILE__), array('jquery'), $CRAYON_VERSION);
		if (CRAYON_THEME_EDITOR) {
			wp_enqueue_script('crayon_theme_editor', plugins_url(CRAYON_THEME_EDITOR_JS, __FILE__), array('jquery'), $CRAYON_VERSION);
		}
	}

	public static function settings() {
		if (!current_user_can('manage_options')) {
			wp_die(crayon__('You do not have sufficient permissions to access this page.'));
		}
		
		?>

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

<div id="crayon-theme-editor-wrap" class="wrap" url="<?php echo plugins_url(CRAYON_THEME_EDITOR_PHP, __FILE__); ?>"></div>

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
	
	// Saves settings from CrayonGlobalSettings to the db
	public static function save_settings() {
		update_option(self::OPTIONS, CrayonGlobalSettings::get_array());
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
		if (in_array($name, self::$cache)) {
			unset(self::$cache[$name]);
		}
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
		// General

		self::add_section(self::GENERAL, crayon__('General'));
		self::add_field(self::GENERAL, crayon__('Theme'), 'themes');
		self::add_field(self::GENERAL, crayon__('Font'), 'fonts');
		self::add_field(self::GENERAL, crayon__('Metrics'), 'metrics');
		self::add_field(self::GENERAL, crayon__('Toolbar'), 'toolbar');
		self::add_field(self::GENERAL, crayon__('Lines'), 'lines');
		self::add_field(self::GENERAL, crayon__('Code'), 'code');
		self::add_field(self::GENERAL, crayon__('Languages'), 'langs');
		self::add_field(self::GENERAL, crayon__('Files'), 'files');
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
		//return array();
		
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

		foreach ($global_settings as $setting) {
			// XXX Ignore the HIDE_HELP
			if ($setting->name() == CrayonSettings::HIDE_HELP) {
				$inputs[CrayonSettings::HIDE_HELP] = CrayonGlobalSettings::val(CrayonSettings::HIDE_HELP);
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

	// Used to read args and validate for input tags
	private static function input($args) {
		if (empty($args) || !is_array($args)) {
			return FALSE;
		}
		extract($args);
		$name = (!empty($name) ? $name : '');
		$size = (!empty($size) && is_numeric($size) ? $size : 40);
		$break = (!empty($break) && $break ? CRAYON_BR : '');
		$margin = (!empty($margin) && $margin ? '20px' : 0);
		// By default, inputs will trigger preview refresh
		$preview = (!empty($preview) && !$preview ? 0 : 1);
		//$options = get_option(self::OPTIONS);
		if (!array_key_exists($name, self::$options)) {
			return array();
		}
		return compact('name', 'size', 'break', 'margin', 'preview', 'options');
	}

	private static function textbox($args) {
		if (!($args = self::input($args))) {
			return;
		}
		$name = $size = $margin = $preview = $break = '';
		extract($args);
		echo '<input id="', $name, '" name="', self::OPTIONS, '[', $name, ']" size="', $size, '" type="text" value="',
			self::$options[$name], '" style="margin-left: ', $margin, '" crayon-preview="', ($preview ? 1 : 0), '" />', $break;
	}

	private static function checkbox($args, $line_break = TRUE, $preview = TRUE) {
		if (empty($args) || !is_array($args) || count($args) != 2) {
			return;
		}
		$name = $args[0];
		$text = $args[1];
		$checked = (!array_key_exists($name, self::$options)) ? '' : checked(TRUE, self::$options[$name], FALSE);
		echo '<input id="', $name, '" name="', self::OPTIONS, '[', $name, ']" type="checkbox" value="1"', $checked,
			' crayon-preview="', ($preview ? 1 : 0), '" /> ', '<span>', $text, '</span>', ($line_break ? CRAYON_BR : '');
	}

	// Draws a dropdown by loading the default value (an array) from a setting
	private static function dropdown($name, $line_break = TRUE, $preview = TRUE) {
		if (!array_key_exists($name, self::$options)) {
			return;
		}
		$opts = CrayonGlobalSettings::get($name)->def();
		if (is_array($opts)) {
			echo '<select id="', $name, '" name="', self::OPTIONS, '[', $name, ']" crayon-preview="', ($preview ? 1 : 0), '">';
			for ($i = 0; $i < count($opts); $i++) {
				echo '<option value="', $i,'" ', selected(self::$options[$name], $i), '>', $opts[$i], '</option>';
			}
			echo '</select>', ($line_break ? CRAYON_BR : '');
		}
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
		self::checkbox(array(CrayonSettings::HEIGHT_SET, '<span class="crayon-span-50">'.crayon__('Height').': </span>'), FALSE);
		self::dropdown(CrayonSettings::HEIGHT_MODE, FALSE);
		echo ' ';
		self::textbox(array('name' => CrayonSettings::HEIGHT, 'size' => 8));
		echo ' ';
		self::dropdown(CrayonSettings::HEIGHT_UNIT);
		self::checkbox(array(CrayonSettings::WIDTH_SET, '<span class="crayon-span-50">'.crayon__('Width').': </span>'), FALSE);
		self::dropdown(CrayonSettings::WIDTH_MODE, FALSE);
		echo ' ';
		self::textbox(array('name' => CrayonSettings::WIDTH, 'size' => 8));
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
			self::textbox(array('name' => $margin, 'size' => 8, 'preview' => FALSE));
			echo '<span class="crayon-span-margin">Pixels</span>', CRAYON_BR;
		}
		echo '<span class="crayon-span" style="min-width: 135px;">'.crayon__('Horizontal Alignment').': </span>';
		self::dropdown(CrayonSettings::H_ALIGN);
		echo '<div id="crayon-float">';
		self::checkbox(array(CrayonSettings::FLOAT_ENABLE, crayon__('Allow floating elements to surround Crayon')), FALSE, FALSE);
		echo '</div>';
	}

	public static function toolbar() {
		echo crayon__('Display the Toolbar'), ': ';
		self::dropdown(CrayonSettings::TOOLBAR);
		echo '<div id="' . CrayonSettings::TOOLBAR_OVERLAY . '">';
		self::checkbox(array(CrayonSettings::TOOLBAR_OVERLAY, crayon__('Overlay the toolbar on code rather than push it down when possible')));
		self::checkbox(array(CrayonSettings::TOOLBAR_HIDE, crayon__('Toggle the toolbar on single click when it is overlayed')));
		self::checkbox(array(CrayonSettings::TOOLBAR_DELAY, crayon__('Delay hiding the toolbar on MouseOut')));
		echo '</div>';
		self::checkbox(array(CrayonSettings::SHOW_TITLE, crayon__('Display the title when provided')));
		echo crayon__('Display the language'), ': ';
		self::dropdown(CrayonSettings::SHOW_LANG);
	}

	public static function lines() {
		self::checkbox(array(CrayonSettings::STRIPED, crayon__('Display striped code lines')));
		self::checkbox(array(CrayonSettings::MARKING, crayon__('Enable line marking for important lines')));
		self::checkbox(array(CrayonSettings::NUMS, crayon__('Display line numbers by default')));
		self::checkbox(array(CrayonSettings::NUMS_TOGGLE, crayon__('Enable line number toggling')));
		echo crayon__('Start line numbers from'), ': ';
		self::textbox(array('name' => CrayonSettings::START_LINE, 'size' => 2, 'break' => TRUE));
	}

	public static function langs() {
		echo '<a name="langs"></a>';
		// Specialised dropdown for languages
		if (array_key_exists(CrayonSettings::FALLBACK_LANG, self::$options)) {
			if (($langs = CrayonParser::parse_all()) != FALSE) {
				$name = CrayonSettings::FALLBACK_LANG;
				echo crayon__('When no language is provided, use the fallback'), ': ', '<select id="', $name, '" name="', self::OPTIONS,
					'[', $name, ']" crayon-preview="1">';
				self::lang_dropdown($langs);
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
				echo '<a id="show-lang" onclick="CrayonSyntaxAdmin.show_langs(\'', plugins_url(CRAYON_LIST_LANGS_PHP, __FILE__),
					'\');">', crayon__('Show Languages'), '</a><div id="lang-info"></div>';
			} else {
				echo 'No languages could be parsed.';
			}
		}
	}
	
	public static function lang_dropdown($langs) {
		foreach ($langs as $lang) {
			$title = $lang->name() . ' [' . $lang->id() . ']';
			echo '<option value="', $lang->id(), '" ', selected(self::$options[CrayonSettings::FALLBACK_LANG],
				$lang->id()), '>', $title, '</option>';
		}
	}

	public static function themes() {
		$db_theme = self::$options[CrayonSettings::THEME]; // Theme name from db
		if (!array_key_exists(CrayonSettings::THEME, self::$options)) {
			$db_theme = '';
		}
		$name = CrayonSettings::THEME;
		$themes = CrayonResources::themes()->get();
		echo '<select id="', $name, '" name="', self::OPTIONS, '[', $name, ']" crayon-preview="1">';
		foreach ($themes as $theme) {
			$title = $theme->name();
			echo '<option value="', $theme->id(), '" ', selected($db_theme, $theme->id()), '>', $title, '</option>';
		}
		echo '</select><span class="crayon-span-5"></span>';
		// Theme editor
		if (CRAYON_THEME_EDITOR) {
			echo '<a id="crayon-theme-editor-button" class="button-primary crayon-admin-button" loading="'. crayon__('Loading...') .'" loaded="'. crayon__('Theme Editor') .'" >'. crayon__('Theme Editor') .'</a></br>';
		}
		// Preview Box
		echo '<div id="crayon-preview" url="', plugins_url(CRAYON_PREVIEW_PHP, __FILE__), '"></div>';
		printf(crayon__('Change the %1$sfallback language%2$s to change the sample code. Lines 5-7 are marked.'), '<a href="#langs">', '</a>');
		// Preview checkbox
		echo '<div style="height:10px;"></div>';
		self::checkbox(array(CrayonSettings::PREVIEW, crayon__('Enable Live Preview')), FALSE, FALSE);
		echo '</select><span class="crayon-span-10"></span>';
		self::checkbox(array(CrayonSettings::ENQUEUE_THEMES, crayon__('Enqueue themes in the header (more efficient).') . ' <a href="http://bit.ly/zTUAQV" target="_blank">' . crayon__('Learn More') . '</a>'));
		// Check if theme from db is loaded
		if (!CrayonResources::themes()->is_loaded($db_theme) || !CrayonResources::themes()->exists($db_theme)) {
			echo '<span class="crayon-error">', sprintf(crayon__('The selected theme with id %s could not be loaded'), '<strong>'.$db_theme.'</strong>'), '. </span>';
		}
	}

	public static function fonts() {
		$db_font = self::$options[CrayonSettings::FONT]; // Theme name from db
		if (!array_key_exists(CrayonSettings::FONT, self::$options)) {
			$db_font = '';
		}
		$name = CrayonSettings::FONT;
		$fonts = CrayonResources::fonts()->get();
		echo '<select id="', $name, '" name="', self::OPTIONS, '[', $name, ']" crayon-preview="1">';
		foreach ($fonts as $font) {
			$title = $font->id() != CrayonFonts::DEFAULT_FONT ? $font->name() : crayon__('Theme Default');
			echo '<option value="', $font->id(), '" ', selected($db_font, $font->id()), '>', $title, '</option>';
		}
		echo '</select><span class="crayon-span-10"></span>';
		self::checkbox(array(CrayonSettings::FONT_SIZE_ENABLE, crayon__('Custom Font Size').': '), FALSE);
		self::textbox(array('name' => CrayonSettings::FONT_SIZE, 'size' => 2));
		echo '<span class="crayon-span-margin">Pixels</span></br>';
		if ($db_font != CrayonFonts::DEFAULT_FONT && (!CrayonResources::fonts()->is_loaded($db_font) || !CrayonResources::fonts()->exists($db_font))) {
			// Default font doesn't actually exist as a file, it means do not override default theme font
			echo '<span class="crayon-error">', sprintf(crayon__('The selected font with id %s could not be loaded'), '<strong>'.$db_font.'</strong>'), '. </span><br/>';
		}
		echo '<div style="height:10px;"></div>';
		self::checkbox(array(CrayonSettings::ENQUEUE_FONTS, crayon__('Enqueue fonts in the header (more efficient).') . ' <a href="http://bit.ly/zTUAQV" target="_blank">' . crayon__('Learn More') . '</a>'));
	}

	public static function code() {
		self::checkbox(array(CrayonSettings::PLAIN, crayon__('Enable plain code view and display').': '), FALSE);
		self::dropdown(CrayonSettings::SHOW_PLAIN);
		echo '<span id="crayon-copy-check">';
		self::checkbox(array(CrayonSettings::PLAIN_TOGGLE, crayon__('Enable plain code toggling')));
		self::checkbox(array(CrayonSettings::SHOW_PLAIN_DEFAULT, crayon__('Show the plain code by default')));
		self::checkbox(array(CrayonSettings::COPY, crayon__('Enable code copy/paste')));
		echo '</span>';
		self::checkbox(array(CrayonSettings::POPUP, crayon__('Enable opening code in a window')));
		echo crayon__('Display scrollbars (when needed)'),': ';
		self::dropdown(CrayonSettings::SCROLL);
		echo crayon__('Tab size in spaces'),': ';
		self::textbox(array('name' => CrayonSettings::TAB_SIZE, 'size' => 2, 'break' => TRUE));
		self::checkbox(array(CrayonSettings::TRIM_WHITESPACE, crayon__('Remove whitespace surrounding the shortcode content')));
		self::checkbox(array(CrayonSettings::CAPTURE_PRE, crayon__('Capture &lt;pre&gt; tags as Crayons')));
		self::checkbox(array(CrayonSettings::CAPTURE_MINI_TAG, crayon__('Capture Mini Tags like [php][/php] as Crayons.') . ' <a href="http://bit.ly/rRZuzk" target="_blank">' . crayon__('Learn More') . '</a>'));
		self::checkbox(array(CrayonSettings::PLAIN_TAG, crayon__('Enable [plain][/plain] tag.') . ' <a href="http://bit.ly/rRZuzk" target="_blank">' . crayon__('Learn More') . '</a>'));
		self::checkbox(array(CrayonSettings::MIXED, crayon__('Allow Mixed Language Highlighting with delimiters and tags.') . ' <a href="http://bit.ly/ukwts2" target="_blank">' . crayon__('Learn More') . '</a>'));
		self::checkbox(array(CrayonSettings::SHOW_MIXED, crayon__('Show Mixed Language Icon (+)')));
	}

	public static function files() {
		echo '<a name="files"></a>';
		echo crayon__('When loading local files and a relative path is given for the URL, use the absolute path'),': ',
			'<div style="margin-left: 20px">', home_url(), '/';
		self::textbox(array('name' => CrayonSettings::LOCAL_PATH));
		echo '</div>', crayon__('Followed by your relative URL.');
	}

	public static function misc() {
		echo crayon__('Clear the cache used to store remote code requests'),': ';
		self::dropdown(CrayonSettings::CACHE, false);
		echo '<input type="submit" id="crayon-cache-clear" name="crayon-cache-clear" class="button-secondary" value="', crayon__('Clear Now'), '" /><br/>';
		self::checkbox(array(CrayonSettings::EFFICIENT_ENQUEUE, crayon__('Attempt to load Crayon\'s CSS and JavaScript only when needed').'. <a href="http://ak.net84.net/?p=660" target="_blank">'.crayon__('Why?').'</a>'));
		self::checkbox(array(CrayonSettings::TOUCHSCREEN, crayon__('Disable mouse gestures for touchscreen devices (eg. MouseOver)')));
		self::checkbox(array(CrayonSettings::DISABLE_ANIM, crayon__('Disable animations')));
		self::checkbox(array(CrayonSettings::DISABLE_RUNTIME, crayon__('Disable runtime stats')));
		//self::checkbox(array(CrayonSettings::EXP_SCROLL, 'Use experimental CSS3 scrollbars (visible only in Chrome and Safari for now)'));
	}

	// Debug Fields ===========================================================

	public static function errors() {
		self::checkbox(array(CrayonSettings::ERROR_LOG, crayon__('Log errors for individual Crayons')));
		self::checkbox(array(CrayonSettings::ERROR_LOG_SYS, crayon__('Log system-wide errors')));
		self::checkbox(array(CrayonSettings::ERROR_MSG_SHOW, crayon__('Display custom message for errors')));
		self::textbox(array('name' => CrayonSettings::ERROR_MSG, 'size' => 60, 'margin' => TRUE));
	}

	public static function log() {
		$log = CrayonLog::log();
		touch(CRAYON_LOG_FILE);
		$exists = file_exists(CRAYON_LOG_FILE);
		$writable = is_writable(CRAYON_LOG_FILE);
		if (!empty($log)) {
			echo '<div id="crayon-log-wrapper">', '<div id="crayon-log"><div id="crayon-log-text">', $log,
				'</div></div>', '<div id="crayon-log-controls">',
				'<input type="button" id="crayon-log-toggle" class="button-secondary" value="', crayon__('Show Log'), '"> ',
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
		global $CRAYON_VERSION, $CRAYON_DATE, $CRAYON_AUTHOR, $CRAYON_TWITTER, $CRAYON_EMAIL;
		echo '<a name="info"></a>';
		$version = '<b>'.crayon__('Version').':</b> ' . $CRAYON_VERSION;
		$date = $CRAYON_DATE;
		$developer = '<b>'.crayon__('Developer').':</b> ' . $CRAYON_AUTHOR;
		/*$paypal = '<form action="https://www.paypal.com/cgi-bin/webscr" method="post">
<input type="hidden" name="cmd" value="_s-xclick">
<input type="hidden" name="encrypted" value="-----BEGIN PKCS7-----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-----END PKCS7-----
">
<input type="image" src="https://www.paypalobjects.com/en_AU/i/btn/btn_donate_SM.gif" border="0" name="submit" alt="PayPal � The safer, easier way to pay online.">
<img alt="" border="0" src="https://www.paypalobjects.com/en_AU/i/scr/pixel.gif" width="1" height="1">
</form>
		';*/
		$paypal = '<a href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=AW99EMEPQ4CFE&lc=AU&item_name=Crayon%20Syntax%20Highlighter%20Donation&item_number=crayon%2ddonate&currency_code=AUD&bn=PP%2dDonationsBF%3abtn_donate_SM%2egif%3aNonHosted" target="_blank"><img src="'.plugins_url(CRAYON_DONATE_BUTTON, __FILE__).'"></a>
		';
		$links = '<a id="twitter-icon" href="' . $CRAYON_TWITTER . '" target="_blank"></a>
					<a id="gmail-icon" href="mailto:' . $CRAYON_EMAIL . '" target="_blank"></a><div id="crayon-donate">' . $paypal . '</div>';
					//<a id="donate-icon" href="" target="_blank"></a>
		echo '
		<table id="crayon-info" border="0">
		  <tr>
		    <td>'.$version.' - '.$date.'</td>
		  </tr>
		  <tr>
		    <td>'.$developer.'</td>
		    <td></td>
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
		if ($file == CrayonWP::basename()) {
			$meta[] = '<a href="options-general.php?page=crayon_settings">' . crayon__('Settings') . '</a>';
			if (CRAYON_THEME_EDITOR) {
				$meta[] = '<a href="options-general.php?page=crayon_settings&subpage=theme_editor">' . crayon__('Theme Editor') . '</a>';
			}
			$meta[] = '<a href="http://bit.ly/crayondonate" target="_blank">' . crayon__('Donate') . '</a>';
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