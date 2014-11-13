(function ($) {

    window.CrayonTagEditor = new function () {
        var base = this;

        var isInit = false;
        var loaded = false;
        var editing = false;
        var insertCallback, editCallback, showCallback, hideCallback, selectCallback;
        // Used for encoding, decoding
        var inputHTML, outputHTML, editor_name, ajax_class_timer;
        var ajax_class_timer_count = 0;

        var code_refresh, url_refresh;

        // Current $ obj of pre node
        var currCrayon = null;
        // Classes from pre node, excl. settings
        var currClasses = '';
        // Whether to make span or pre
        var is_inline = false;

        // Generated in WP and contains the settings
        var s, gs, util;

        // CSS
        var dialog, code, clear, submit, cancel;

        var colorboxSettings = {
            inline: true,
            width: 690,
            height: '90%',
            closeButton: false,
            fixed: true,
            transition: 'none',
            className: 'crayon-colorbox',
            onOpen: function () {
                $(this.outer).prepend($(s.bar_content));
            },
            onComplete: function () {
                $(s.code_css).focus();
            },
            onCleanup: function () {
                $(s.bar).prepend($(s.bar_content));
            }
        };

        base.init = function () {
            s = CrayonTagEditorSettings;
            gs = CrayonSyntaxSettings;
            util = CrayonUtil;
            // This allows us to call $.colorbox and reload without needing a button click.
            colorboxSettings.href = s.content_css;
        };

        base.bind = function (buttonCls) {
            if (!isInit) {
                isInit = true;
                base.init();
            }
            var $buttons = $(buttonCls);
            $buttons.each(function (i, button) {
                var $button = $(button);
                var $wrapper = $('<a class="crayon-tag-editor-button-wrapper"></a>').attr('href', s.content_css);
                $button.after($wrapper);
                $wrapper.append($button);
                $wrapper.colorbox(colorboxSettings);
            });
        };

        base.hide = function () {
            $.colorbox.close();
            return false;
        };

        // XXX Loads dialog contents
        base.loadDialog = function (callback) {
            // Loaded once url is given
            if (!loaded) {
                loaded = true;
            } else {
                callback && callback();
                return;
            }
            // Load the editor content
            CrayonUtil.getAJAX({action: 'crayon-tag-editor', is_admin: gs.is_admin}, function (data) {
                dialog = $('<div id="' + s.css + '"></div>');
                dialog.appendTo('body').hide();
                dialog.html(data);

                base.setOrigValues();

                submit = dialog.find(s.submit_css);
                cancel = dialog.find(s.cancel_css);

                code = $(s.code_css);
                clear = $('#crayon-te-clear');
                code_refresh = function () {
                    var clear_visible = clear.is(":visible");
                    if (code.val().length > 0 && !clear_visible) {
                        clear.show();
                        code.removeClass(gs.selected);
                    } else if (code.val().length <= 0) {
                        clear.hide();
                    }
                };

                code.keyup(code_refresh);
                code.change(code_refresh);
                clear.click(function () {
                    code.val('');
                    code.removeClass(gs.selected);
                    code.focus();
                });

                var url = $(s.url_css);
                var url_info = $(s.url_info_css);
                var exts = CrayonTagEditorSettings.extensions;
                url_refresh = function () {
                    if (url.val().length > 0 && !url_info.is(":visible")) {
                        url_info.show();
                        url.removeClass(gs.selected);
                    } else if (url.val().length <= 0) {
                        url_info.hide();
                    }

                    // Check for extensions and select language automatically
                    var ext = CrayonUtil.getExt(url.val());
                    if (ext) {
                        var lang = exts[ext];
                        // Otherwise use the extention as the lang
                        var lang_id = lang ? lang : ext;
                        var final_lang = CrayonTagEditorSettings.fallback_lang;
                        $(s.lang_css + ' option').each(function () {
                            if ($(this).val() == lang_id) {
                                final_lang = lang_id;
                            }
                        });
                        $(s.lang_css).val(final_lang);
                    }
                };
                url.keyup(url_refresh);
                url.change(url_refresh);

                var setting_change = function () {
                    var setting = $(this);
                    var orig_value = $(this).attr(gs.orig_value);
                    if (typeof orig_value == 'undefined') {
                        orig_value = '';
                    }
                    // Depends on type
                    var value = base.settingValue(setting);
                    CrayonUtil.log(setting.attr('id') + ' value: ' + value);
                    var highlight = null;
                    if (setting.is('input[type=checkbox]')) {
                        highlight = setting.next('span');
                    }

                    CrayonUtil.log('   >>> ' + setting.attr('id') + ' is ' + orig_value + ' = ' + value);
                    if (orig_value == value) {
                        // No change
                        setting.removeClass(gs.changed);
                        if (highlight) {
                            highlight.removeClass(gs.changed);
                        }
                    } else {
                        // Changed
                        setting.addClass(gs.changed);
                        if (highlight) {
                            highlight.addClass(gs.changed);
                        }
                    }
                    // Save standardized value for later
                    base.settingValue(setting, value);
                };
                $('.' + gs.setting + '[id]:not(.' + gs.special + ')').each(function () {
                    $(this).change(setting_change);
                    $(this).keyup(setting_change);
                });
                callback && callback();
            });
        };

        // XXX Displays the dialog.
        base.showDialog = function (args) {
            var wasLoaded = loaded;
            base.loadDialog(function () {
                if (!wasLoaded) {
                    // Forcefully load the colorbox. Otherwise it populates the content after opening the window and
                    // never renders.
                    $.colorbox(colorboxSettings);
                }
                base._showDialog(args);
            });
        };

        base._showDialog = function (args) {
            args = $.extend({
                insert: null,
                edit: null,
                show: null,
                hide: base.hide,
                select: null,
                editor_str: null,
                ed: null,
                node: null,
                input: null,
                output: null
            }, args);

            // Need to reset all settings back to original, clear yellow highlighting
            base.resetSettings();
            // Save these for when we add a Crayon
            insertCallback = args.insert;
            editCallback = args.edit;
            showCallback = args.show;
            hideCallback = args.hide;
            selectCallback = args.select;
            inputHTML = args.input;
            outputHTML = args.output;
            editor_name = args.editor_str;
            var currNode = args.node;
            var currNode = args.node;
            is_inline = false;

            // Unbind submit
            submit.unbind();
            submit.click(function (e) {
                base.submitButton();
                e.preventDefault();
            });
            base.setSubmitText(s.submit_add);

            cancel.unbind();
            cancel.click(function (e) {
                base.hide();
                e.preventDefault();
            });

            if (base.isCrayon(currNode)) {
                currCrayon = $(currNode);
                if (currCrayon.length != 0) {
                    // Read back settings for editing
                    currClasses = currCrayon.attr('class');
                    var re = new RegExp('\\b([A-Za-z-]+)' + s.attr_sep + '(\\S+)', 'gim');
                    var matches = re.execAll(currClasses);
                    // Retain all other classes, remove settings
                    currClasses = $.trim(currClasses.replace(re, ''));
                    var atts = {};
                    for (var i in matches) {
                        var id = matches[i][1];
                        var value = matches[i][2];
                        atts[id] = value;
                    }

                    // Title
                    var title = currCrayon.attr('title');
                    if (title) {
                        atts['title'] = title;
                    }

                    // URL
                    var url = currCrayon.attr('data-url');
                    if (url) {
                        atts['url'] = url;
                    }

                    // Inverted settings
                    if (typeof atts['highlight'] != 'undefined') {
                        atts['highlight'] = '0' ? '1' : '0';
                    }

                    // Inline
                    is_inline = currCrayon.hasClass(s.inline_css);
                    atts['inline'] = is_inline ? '1' : '0';

                    // Ensure language goes to fallback if invalid
                    var avail_langs = [];
                    $(s.lang_css + ' option').each(function () {
                        var value = $(this).val();
                        if (value) {
                            avail_langs.push(value);
                        }
                    });
                    if ($.inArray(atts['lang'], avail_langs) == -1) {
                        atts['lang'] = s.fallback_lang;
                    }

                    // Validate the attributes
                    atts = base.validate(atts);

                    // Load in attributes, add prefix
                    for (var att in atts) {
                        var setting = $('#' + gs.prefix + att + '.' + gs.setting);
                        var value = atts[att];
                        base.settingValue(setting, value);
                        // Update highlights
                        setting.change();
                        // If global setting changes and we access settings, it should declare loaded settings as changed even if they equal the global value, just so they aren't lost on save
                        if (!setting.hasClass(gs.special)) {
                            setting.addClass(gs.changed);
                            if (setting.is('input[type=checkbox]')) {
                                highlight = setting.next('span');
                                highlight.addClass(gs.changed);
                            }
                        }
                        CrayonUtil.log('loaded: ' + att + ':' + value);
                    }

                    editing = true;
                    base.setSubmitText(s.submit_edit);

                    // Code
                    var content = currCrayon.html();
                    if (inputHTML == 'encode') {
                        content = CrayonUtil.encode_html(content);
                    } else if (inputHTML == 'decode') {
                        content = CrayonUtil.decode_html(content);
                    }
                    code.val(content);

                } else {
                    CrayonUtil.log('cannot load currNode of type pre');
                }
            } else {
                if (selectCallback) {
                    // Add selected content as code
                    code.val(selectCallback);
                }
                // We are creating a new Crayon, not editing
                editing = false;
                base.setSubmitText(s.submit_add);
                currCrayon = null;
                currClasses = '';
            }

            // Inline
            var inline = $('#' + s.inline_css);
            inline.change(function () {
                is_inline = $(this).is(':checked');
                var inline_hide = $('.' + s.inline_hide_css);
                var inline_single = $('.' + s.inline_hide_only_css);
                var disabled = [s.mark_css, s.range_css, s.title_css, s.url_css];

                for (var i in disabled) {
                    var obj = $(disabled[i]);
                    obj.attr('disabled', is_inline);
                }

                if (is_inline) {
                    inline_hide.hide();
                    inline_single.hide();
                    inline_hide.closest('tr').hide();
                    for (var i in disabled) {
                        var obj = $(disabled[i]);
                        obj.addClass('crayon-disabled');
                    }
                } else {
                    inline_hide.show();
                    inline_single.show();
                    inline_hide.closest('tr').show();
                    for (var i in disabled) {
                        var obj = $(disabled[i]);
                        obj.removeClass('crayon-disabled');
                    }
                }
            });
            inline.change();

            // Show the dialog
            var dialog_title = editing ? s.edit_text : s.add_text;
            $(s.dialog_title_css).html(dialog_title);
            if (showCallback) {
                showCallback();
            }

            code.focus();
            code_refresh();
            url_refresh();
            if (ajax_class_timer) {
                clearInterval(ajax_class_timer);
                ajax_class_timer_count = 0;
            }

            var ajax_window = $('#TB_window');
            ajax_window.hide();
            var fallback = function () {
                ajax_window.show();
                // Prevent draw artifacts
                var oldScroll = $(window).scrollTop();
                $(window).scrollTop(oldScroll + 10);
                $(window).scrollTop(oldScroll - 10);
            };

            ajax_class_timer = setInterval(function () {
                if (typeof ajax_window != 'undefined' && !ajax_window.hasClass('crayon-te-ajax')) {
                    ajax_window.addClass('crayon-te-ajax');
                    clearInterval(ajax_class_timer);
                    fallback();
                }
                if (ajax_class_timer_count >= 100) {
                    // In case it never loads, terminate
                    clearInterval(ajax_class_timer);
                    fallback();
                }
                ajax_class_timer_count++;
            }, 40);
        };

        // XXX Add Crayon to editor
        base.addCrayon = function () {
            var url = $(s.url_css);
            if (url.val().length == 0 && code.val().length == 0) {
                code.addClass(gs.selected);
                code.focus();
                return false;
            }
            code.removeClass(gs.selected);

            // Add inline for matching with CSS
            var inline = $('#' + s.inline_css);
            is_inline = inline.length != 0 && inline.is(':checked');

            // Spacing only for <pre>
            var br_before = br_after = '';
            if (!editing) {
                // Don't add spaces if editing
                if (!is_inline) {
                    if (editor_name == 'html') {
                        br_after = br_before = ' \n';
                    } else {
                        br_after = '<p>&nbsp;</p>';
                    }
                } else {
                    // Add a space after
                    if (editor_name == 'html') {
                        br_after = br_before = ' ';
                    } else {
                        br_after = '&nbsp;';
                    }
                }
            }

            var tag = (is_inline ? 'span' : 'pre');
            var shortcode = br_before + '<' + tag + ' ';

            var atts = {};
            shortcode += 'class="';

            var inline_re = new RegExp('\\b' + s.inline_css + '\\b', 'gim');
            if (is_inline) {
                // If don't have inline class, add it
                if (inline_re.exec(currClasses) == null) {
                    currClasses += ' ' + s.inline_css + ' ';
                }
            } else {
                // Remove inline css if it exists
                currClasses = currClasses.replace(inline_re, '');
            }

            // Grab settings as attributes
            $('.' + gs.changed + '[id],.' + gs.changed + '[' + s.data_value + ']').each(function () {
                var id = $(this).attr('id');
                var value = $(this).attr(s.data_value);
                // Remove prefix
                id = util.removePrefixFromID(id);
                atts[id] = value;
            });

            // Settings
            atts['lang'] = $(s.lang_css).val();
            var mark = $(s.mark_css).val();
            if (mark.length != 0 && !is_inline) {
                atts['mark'] = mark;
            }
            var range = $(s.range_css).val();
            if (range.length != 0 && !is_inline) {
                atts['range'] = range;
            }

            // XXX Code highlighting, checked means 0!
            if ($(s.hl_css).is(':checked')) {
                atts['highlight'] = '0';
            }

            // XXX Very important when working with editor
            atts['decode'] = 'true';

            // Validate the attributes
            atts = base.validate(atts);

            for (var id in atts) {
                // Remove prefix, if exists
                var value = atts[id];
                CrayonUtil.log('add ' + id + ':' + value);
                shortcode += id + s.attr_sep + value + ' ';
            }

            // Add classes
            shortcode += currClasses;
            // Don't forget to close quote for class
            shortcode += '" ';

            if (!is_inline) {
                // Title
                var title = $(s.title_css).val();
                if (title.length != 0) {
                    shortcode += 'title="' + title + '" ';
                }
                // URL
                var url = $(s.url_css).val();
                if (url.length != 0) {
                    shortcode += 'data-url="' + url + '" ';
                }
            }

            var content = $(s.code_css).val();
            if (outputHTML == 'encode') {
                content = CrayonUtil.encode_html(content);
            } else if (outputHTML == 'decode') {
                content = CrayonUtil.decode_html(content);
            }
            content = typeof content != 'undefined' ? content : '';
            shortcode += '>' + content + '</' + tag + '>' + br_after;

            if (editing && editCallback) {
                // Edit the current selected node
                editCallback(shortcode);
            } else if (insertCallback) {
                // Insert the tag and hide dialog
                insertCallback(shortcode);
            }

            return true;
        };

        base.submitButton = function () {
            CrayonUtil.log('submit');
            if (base.addCrayon() != false) {
                base.hideDialog();
            }
        };

        base.hideDialog = function () {
            CrayonUtil.log('hide');
            if (hideCallback) {
                hideCallback();
            }
        };

        // XXX Auxiliary methods

        base.setOrigValues = function () {
            $('.' + gs.setting + '[id]').each(function () {
                var setting = $(this);
                setting.attr(gs.orig_value, base.settingValue(setting));
            });
        };

        base.resetSettings = function () {
            CrayonUtil.log('reset');
            $('.' + gs.setting).each(function () {
                var setting = $(this);
                base.settingValue(setting, setting.attr(gs.orig_value));
                // Update highlights
                setting.change();
            });
            code.val('');
        };

        base.settingValue = function (setting, value) {
            if (typeof value == 'undefined') {
                // getter
                value = '';
                if (setting.is('input[type=checkbox]')) {
                    // Boolean is stored as string
                    value = setting.is(':checked') ? 'true' : 'false';
                } else {
                    value = setting.val();
                }
                return value;
            } else {
                // setter
                if (setting.is('input[type=checkbox]')) {
                    if (typeof value == 'string') {
                        if (value == 'true' || value == '1') {
                            value = true;
                        } else if (value == 'false' || value == '0') {
                            value = false;
                        }
                    }
                    setting.prop('checked', value);
                } else {
                    setting.val(value);
                }
                setting.attr(s.data_value, value);
            }
        };

        base.validate = function (atts) {
            var fields = ['range', 'mark'];
            for (var i in fields) {
                var field = fields[i];
                if (typeof atts[field] != 'undefined') {
                    atts[field] = atts[field].replace(/\s/g, '');
                }
            }
            return atts;
        };

        base.isCrayon = function (node) {
            return node != null &&
                (node.nodeName == 'PRE' || (node.nodeName == 'SPAN' && $(node).hasClass(s.inline_css)));
        };

        base.elemValue = function (obj) {
            var value = null;
            if (obj.is('input[type=checkbox]')) {
                value = obj.is(':checked');
            } else {
                value = obj.val();
            }
            return value;
        };

        base.setSubmitText = function (text) {
            submit.html(text);
        };

    };
})(jQueryCrayon);
