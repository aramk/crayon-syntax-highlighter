<?php
require_once('global.php');
require_once(CRAYON_LANGS_PHP);
require_once(CRAYON_THEMES_PHP);
require_once(CRAYON_FONTS_PHP);
require_once(CRAYON_SETTINGS_PHP);

/*  Manages global settings within WP and integrates them with CrayonSettings.
 CrayonHighlighter and any non-WP classes will only use CrayonSettings to separate
the implementation of global settings and ensure any system can use them. */

class CrayonSettingsWP {
    // Properties and Constants ===============================================

    // A copy of the current options in db
    private static $options = NULL;
    // Posts containing crayons in db
    private static $crayon_posts = NULL;
    // Posts containing legacy tags in db
    private static $crayon_legacy_posts = NULL;
    // An array of cache names for use with Transients API
    private static $cache = NULL;
    // Array of settings to pass to js
    private static $js_settings = NULL;
    private static $js_strings = NULL;
    private static $admin_js_settings = NULL;
    private static $admin_js_strings = NULL;
    private static $admin_page = '';
    private static $is_fully_loaded = FALSE;

    const SETTINGS = 'crayon_fields';
    const FIELDS = 'crayon_settings';
    const OPTIONS = 'crayon_options';
    const POSTS = 'crayon_posts';
    const LEGACY_POSTS = 'crayon_legacy_posts';
    const CACHE = 'crayon_cache';
    const GENERAL = 'crayon_general';
    const DEBUG = 'crayon_debug';
    const ABOUT = 'crayon_about';

    // Used on submit
    const LOG_CLEAR = 'log_clear';
    const LOG_EMAIL_ADMIN = 'log_email_admin';
    const LOG_EMAIL_DEV = 'log_email_dev';
    const SAMPLE_CODE = 'sample-code';
    const CACHE_CLEAR = 'crayon-cache-clear';

    private function __construct() {
    }

    // Methods ================================================================

    public static function admin_load() {
        self::$admin_page = $admin_page = add_options_page('Crayon Syntax Highlighter ' . crayon__('Settings'), 'Crayon', 'manage_options', 'crayon_settings', 'CrayonSettingsWP::settings');
        add_action("admin_print_scripts-$admin_page", 'CrayonSettingsWP::admin_scripts');
        add_action("admin_print_styles-$admin_page", 'CrayonSettingsWP::admin_styles');
        add_action("admin_print_scripts-$admin_page", 'CrayonThemeEditorWP::admin_resources');
        // Register settings, second argument is option name stored in db
        register_setting(self::FIELDS, self::OPTIONS, 'CrayonSettingsWP::settings_validate');
        add_action("admin_head-$admin_page", 'CrayonSettingsWP::admin_init');
        // Register settings for post page
        add_action("admin_print_styles-post-new.php", 'CrayonSettingsWP::admin_scripts');
        add_action("admin_print_styles-post.php", 'CrayonSettingsWP::admin_scripts');
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
        if (CRAYON_MINIFY) {
            wp_enqueue_style('crayon', plugins_url(CRAYON_STYLE_MIN, __FILE__), array('editor-buttons'), $CRAYON_VERSION);
        } else {
            wp_enqueue_style('crayon', plugins_url(CRAYON_STYLE, __FILE__), array(), $CRAYON_VERSION);
            wp_enqueue_style('crayon_global', plugins_url(CRAYON_STYLE_GLOBAL, __FILE__), array(), $CRAYON_VERSION);
            wp_enqueue_style('crayon_admin', plugins_url(CRAYON_STYLE_ADMIN, __FILE__), array('editor-buttons'), $CRAYON_VERSION);
        }
    }

    public static function admin_scripts() {
        global $CRAYON_VERSION;

        if (CRAYON_MINIFY) {
            CrayonWP::enqueue_resources();
        } else {
            wp_enqueue_script('crayon_util_js', plugins_url(CRAYON_JS_UTIL, __FILE__), array('jquery'), $CRAYON_VERSION);
            self::other_scripts();
        }

        self::init_js_settings();

        if (is_admin()) {
            wp_enqueue_script('crayon_admin_js', plugins_url(CRAYON_JS_ADMIN, __FILE__), array('jquery', 'crayon_js', 'wpdialogs'), $CRAYON_VERSION);
            self::init_admin_js_settings();
        }
    }

    public static function other_scripts() {
        global $CRAYON_VERSION;
        self::load_settings(TRUE);
        $deps = array('jquery', 'crayon_util_js');
        if (CrayonGlobalSettings::val(CrayonSettings::POPUP) || is_admin()) {
            // TODO include anyway and minify
            wp_enqueue_script('crayon_jquery_popup', plugins_url(CRAYON_JQUERY_POPUP, __FILE__), array('jquery'), $CRAYON_VERSION);
            $deps[] = 'crayon_jquery_popup';
        }
        wp_enqueue_script('crayon_js', plugins_url(CRAYON_JS, __FILE__), $deps, $CRAYON_VERSION);
    }

    public static function init_js_settings() {
        // This stores JS variables used in AJAX calls and in the JS files
        global $CRAYON_VERSION;
        self::load_settings(TRUE);
        if (!self::$js_settings) {
            self::$js_settings = array(
                'version' => $CRAYON_VERSION,
                'is_admin' => intval(is_admin()),
                'ajaxurl' => admin_url('admin-ajax.php'),
                'prefix' => CrayonSettings::PREFIX,
                'setting' => CrayonSettings::SETTING,
                'selected' => CrayonSettings::SETTING_SELECTED,
                'changed' => CrayonSettings::SETTING_CHANGED,
                'special' => CrayonSettings::SETTING_SPECIAL,
                'orig_value' => CrayonSettings::SETTING_ORIG_VALUE,
                'debug' => CRAYON_DEBUG
            );
        }
        if (!self::$js_strings) {
            self::$js_strings = array(
                'copy' => crayon__('Press %s to Copy, %s to Paste'),
                'minimize' => crayon__('Click To Expand Code')
            );
        }
        if (CRAYON_MINIFY) {
            wp_localize_script('crayon_js', 'CrayonSyntaxSettings', self::$js_settings);
            wp_localize_script('crayon_js', 'CrayonSyntaxStrings', self::$js_strings);
        } else {
            wp_localize_script('crayon_util_js', 'CrayonSyntaxSettings', self::$js_settings);
            wp_localize_script('crayon_util_js', 'CrayonSyntaxStrings', self::$js_strings);
        }
    }

