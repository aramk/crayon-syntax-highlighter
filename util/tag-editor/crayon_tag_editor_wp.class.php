<?php

require_once(CRAYON_ROOT_PATH . 'crayon_settings_wp.class.php');

class CrayonTagEditorWP {

    public static $settings = null;

    public static function init() {
        // Hooks
        if (CRAYON_TAG_EDITOR) {
            CrayonSettingsWP::load_settings(TRUE);
            if (is_admin()) {
                // XXX Only runs in wp-admin
                add_action('admin_print_scripts-post-new.php', 'CrayonTagEditorWP::enqueue_resources');
                add_action('admin_print_scripts-post.php', 'CrayonTagEditorWP::enqueue_resources');
                add_filter('tiny_mce_before_init', 'CrayonTagEditorWP::init_tinymce');
                // Must come after
                add_action("admin_print_scripts-post-new.php", 'CrayonSettingsWP::init_js_settings');
                add_action("admin_print_scripts-post.php", 'CrayonSettingsWP::init_js_settings');
                self::addbuttons();
            } else if (CrayonGlobalSettings::val(CrayonSettings::TAG_EDITOR_FRONT)) {
                // XXX This will always need to enqueue, but only runs on front end
                add_action('wp', 'CrayonTagEditorWP::enqueue_resources');
                add_filter('tiny_mce_before_init', 'CrayonTagEditorWP::init_tinymce');
                self::addbuttons();
            }
        }
    }

    public static function init_settings() {

        if (!self::$settings) {
            // Add settings
            self::$settings = array(
                'home_url' => home_url(),
                'css' => 'crayon-te',
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
                'tinymce_button_generic' => '.mce-btn',
                'tinymce_button' => 'a.mce_crayon_tinymce,.mce-i-crayon_tinymce',
                'tinymce_button_unique' => 'mce_crayon_tinymce',
                'tinymce_highlight' => 'mce-active',
                'submit_css' => '#crayon-te-ok',
                'cancel_css' => '#crayon-te-cancel',
                'content_css' => '#crayon-te-content',
                'dialog_title_css' => '#crayon-te-title',
                'submit_wrapper_css' => '#crayon-te-submit-wrapper',
                'data_value' => 'data-value',
                'attr_sep' => CrayonGlobalSettings::val_str(CrayonSettings::ATTR_SEP),
                'css_sep' => '_',
                'fallback_lang' => CrayonGlobalSettings::val(CrayonSettings::FALLBACK_LANG),
                'add_text' => CrayonGlobalSettings::val(CrayonSettings::TAG_EDITOR_ADD_BUTTON_TEXT),
                'edit_text' => CrayonGlobalSettings::val(CrayonSettings::TAG_EDITOR_EDIT_BUTTON_TEXT),
                'quicktag_text' => CrayonGlobalSettings::val(CrayonSettings::TAG_EDITOR_QUICKTAG_BUTTON_TEXT),
                'submit_add' => crayon__('Add'),
                'submit_edit' => crayon__('Save'),
                'bar' => '#crayon-te-bar',
                'bar_content' => '#crayon-te-bar-content',
                'extensions' => CrayonResources::langs()->extensions_inverted()
            );
        }
    }

    public static function enqueue_resources() {
        global $CRAYON_VERSION;
        self::init_settings();

        if (CRAYON_MINIFY) {
            wp_deregister_script('crayon_js');
            wp_enqueue_script('crayon_js', plugins_url(CRAYON_JS_TE_MIN, dirname(dirname(__FILE__))), array('jquery', 'quicktags'), $CRAYON_VERSION);
            CrayonSettingsWP::init_js_settings();
            wp_localize_script('crayon_js', 'CrayonTagEditorSettings', self::$settings);
        } else {
            wp_enqueue_script('crayon_colorbox_js', plugins_url(CRAYON_COLORBOX_JS, __FILE__), array('jquery'), $CRAYON_VERSION);
            wp_enqueue_style('crayon_colorbox_css', plugins_url(CRAYON_COLORBOX_CSS, __FILE__), array(), $CRAYON_VERSION);
            wp_enqueue_script('crayon_te_js', plugins_url(CRAYON_TAG_EDITOR_JS, __FILE__), array('crayon_util_js', 'crayon_colorbox_js'), $CRAYON_VERSION);
            wp_enqueue_script('crayon_qt_js', plugins_url(CRAYON_QUICKTAGS_JS, __FILE__), array('quicktags', 'crayon_te_js'), $CRAYON_VERSION, TRUE);
            wp_localize_script('crayon_te_js', 'CrayonTagEditorSettings', self::$settings);
            CrayonSettingsWP::other_scripts();
        }
    }

