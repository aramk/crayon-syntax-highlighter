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
                priority = typeof priority != 'undefined' ? priority : '';
                if (typeof style.setProperty != 'undefined') {
                    style.setProperty(styleName, value, priority);
                } else {
                    // XXX Using priority breaks on IE 7 & 8
//                    if (priority) {
//                        value = value + ' !' + priority;
//                    }
                    style[styleName] = value;
                }
            } else {
                // Get style property
                return style[styleName];
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
            CrayonUtil.log(uid);

            if (typeof replace == 'undefined') {
                replace = false;
            }

            if (!replace && !makeUID(uid)) {
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
            var numsContent = c.find(CRAYON_NUMS_CONTENT);
            var numsButton = c.find(CRAYON_NUMS_BUTTON);
            var wrapButton = c.find(CRAYON_WRAP_BUTTON);
            var expandButton = c.find(CRAYON_EXPAND_BUTTON);
            var popupButton = c.find(CRAYON_POPUP_BUTTON);
            var copyButton = c.find(CRAYON_COPY_BUTTON);
            var plainButton = c.find(CRAYON_PLAIN_BUTTON);

            crayon[uid] = c;
            crayon[uid].toolbar = toolbar;
            crayon[uid].plain = plain;
            crayon[uid].info = info;
            crayon[uid].main = main;
            crayon[uid].table = table;
            crayon[uid].code = code;
            crayon[uid].nums = nums;
            crayon[uid].nums_content = numsContent;
            crayon[uid].numsButton = numsButton;
            crayon[uid].wrapButton = wrapButton;
            crayon[uid].expandButton = expandButton;
            crayon[uid].popup_button = popupButton;
            crayon[uid].copy_button = copyButton;
            crayon[uid].plainButton = plainButton;
            crayon[uid].numsVisible = true;
            crayon[uid].wrapped = false;
            crayon[uid].plainVisible = false;

            crayon[uid].toolbar_delay = 0;
            crayon[uid].time = 1;

            // Set plain
            $(CRAYON_PLAIN).css('z-index', 0);

            // XXX Remember CSS dimensions
            var mainStyle = main.style();
            crayon[uid].main_style = {
                'height': mainStyle && mainStyle.height || '',
                'max-height': mainStyle && mainStyle.maxHeight || '',
                'min-height': mainStyle && mainStyle.minHeight || '',
                'width': mainStyle && mainStyle.width || '',
                'max-width': mainStyle && mainStyle.maxWidth || '',
                'min-width': mainStyle && mainStyle.minWidth || ''
            };

            var load_timer;
            var i = 0;
            crayon[uid].loading = true;
            crayon[uid].scrollBlockFix = false;

            // Register click events
            numsButton.click(function () {
                CrayonSyntax.toggleNums(uid);
            });
            wrapButton.click(function () {
                CrayonSyntax.toggleWrap(uid);
            });
            expandButton.click(function () {
                CrayonSyntax.toggleExpand(uid);
            });
            plainButton.click(function () {
                CrayonSyntax.togglePlain(uid);
            });
            copyButton.click(function () {
                CrayonSyntax.copyPlain(uid);
            });

            // Enable retina if supported
            retina(uid);

            var load_func = function () {
                // If nums hidden by default
                if (nums.filter('[data-settings~="hide"]').length != 0) {
                    numsContent.ready(function () {
                        CrayonUtil.log('function' + uid);
                        CrayonSyntax.toggleNums(uid, true, true);
                    });
                } else {
                    updateNumsButton(uid);
                }

                if (typeof crayon[uid].expanded == 'undefined') {
                    // Determine if we should enable code expanding toggling
                    if (Math.abs(crayon[uid].main.width() - crayon[uid].table.width()) < 10) {
                        crayon[uid].expandButton.hide();
                    } else {
                        crayon[uid].expandButton.show();
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
            fixScrollBlank(uid);

            // Add ref to num for each line
            $(CRAYON_NUM, crayon[uid]).each(function () {
                var lineID = $(this).attr('data-line');
                var line = $('#' + lineID);
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
                    crayonInfo(uid, '', false);
                });
                plain.click(function () {
                    crayonInfo(uid, '', false);
                });
                info.click(function () {
                    crayonInfo(uid, '', false);
                });
            }

            // Used for code popup
            if (c.filter('[data-settings~="no-popup"]').length == 0) {
                crayon[uid].popup_settings = popupWindow(popupButton, {
                    height: screen.height - 200,
                    width: screen.width - 100,
                    top: 75,
                    left: 50,
                    scrollbars: 1,
                    windowURL: '',
                    data: '' // Data overrides URL
                }, function () {
                    codePopup(uid);
                }, function () {
                    //CrayonUtil.log('after');
                });
            }

            plain.css('opacity', 0);

            crayon[uid].toolbar_visible = true;
            crayon[uid].toolbarMouseover = false;
            // If a toolbar with mouseover was found
            if (toolbar.filter('[data-settings~="mouseover"]').length != 0 && !touchscreen) {
                crayon[uid].toolbarMouseover = true;
                crayon[uid].toolbar_visible = false;

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
                            toggleToolbar(uid, undefined, undefined, 0);
                        });
                        plain.click(function () {
                            toggleToolbar(uid, false, undefined, 0);
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
                    toggleToolbar(uid, true);
                })
                    .mouseleave(function () {
                        toggleToolbar(uid, false);
                    });
            } else if (touchscreen) {
                toolbar.show();
            }

            // Plain show events
            if (plain.length != 0 && !touchscreen) {
                if (plain.filter('[data-settings~="dblclick"]').length != 0) {
                    main.dblclick(function () {
                        CrayonSyntax.togglePlain(uid);
                    });
                } else if (plain.filter('[data-settings~="click"]').length != 0) {
                    main.click(function () {
                        CrayonSyntax.togglePlain(uid);
                    });
                } else if (plain.filter('[data-settings~="mouseover"]').length != 0) {
                    c.mouseenter(function () {
                        CrayonSyntax.togglePlain(uid, true);
                    })
                        .mouseleave(function () {
                            CrayonSyntax.togglePlain(uid, false);
                        });
                    numsButton.hide();
                }
                if (plain.filter('[data-settings~="show-plain-default"]').length != 0) {
                    // XXX
                    CrayonSyntax.togglePlain(uid, true);
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
                    toggleExpand(uid, true);
                })
                    .mouseleave(function () {
                        toggleExpand(uid, false);
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
            updateNumsButton(uid);
            updatePlainButton(uid);
            updateWrap(uid);
        };

        var makeUID = function (uid) {
            CrayonUtil.log(crayon);
            if (typeof crayon[uid] == 'undefined') {
                crayon[uid] = $('#' + uid);
                CrayonUtil.log('make ' + uid);
                return true;
            }

            CrayonUtil.log('no make ' + uid);
            return false;
        };

        var getUID = function () {
            return currUID++;
        };

        var codePopup = function (uid) {
            if (typeof crayon[uid] == 'undefined') {
                return makeUID(uid);
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
            if (crayon[uid].plainVisible) {
                code = clone.find(CRAYON_PLAIN);
            } else {
                code = clone.find(CRAYON_MAIN);
            }

            settings.data = base.getAllCSS() + '<body class="crayon-popup-window" style="padding:0; margin:0;"><div class="' + clone.attr('class') +
                ' crayon-popup">' + base.removeCssInline(base.getHtmlString(code)) + '</div></body>';
        };

        base.getHtmlString = function (object) {
            return $('<div>').append(object.clone()).remove().html();
        };

        base.removeCssInline = function (string) {
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
        base.getAllCSS = function () {
            var css_str = '';
            var css = $('link[rel="stylesheet"]');
            var filtered = [];
            if (css.length == 1) {
                // For minified CSS, only allow a single file
                filtered = css;
            } else {
                // Filter all others for Crayon CSS
                filtered = css.filter('[href*="crayon-syntax-highlighter"], [href*="min/"]');
            }
            filtered.each(function () {
                var string = base.getHtmlString($(this));
                css_str += string;
            });
            return css_str;
        };

        base.copyPlain = function (uid, hover) {
            if (typeof crayon[uid] == 'undefined') {
                return makeUID(uid);
            }

            var plain = crayon[uid].plain;

            base.togglePlain(uid, true, true);
            toggleToolbar(uid, true);

            key = crayon[uid].mac ? '\u2318' : 'CTRL';
            var text = crayon[uid].copy_button.attr('data-text');
            text = text.replace(/%s/, key + '+C');
            text = text.replace(/%s/, key + '+V');
            crayonInfo(uid, text);
            return false;
        };

        var crayonInfo = function (uid, text, show) {
            if (typeof crayon[uid] == 'undefined') {
                return makeUID(uid);
            }

            var info = crayon[uid].info;

            if (typeof text == 'undefined') {
                text = '';
            }
            if (typeof show == 'undefined') {
                show = true;
            }

            if (isSlideHidden(info) && show) {
                info.html('<div>' + text + '</div>');
                info.css('margin-top', -info.height());
                info.show();
                crayonSlide(uid, info, true);
                setTimeout(function () {
                    crayonSlide(uid, info, false);
                }, 5000);
            }

            if (!show) {
                crayonSlide(uid, info, false);
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

        var isSlideHidden = function (object) {
            var object_neg_height = '-' + object.height() + 'px';
            if (object.css('margin-top') == object_neg_height || object.css('display') == 'none') {
                return true;
            } else {
                return false;
            }
        };

        var crayonSlide = function (uid, object, show, animTime, hideDelay, callback) {
            var complete = function () {
                if (callback) {
                    callback(uid, object);
                }
            }
            var objectNegHeight = '-' + object.height() + 'px';

            if (typeof show == 'undefined') {
                if (isSlideHidden(object)) {
                    show = true;
                } else {
                    show = false;
                }
            }
            // Instant means no time delay for showing/hiding
            if (typeof animTime == 'undefined') {
                animTime = 100;
            }
            if (animTime == false) {
                animTime = false;
            }
            if (typeof hideDelay == 'undefined') {
                hideDelay = 0;
            }
            object.stop(true);
            if (show == true) {
                object.show();
                object.animate({
                    marginTop: 0
                }, animt(animTime, uid), complete);
            } else if (show == false) {
                // Delay if fully visible
                if (/*instant == false && */object.css('margin-top') == '0px' && hideDelay) {
                    object.delay(hideDelay);
                }
                object.animate({
                    marginTop: objectNegHeight
                }, animt(animTime, uid), function () {
                    object.hide();
                    complete();
                });
            }
        };

        base.togglePlain = function (uid, hover, select) {
            if (typeof crayon[uid] == 'undefined') {
                return makeUID(uid);
            }

            var main = crayon[uid].main;
            var plain = crayon[uid].plain;

            if ((main.is(':animated') || plain.is(':animated')) && typeof hover == 'undefined') {
                return;
            }

            reconsileDimensions(uid);

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

            crayon[uid].plainVisible = (hidden == plain);

            // Remember scroll positions of visible
            crayon[uid].top = visible.scrollTop();
            crayon[uid].left = visible.scrollLeft();

            /* Used to detect a change in overflow when the mouse moves out
             * of the Crayon. If it does, then overflow has already been changed,
             * no need to revert it after toggling plain. */
            crayon[uid].scrollChanged = false;

            // Hide scrollbars during toggle to avoid Chrome weird draw error
            // visible.css('overflow', 'hidden');
            // hidden.css('overflow', 'hidden');

            fixScrollBlank(uid);

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

            updatePlainButton(uid);

            // Hide toolbar if possible
            toggleToolbar(uid, false);
            return false;
        };

        base.toggleNums = function (uid, hide, instant) {
            if (typeof crayon[uid] == 'undefined') {
                makeUID(uid);
                return false;
            }

            if (crayon[uid].table.is(':animated')) {
                return false;
            }
            var numsWidth = Math.round(crayon[uid].nums_content.width() + 1);
            var negWidth = '-' + numsWidth + 'px';

            // Force hiding
            var numHidden;
            if (typeof hide != 'undefined') {
                numHidden = false;
            } else {
                // Check hiding
                numHidden = (crayon[uid].table.css('margin-left') == negWidth);
            }

            var numMargin;
            if (numHidden) {
                // Show
                numMargin = '0px';
                crayon[uid].numsVisible = true;
            } else {
                // Hide
                crayon[uid].table.css('margin-left', '0px');
                crayon[uid].numsVisible = false;
                numMargin = negWidth;
            }

            if (typeof instant != 'undefined') {
                crayon[uid].table.css('margin-left', numMargin);
                updateNumsButton(uid);
                return false;
            }

            // Stop jerking animation from scrollbar appearing for a split second due to
            // change in width. Prevents scrollbar disappearing if already visible.
            h_scroll_visible = (crayon[uid].table.width() + pxToInt(crayon[uid].table.css('margin-left')) > crayon[uid].main.width());
            v_scroll_visible = (crayon[uid].table.height() > crayon[uid].main.height());
            if (!h_scroll_visible && !v_scroll_visible) {
                crayon[uid].main.css('overflow', 'hidden');
            }
            crayon[uid].table.animate({
                marginLeft: numMargin
            }, animt(200, uid), function () {
                if (typeof crayon[uid] != 'undefined') {
                    updateNumsButton(uid);
                    if (!h_scroll_visible && !v_scroll_visible) {
                        crayon[uid].main.css('overflow', 'auto');
                    }
                }
            });
            return false;
        };

        base.toggleWrap = function (uid) {
            crayon[uid].wrapped = !crayon[uid].wrapped;
            updateWrap(uid);
        };

        base.toggleExpand = function (uid) {
            var expand = !CrayonUtil.setDefault(crayon[uid].expanded, false);
            toggleExpand(uid, expand);
        };

        var updateWrap = function (uid, restore) {
            restore = CrayonUtil.setDefault(restore, true);
            if (crayon[uid].wrapped) {
                crayon[uid].addClass(CRAYON_WRAPPED);
            } else {
                crayon[uid].removeClass(CRAYON_WRAPPED);
            }
            updateWrapButton(uid);
            if (!crayon[uid].expanded && restore) {
                restoreDimensions(uid);
            }
            crayon[uid].wrapTimes = 0;
            clearInterval(crayon[uid].wrapTimer);
            crayon[uid].wrapTimer = setInterval(function () {
                reconsileLines(uid);
                crayon[uid].wrapTimes++;
                if (crayon[uid].wrapTimes == 5) {
                    clearInterval(crayon[uid].wrapTimer);
                }
            }, 200);
        };

        var fixTableWidth = function (uid) {
            if (typeof crayon[uid] == 'undefined') {
                makeUID(uid);
                return false;
            }
        };

        // Convert '-10px' to -10
        var pxToInt = function (pixels) {
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

        var updateNumsButton = function (uid) {
            if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].numsVisible == 'undefined') {
                return;
            }
            if (crayon[uid].numsVisible) {
                crayon[uid].numsButton.removeClass(UNPRESSED);
                crayon[uid].numsButton.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayon[uid].numsButton.removeClass(PRESSED);
                crayon[uid].numsButton.addClass(UNPRESSED);
            }
        };

        var updateWrapButton = function (uid) {
            if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].wrapped == 'undefined') {
                return;
            }
            if (crayon[uid].wrapped) {
                crayon[uid].wrapButton.removeClass(UNPRESSED);
                crayon[uid].wrapButton.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayon[uid].wrapButton.removeClass(PRESSED);
                crayon[uid].wrapButton.addClass(UNPRESSED);
            }
        };

        var updateExpandButton = function (uid) {
            if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].expanded == 'undefined') {
                return;
            }

            if (crayon[uid].expanded) {
                crayon[uid].expandButton.removeClass(UNPRESSED);
                crayon[uid].expandButton.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayon[uid].expandButton.removeClass(PRESSED);
                crayon[uid].expandButton.addClass(UNPRESSED);
            }
        };

        var updatePlainButton = function (uid) {
            if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].plainVisible == 'undefined') {
                return;
            }

            if (crayon[uid].plainVisible) {
                crayon[uid].plainButton.removeClass(UNPRESSED);
                crayon[uid].plainButton.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayon[uid].plainButton.removeClass(PRESSED);
                crayon[uid].plainButton.addClass(UNPRESSED);
            }
        };

        var toggleToolbar = function (uid, show, animTime, hideDelay) {
            if (typeof crayon[uid] == 'undefined') {
                return makeUID(uid);
            } else if (!crayon[uid].toolbarMouseover) {
                return;
            }
            var toolbar = crayon[uid].toolbar;

            if (typeof hideDelay == 'undefined') {
                hideDelay = crayon[uid].toolbar_delay;
            }

            crayonSlide(uid, toolbar, show, animTime, hideDelay, function () {
                crayon[uid].toolbar_visible = show;
            });
        };

        var initSize = function (uid) {
            if (typeof crayon[uid].initialSize == 'undefined') {
                // Shared for scrollbars and expanding
                crayon[uid].initialSize = {width: crayon[uid].main.width(), height: crayon[uid].main.height()};
                // If toolbar is always showing, make room for it
                if (crayon[uid].toolbarMouseover == false) {
                    crayon[uid].initialSize.height += crayon[uid].toolbar.height();
                }
            }
        };

        var toggleExpand = function (uid, expand) {
            if (typeof crayon[uid] == 'undefined') {
                return makeUID(uid);
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
                    // If toolbar is always showing, make room for it
                    if (crayon[uid].toolbarMouseover == false) {
                        crayon[uid].finalSize.height += crayon[uid].toolbar.height();
                    }
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

                crayon[uid].width(crayon[uid].width());
                crayon[uid].css({
                    'min-width': 'none',
                    'max-width': 'none'
                });
                var newSize = {
                    width: finalSize.width
                };
                if (finalSize.height > crayon[uid].toolbar.height() * 2) {
                    newSize.height = finalSize.height;
                    crayon[uid].height(crayon[uid].height());
                }

                main.css(expandHeight);
                main.css(expandWidth);
                crayon[uid].stop(true);

                crayon[uid].animate(newSize, animt(crayon[uid].expandTime, uid), function () {
                    crayon[uid].expanded = true;
                    updateExpandButton(uid);
                });
            } else {
                var initialSize = crayon[uid].initialSize;
                var delay = crayon[uid].toolbar_delay;
                if (initialSize) {
                    crayon[uid].stop(true);
                    if (!crayon[uid].expanded) {
                        crayon[uid].delay(delay);
                    }
                    var newSize = {
                        width: initialSize.width
                    };
                    if (crayon[uid].style('height') != 'auto') {
                        newSize.height = initialSize.height;
                    }
                    crayon[uid].animate(newSize, animt(crayon[uid].expandTime, uid), function () {
                        expandFinish(uid);
                    });
                } else {
                    setTimeout(function () {
                       expandFinish(uid);
                    }, delay);
                }
            }

            reconsileDimensions(uid);
            if (expand) {
                updateWrap(uid, false);
            }
        };

        var expandFinish = function(uid) {
            crayon[uid].expanded = false;
            restoreDimensions(uid);
            updateExpandButton(uid);
            if (crayon[uid].wrapped) {
                updateWrap(uid);
            }
        };

        var toggle_scroll = function (uid, show, expand) {
            if (typeof crayon[uid] == 'undefined') {
                return makeUID(uid);
            }
            if (typeof show == 'undefined') {
                return;
            }

            var main = crayon[uid].main;
            var plain = crayon[uid].plain;

            initSize(uid);

            if (show) {
//                main.height(main.height());
//                plain.height(plain.height());
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
                
                if (!crayon[uid].expanded) {
                    restoreDimensions(uid);
                }
            }
            // Register that overflow has changed
            crayon[uid].scrollChanged = true;
            fixScrollBlank(uid);
        };

        /* Fix weird draw error, causes blank area to appear where scrollbar once was. */
        var fixScrollBlank = function (uid) {
            // Scrollbar draw error in Chrome
            crayon[uid].table.style('width', '100%', 'important');
            var redraw = setTimeout(function () {
                crayon[uid].table.style('width', '');
                clearInterval(redraw);
            }, 10);
        };

        var restoreDimensions = function (uid) {
            // Restore dimensions
            var main = crayon[uid].main;
            var mainStyle = crayon[uid].main_style;
            main.css(mainStyle);
            // Width styles also apply to crayon
            crayon[uid].css('height', 'auto');
            crayon[uid].css('width', mainStyle['width']);
            crayon[uid].css('max-width', mainStyle['max-width']);
            crayon[uid].css('min-width', mainStyle['min-width']);
        };

        var reconsileDimensions = function (uid) {
            // Reconsile dimensions
            crayon[uid].plain.height(crayon[uid].main.height());
        };

        var reconsileLines = function (uid) {
            $(CRAYON_NUM, crayon[uid]).each(function () {
                var lineID = $(this).attr('data-line');
                var line = $('#' + lineID);
                if (crayon[uid].wrapped) {
                    line.css('height', '');
                    $(this).css('height', line.height());
                    // TODO toolbar should overlay title if needed
                } else {
                    var height = line.attr('data-height');
                    height = height ? height : '';
                    line.css('height', height);
                    $(this).css('height', height);
                    //line.css('height', line.css('line-height'));
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