    public static function init_admin_js_settings() {
        if (!self::$admin_js_settings) {
            // We need to load themes at this stage
            CrayonSettingsWP::load_settings();
            $themes_ = CrayonResources::themes()->get();
            $stockThemes = array();
            $userThemes = array();
            foreach ($themes_ as $theme) {
                $id = $theme->id();
                $name = $theme->name();
                if ($theme->user()) {
                    $userThemes[$id] = $name;
                } else {
                    $stockThemes[$id] = $name;
                }
            }
            self::$admin_js_settings = array(
                'themes' => array_merge($stockThemes, $userThemes),
                'stockThemes' => $stockThemes,
                'userThemes' => $userThemes,
                'defaultTheme' => CrayonThemes::DEFAULT_THEME,
                'themesURL' => CrayonResources::themes()->dirurl(false),
                'userThemesURL' => CrayonResources::themes()->dirurl(true),
                'sampleCode' => self::SAMPLE_CODE,
                'dialogFunction' => 'wpdialog'
            );
            wp_localize_script('crayon_admin_js', 'CrayonAdminSettings', self::$admin_js_settings);
        }
        if (!self::$admin_js_strings) {
            self::$admin_js_strings = array(
                'prompt' => crayon__("Prompt"),
                'value' => crayon__("Value"),
                'alert' => crayon__("Alert"),
                'no' => crayon__("No"),
                'yes' => crayon__("Yes"),
                'confirm' => crayon__("Confirm"),
                'changeCode' => crayon__("Change Code")
            );
            wp_localize_script('crayon_admin_js', 'CrayonAdminStrings', self::$admin_js_strings);
        }
    }

