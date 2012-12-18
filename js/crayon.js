// Crayon Syntax Highlighter JavaScript

(function ($) {

    // BEGIN AUXILIARY FUNCTIONS

    $.fn.exists = function () {
        return this.length !== 0;
    };

    $.fn.style = function (styleName, value, priority) {
        // DOM node
        var node = this.get(0);
        // Ensure we have a DOM node
        if (typeof node == 'undefined') {
            return;
        }
        // CSSStyleDeclaration
        var style = node.style;
        // Getter/Setter
        if (typeof styleName != 'undefined') {
            if (typeof value != 'undefined') {
                // Set style property
                var priority = typeof priority != 'undefined' ? priority : '';
                if (typeof style.setProperty != 'undefined') {
                    style.setProperty(styleName, value, priority);
                } else {
                    style.styleName = value + ' ' + priority;
                }
            } else {
                // Get style property
                return style.styleName;
            }
        } else {
            // Get CSSStyleDeclaration
            return style;
        }
    };

    // END AUXILIARY FUNCTIONS

    var PRESSED = 'crayon-pressed';
    var UNPRESSED = '';

    var CRAYON_SYNTAX = 'div.crayon-syntax';
    var CRAYON_TOOLBAR = '.crayon-toolbar';
    var CRAYON_INFO = '.crayon-info';
    var CRAYON_PLAIN = '.crayon-plain';
    var CRAYON_MAIN = '.crayon-main';
    var CRAYON_TABLE = '.crayon-table';
    var CRAYON_LOADING = '.crayon-loading';
    var CRAYON_CODE = '.crayon-code';
    var CRAYON_NUMS = '.crayon-nums';
    var CRAYON_NUM = '.crayon-num';
    var CRAYON_LINE = '.crayon-line';
    var CRAYON_WRAPPED = 'crayon-wrapped';
    var CRAYON_NUMS_CONTENT = '.crayon-nums-content';
    var CRAYON_NUMS_BUTTON = '.crayon-nums-button';
    var CRAYON_WRAP_BUTTON = '.crayon-wrap-button';
    var CRAYON_EXPAND_BUTTON = '.crayon-expand-button';
    var CRAYON_POPUP_BUTTON = '.crayon-popup-button';
    var CRAYON_COPY_BUTTON = '.crayon-copy-button';
    var CRAYON_PLAIN_BUTTON = '.crayon-plain-button';

    $(document).ready(function () {
        CrayonSyntax.init();
    });

    CrayonSyntax = new function () {
        var base = this;
        var crayon = new Object();
        var currUID = 0;

        base.init = function () {
            if (typeof crayon == 'undefined') {
                crayon = new Object();
            }

            $(CRAYON_SYNTAX).each(function () {
                base.process(this);
            });
        };

        base.process = function (c, replace) {
            c = $(c);
            var uid = c.attr('id');
            if (uid == 'crayon-') {
                // No ID, generate one
                uid += getUID();
            }
            c.attr('id', uid);
            console_log(uid);

            if (typeof replace == 'undefined') {
                replace = false;
            }

            if (!replace && !make_uid(uid)) {
                // Already a Crayon
                return;
            }

            var toolbar = c.find(CRAYON_TOOLBAR);
            var info = c.find(CRAYON_INFO);
            var plain = c.find(CRAYON_PLAIN);
            var main = c.find(CRAYON_MAIN);
            var table = c.find(CRAYON_TABLE);
            var code = c.find(CRAYON_CODE);
            var nums = c.find(CRAYON_NUMS);
            var nums_content = c.find(CRAYON_NUMS_CONTENT);
            var nums_button = c.find(CRAYON_NUMS_BUTTON);
            var wrap_button = c.find(CRAYON_WRAP_BUTTON);
            var expand_button = c.find(CRAYON_EXPAND_BUTTON);
            var popup_button = c.find(CRAYON_POPUP_BUTTON);
            var copy_button = c.find(CRAYON_COPY_BUTTON);
            var plain_button = c.find(CRAYON_PLAIN_BUTTON);

            crayon[uid] = c;
            crayon[uid].toolbar = toolbar;
            crayon[uid].plain = plain;
            crayon[uid].info = info;
            crayon[uid].main = main;
            crayon[uid].table = table;
            crayon[uid].code = code;
            crayon[uid].nums = nums;
            crayon[uid].nums_content = nums_content;
            crayon[uid].nums_button = nums_button;
            crayon[uid].wrap_button = wrap_button;
            crayon[uid].expand_button = expand_button;
            crayon[uid].popup_button = popup_button;
            crayon[uid].copy_button = copy_button;
            crayon[uid].plain_button = plain_button;
            crayon[uid].nums_visible = true;
            crayon[uid].wrapped = false;
            crayon[uid].plain_visible = false;

            crayon[uid].toolbar_delay = 0;
            crayon[uid].time = 1;

            // Set plain
            $(CRAYON_PLAIN).css('z-index', 0);

            // XXX Remember CSS dimensions
            var main_style = main.style();
            crayon[uid].main_style = {
                'height': main_style && main_style.height || '',
                'max-height': main_style && main_style.maxHeight || '',
                'min-height': main_style && main_style.minHeight || '',
                'width': main_style && main_style.width || '',
                'max-width': main_style && main_style.maxWidth || '',
                'min-width': main_style && main_style.minWidth || ''
            };

            var load_timer;
            var i = 0;
            crayon[uid].loading = true;
            crayon[uid].scroll_block_fix = false;

            // Register click events
            nums_button.click(function () {
                CrayonSyntax.toggle_nums(uid);
            });
            wrap_button.click(function () {
                CrayonSyntax.toggle_wrap(uid);
            });
            expand_button.click(function () {
                CrayonSyntax.toggle_expand(uid);
            });
            plain_button.click(function () {
                CrayonSyntax.toggle_plain(uid);
            });
            copy_button.click(function () {
                CrayonSyntax.copy_plain(uid);
            });

            // Enable retina if supported
            retina(uid);

            var load_func = function () {
                if (main.height() < 30) {
                    crayon[uid].scroll_block_fix = true;
                }

                // If nums hidden by default
                if (nums.filter('[data-settings~="hide"]').length != 0) {
                    nums_content.ready(function () {
                        console_log('function' + uid);
                        CrayonSyntax.toggle_nums(uid, true, true);
                    });
                } else {
                    update_nums_button(uid);
                }

                if (typeof crayon[uid].expanded == 'undefined') {
                    // Determine if we should enable code expanding toggling
                    if (Math.abs(crayon[uid].main.width() - crayon[uid].table.width()) < 10) {
                        crayon[uid].expand_button.hide();
                    } else {
                        crayon[uid].expand_button.show();
                    }
                }

                // TODO If width has changed or timeout, stop timer
                if (/*last_num_width != nums.width() ||*/ i == 5) {
                    clearInterval(load_timer);
                    //crayon[uid].removeClass(CRAYON_LOADING);
                    crayon[uid].loading = false;
                }
                i++;
            };
            load_timer = setInterval(load_func, 300);
            fix_scroll_blank(uid);

            // Add ref to num for each line
            $(CRAYON_NUM, crayon[uid]).each(function () {
                var line_id = $(this).attr('data-line');
                var line = $('#' + line_id);
                var height = line.style('height');
                if (height) {
                    line.attr('data-height', height);
                }
            });

            // Used for toggling
            main.css('position', 'relative');
            main.css('z-index', 1);

            // Disable certain features for touchscreen devices
            touchscreen = (c.filter('[data-settings~="touchscreen"]').length != 0);

            // Used to hide info
            if (!touchscreen) {
                main.click(function () {
                    crayon_info(uid, '', false);
                });
                plain.click(function () {
                    crayon_info(uid, '', false);
                });
                info.click(function () {
                    crayon_info(uid, '', false);
                });
            }

            // Used for code popup
            if (c.filter('[data-settings~="no-popup"]').length == 0) {
                crayon[uid].popup_settings = popupWindow(popup_button, {
                    height: screen.height - 200,
                    width: screen.width - 100,
                    top: 75,
                    left: 50,
                    scrollbars: 1,
                    windowURL: '',
                    data: '' // Data overrides URL
                }, function () {
                    code_popup(uid);
                }, function () {
                    //console_log('after');
                });
            }

            plain.css('opacity', 0);
            // If a toolbar with mouseover was found
            if (toolbar.filter('[data-settings~="mouseover"]').length != 0 && !touchscreen) {
                crayon[uid].toolbar_mouseover = true;

                toolbar.css('margin-top', '-' + toolbar.height() + 'px');
                toolbar.hide();
                // Overlay the toolbar if needed, only if doing so will not hide the
                // whole code!
                if (toolbar.filter('[data-settings~="overlay"]').length != 0
                    && main.height() > toolbar.height() * 2) {
                    toolbar.css('position', 'absolute');
                    toolbar.css('z-index', 2);
                    // Hide on single click when overlayed
                    if (toolbar.filter('[data-settings~="hide"]').length != 0) {
                        main.click(function () {
                            toolbar_toggle(uid, undefined, undefined, 0);
                        });
                        plain.click(function () {
                            toolbar_toggle(uid, false, undefined, 0);
                        });
                    }
                } else {
                    toolbar.css('z-index', 4);
                }
                // Enable delay on mouseout
                if (toolbar.filter('[data-settings~="delay"]').length != 0) {
                    crayon[uid].toolbar_delay = 500;
                }
                // Use .hover() for chrome, but in firefox mouseover/mouseout worked best
                c.mouseenter(function () {
                    toolbar_toggle(uid, true);
                })
                    .mouseleave(function () {
                        toolbar_toggle(uid, false);
                    });
            } else if (touchscreen) {
                toolbar.show();
            }

            // Plain show events
            if (plain.length != 0 && !touchscreen) {
                if (plain.filter('[data-settings~="dblclick"]').length != 0) {
                    main.dblclick(function () {
                        CrayonSyntax.toggle_plain(uid);
                    });
                } else if (plain.filter('[data-settings~="click"]').length != 0) {
                    main.click(function () {
                        CrayonSyntax.toggle_plain(uid);
                    });
                } else if (plain.filter('[data-settings~="mouseover"]').length != 0) {
                    c.mouseenter(function () {
                        CrayonSyntax.toggle_plain(uid, true);
                    })
                        .mouseleave(function () {
                            CrayonSyntax.toggle_plain(uid, false);
                        });
                    nums_button.hide();
                }
                if (plain.filter('[data-settings~="show-plain-default"]').length != 0) {
                    // XXX
                    CrayonSyntax.toggle_plain(uid, true);
                }
            }

            // Scrollbar show events
            var expand = c.filter('[data-settings~="expand"]').length != 0;
//            crayon[uid].mouse_expand = expand;
            if (!touchscreen && c.filter('[data-settings~="scroll-mouseover"]').length != 0) {
                // Disable on touchscreen devices and when set to mouseover
                main.css('overflow', 'hidden');
                plain.css('overflow', 'hidden');
                if (!expand) {
                    c.mouseenter(function () {
                        toggle_scroll(uid, true, expand);
                    })
                        .mouseleave(function () {
                            toggle_scroll(uid, false, expand);
                        });
                }
            }

            if (expand) {
                c.mouseenter(function () {
                    toggle_expand(uid, true);
                })
                    .mouseleave(function () {
                        toggle_expand(uid, false);
                    });
            }

            // Disable animations
            if (c.filter('[data-settings~="disable-anim"]').length != 0) {
                crayon[uid].time = 0;
            }

            // Wrap
            if (c.filter('[data-settings~="wrap"]').length != 0) {
                crayon[uid].wrapped = true;
            }

            // Determine if Mac
            crayon[uid].mac = c.hasClass('crayon-os-mac');

            // Update clickable buttons
            update_nums_button(uid);
            update_plain_button(uid);
            update_wrap(uid);
        };

        var make_uid = function (uid) {
            console_log(crayon);
            if (typeof crayon[uid] == 'undefined') {
                crayon[uid] = $('#' + uid);
                console_log('make ' + uid);
                return true;
            }

            console_log('no make ' + uid);
            return false;
        };

        var getUID = function () {
            return currUID++;
        };

        var code_popup = function (uid) {
            if (typeof crayon[uid] == 'undefined') {
                return make_uid(uid);
            }
            var settings = crayon[uid].popup_settings;
            if (settings.data) {
                // Already done
                return;
            }

            var clone = crayon[uid].clone(true);
            clone.removeClass('crayon-wrapped');

            // Unwrap
            if (crayon[uid].wrapped) {
                $(CRAYON_NUM, clone).each(function () {
                    var line_id = $(this).attr('data-line');
                    var line = $('#' + line_id);
                    var height = line.attr('data-height');
                    height = height ? height : '';
                    if (typeof height != 'undefined') {
                        line.css('height', height);
                        $(this).css('height', height);
                    }
                });
            }
            clone.find(CRAYON_MAIN).css('height', '');

            var code = '';
            if (crayon[uid].plain_visible) {
                code = clone.find(CRAYON_PLAIN);
            } else {
                code = clone.find(CRAYON_MAIN);
            }

            settings.data = base.get_all_css() + '<body class="crayon-popup-window" style="padding:0; margin:0;"><div class="' + clone.attr('class') +
                ' crayon-popup">' + remove_css_inline(get_jquery_str(code)) + '</div></body>';
        };

        var get_jquery_str = function (object) {
            return $('<div>').append(object.clone()).remove().html();
        };

        var remove_css_inline = function (string) {
            var reStyle = /style\s*=\s*"([^"]+)"/gmi;
            var match = null;
            while ((match = reStyle.exec(string)) != null) {
                var repl = match[1];
                repl = repl.replace(/\b(?:width|height)\s*:[^;]+;/gmi, '');
                string = string.sliceReplace(match.index, match.index + match[0].length, 'style="' + repl + '"');
            }
            return string;
        };

        // Get all CSS on the page as a string
        base.get_all_css = function () {
            var css_str = '';
            var css = $('link[rel="stylesheet"]');
            var filtered = [];
            if (css.length == 1) {
                // For minified CSS, only allow a single file
                filtered = css;
            } else {
                // Filter all others for Crayon CSS
                filtered = css.filter('[href*="crayon-syntax-highlighter"]');
            }
            filtered.each(function () {
                var string = get_jquery_str($(this));
                css_str += string;
            });
            return css_str;
        };

        base.copy_plain = function (uid, hover) {
            if (typeof crayon[uid] == 'undefined') {
                return make_uid(uid);
            }

            var plain = crayon[uid].plain;

            base.toggle_plain(uid, true, true);
            toolbar_toggle(uid, true);

            key = crayon[uid].mac ? '\u2318' : 'CTRL';
            var text = crayon[uid].copy_button.attr('data-text');
            text = text.replace(/%s/, key + '+C');
            text = text.replace(/%s/, key + '+V');
            crayon_info(uid, text);
            return false;
        };

        var crayon_info = function (uid, text, show) {
            if (typeof crayon[uid] == 'undefined') {
                return make_uid(uid);
            }

            var info = crayon[uid].info;

            if (typeof text == 'undefined') {
                text = '';
            }
            if (typeof show == 'undefined') {
                show = true;
            }

            if (crayon_is_slide_hidden(info) && show) {
                info.html('<div>' + text + '</div>');
                info.css('margin-top', -info.height());
                info.show();
                crayon_slide(uid, info, true);
                setTimeout(function () {
                    crayon_slide(uid, info, false);
                }, 5000);
            }

            if (!show) {
                crayon_slide(uid, info, false);
            }

        };

        var retina = function (uid) {
            if (window.devicePixelRatio > 1) {
                var buttons = $('.crayon-button', crayon[uid].toolbar);
                buttons.each(function () {
                    var lowres = $(this).css('background-image');
                    var highres = lowres.replace(/\.(?=[^\.]+$)/g, '@2x.');
                    $(this).css('background-size', '48px 16px');
                    $(this).css('background-image', highres);
                });
            }
        };

        var crayon_is_slide_hidden = function (object) {
            var object_neg_height = '-' + object.height() + 'px';
            if (object.css('margin-top') == object_neg_height || object.css('display') == 'none') {
                return true;
            } else {
                return false;
            }
        };

        var crayon_slide = function (uid, object, show, anim_time, hide_delay) {
            var object_neg_height = '-' + object.height() + 'px';

            if (typeof show == 'undefined') {
                if (crayon_is_slide_hidden(object)) {
                    show = true;
                } else {
                    show = false;
                }
            }
            // Instant means no time delay for showing/hiding
            if (typeof anim_time == 'undefined') {
                anim_time = 100;
            }
            if (anim_time == false) {
                anim_time = false;
            }
            if (typeof hide_delay == 'undefined') {
                hide_delay = 0;
            }
            object.stop(true);
            if (show == true) {
                object.show();
                object.animate({
                    marginTop: 0
                }, animt(anim_time, uid));
            } else if (show == false) {
                // Delay if fully visible
                if (/*instant == false && */object.css('margin-top') == '0px' && hide_delay) {
                    object.delay(hide_delay);
                }
                object.animate({
                    marginTop: object_neg_height
                }, animt(anim_time, uid), function () {
                    object.hide();
                });
            }
        };

        base.toggle_plain = function (uid, hover, select) {
            if (typeof crayon[uid] == 'undefined') {
                return make_uid(uid);
            }

            var main = crayon[uid].main;
            var plain = crayon[uid].plain;

            if ((main.is(':animated') || plain.is(':animated')) && typeof hover == 'undefined') {
                return;
            }

            reconsile_dimensions(uid);

            var visible, hidden;
            if (typeof hover != 'undefined') {
                if (hover) {
                    visible = main;
                    hidden = plain;
                } else {
                    visible = plain;
                    hidden = main;
                }
            } else {
                if (main.css('z-index') == 1) {
                    visible = main;
                    hidden = plain;
                } else {
                    visible = plain;
                    hidden = main;
                }
            }

            crayon[uid].plain_visible = (hidden == plain);

            // Remember scroll positions of visible
            crayon[uid].top = visible.scrollTop();
            crayon[uid].left = visible.scrollLeft();

            /* Used to detect a change in overflow when the mouse moves out
             * of the Crayon. If it does, then overflow has already been changed,
             * no need to revert it after toggling plain. */
            crayon[uid].scroll_changed = false;

            // Hide scrollbars during toggle to avoid Chrome weird draw error
            // visible.css('overflow', 'hidden');
            // hidden.css('overflow', 'hidden');

            fix_scroll_blank(uid);

            // Show hidden, hide visible
            visible.stop(true);
            visible.fadeTo(animt(500, uid), 0,
                function () {
                    visible.css('z-index', 0);
                });
            hidden.stop(true);
            hidden.fadeTo(animt(500, uid), 1,
                function () {
                    hidden.css('z-index', 1);
                    // Give focus to plain code
                    if (hidden == plain) {
                        if (select) {
                            plain.select();
                        } else {
                            // XXX not needed
                            // plain.focus();
                        }
                    }

                    // Refresh scrollbar draw
                    hidden.scrollTop(crayon[uid].top + 1);
                    hidden.scrollTop(crayon[uid].top);
                    hidden.scrollLeft(crayon[uid].left + 1);
                    hidden.scrollLeft(crayon[uid].left);
                });

            // Restore scroll positions to hidden
            hidden.scrollTop(crayon[uid].top);
            hidden.scrollLeft(crayon[uid].left);

            update_plain_button(uid);

            // Hide toolbar if possible
            toolbar_toggle(uid, false);
            return false;
        };

        base.toggle_nums = function (uid, hide, instant) {
            if (typeof crayon[uid] == 'undefined') {
                make_uid(uid);
                return false;
            }

            if (crayon[uid].table.is(':animated')) {
                return false;
            }
            var nums_width = Math.round(crayon[uid].nums_content.width() + 1);
            var neg_width = '-' + nums_width + 'px';

            // Force hiding
            var num_hidden;
            if (typeof hide != 'undefined') {
                num_hidden = false;
            } else {
                // Check hiding
                num_hidden = (crayon[uid].table.css('margin-left') == neg_width);
            }

            var num_margin;
            if (num_hidden) {
                // Show
                num_margin = '0px';
                crayon[uid].nums_visible = true;
            } else {
                // Hide
                crayon[uid].table.css('margin-left', '0px');
                crayon[uid].nums_visible = false;
                num_margin = neg_width;
            }

            if (typeof instant != 'undefined') {
                crayon[uid].table.css('margin-left', num_margin);
                update_nums_button(uid);
                return false;
            }

            // Stop jerking animation from scrollbar appearing for a split second due to
            // change in width. Prevents scrollbar disappearing if already visible.
            h_scroll_visible = (crayon[uid].table.width() + px_to_int(crayon[uid].table.css('margin-left')) > crayon[uid].main.width());
            v_scroll_visible = (crayon[uid].table.height() > crayon[uid].main.height());
            if (!h_scroll_visible && !v_scroll_visible) {
                crayon[uid].main.css('overflow', 'hidden');
            }
            crayon[uid].table.animate({
                marginLeft: num_margin
            }, animt(200, uid), function () {
                if (typeof crayon[uid] != 'undefined') {
                    update_nums_button(uid);
                    if (!h_scroll_visible && !v_scroll_visible) {
                        crayon[uid].main.css('overflow', 'auto');
                    }
                }
            });
            return false;
        };

        base.toggle_wrap = function (uid) {
            crayon[uid].wrapped = !crayon[uid].wrapped;
            update_wrap(uid);
        };

        base.toggle_expand = function (uid) {
            var expand = !CrayonUtil.setDefault(crayon[uid].expanded, false);
            toggle_expand(uid, expand);
        };

        var update_wrap = function (uid) {
            if (crayon[uid].wrapped) {
                crayon[uid].addClass(CRAYON_WRAPPED);
            } else {
                crayon[uid].removeClass(CRAYON_WRAPPED);
            }
            update_wrap_button(uid);
            if (!crayon[uid].expanded) {
                restore_dimensions(uid);
            }
            crayon[uid].wrap_times = 0;
            crayon[uid].wrap_timer = setInterval(function () {
                reconsile_lines(uid);
                crayon[uid].wrap_times++;
                if (crayon[uid].wrap_times == 5) {
                    clearInterval(crayon[uid].wrap_timer);
                }
            }, 200);
        };

        var fix_table_width = function (uid) {
            if (typeof crayon[uid] == 'undefined') {
                make_uid(uid);
                return false;
            }
        };

        // Convert '-10px' to -10
        var px_to_int = function (pixels) {
            if (typeof pixels != 'string') {
                return 0;
            }
            var result = pixels.replace(/[^-0-9]/g, '');
            if (result.length == 0) {
                return 0;
            } else {
                return parseInt(result);
            }
        };

        var update_nums_button = function (uid) {
            if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].nums_visible == 'undefined') {
                return;
            }
            if (crayon[uid].nums_visible) {
                crayon[uid].nums_button.removeClass(UNPRESSED);
                crayon[uid].nums_button.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayon[uid].nums_button.removeClass(PRESSED);
                crayon[uid].nums_button.addClass(UNPRESSED);
            }
        };

        var update_wrap_button = function (uid) {
            if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].wrapped == 'undefined') {
                return;
            }
            if (crayon[uid].wrapped) {
                crayon[uid].wrap_button.removeClass(UNPRESSED);
                crayon[uid].wrap_button.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayon[uid].wrap_button.removeClass(PRESSED);
                crayon[uid].wrap_button.addClass(UNPRESSED);
            }
        };

        var update_expand_button = function (uid) {
            if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].expanded == 'undefined') {
                return;
            }

            if (crayon[uid].expanded) {
                crayon[uid].expand_button.removeClass(UNPRESSED);
                crayon[uid].expand_button.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayon[uid].expand_button.removeClass(PRESSED);
                crayon[uid].expand_button.addClass(UNPRESSED);
            }
        };

        var update_plain_button = function (uid) {
            if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].plain_visible == 'undefined') {
                return;
            }

            if (crayon[uid].plain_visible) {
                crayon[uid].plain_button.removeClass(UNPRESSED);
                crayon[uid].plain_button.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayon[uid].plain_button.removeClass(PRESSED);
                crayon[uid].plain_button.addClass(UNPRESSED);
            }
        };

        var toolbar_toggle = function (uid, show, anim_time, hide_delay) {
            if (typeof crayon[uid] == 'undefined') {
                return make_uid(uid);
            } else if (!crayon[uid].toolbar_mouseover) {
                return;
            }
            var toolbar = crayon[uid].toolbar;

            if (typeof hide_delay == 'undefined') {
                hide_delay = crayon[uid].toolbar_delay;
            }

            crayon_slide(uid, toolbar, show, anim_time, hide_delay);
        };

        var initSize = function (uid) {
            // Shared for scrollbars and expanding
            crayon[uid].initialSize = {width: crayon[uid].width(), height: crayon[uid].height()};
        };

        var toggle_expand = function (uid, expand) {
            if (typeof crayon[uid] == 'undefined') {
                return make_uid(uid);
            }
            if (typeof expand == 'undefined') {
                return;
            }

            var main = crayon[uid].main;
            var plain = crayon[uid].plain;

            if (expand) {
                if (typeof crayon[uid].expanded == 'undefined') {
                    initSize(uid);
                    crayon[uid].finalSize = {width: crayon[uid].table.width(), height: crayon[uid].table.height()};
                    // Ensure we don't shrink
                    crayon[uid].finalSize.width = CrayonUtil.setMin(crayon[uid].finalSize.width, crayon[uid].initialSize.width);
                    crayon[uid].finalSize.height = CrayonUtil.setMin(crayon[uid].finalSize.height, crayon[uid].initialSize.height);
                    crayon[uid].diffSize = {
                        width: crayon[uid].finalSize.width - crayon[uid].initialSize.width,
                        height: crayon[uid].finalSize.height - crayon[uid].initialSize.height
                    };
                    crayon[uid].expandTime = CrayonUtil.setRange(crayon[uid].diffSize.width / 3, 300, 800);
                    crayon[uid].expanded = false;
                }

                var initialSize = crayon[uid].initialSize;
                var diffSize = crayon[uid].diffSize;
                var finalSize = crayon[uid].finalSize;

                var expandHeight = {
                    'height': 'auto',
                    'min-height': 'none',
                    'max-height': 'none'
                };
                var expandWidth = {
                    'width': 'auto',
                    'min-width': 'none',
                    'max-width': 'none'
                };
                crayon[uid].height(crayon[uid].height());
                crayon[uid].width(crayon[uid].width());
                crayon[uid].css({
                    'min-width': 'none',
                    'max-width': 'none'
                });
                main.css(expandHeight);
                main.css(expandWidth);
                crayon[uid].stop(true);
                crayon[uid].animate({
                    width: finalSize.width,
                    height: finalSize.height
                }, animt(crayon[uid].expandTime, uid), function () {
                    crayon[uid].expanded = true;
                    update_expand_button(uid);
                });
            } else {
                var initialSize = crayon[uid].initialSize;
                var delay = crayon[uid].toolbar_delay;
                if (initialSize) {
                    crayon[uid].stop(true);
                    if (!crayon[uid].expanded) {
                        crayon[uid].delay(delay);
                    }
                    crayon[uid].animate({
                        width: initialSize.width,
                        height: initialSize.height
                    }, animt(crayon[uid].expandTime, uid), function () {
                        expand_finish(uid);
                    });
                } else {
                    setTimeout(function () {
                        expand_finish(uid);
                    }, delay);
                }
            }

            reconsile_dimensions(uid);
            if (expand) {
                update_wrap(uid);
            }
        };

        var expand_finish = function(uid) {
            crayon[uid].expanded = false;
            restore_dimensions(uid);
            update_expand_button(uid);
            if (crayon[uid].wrapped) {
                update_wrap(uid);
            }
        };

        var toggle_scroll = function (uid, show, expand) {
            if (typeof crayon[uid] == 'undefined') {
                return make_uid(uid);
            }
            if (typeof show == 'undefined') {
                return;
            }

            var main = crayon[uid].main;
            var plain = crayon[uid].plain;

            if (typeof crayon[uid].initialSize == 'undefined') {
                initSize(uid);
            }

            if (show) {
                main.height(main.height());
                plain.height(plain.height());
                // Show scrollbars
                main.css('overflow', 'auto');
                plain.css('overflow', 'auto');
                if (typeof crayon[uid].top != 'undefined') {
                    visible = (main.css('z-index') == 1 ? main : plain);
                    // Browser will not render until scrollbar moves, move it manually
                    visible.scrollTop(crayon[uid].top - 1);
                    visible.scrollTop(crayon[uid].top);
                    visible.scrollLeft(crayon[uid].left - 1);
                    visible.scrollLeft(crayon[uid].left);
                }
            } else {
                // Hide scrollbars
                visible = (main.css('z-index') == 1 ? main : plain);
                crayon[uid].top = visible.scrollTop();
                crayon[uid].left = visible.scrollLeft();
                main.css('overflow', 'hidden');
                plain.css('overflow', 'hidden');
//                main.height(crayon[uid].initialSize.height);
//                plain.height(crayon[uid].initialSize.height);

                if (!crayon[uid].expanded) {
                    restore_dimensions(uid);
                }

                //restore_dimensions(uid);
            }
            // Register that overflow has changed
            crayon[uid].scroll_changed = true;
            fix_scroll_blank(uid);
        };

        /* Fix weird draw error, causes blank area to appear where scrollbar once was. */
        var fix_scroll_blank = function (uid) {
            // Scrollbar draw error in Chrome
            crayon[uid].table.style('width', '100%', 'important');
            var redraw = setTimeout(function () {
                crayon[uid].table.style('width', '');
                clearInterval(redraw);
            }, 10);
        };

        var restore_dimensions = function (uid) {
            // Restore dimensions
            var main = crayon[uid].main;
            var main_style = crayon[uid].main_style;
            main.css(main_style);
            // Width styles also apply to crayon
            crayon[uid].css('height', 'auto');
            crayon[uid].css('width', main_style['width']);
            crayon[uid].css('max-width', main_style['max-width']);
            crayon[uid].css('min-width', main_style['min-width']);
        };

        var reconsile_dimensions = function (uid) {
            // Reconsile dimensions
            crayon[uid].plain.height(crayon[uid].main.height());
        };

        var reconsile_lines = function (uid) {
            $(CRAYON_NUM, crayon[uid]).each(function () {
                var line_id = $(this).attr('data-line');
                var line = $('#' + line_id);
                if (crayon[uid].wrapped) {
                    line.css('height', '');
                    $(this).css('height', line.height());
                    // TODO toolbar should overlay title if needed
                } else {
                    var height = line.attr('data-height');
                    height = height ? height : '';
                    if (typeof height != 'undefined') {
                        line.css('height', height);
                        $(this).css('height', height);
                    }
                    //line.css('height', line.css('line-height'));
                    //console.log(line.css('line-height'));
                }
            });
        };

        var animt = function (x, uid) {
            if (x == 'fast') {
                x = 200;
            } else if (x == 'slow') {
                x = 600;
            } else if (!isNumber(x)) {
                x = parseInt(x);
                if (isNaN(x)) {
                    return 0;
                }
            }
            return x * crayon[uid].time;
        };

        var isNumber = function (x) {
            return typeof x == 'number';
        };

    };

})(jQueryCrayon);
