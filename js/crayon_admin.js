// Crayon Syntax Highlighter Admin JavaScript

(function ($) {

    window.CrayonSyntaxAdmin = new function () {
        var base = this;

        // Preview
        var preview, preview_info, preview_cbox, preview_delay_timer, preview_get = null;
        // The DOM object ids that trigger a preview update
        var preview_obj_names = [];
        // The jQuery objects for these objects
        var preview_objs = [];
        var preview_last_values = [];
        // Alignment
        var align_drop = float = null;
        // Toolbar
        var overlay = toolbar = null;
        // Error
        var msg_cbox = msg = null;
        // Log
        var log_button = log_text = null;

        var main_wrap, theme_editor_wrap, editor_url, theme_editor_edit_button, theme_editor_create_button = null;
        var theme_select, theme_info, theme_ver, theme_author, theme_desc = null;

        var settings = null;
        var adminSettings = null;
        var util = null;

        base.init = function () {
            console_log('admin init');
            settings = CrayonSyntaxSettings;
            adminSettings = CrayonAdminSettings;
            util = CrayonUtil;

            // Wraps
            main_wrap = $('#crayon-main-wrap');
            theme_editor_wrap = $('#crayon-theme-editor-wrap');
            editor_url = theme_editor_wrap.attr('url');
            theme_editor_edit_button = $('#crayon-theme-editor-edit-button');
            theme_editor_create_button = $('#crayon-theme-editor-create-button');
            theme_editor_edit_button.click(function () {
                CrayonSyntaxAdmin.show_theme_editor(theme_editor_edit_button,
                    true);
            });
            theme_editor_create_button.click(function () {
                CrayonSyntaxAdmin.show_theme_editor(theme_editor_create_button,
                    false);
            });

            // Themes
            theme_select = $('#crayon-theme');
            theme_info = $('#crayon-theme-info');
            theme_ver = theme_info.find('.version').next('div');
            theme_author = theme_info.find('.author').next('div');
            theme_desc = theme_info.find('.desc');
            base.show_theme_info();
            theme_select.change(function () {
                base.show_theme_info();
                base.preview_update();
            });

            // Help
            help = $('.crayon-help-close');
            help.click(function () {
                $('.crayon-help').hide();
                $.get(settings.ajaxurl, {action : 'crayon-ajax', 'hide-help' : 1});
            });

            // Preview
            preview = $('#crayon-live-preview');
            preview_info = $('#crayon-preview-info');
            preview_cbox = util.cssElem('#preview');
            if (preview.length != 0) {
                // Preview not needed in Tag Editor
                preview_register();
                preview.ready(function () {
                    preview_toggle();
                });
                preview_cbox.change(function () {
                    preview_toggle();
                });
            }

            $('#show-posts').click(function () {
                $.get(settings.ajaxurl, {action : 'crayon-show-posts'}, function (data) {
                    $('#crayon-subsection-posts-info').html(data);
                });
            });

            $('#show-langs').click(function () {
                $.get(settings.ajaxurl, {action : 'crayon-show-langs'}, function (data) {
                    $('#lang-info').hide();
                    $('#crayon-subsection-langs-info').html(data);
                });
            });

            // Convert
            $('#crayon-settings-form input').live('focusin focusout mouseup', function () {
                $('#crayon-settings-form').data('lastSelected', $(this));
            });
            $('#crayon-settings-form').submit(function () {
                var last = $(this).data('lastSelected').get(0);
                var target = $('#convert').get(0);
                if (last == target) {
                    var r = confirm("Please BACKUP your database first! Converting will update your post content. Do you wish to continue?");
                    return r;
                }
            });

            // Alignment
            align_drop = util.cssElem('#h-align');
            float = $('#crayon-subsection-float');
            align_drop.change(function () {
                float_toggle();
            });
            align_drop.ready(function () {
                float_toggle();
            });

            // Custom Error
            msg_cbox = util.cssElem('#error-msg-show');
            msg = util.cssElem('#error-msg');
            toggle_error();
            msg_cbox.change(function () {
                toggle_error();
            });

            // Toolbar
            overlay = $('#crayon-subsection-toolbar');
            toolbar = util.cssElem('#toolbar');
            toggle_toolbar();
            toolbar.change(function () {
                toggle_toolbar();
            });

            // Copy
            plain = util.cssElem('#plain');
            copy = $('#crayon-subsection-copy-check');
            plain.change(function () {
                if (plain.is(':checked')) {
                    copy.show();
                } else {
                    copy.hide();
                }
            });

            // Log
            log_wrapper = $('#crayon-log-wrapper');
            log_button = $('#crayon-log-toggle');
            log_text = $('#crayon-log-text');
            var show_log = log_button.attr('show_txt');
            var hide_log = log_button.attr('hide_txt');
            clog = $('#crayon-log');
            log_button.val(show_log);
            log_button
                .click(function () {
                    clog.width(log_wrapper.width());
                    clog.toggle();
                    // Scrolls content
                    clog.scrollTop(log_text.height());
                    var text = (log_button.val() == show_log ? hide_log
                        : show_log);
                    log_button.val(text);
                });

        };

        /* Whenever a control changes preview */
        base.preview_update = function () {
            var val = 0;
            var obj;
            var getVars = {
                action : 'crayon-show-preview',
                theme : adminSettings.curr_theme
            };
            for (var i = 0; i < preview_obj_names.length; i++) {
                obj = preview_objs[i];
                if (obj.attr('type') == 'checkbox') {
                    val = obj.is(':checked');
                } else {
                    val = obj.val();
                }
                getVars[preview_obj_names[i]] = crayon_escape(val);
            }

            // Load Preview
            $.get(settings.ajaxurl, getVars, function (data) {
                preview.html(data);
                // Important! Calls the crayon.js init
                CrayonSyntax.init();
            });
        };

        var preview_toggle = function () {
            // console_log('preview_toggle');
            if (preview_cbox.is(':checked')) {
                preview.show();
                preview_info.show();
                base.preview_update();
            } else {
                preview.hide();
                preview_info.hide();
            }
        };

        var float_toggle = function () {
            if (align_drop.val() != 0) {
                float.show();
            } else {
                float.hide();
            }
        };

        // List of callbacks
        var preview_callback;
        var preview_txt_change;
        var preview_txt_callback; // Only updates if text value changed
        var preview_txt_callback_delayed;
        // var height_set;

        // Register all event handlers for preview objects
        var preview_register = function () {
            // Instant callback
            preview_callback = function () {
                base.preview_update();
            };

            // Checks if the text input is changed, if so, runs the callback
            // with given event
            preview_txt_change = function (callback, event) {
                // console_log('checking if changed');
                var obj = event.target;
                var last = preview_last_values[obj.id];
                // console_log('last' + preview_last_values[obj.id]);

                if (obj.value != last) {
                    // console_log('changed');
                    // Update last value to current
                    preview_last_values[obj.id] = obj.value;
                    // Run callback with event
                    callback(event);
                }
            };

            // Only updates when text is changed
            preview_txt_callback = function (event) {
                // console_log('txt callback');
                preview_txt_change(base.preview_update, event);
            };

            // Only updates when text is changed, but callback
            preview_txt_callback_delayed = function (event) {
                preview_txt_change(function () {
                    clearInterval(preview_delay_timer);
                    preview_delay_timer = setInterval(function () {
                        // console_log('delayed update');
                        base.preview_update();
                        clearInterval(preview_delay_timer);
                    }, 500);
                }, event);
            };

            // Retreive preview objects
            $('[crayon-preview="1"]').each(function (i) {
                var obj = $(this);
                var id = obj.attr('id');
                // XXX Remove prefix
                id = util.removePrefixFromID(id);
                preview_obj_names[i] = id;
                preview_objs[i] = obj;
                // To capture key up events when typing
                if (obj.attr('type') == 'text') {
                    preview_last_values[obj.attr('id')] = obj.val();
                    obj.bind('keyup', preview_txt_callback_delayed);
                    obj.change(preview_txt_callback);
                } else {
                    // For all other objects
                    obj.change(preview_callback);
                }
            });
        };

        var toggle_error = function () {
            if (msg_cbox.is(':checked')) {
                msg.show();
            } else {
                msg.hide();
            }
        };

        var toggle_toolbar = function () {
            if (toolbar.val() == 0) {
                overlay.show();
            } else {
                overlay.hide();
            }
        };

        base.get_vars = function () {
            var vars = {};
            window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
                vars[key] = value;
            });
            return vars;
        };

        // Changing wrap views
        base.show_main = function () {
            theme_editor_wrap.hide();
            main_wrap.show();
            return false;
        };

        base.show_theme_editor_now = function (button) {
            main_wrap.hide();
            theme_editor_wrap.show();
            theme_editor_loading = false;
            button.html(button.attr('loaded'));
        };

        base.show_theme_info = function (callback) {
            adminSettings.curr_theme = $('#crayon-theme').val();
            adminSettings.curr_theme_url = adminSettings.themes_url + adminSettings.curr_theme + '/' + adminSettings.curr_theme + '.css';
            $.ajax({
                url : adminSettings.curr_theme_url,
                success : function (data) {
                    adminSettings.curr_theme_str = data;
                    var fields = {
                        'Version' : theme_ver,
                        'Author' : theme_author,
                        'Author URI' : null,
                        'Description' : theme_desc
                    };
                    for (field in fields) {
                        var re = new RegExp('(?:^|[\\r\\n]\\s*)\\b' + field + '\\s*:\\s*([^\\r\\n]+)', 'gmi');
                        var match = re.exec(data);
                        var val = fields[field];
                        if (match) {
                            if (val != null) {
                                val.html(match[1].escape().linkify('_blank'));
                            } else if (field == 'Author URI') {
                                theme_author.html('<a href="' + match[1] + '" target="_blank">' + theme_author.text() + '</a>');
                            }
                        } else if (val != null) {
                            val.text('N/A');
                        }
                    }
                    if (callback) {
                        callback();
                    }
                },
                cache : false
            });
        };

        base.show_theme_editor = function (button, editing) {
            button.html(button.attr('loading'));

            adminSettings.editing = editing;

            // Load theme editor
            $.get(editor_url + '?curr_theme='
                + adminSettings.curr_theme + '&editing='
                + editing, function (data) {
                theme_editor_wrap.html(data);
                // Load preview into editor
                CrayonSyntaxThemeEditor.init(function () {
                    base.show_theme_editor_now(button);
                }, preview.clone());
            });
            return false;
        };

    };

})(jQueryCrayon);