    public static function settings() {
        if (!current_user_can('manage_options')) {
            wp_die(crayon__('You do not have sufficient permissions to access this page.'));
        }
        ?>

        <script type="text/javascript">
            jQuery(document).ready(function () {
                CrayonSyntaxAdmin.init();
            });
        </script>

        <div id="crayon-main-wrap" class="wrap">

            <div id="icon-options-general" class="icon32">
                <br>
            </div>
            <h2>
                Crayon Syntax Highlighter
                <?php crayon_e('Settings'); ?>
            </h2>
            <?php self::help(); ?>
            <form id="crayon-settings-form" action="options.php" method="post">
                <?php
                settings_fields(self::FIELDS);
                ?>

                <?php
                do_settings_sections(self::SETTINGS);
                ?>

                <p class="submit">
                    <input type="submit" name="submit" id="submit" class="button-primary"
                           value="<?php
                           crayon_e('Save Changes');
                           ?>"/><span style="width:10px; height: 5px; float:left;"></span>
                    <input type="submit"
                           name="<?php echo self::OPTIONS; ?>[reset]"
                           id="reset"
                           class="button-primary"
                           value="<?php
                           crayon_e('Reset Settings');
                           ?>"/>
                </p>
            </form>
        </div>

        <div id="crayon-theme-editor-wrap" class="wrap"></div>

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

            // For local file loading
            // This is used to decouple WP functions from internal Crayon classes
            CrayonGlobalSettings::site_url(home_url());
            CrayonGlobalSettings::site_path(ABSPATH);
            CrayonGlobalSettings::plugin_path(plugins_url('', __FILE__));
            $upload = wp_upload_dir();

            CrayonLog::debug($upload, "WP UPLOAD FUNCTION");
            CrayonGlobalSettings::upload_path(CrayonUtil::path_slash($upload['basedir']) . CRAYON_DIR);
            CrayonGlobalSettings::upload_url($upload['baseurl'] . '/' . CRAYON_DIR);
            CrayonLog::debug(CrayonGlobalSettings::upload_path(), "UPLOAD PATH");
            CrayonGlobalSettings::set_mkdir('wp_mkdir_p');

            // Load all available languages and themes
            CrayonResources::langs()->load();
            CrayonResources::themes()->load();

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

    // Crayon posts

    /**
     * This loads the posts marked as containing Crayons
     */
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

    /**
     * This looks through all posts and marks those which contain Crayons
     */
// 	public static function scan_and_save_posts() {
// 		self::save_posts(CrayonWP::scan_posts(TRUE, TRUE));
// 	}

    /**
     * Saves the marked posts to the db
     */
    public static function save_posts($posts = NULL) {
        if ($posts === NULL) {
            $posts = self::$crayon_posts;
        }
        update_option(self::POSTS, $posts);
        self::load_posts();
    }

    /**
     * Adds a post as containing a Crayon
     */
    public static function add_post($id, $save = TRUE) {
        self::load_posts();
        if (!in_array($id, self::$crayon_posts)) {
            self::$crayon_posts[] = $id;
        }
        if ($save) {
            self::save_posts();
        }
    }

    /**
     * Removes a post as not containing a Crayon
     */
    public static function remove_post($id, $save = TRUE) {
        self::load_posts();
        $key = array_search($id, self::$crayon_posts);
        if ($key === false) {
            return;
        }
        unset(self::$crayon_posts[$key]);
        if ($save) {
            self::save_posts();
        }
    }

    public static function remove_posts() {
        self::$crayon_posts = array();
        self::save_posts();
    }

    // Crayon legacy posts

    /**
     * This loads the posts marked as containing Crayons
     */
    public static function load_legacy_posts($force = FALSE) {
        if (self::$crayon_legacy_posts === NULL || $force) {
            // Load from db
            if (!(self::$crayon_legacy_posts = get_option(self::LEGACY_POSTS))) {
                // Posts don't exist! Scan for them. This will fill self::$crayon_legacy_posts
                self::$crayon_legacy_posts = CrayonWP::scan_legacy_posts();
                update_option(self::LEGACY_POSTS, self::$crayon_legacy_posts);
            }
        }
        return self::$crayon_legacy_posts;
    }

    /**
     * This looks through all posts and marks those which contain Crayons
     */
// 	public static function scan_and_save_posts() {
// 		self::save_posts(CrayonWP::scan_posts(TRUE, TRUE));
// 	}

    /**
     * Saves the marked posts to the db
     */
    public static function save_legacy_posts($posts = NULL) {
        if ($posts === NULL) {
            $posts = self::$crayon_legacy_posts;
        }
        update_option(self::LEGACY_POSTS, $posts);
        self::load_legacy_posts();
    }

    /**
     * Adds a post as containing a Crayon
     */
    public static function add_legacy_post($id, $save = TRUE) {
        self::load_legacy_posts();
        if (!in_array($id, self::$crayon_legacy_posts)) {
            self::$crayon_legacy_posts[] = $id;
        }
        if ($save) {
            self::save_legacy_posts();
        }
    }

    /**
     * Removes a post as not containing a Crayon
     */
    public static function remove_legacy_post($id, $save = TRUE) {
        self::load_legacy_posts();
        $key = array_search($id, self::$crayon_legacy_posts);
        if ($key === false) {
            return;
        }
        unset(self::$crayon_legacy_posts[$key]);
        if ($save) {
            self::save_legacy_posts();
        }
    }

    public static function remove_legacy_posts() {
        self::$crayon_legacy_posts = array();
        self::save_legacy_posts();
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

    public static function admin_init() {
        // Load default settings if they don't exist
        self::load_settings();

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
        self::add_field(self::GENERAL, crayon__('Posts'), 'posts');
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
        // Convert old tags
        if (array_key_exists('convert', $inputs)) {
            $encode = array_key_exists('convert_encode', $inputs);
            CrayonWP::convert_tags($encode);
        }
        // Refresh internal tag management
        if (array_key_exists('refresh_tags', $inputs)) {
            CrayonWP::refresh_posts();
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
        if (array_key_exists(self::CACHE_CLEAR, $_POST)) {
            self::clear_cache();
        }

        // If settings don't exist in input, set them to default
        $global_settings = CrayonSettings::get_defaults();

        $ignored = array(CrayonSettings::HIDE_HELP);

        foreach ($global_settings as $setting) {
            // XXX Ignore some settings
            if (in_array($setting->name(), $ignored)) {
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

        $refresh = array(
            // These should trigger a refresh of which posts contain crayons, since they affect capturing
            CrayonSettings::INLINE_TAG => TRUE,
            CrayonSettings::INLINE_TAG_CAPTURE => TRUE,
            CrayonSettings::CODE_TAG_CAPTURE => TRUE,
            CrayonSettings::BACKQUOTE => TRUE,
            CrayonSettings::CAPTURE_PRE => TRUE,
            CrayonSettings::CAPTURE_MINI_TAG => TRUE,
            CrayonSettings::PLAIN_TAG => TRUE
        );

        // Validate inputs
        foreach ($inputs as $input => $value) {
            // Convert all array setting values to ints
            $inputs[$input] = $value = CrayonSettings::validate($input, $value);
            // Clear cache when changed
            if (CrayonGlobalSettings::has_changed($input, CrayonSettings::CACHE, $value)) {
                self::clear_cache();
            }
            if (isset($refresh[$input])) {
                if (CrayonGlobalSettings::has_changed($input, $input, $value)) {
                    // Needs to take place, in case it refresh depends on changed value
                    CrayonGlobalSettings::set($input, $value);
                    CrayonWP::refresh_posts();
                }
            }
        }

        return $inputs;
    }

    // Section callback functions

    public static function blank() {
    } // Used for required callbacks with blank content

    // Input Drawing ==========================================================

    private static function input($args) {
        $id = '';
        $size = 40;
        $margin = FALSE;
        $preview = 1;
        $break = FALSE;
        $type = 'text';
        extract($args);

        echo '<input id="', CrayonSettings::PREFIX, $id, '" name="', self::OPTIONS, '[', $id, ']" class="' . CrayonSettings::SETTING . '" size="', $size, '" type="', $type, '" value="',
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
        echo '<input id="', CrayonSettings::PREFIX, $id, '" name="', self::OPTIONS, '[', $id, ']" type="checkbox" class="' . CrayonSettings::SETTING . '" value="1"', $checked_str,
        ' crayon-preview="', ($preview ? 1 : 0), '" /> ', '<label for="', CrayonSettings::PREFIX, $id, '">', $text, '</label>', ($line_break ? CRAYON_BR : '');
    }

    // Draws a dropdown by loading the default value (an array) from a setting
    private static function dropdown($id, $line_break = TRUE, $preview = TRUE, $echo = TRUE, $resources = NULL, $selected = NULL) {
        if (!array_key_exists($id, self::$options)) {
            return;
        }
        $resources = $resources != NULL ? $resources : CrayonGlobalSettings::get($id)->def();

        $return = '<select id="' . CrayonSettings::PREFIX . $id . '" name="' . self::OPTIONS . '[' . $id . ']" class="' . CrayonSettings::SETTING . '" crayon-preview="' . ($preview ? 1 : 0) . '">';
        foreach ($resources as $k => $v) {
            if (is_array($v) && count($v)) {
                $data = $v[0];
                $text = $v[1];
            } else {
                $text = $v;
            }
            $is_selected = $selected !== NULL && $selected == $k ? 'selected' : selected(self::$options[$id], $k, FALSE);
            $return .= '<option ' . (isset($data) ? 'data-value="' . $data . '"' : '') . ' value="' . $k . '" ' . $is_selected . '>' . $text . '</option>';
        }
        $return .= '</select>' . ($line_break ? CRAYON_BR : '');
        if ($echo) {
            echo $return;
        } else {
            return $return;
        }
    }

    private static function button($args = array()) {
        extract($args);
        CrayonUtil::set_var($id, '');
        CrayonUtil::set_var($class, '');
        CrayonUtil::set_var($onclick, '');
        CrayonUtil::set_var($title, '');
        return '<a id="' . $id . '" class="button-primary ' . $class . '" onclick="' . $onclick . '">' . $title . '</a>';
    }

    private static function info_span($name, $text) {
        echo '<span id="', $name, '-info">', $text, '</span>';
    }

    private static function span($text) {
        echo '<span>', $text, '</span>';
    }

    // General Fields =========================================================
    public static function help() {
        global $CRAYON_WEBSITE, $CRAYON_TWITTER, $CRAYON_GIT, $CRAYON_PLUGIN_WP, $CRAYON_DONATE;
        if (CrayonGlobalSettings::val(CrayonSettings::HIDE_HELP)) {
            return;
        }
        echo '<div id="crayon-help" class="updated settings-error crayon-help">
				<p><strong>Howdy, coder!</strong> Thanks for using Crayon. <strong>Useful Links:</strong> <a href="' . $CRAYON_WEBSITE . '" target="_blank">Documentation</a>, <a href="' . $CRAYON_GIT . '" target="_blank">GitHub</a>, <a href="' . $CRAYON_PLUGIN_WP . '" target="_blank">Plugin Page</a>, <a href="' . $CRAYON_TWITTER . '" target="_blank">Twitter</a>. Crayon has always been free. If you value my work please consider a <a href="' . $CRAYON_DONATE . '">small donation</a> to show your appreciation. Thanks! <a class="crayon-help-close">X</a></p></div>
						';
    }

    public static function help_screen() {
        $screen = get_current_screen();

        if ($screen->id != self::$admin_page) {
            return;
        }
    }

    public static function metrics() {
        echo '<div id="crayon-section-metrics" class="crayon-hide-inline">';
        self::checkbox(array(CrayonSettings::HEIGHT_SET, '<span class="crayon-span-50">' . crayon__('Height') . ' </span>'), FALSE);
        self::dropdown(CrayonSettings::HEIGHT_MODE, FALSE);
        echo ' ';
        self::input(array('id' => CrayonSettings::HEIGHT, 'size' => 8));
        echo ' ';
        self::dropdown(CrayonSettings::HEIGHT_UNIT);
        self::checkbox(array(CrayonSettings::WIDTH_SET, '<span class="crayon-span-50">' . crayon__('Width') . ' </span>'), FALSE);
        self::dropdown(CrayonSettings::WIDTH_MODE, FALSE);
        echo ' ';
        self::input(array('id' => CrayonSettings::WIDTH, 'size' => 8));
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
            self::input(array('id' => $margin, 'size' => 8, 'preview' => FALSE));
            echo '<span class="crayon-span-margin">', crayon__('Pixels'), '</span>', CRAYON_BR;
        }
        echo '<span class="crayon-span" style="min-width: 135px;">' . crayon__('Horizontal Alignment') . ' </span>';
        self::dropdown(CrayonSettings::H_ALIGN);
        echo '<div id="crayon-subsection-float">';
        self::checkbox(array(CrayonSettings::FLOAT_ENABLE, crayon__('Allow floating elements to surround Crayon')), FALSE, FALSE);
        echo '</div>';
        echo '<span class="crayon-span-100">' . crayon__('Inline Margin') . ' </span>';
        self::input(array('id' => CrayonSettings::INLINE_MARGIN, 'size' => 2));
        echo '<span class="crayon-span-margin">', crayon__('Pixels'), '</span>';
        echo '</div>';
    }

    public static function toolbar() {
        echo '<div id="crayon-section-toolbar" class="crayon-hide-inline">';
        self::span(crayon__('Display the Toolbar') . ' ');
        self::dropdown(CrayonSettings::TOOLBAR);
        echo '<div id="crayon-subsection-toolbar">';
        self::checkbox(array(CrayonSettings::TOOLBAR_OVERLAY, crayon__('Overlay the toolbar on code rather than push it down when possible')));
        self::checkbox(array(CrayonSettings::TOOLBAR_HIDE, crayon__('Toggle the toolbar on single click when it is overlayed')));
        self::checkbox(array(CrayonSettings::TOOLBAR_DELAY, crayon__('Delay hiding the toolbar on MouseOut')));
        echo '</div>';
        self::checkbox(array(CrayonSettings::SHOW_TITLE, crayon__('Display the title when provided')));
        self::span(crayon__('Display the language') . ' ');
        self::dropdown(CrayonSettings::SHOW_LANG);
        echo '</div>';
    }

    public static function lines() {
        echo '<div id="crayon-section-lines" class="crayon-hide-inline">';
        self::checkbox(array(CrayonSettings::STRIPED, crayon__('Display striped code lines')));
        self::checkbox(array(CrayonSettings::MARKING, crayon__('Enable line marking for important lines')));
        self::checkbox(array(CrayonSettings::RANGES, crayon__('Enable line ranges for showing only parts of code')));
        self::checkbox(array(CrayonSettings::NUMS, crayon__('Display line numbers by default')));
        self::checkbox(array(CrayonSettings::NUMS_TOGGLE, crayon__('Enable line number toggling')));
        self::checkbox(array(CrayonSettings::WRAP, crayon__('Wrap lines by default')));
        self::checkbox(array(CrayonSettings::WRAP_TOGGLE, crayon__('Enable line wrap toggling')));
        self::span(crayon__('Start line numbers from') . ' ');
        self::input(array('id' => CrayonSettings::START_LINE, 'size' => 2, 'break' => TRUE));
        echo '</div>';
    }

    public static function langs() {
        echo '<a name="langs"></a>';
        // Specialised dropdown for languages
        if (array_key_exists(CrayonSettings::FALLBACK_LANG, self::$options)) {
            if (($langs = CrayonParser::parse_all()) != FALSE) {
                $langs = CrayonLangs::sort_by_name($langs);
                self::span(crayon__('When no language is provided, use the fallback') . ': ');
                self::dropdown(CrayonSettings::FALLBACK_LANG, FALSE, TRUE, TRUE, $langs);
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
                    echo '<br/><span class="crayon-error">', sprintf(crayon__('The selected language with id %s could not be loaded'), '<strong>' . $db_fallback . '</strong>'), '. </span>';
                }
                // Language parsing info
                echo CRAYON_BR, '<div id="crayon-subsection-langs-info"><div>' . self::button(array('id' => 'show-langs', 'title' => crayon__('Show Languages'))) . '</div></div>';
            } else {
                echo crayon__('No languages could be parsed.');
            }
        }
    }

    public static function show_langs() {
        CrayonSettingsWP::load_settings();
        require_once(CRAYON_PARSER_PHP);
        if (($langs = CrayonParser::parse_all()) != FALSE) {
            $langs = CrayonLangs::sort_by_name($langs);
            echo '<table class="crayon-table" cellspacing="0" cellpadding="0"><tr class="crayon-table-header">',
            '<td>', crayon__('ID'), '</td><td>', crayon__('Name'), '</td><td>', crayon__('Version'), '</td><td>', crayon__('File Extensions'), '</td><td>', crayon__('Aliases'), '</td><td>', crayon__('State'), '</td></tr>';
            $keys = array_values($langs);
            for ($i = 0; $i < count($langs); $i++) {
                $lang = $keys[$i];
                $tr = ($i == count($langs) - 1) ? 'crayon-table-last' : '';
                echo '<tr class="', $tr, '">',
                '<td>', $lang->id(), '</td>',
                '<td>', $lang->name(), '</td>',
                '<td>', $lang->version(), '</td>',
                '<td>', implode(', ', $lang->ext()), '</td>',
                '<td>', implode(', ', $lang->alias()), '</td>',
                '<td class="', strtolower(CrayonUtil::space_to_hyphen($lang->state_info())), '">',
                $lang->state_info(), '</td>',
                '</tr>';
            }
            echo '</table><br/>' . crayon__("Languages that have the same extension as their name don't need to explicitly map extensions.");
        } else {
            echo crayon__('No languages could be found.');
        }
        exit();
    }

    public static function posts() {
        echo '<a name="posts"></a>';
        echo self::button(array('id' => 'show-posts', 'title' => crayon__('Show Crayon Posts')));
        echo ' <input type="submit" name="', self::OPTIONS, '[refresh_tags]" id="refresh_tags" class="button-primary" value="', crayon__('Refresh'), '" />';
        echo self::help_button('http://aramk.com/blog/2012/09/26/internal-post-management-crayon/');
        echo '<div id="crayon-subsection-posts-info"></div>';
    }

    public static function post_cmp($a, $b) {
        $a = $a->post_modified;
        $b = $b->post_modified;
        if ($a == $b) {
            return 0;
        } else {
            return $a < $b ? 1 : -1;
        }
    }

    public static function show_posts() {
        CrayonSettingsWP::load_settings();
        $postIDs = self::load_posts();
        $legacy_posts = self::load_legacy_posts();
        // Avoids O(n^2) by using a hash map, tradeoff in using strval
        $legacy_map = array();
        foreach ($legacy_posts as $legacyID) {
            $legacy_map[strval($legacyID)] = TRUE;
        }

        echo '<table class="crayon-table" cellspacing="0" cellpadding="0"><tr class="crayon-table-header">',
        '<td>', crayon__('ID'), '</td><td>', crayon__('Title'), '</td><td>', crayon__('Posted'), '</td><td>', crayon__('Modifed'), '</td><td>', crayon__('Contains Legacy Tags?'), '</td></tr>';

        $posts = array();
        for ($i = 0; $i < count($postIDs); $i++) {
            $posts[$i] = get_post($postIDs[$i]);
        }

        usort($posts, 'CrayonSettingsWP::post_cmp');

        for ($i = 0; $i < count($posts); $i++) {
            $post = $posts[$i];
            $postID = $post->ID;
            $title = $post->post_title;
            $title = !empty($title) ? $title : 'N/A';
            $tr = ($i == count($posts) - 1) ? 'crayon-table-last' : '';
            echo '<tr class="', $tr, '">',
            '<td>', $postID, '</td>',
            '<td><a href="', $post->guid, '" target="_blank">', $title, '</a></td>',
            '<td>', $post->post_date, '</td>',
            '<td>', $post->post_modified, '</td>',
            '<td>', isset($legacy_map[strval($postID)]) ? '<span style="color: red;">' . crayon__('Yes') . '</a>' : crayon__('No'), '</td>',
            '</tr>';
        }

        echo '</table>';
        exit();
    }

    public static function show_preview() {
        echo '<div id="content">';

        self::load_settings(); // Run first to ensure global settings loaded

        $crayon = CrayonWP::instance();

        // Settings to prevent from validating
        $preview_settings = array(self::SAMPLE_CODE);

        // Load settings from GET and validate
        foreach ($_POST as $key => $value) {
            //	echo $key, ' ', $value , '<br/>';
            $value = stripslashes($value);
            if (!in_array($key, $preview_settings)) {
                $_POST[$key] = CrayonSettings::validate($key, $value);
            } else {
                $_POST[$key] = $value;
            }
        }
        $crayon->settings($_POST);
        if (!isset($crayon_preview_dont_override_get) || !$crayon_preview_dont_override_get) {
            $settings = array(CrayonSettings::TOP_SET => TRUE, CrayonSettings::TOP_MARGIN => 10,
                CrayonSettings::BOTTOM_SET => FALSE, CrayonSettings::BOTTOM_MARGIN => 0);
            $crayon->settings($settings);
        }

        // Print the theme CSS
        $theme_id = $crayon->setting_val(CrayonSettings::THEME);
        if ($theme_id != NULL) {
            echo CrayonResources::themes()->get_css($theme_id, date('U'));
        }

        $font_id = $crayon->setting_val(CrayonSettings::FONT);
        if ($font_id != NULL /*&& $font_id != CrayonFonts::DEFAULT_FONT*/) {
            echo CrayonResources::fonts()->get_css($font_id);
        }

        // Load custom code based on language
        $lang = $crayon->setting_val(CrayonSettings::FALLBACK_LANG);
        $path = CrayonGlobalSettings::plugin_path() . CRAYON_UTIL_DIR . '/sample/' . $lang . '.txt';

        if (isset($_POST[self::SAMPLE_CODE])) {
            $crayon->code($_POST[self::SAMPLE_CODE]);
        } else if ($lang && @file_exists($path)) {
            $crayon->url($path);
        } else {
            $code = "
// A sample class
class Human {
	private int age = 0;
	public void birthday() {
		age++;
		print('Happy Birthday!');
	}
}
";
            $crayon->code($code);
        }
        $crayon->title('Sample Code');
        $crayon->marked('5-7');
        $crayon->output($highlight = true, $nums = true, $print = true);
        echo '</div>';
        crayon_load_plugin_textdomain();
        exit();
    }

    public static function theme($editor = FALSE) {
        $db_theme = self::$options[CrayonSettings::THEME]; // Theme name from db
        if (!array_key_exists(CrayonSettings::THEME, self::$options)) {
            $db_theme = '';
        }
        $themes_array = CrayonResources::themes()->get_array();
        // Mark user themes
        foreach ($themes_array as $id => $name) {
            $mark = CrayonResources::themes()->get($id)->user() ? ' *' : '';
            $themes_array[$id] = array($name, $name . $mark);
        }
        $missing_theme = !CrayonResources::themes()->is_loaded($db_theme) || !CrayonResources::themes()->exists($db_theme);
        self::dropdown(CrayonSettings::THEME, FALSE, FALSE, TRUE, $themes_array, $missing_theme ? CrayonThemes::DEFAULT_THEME : NULL);
        if ($editor) {
            return;
        }
        // Theme editor
        if (CRAYON_THEME_EDITOR) {
            // 			echo '<a id="crayon-theme-editor-button" class="button-primary crayon-admin-button" loading="'. crayon__('Loading...') .'" loaded="'. crayon__('Theme Editor') .'" >'. crayon__('Theme Editor') .'</a></br>';
            echo '<div id="crayon-theme-editor-admin-buttons">';
            $buttons = array('edit' => crayon__('Edit'), 'duplicate' => crayon__('Duplicate'), 'submit' => crayon__('Submit'),
                'delete' => crayon__('Delete'));
            foreach ($buttons as $k => $v) {
                echo '<a id="crayon-theme-editor-', $k, '-button" class="button-secondary crayon-admin-button" loading="', crayon__('Loading...'), '" loaded="', $v, '" >', $v, '</a>';
            }
            echo '<span class="crayon-span-5"></span>', self::help_button('http://aramk.com/blog/2012/12/27/crayon-theme-editor/'), '<span class="crayon-span-5"></span>', crayon__("Duplicate a Stock Theme into a User Theme to allow editing.");
            echo '</br></div>';
        }
        // Preview Box
        ?>
        <div id="crayon-theme-panel">
            <div id="crayon-theme-info"></div>
            <div id="crayon-live-preview-wrapper">
                <div id="crayon-live-preview-inner">
                    <div id="crayon-live-preview"></div>
                    <div id="crayon-preview-info">
                        <?php printf(crayon__('Change the %1$sfallback language%2$s to change the sample code or %3$schange it manually%4$s. Lines 5-7 are marked.'), '<a href="#langs">', '</a>', '<a id="crayon-change-code" href="#">', '</a>'); ?>
                    </div>
                </div>
            </div>
        </div>
        <?php
        // Preview checkbox
        self::checkbox(array(CrayonSettings::PREVIEW, crayon__('Enable Live Preview')), FALSE, FALSE);
        echo '</select><span class="crayon-span-10"></span>';
        self::checkbox(array(CrayonSettings::ENQUEUE_THEMES, crayon__('Enqueue themes in the header (more efficient).') . self::help_button('http://aramk.com/blog/2012/01/07/enqueuing-themes-and-fonts-in-crayon/')));
        // Check if theme from db is loaded
        if ($missing_theme) {
            echo '<span class="crayon-error">', sprintf(crayon__('The selected theme with id %s could not be loaded'), '<strong>' . $db_theme . '</strong>'), '. </span>';
        }
    }

    public static function font($editor = FALSE) {
        $db_font = self::$options[CrayonSettings::FONT]; // Theme name from db
        if (!array_key_exists(CrayonSettings::FONT, self::$options)) {
            $db_font = '';
        }
        $fonts_array = CrayonResources::fonts()->get_array();
        self::dropdown(CrayonSettings::FONT, FALSE, TRUE, TRUE, $fonts_array);
        echo '<span class="crayon-span-5"></span>';
        // TODO(aramk) Add this blog article back.
        // echo '<a href="http://bit.ly/Yr2Xv6" target="_blank">', crayon__('Add More'), '</a>';
        echo '<span class="crayon-span-10"></span>';
        self::checkbox(array(CrayonSettings::FONT_SIZE_ENABLE, crayon__('Custom Font Size') . ' '), FALSE);
        self::input(array('id' => CrayonSettings::FONT_SIZE, 'size' => 2));
        echo '<span class="crayon-span-margin">', crayon__('Pixels'), ',&nbsp;&nbsp;', crayon__('Line Height'), ' </span>';
        self::input(array('id' => CrayonSettings::LINE_HEIGHT, 'size' => 2));
        echo '<span class="crayon-span-margin">', crayon__('Pixels'), '</span></br>';
        if ((!CrayonResources::fonts()->is_loaded($db_font) || !CrayonResources::fonts()->exists($db_font))) {
            // Default font doesn't actually exist as a file, it means do not override default theme font
            echo '<span class="crayon-error">', sprintf(crayon__('The selected font with id %s could not be loaded'), '<strong>' . $db_font . '</strong>'), '. </span><br/>';
        }
        if ($editor) {
            return;
        }
        echo '<div style="height:10px;"></div>';
        self::checkbox(array(CrayonSettings::ENQUEUE_FONTS, crayon__('Enqueue fonts in the header (more efficient).') . self::help_button('http://aramk.com/blog/2012/01/07/enqueuing-themes-and-fonts-in-crayon/')));
    }

    public static function code($editor = FALSE) {
        echo '<div id="crayon-section-code-interaction" class="crayon-hide-inline-only">';
        self::checkbox(array(CrayonSettings::PLAIN, crayon__('Enable plain code view and display') . ' '), FALSE);
        self::dropdown(CrayonSettings::SHOW_PLAIN);
        echo '<span id="crayon-subsection-copy-check">';
        self::checkbox(array(CrayonSettings::PLAIN_TOGGLE, crayon__('Enable plain code toggling')));
        self::checkbox(array(CrayonSettings::SHOW_PLAIN_DEFAULT, crayon__('Show the plain code by default')));
        self::checkbox(array(CrayonSettings::COPY, crayon__('Enable code copy/paste')));
        echo '</span>';
        self::checkbox(array(CrayonSettings::POPUP, crayon__('Enable opening code in a window')));
        self::checkbox(array(CrayonSettings::SCROLL, crayon__('Always display scrollbars')));
        self::checkbox(array(CrayonSettings::MINIMIZE, crayon__('Minimize code') . self::help_button('http://aramk.com/blog/2013/01/15/minimizing-code-in-crayon/')));
        self::checkbox(array(CrayonSettings::EXPAND, crayon__('Expand code beyond page borders on mouseover')));
        self::checkbox(array(CrayonSettings::EXPAND_TOGGLE, crayon__('Enable code expanding toggling when possible')));
        echo '</div>';
        if (!$editor) {
            self::checkbox(array(CrayonSettings::DECODE, crayon__('Decode HTML entities in code')));
        }
        self::checkbox(array(CrayonSettings::DECODE_ATTRIBUTES, crayon__('Decode HTML entities in attributes')));
        echo '<div class="crayon-hide-inline-only">';
        self::checkbox(array(CrayonSettings::TRIM_WHITESPACE, crayon__('Remove whitespace surrounding the shortcode content')));
        echo '</div>';
        self::checkbox(array(CrayonSettings::TRIM_CODE_TAG, crayon__('Remove &lt;code&gt; tags surrounding the shortcode content')));
        self::checkbox(array(CrayonSettings::MIXED, crayon__('Allow Mixed Language Highlighting with delimiters and tags.') . self::help_button('http://aramk.com/blog/2011/12/25/mixed-language-highlighting-in-crayon/')));
        echo '<div class="crayon-hide-inline-only">';
        self::checkbox(array(CrayonSettings::SHOW_MIXED, crayon__('Show Mixed Language Icon (+)')));
        echo '</div>';
        self::checkbox(array(CrayonSettings::TAB_CONVERT, crayon__('Convert tabs to spaces')));
        self::span(crayon__('Tab size in spaces') . ': ');
        self::input(array('id' => CrayonSettings::TAB_SIZE, 'size' => 2, 'break' => TRUE));
        self::span(crayon__('Blank lines before code:') . ' ');
        self::input(array('id' => CrayonSettings::WHITESPACE_BEFORE, 'size' => 2, 'break' => TRUE));
        self::span(crayon__('Blank lines after code:') . ' ');
        self::input(array('id' => CrayonSettings::WHITESPACE_AFTER, 'size' => 2, 'break' => TRUE));
    }

    public static function tags() {
        self::checkbox(array(CrayonSettings::INLINE_TAG, crayon__('Capture Inline Tags') . self::help_button('http://aramk.com/blog/2012/03/07/inline-crayons/')));
        self::checkbox(array(CrayonSettings::INLINE_WRAP, crayon__('Wrap Inline Tags') . self::help_button('http://aramk.com/blog/2012/03/07/inline-crayons/')));
        self::checkbox(array(CrayonSettings::CODE_TAG_CAPTURE, crayon__('Capture &lt;code&gt; as')), FALSE);
        echo ' ';
        self::dropdown(CrayonSettings::CODE_TAG_CAPTURE_TYPE, FALSE);
        echo self::help_button('http://aramk.com/blog/2012/03/07/inline-crayons/') . '<br/>';
        self::checkbox(array(CrayonSettings::BACKQUOTE, crayon__('Capture `backquotes` as &lt;code&gt;') . self::help_button('http://aramk.com/blog/2012/03/07/inline-crayons/')));
        self::checkbox(array(CrayonSettings::CAPTURE_PRE, crayon__('Capture &lt;pre&gt; tags as Crayons') . self::help_button('http://aramk.com/blog/2011/12/27/mini-tags-in-crayon/')));

        echo '<div class="note" style="width: 350px;">', sprintf(crayon__("Using this markup for Mini Tags and Inline tags is now %sdepreciated%s! Use the %sTag Editor%s instead and convert legacy tags."), '<a href="http://aramk.com/blog/2011/12/27/mini-tags-in-crayon/" target="_blank">', '</a>', '<a href="http://aramk.com/blog/2012/03/25/crayon-tag-editor/‎" target="_blank">', '</a>'), '</div>';
        self::checkbox(array(CrayonSettings::CAPTURE_MINI_TAG, crayon__('Capture Mini Tags like [php][/php] as Crayons.') . self::help_button('http://aramk.com/blog/2011/12/27/mini-tags-in-crayon/')));
        self::checkbox(array(CrayonSettings::INLINE_TAG_CAPTURE, crayon__('Capture Inline Tags like {php}{/php} inside sentences.') . self::help_button('http://aramk.com/blog/2012/03/07/inline-crayons/')));
        self::checkbox(array(CrayonSettings::PLAIN_TAG, crayon__('Enable [plain][/plain] tag.') . self::help_button('http://aramk.com/blog/2011/12/27/mini-tags-in-crayon/')));
    }

    public static function files() {
        echo '<a name="files"></a>';
        echo crayon__('When loading local files and a relative path is given for the URL, use the absolute path'), ': ',
        '<div style="margin-left: 20px">', home_url(), '/';
        self::input(array('id' => CrayonSettings::LOCAL_PATH));
        echo '</div>', crayon__('Followed by your relative URL.');
    }

    public static function tag_editor() {
        $can_convert = self::load_legacy_posts();
        if ($can_convert) {
            $disabled = '';
            $convert_text = crayon__('Convert Legacy Tags');
        } else {
            $disabled = 'disabled="disabled"';
            $convert_text = crayon__('No Legacy Tags Found');
        }

        echo '<input type="submit" name="', self::OPTIONS, '[convert]" id="convert" class="button-primary" value="', $convert_text, '"', $disabled, ' />&nbsp; ';
        self::checkbox(array('convert_encode', crayon__("Encode")), FALSE);
        echo self::help_button('http://aramk.com/blog/2012/09/26/converting-legacy-tags-to-pre/'), CRAYON_BR, CRAYON_BR;
        $sep = sprintf(crayon__('Use %s to separate setting names from values in the &lt;pre&gt; class attribute'),
            self::dropdown(CrayonSettings::ATTR_SEP, FALSE, FALSE, FALSE));
        echo '<span>', $sep, self::help_button('http://aramk.com/blog/2012/03/25/crayon-tag-editor/'), '</span><br/>';
        self::checkbox(array(CrayonSettings::TAG_EDITOR_FRONT, crayon__("Display the Tag Editor in any TinyMCE instances on the frontend (e.g. bbPress)") . self::help_button('http://aramk.com/blog/2012/09/08/crayon-with-bbpress/')));
        self::checkbox(array(CrayonSettings::TAG_EDITOR_SETTINGS, crayon__("Display Tag Editor settings on the frontend")));
        self::span(crayon__('Add Code button text') . ' ');
        self::input(array('id' => CrayonSettings::TAG_EDITOR_ADD_BUTTON_TEXT, 'break' => TRUE));
        self::span(crayon__('Edit Code button text') . ' ');
        self::input(array('id' => CrayonSettings::TAG_EDITOR_EDIT_BUTTON_TEXT, 'break' => TRUE));
        self::span(crayon__('Quicktag button text') . ' ');
        self::input(array('id' => CrayonSettings::TAG_EDITOR_QUICKTAG_BUTTON_TEXT, 'break' => TRUE));
    }

    public static function misc() {
        echo crayon__('Clear the cache used to store remote code requests'), ': ';
        self::dropdown(CrayonSettings::CACHE, false);
        echo '<input type="submit" id="', self::CACHE_CLEAR, '" name="', self::CACHE_CLEAR, '" class="button-secondary" value="', crayon__('Clear Now'), '" /><br/>';
        self::checkbox(array(CrayonSettings::EFFICIENT_ENQUEUE, crayon__('Attempt to load Crayon\'s CSS and JavaScript only when needed') . self::help_button('http://aramk.com/blog/2012/01/23/failing-to-load-crayons-on-pages/')));
        self::checkbox(array(CrayonSettings::SAFE_ENQUEUE, crayon__('Disable enqueuing for page templates that may contain The Loop.') . self::help_button('http://aramk.com/blog/2012/01/23/failing-to-load-crayons-on-pages/')));
        self::checkbox(array(CrayonSettings::COMMENTS, crayon__('Allow Crayons inside comments')));
        self::checkbox(array(CrayonSettings::EXCERPT_STRIP, crayon__('Remove Crayons from excerpts')));
        self::checkbox(array(CrayonSettings::MAIN_QUERY, crayon__('Load Crayons only from the main Wordpress query')));
        self::checkbox(array(CrayonSettings::TOUCHSCREEN, crayon__('Disable mouse gestures for touchscreen devices (eg. MouseOver)')));
        self::checkbox(array(CrayonSettings::DISABLE_ANIM, crayon__('Disable animations')));
        self::checkbox(array(CrayonSettings::DISABLE_RUNTIME, crayon__('Disable runtime stats')));
        echo '<span class="crayon-span-100">' . crayon__('Disable for posts before') . ':</span> ';
        self::input(array('id' => CrayonSettings::DISABLE_DATE, 'type' => 'date', 'size' => 8, 'break' => FALSE));
        echo '<br/>';
        self::checkbox(array(CrayonSettings::DELAY_LOAD_JS, crayon__('Load scripts in the page footer using wp_footer() to improve loading performance.')));
    }

    // Debug Fields ===========================================================

    public static function errors() {
        self::checkbox(array(CrayonSettings::ERROR_LOG, crayon__('Log errors for individual Crayons')));
        self::checkbox(array(CrayonSettings::ERROR_LOG_SYS, crayon__('Log system-wide errors')));
        self::checkbox(array(CrayonSettings::ERROR_MSG_SHOW, crayon__('Display custom message for errors')));
        self::input(array('id' => CrayonSettings::ERROR_MSG, 'size' => 60, 'margin' => TRUE));
    }

    public static function log() {
        $log = CrayonLog::log();
        touch(CRAYON_LOG_FILE);
        $exists = file_exists(CRAYON_LOG_FILE);
        $writable = is_writable(CRAYON_LOG_FILE);
        if (!empty($log)) {
            echo '<div id="crayon-log-wrapper">', '<div id="crayon-log"><div id="crayon-log-text">', $log,
            '</div></div>', '<div id="crayon-log-controls">',
            '<input type="button" id="crayon-log-toggle" show_txt="', crayon__('Show Log'), '" hide_txt="', crayon__('Hide Log'), '" class="button-secondary" value="', crayon__('Show Log'), '"> ',
            '<input type="submit" id="crayon-log-clear" name="', self::LOG_CLEAR,
            '" class="button-secondary" value="', crayon__('Clear Log'), '"> ', '<input type="submit" id="crayon-log-email" name="',
                self::LOG_EMAIL_ADMIN . '" class="button-secondary" value="', crayon__('Email Admin'), '"> ',
            '<input type="submit" id="crayon-log-email" name="', self::LOG_EMAIL_DEV,
            '" class="button-secondary" value="', crayon__('Email Developer'), '"> ', '</div>', '</div>';
        }
        echo '<span', (!empty($log)) ? ' class="crayon-span"' : '', '>', (empty($log)) ? crayon__('The log is currently empty.') . ' ' : '';
        if ($exists) {
            $writable ? crayon_e('The log file exists and is writable.') : crayon_e('The log file exists and is not writable.');
        } else {
            crayon_e('The log file does not exist and is not writable.');
        }
        echo '</span>';
    }

    // About Fields ===========================================================

    public static function info() {
        global $CRAYON_VERSION, $CRAYON_DATE, $CRAYON_AUTHOR, $CRAYON_WEBSITE, $CRAYON_TWITTER, $CRAYON_GIT, $CRAYON_PLUGIN_WP, $CRAYON_AUTHOR_SITE, $CRAYON_EMAIL, $CRAYON_DONATE;
        echo '<a name="info"></a>';
        $version = '<strong>' . crayon__('Version') . ':</strong> ' . $CRAYON_VERSION;
        $date = $CRAYON_DATE;
        $developer = '<strong>' . crayon__('Developer') . ':</strong> ' . '<a href="' . $CRAYON_AUTHOR_SITE . '" target="_blank">' . $CRAYON_AUTHOR . '</a>';
        $translators = '<strong>' . crayon__('Translators') . ':</strong> ' .
            '
            Arabic (<a href="http://djennadhamza.eb2a.com/" target="_blank">Djennad Hamza</a>),
            Chinese Simplified (<a href="http://smerpup.com/" target="_blank">Dezhi Liu</a>, <a href="http://neverno.me/" target="_blank">Jash Yin</a>),
            Chinese Traditional (<a href="http://www.arefly.com/" target="_blank">Arefly</a>),
            Dutch (<a href="https://twitter.com/RobinRoelofsen" target="_blank">Robin Roelofsen</a>, <a href="https://twitter.com/#!/chilionsnoek" target="_blank">Chilion Snoek</a>),
            French (<a href="http://tech.dupeu.pl" target="_blank">Victor Felder</a>),
            Finnish (<a href="https://github.com/vahalan" target="_blank">vahalan</a>),
            German (<a href="http://www.technologyblog.de/" target="_blank">Stephan Knau&#223;</a>),
            Italian (<a href="http://www.federicobellucci.net/" target="_blank">Federico Bellucci</a>),
            Japanese (<a href="https://twitter.com/#!/west_323" target="_blank">@west_323</a>),
            Korean (<a href="https://github.com/dokenzy" target="_blank">dokenzy</a>),
            Lithuanian (Vincent G),
            Persian (MahdiY),
            Polish (<a href="https://github.com/toszcze" target="_blank">Bartosz Romanowski</a>),
            Portuguese (<a href="http://www.adonai.eti.br" target="_blank">Adonai S. Canez</a>),
            Russian (<a href="http://simplelib.com/" target="_blank">Minimus</a>, Di_Skyer),
            Slovak (<a href="https://twitter.com/#!/webhostgeeks" target="_blank">webhostgeeks</a>),
            Slovenian (<a href="http://jodlajodla.si/" target="_blank">Jan Su&#353;nik</a>),
            Spanish (<a href="http://www.hbravo.com/" target="_blank">Hermann Bravo</a>),
            Tamil (<a href="http://kks21199.mrgoogleglass.com/" target="_blank">KKS21199</a>),
            Turkish (<a href="http://hakanertr.wordpress.com" target="_blank">Hakan</a>),
            Ukrainian (<a href="http://getvoip.com/blog" target="_blank">Michael Yunat</a>)';

        $links = '
	 			<a id="docs-icon" class="small-icon" title="Documentation" href="' . $CRAYON_WEBSITE . '" target="_blank"></a>
				<a id="git-icon" class="small-icon" title="GitHub" href="' . $CRAYON_GIT . '" target="_blank"></a>
				<a id="wp-icon" class="small-icon" title="Plugin Page" href="' . $CRAYON_PLUGIN_WP . '" target="_blank"></a>
	 			<a id="twitter-icon" class="small-icon" title="Twitter" href="' . $CRAYON_TWITTER . '" target="_blank"></a>
				<a id="gmail-icon" class="small-icon" title="Email" href="mailto:' . $CRAYON_EMAIL . '" target="_blank"></a>
				<div id="crayon-donate"><a href="' . $CRAYON_DONATE . '" title="Donate" target="_blank">
					<img src="' . plugins_url(CRAYON_DONATE_BUTTON, __FILE__) . '"></a>
				</div>';

        echo '
				<table id="crayon-info" border="0">
		  <tr>
				<td>' . $version . ' - ' . $date . '</td>
					</tr>
					<tr>
					<td>' . $developer . '</td>
		  </tr>
		  <tr>
				<td>' . $translators . '</td>
		  </tr>
		  <tr>
				<td colspan="2">' . $links . '</td>
		  </tr>
				</table>';

    }

    public static function help_button($link) {
        return ' <a href="' . $link . '" target="_blank" class="crayon-question">' . crayon__('?') . '</a>';
    }

    public static function plugin_row_meta($meta, $file) {
        global $CRAYON_DONATE;
        if ($file == CrayonWP::basename()) {
            $meta[] = '<a href="options-general.php?page=crayon_settings">' . crayon__('Settings') . '</a>';
            $meta[] = '<a href="options-general.php?page=crayon_settings&theme-editor=1">' . crayon__('Theme Editor') . '</a>';
            $meta[] = '<a href="' . $CRAYON_DONATE . '" target="_blank">' . crayon__('Donate') . '</a>';
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