    public static function init_tinymce($init) {
        if (!array_key_exists('extended_valid_elements', $init)) {
            $init['extended_valid_elements'] = '';
        }
        $init['extended_valid_elements'] .= ',pre[*],code[*],iframe[*]';
        return $init;
    }

    public static function addbuttons() {
        // Add only in Rich Editor mode
        add_filter('mce_external_plugins', 'CrayonTagEditorWP::add_plugin');
        add_filter('mce_buttons', 'CrayonTagEditorWP::register_buttons');
        add_filter('bbp_before_get_the_content_parse_args', 'CrayonTagEditorWP::bbp_get_the_content_args');
    }

    public static function bbp_get_the_content_args($args) {
        // Turn off "teeny" to allow the bbPress TinyMCE to display external plugins
        return array_merge($args, array('teeny' => false));
    }

    public static function register_buttons($buttons) {
        array_push($buttons, 'separator', 'crayon_tinymce');
        return $buttons;
    }

    public static function add_plugin($plugin_array) {
        $plugin_array['crayon_tinymce'] = plugins_url(CRAYON_TINYMCE_JS, __FILE__);
        return $plugin_array;
    }

    // The remaining functions are for displayed output.

    public static function select_resource($id, $resources, $current, $set_class = TRUE) {
        $id = CrayonSettings::PREFIX . $id;
        if (count($resources) > 0) {
            $class = $set_class ? 'class="' . CrayonSettings::SETTING . ' ' . CrayonSettings::SETTING_SPECIAL . '"' : '';
            echo '<select id="' . $id . '" name="' . $id . '" ' . $class . ' ' . CrayonSettings::SETTING_ORIG_VALUE . '="' . $current . '">';
            foreach ($resources as $resource) {
                $asterisk = $current == $resource->id() ? ' *' : '';
                echo '<option value="' . $resource->id() . '" ' . selected($current, $resource->id()) . ' >' . $resource->name() . $asterisk . '</option>';
            }
            echo '</select>';
        } else {
            // None found, default to text box
            echo '<input type="text" id="' . $id . '" name="' . $id . '" class="' . CrayonSettings::SETTING . ' ' . CrayonSettings::SETTING_SPECIAL . '" />';
        }
    }

    public static function checkbox($id) {
        $id = CrayonSettings::PREFIX . $id;
        echo '<input type="checkbox" id="' . $id . '" name="' . $id . '" class="' . CrayonSettings::SETTING . ' ' . CrayonSettings::SETTING_SPECIAL . '" />';
    }

    public static function textbox($id, $atts = array(), $set_class = TRUE) {
        $id = CrayonSettings::PREFIX . $id;
        $atts_str = '';
        $class = $set_class ? 'class="' . CrayonSettings::SETTING . ' ' . CrayonSettings::SETTING_SPECIAL . '"' : '';
        foreach ($atts as $k => $v) {
            $atts_str = $k . '="' . $v . '" ';
        }
        echo '<input type="text" id="' . $id . '" name="' . $id . '" ' . $class . ' ' . $atts_str . ' />';
    }

    public static function submit() {
        ?>
        <input type="button"
               class="button-primary <?php echo CrayonTagEditorWP::$settings['submit_css']; ?>"
               value="<?php echo CrayonTagEditorWP::$settings['submit_add']; ?>"
               name="submit"/>
    <?php
    }

    public static function content() {
        CrayonSettingsWP::load_settings();
        $langs = CrayonLangs::sort_by_name(CrayonParser::parse_all());
        $curr_lang = CrayonGlobalSettings::val(CrayonSettings::FALLBACK_LANG);
        $themes = CrayonResources::themes()->get();
        $curr_theme = CrayonGlobalSettings::val(CrayonSettings::THEME);
        $fonts = CrayonResources::fonts()->get();
        $curr_font = CrayonGlobalSettings::val(CrayonSettings::FONT);
        CrayonTagEditorWP::init_settings();

        ?>

        <div id="crayon-te-content" class="crayon-te">
            <div id="crayon-te-bar">
                <div id="crayon-te-bar-content">
                    <div id="crayon-te-title">Title</div>
                    <div id="crayon-te-controls">
                        <a id="crayon-te-ok" href="#"><?php crayon_e('OK'); ?></a> <span
                            class="crayon-te-seperator">|</span> <a id="crayon-te-cancel"
                                                                    href="#"><?php crayon_e('Cancel'); ?></a>
                    </div>
                </div>
            </div>

            <table id="crayon-te-table" class="describe">
                <tr class="crayon-tr-center">
                    <th><?php crayon_e('Title'); ?>
                    </th>
                    <td class="crayon-nowrap"><?php self::textbox('title', array('placeholder' => crayon__('A short description'))); ?>
                        <span id="crayon-te-sub-section"> <?php self::checkbox('inline'); ?>
                            <span class="crayon-te-section"><?php crayon_e('Inline'); ?> </span>
			</span> <span id="crayon-te-sub-section"> <?php self::checkbox('highlight'); ?>
                            <span class="crayon-te-section"><?php crayon_e("Don't Highlight"); ?>
				</span>
			</span></td>
                </tr>
                <tr class="crayon-tr-center">
                    <th><?php crayon_e('Language'); ?>
                    </th>
                    <td class="crayon-nowrap"><?php self::select_resource('lang', $langs, $curr_lang); ?>
                        <span class="crayon-te-section"><?php crayon_e('Line Range'); ?> </span>
                        <?php self::textbox('range', array('placeholder' => crayon__('(e.g. 3-5 or 3)'))); ?>
                        <span class="crayon-te-section"><?php crayon_e('Marked Lines'); ?> </span>
                        <?php self::textbox('mark', array('placeholder' => crayon__('(e.g. 1,2,3-5)'))); ?>
                    </td>
                </tr>
                <tr class="crayon-tr-center" style="text-align: center;">
                    <th>
                        <div>
                            <?php crayon_e('Code'); ?>
                        </div>
                        <input type="button" id="crayon-te-clear"
                               class="secondary-primary" value="<?php crayon_e('Clear'); ?>"
                               name="clear"/>
                    </th>
                    <td><textarea id="crayon-code" name="code"
                                  placeholder="<?php crayon_e('Paste your code here, or type it in manually.'); ?>"></textarea>
                    </td>
                </tr>
                <tr class="crayon-tr-center">
                    <th id="crayon-url-th"><?php crayon_e('URL'); ?>
                    </th>
                    <td><?php self::textbox('url', array('placeholder' => crayon__('Relative local path or absolute URL'))); ?>
                        <div id="crayon-te-url-info" class="crayon-te-info">
                            <?php
                            crayon_e("If the URL fails to load, the code above will be shown instead. If no code exists, an error is shown.");
                            echo ' ';
                            printf(crayon__('If a relative local path is given it will be appended to %s - which is defined in %sCrayon &gt; Settings &gt; Files%s.'), '<span class="crayon-te-quote">' . get_home_url() . '/' . CrayonGlobalSettings::val(CrayonSettings::LOCAL_PATH) . '</span>', '<a href="options-general.php?page=crayon_settings" target="_blank">', '</a>');
                            ?>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td id="crayon-te-submit-wrapper" colspan="2"
                        style="text-align: center;"><?php self::submit(); ?></td>
                </tr>
                <!--		<tr>-->
                <!--			<td colspan="2"><div id="crayon-te-warning" class="updated crayon-te-info"></div></td>-->
                <!--		</tr>-->
                <tr>
                    <td colspan="2"><?php
                        $admin = isset($_GET['is_admin']) ? intval($_GET['is_admin']) : is_admin();
                        if (!$admin && !CrayonGlobalSettings::val(CrayonSettings::TAG_EDITOR_SETTINGS)) {
                            exit();
                        }
                        ?>
                        <hr/>
                        <div>
                            <h2 class="crayon-te-heading">
                                <?php crayon_e('Settings'); ?>
                            </h2>
                        </div>
                        <div id="crayon-te-settings-info" class="crayon-te-info">
                            <?php
                            crayon_e('Change the following settings to override their global values.');
                            echo ' <span class="', CrayonSettings::SETTING_CHANGED, '">';
                            crayon_e('Only changes (shown yellow) are applied.');
                            echo '</span><br/>';
                            echo sprintf(crayon__('Future changes to the global settings under %sCrayon &gt; Settings%s won\'t affect overridden settings.'), '<a href="options-general.php?page=crayon_settings" target="_blank">', '</a>');
                            ?>
                        </div>
                    </td>
                </tr>
                <?php
                $sections = array('Theme', 'Font', 'Metrics', 'Toolbar', 'Lines', 'Code');
                foreach ($sections as $section) {
                    echo '<tr><th>', crayon__($section), '</th><td>';
                    call_user_func('CrayonSettingsWP::' . strtolower($section), TRUE);
                    echo '</td></tr>';
                }
                ?>
            </table>
        </div>

        <?php
        exit();
    }

}

if (defined('ABSPATH')) {
    add_action('init', 'CrayonTagEditorWP::init');
}

?>
