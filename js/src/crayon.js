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
    var CRAYON_TITLE = '.crayon-title';
    var CRAYON_TOOLS = '.crayon-tools';
    var CRAYON_NUMS = '.crayon-nums';
    var CRAYON_NUM = '.crayon-num';
    var CRAYON_LINE = '.crayon-line';
    var CRAYON_WRAPPED = 'crayon-wrapped';
    var CRAYON_NUMS_CONTENT = '.crayon-nums-content';
    var CRAYON_NUMS_BUTTON = '.crayon-nums-button';
    var CRAYON_WRAP_BUTTON = '.crayon-wrap-button';
    var CRAYON_EXPAND_BUTTON = '.crayon-expand-button';
    var CRAYON_EXPANDED = 'crayon-expanded crayon-toolbar-visible';
    var CRAYON_PLACEHOLDER = 'crayon-placeholder';
    var CRAYON_POPUP_BUTTON = '.crayon-popup-button';
    var CRAYON_COPY_BUTTON = '.crayon-copy-button';
    var CRAYON_PLAIN_BUTTON = '.crayon-plain-button';

    CrayonSyntax = new function () {
        var base = this;
        var crayons = new Object();
        var settings;
        var strings;
        var currUID = 0;
        var touchscreen;

        base.init = function () {
            if (typeof crayons == 'undefined') {
                crayons = new Object();
            }
            settings = CrayonSyntaxSettings;
            strings = CrayonSyntaxStrings;
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
            var title = c.find(CRAYON_TITLE);
            var tools = c.find(CRAYON_TOOLS);
            var nums = c.find(CRAYON_NUMS);
            var numsContent = c.find(CRAYON_NUMS_CONTENT);
            var numsButton = c.find(CRAYON_NUMS_BUTTON);
            var wrapButton = c.find(CRAYON_WRAP_BUTTON);
            var expandButton = c.find(CRAYON_EXPAND_BUTTON);
            var popupButton = c.find(CRAYON_POPUP_BUTTON);
            var copyButton = c.find(CRAYON_COPY_BUTTON);
            var plainButton = c.find(CRAYON_PLAIN_BUTTON);

            crayons[uid] = c;
            crayons[uid].toolbar = toolbar;
            crayons[uid].plain = plain;
            crayons[uid].info = info;
            crayons[uid].main = main;
            crayons[uid].table = table;
            crayons[uid].code = code;
            crayons[uid].title = title;
            crayons[uid].tools = tools;
            crayons[uid].nums = nums;
            crayons[uid].nums_content = numsContent;
            crayons[uid].numsButton = numsButton;
            crayons[uid].wrapButton = wrapButton;
            crayons[uid].expandButton = expandButton;
            crayons[uid].popup_button = popupButton;
            crayons[uid].copy_button = copyButton;
            crayons[uid].plainButton = plainButton;
            crayons[uid].numsVisible = true;
            crayons[uid].wrapped = false;
            crayons[uid].plainVisible = false;

            crayons[uid].toolbar_delay = 0;
            crayons[uid].time = 1;

            // Set plain
            $(CRAYON_PLAIN).css('z-index', 0);

            // XXX Remember CSS dimensions
            var mainStyle = main.style();
            crayons[uid].mainStyle = {
                'height': mainStyle && mainStyle.height || '',
                'max-height': mainStyle && mainStyle.maxHeight || '',
                'min-height': mainStyle && mainStyle.minHeight || '',
                'width': mainStyle && mainStyle.width || '',
                'max-width': mainStyle && mainStyle.maxWidth || '',
                'min-width': mainStyle && mainStyle.minWidth || ''
            };
            crayons[uid].mainHeightAuto = crayons[uid].mainStyle.height == '' && crayons[uid].mainStyle['max-height'] == '';

            var load_timer;
            var i = 0;
            crayons[uid].loading = true;
            crayons[uid].scrollBlockFix = false;

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

                if (typeof crayons[uid].expanded == 'undefined') {
                    // Determine if we should enable code expanding toggling
                    if (Math.abs(crayons[uid].main.outerWidth() - crayons[uid].table.outerWidth()) < 10) {
                        crayons[uid].expandButton.hide();
                    } else {
                        crayons[uid].expandButton.show();
                    }
                }

                // TODO If width has changed or timeout, stop timer
                if (/*last_num_width != nums.outerWidth() ||*/ i == 5) {
                    clearInterval(load_timer);
                    //crayons[uid].removeClass(CRAYON_LOADING);
                    crayons[uid].loading = false;
                }
                i++;
            };
            load_timer = setInterval(load_func, 300);
            fixScrollBlank(uid);

            // Add ref to num for each line
            $(CRAYON_NUM, crayons[uid]).each(function () {
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
                crayons[uid].popup_settings = popupWindow(popupButton, {
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

            crayons[uid].toolbarVisible = true;
            crayons[uid].hasOneLine = table.outerHeight() < toolbar.outerHeight() * 2;
            crayons[uid].toolbarMouseover = false;
            // If a toolbar with mouseover was found
            if (toolbar.filter('[data-settings~="mouseover"]').length != 0 && !touchscreen) {
                crayons[uid].toolbarMouseover = true;
                crayons[uid].toolbarVisible = false;

                toolbar.css('margin-top', '-' + toolbar.outerHeight() + 'px');
                toolbar.hide();
                // Overlay the toolbar if needed, only if doing so will not hide the
                // whole code!
                if (toolbar.filter('[data-settings~="overlay"]').length != 0
                    && !crayons[uid].hasOneLine) {
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
                    crayons[uid].toolbar_delay = 500;
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

            // Minimize
            if (c.filter('[data-settings~="minimize"]').length == 0) {
                base.minimize(uid);
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
//            crayons[uid].mouse_expand = expand;
            if (!touchscreen && c.filter('[data-settings~="scroll-mouseover"]').length != 0) {
                // Disable on touchscreen devices and when set to mouseover
                main.css('overflow', 'hidden');
                plain.css('overflow', 'hidden');
                c.mouseenter(function () {
                    toggle_scroll(uid, true, expand);
                })
                .mouseleave(function () {
                    toggle_scroll(uid, false, expand);
                });
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
                crayons[uid].time = 0;
            }

            // Wrap
            if (c.filter('[data-settings~="wrap"]').length != 0) {
                crayons[uid].wrapped = true;
            }

            // Determine if Mac
            crayons[uid].mac = c.hasClass('crayon-os-mac');

            // Update clickable buttons
            updateNumsButton(uid);
            updatePlainButton(uid);
            updateWrap(uid);
        };

        var makeUID = function (uid) {
            CrayonUtil.log(crayons);
            if (typeof crayons[uid] == 'undefined') {
                crayons[uid] = $('#' + uid);
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
            if (typeof crayons[uid] == 'undefined') {
                return makeUID(uid);
            }
            var settings = crayons[uid].popup_settings;
            if (settings && settings.data) {
                // Already done
                return;
            }

            var clone = crayons[uid].clone(true);
            clone.removeClass('crayon-wrapped');

            // Unwrap
            if (crayons[uid].wrapped) {
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
            if (crayons[uid].plainVisible) {
                code = clone.find(CRAYON_PLAIN);
            } else {
                code = clone.find(CRAYON_MAIN);
            }

            settings.data = base.getAllCSS() + '<body class="crayon-popup-window" style="padding:0; margin:0;"><div class="' + clone.attr('class') +
                ' crayon-popup">' + base.removeCssInline(base.getHtmlString(code)) + '</div></body>';
        };

        base.minimize = function (uid) {
            var button = $('<div class="crayon-minimize crayon-button"><div>');
            crayons[uid].tools.append(button);
            // TODO translate
            crayons[uid].origTitle = crayons[uid].title.html();
            if (!crayons[uid].origTitle) {
                crayons[uid].title.html(strings.minimize);
            };
            var cls = 'crayon-minimized';
            var show = function () {
                crayons[uid].toolbarPreventHide = false;
                button.remove();
                crayons[uid].removeClass(cls);
                crayons[uid].title.html(crayons[uid].origTitle);
                var toolbar = crayons[uid].toolbar;
                if (toolbar.filter('[data-settings~="never-show"]').length != 0) {
                    toolbar.remove();
                }
            };
            crayons[uid].toolbar.click(show);
            button.click(show);
            crayons[uid].addClass(cls);
            crayons[uid].toolbarPreventHide = true;
            toggleToolbar(uid, undefined, undefined, 0);
        }

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
            if (typeof crayons[uid] == 'undefined') {
                return makeUID(uid);
            }

            var plain = crayons[uid].plain;

            base.togglePlain(uid, true, true);
            toggleToolbar(uid, true);

            var key = crayons[uid].mac ? '\u2318' : 'CTRL';
            var text = strings.copy;
            text = text.replace(/%s/, key + '+C');
            text = text.replace(/%s/, key + '+V');
            crayonInfo(uid, text);
            return false;
        };

        var crayonInfo = function (uid, text, show) {
            if (typeof crayons[uid] == 'undefined') {
                return makeUID(uid);
            }

            var info = crayons[uid].info;

            if (typeof text == 'undefined') {
                text = '';
            }
            if (typeof show == 'undefined') {
                show = true;
            }

            if (isSlideHidden(info) && show) {
                info.html('<div>' + text + '</div>');
                info.css('margin-top', -info.outerHeight());
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
                var buttons = $('.crayon-button-icon', crayons[uid].toolbar);
                buttons.each(function () {
                    var lowres = $(this).css('background-image');
                    var highres = lowres.replace(/\.(?=[^\.]+$)/g, '@2x.');
                    $(this).css('background-size', '48px 128px');
                    $(this).css('background-image', highres);
                });
            }
        };

        var isSlideHidden = function (object) {
            var object_neg_height = '-' + object.outerHeight() + 'px';
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
            var objectNegHeight = '-' + object.outerHeight() + 'px';

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
            if (typeof crayons[uid] == 'undefined') {
                return makeUID(uid);
            }

            var main = crayons[uid].main;
            var plain = crayons[uid].plain;

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

            crayons[uid].plainVisible = (hidden == plain);

            // Remember scroll positions of visible
            crayons[uid].top = visible.scrollTop();
            crayons[uid].left = visible.scrollLeft();

            /* Used to detect a change in overflow when the mouse moves out
             * of the Crayon. If it does, then overflow has already been changed,
             * no need to revert it after toggling plain. */
            crayons[uid].scrollChanged = false;

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
                    hidden.scrollTop(crayons[uid].top + 1);
                    hidden.scrollTop(crayons[uid].top);
                    hidden.scrollLeft(crayons[uid].left + 1);
                    hidden.scrollLeft(crayons[uid].left);
                });

            // Restore scroll positions to hidden
            hidden.scrollTop(crayons[uid].top);
            hidden.scrollLeft(crayons[uid].left);

            updatePlainButton(uid);

            // Hide toolbar if possible
            toggleToolbar(uid, false);
            return false;
        };

        base.toggleNums = function (uid, hide, instant) {
            if (typeof crayons[uid] == 'undefined') {
                makeUID(uid);
                return false;
            }

            if (crayons[uid].table.is(':animated')) {
                return false;
            }
            var numsWidth = Math.round(crayons[uid].nums_content.outerWidth() + 1);
            var negWidth = '-' + numsWidth + 'px';

            // Force hiding
            var numHidden;
            if (typeof hide != 'undefined') {
                numHidden = false;
            } else {
                // Check hiding
                numHidden = (crayons[uid].table.css('margin-left') == negWidth);
            }

            var numMargin;
            if (numHidden) {
                // Show
                numMargin = '0px';
                crayons[uid].numsVisible = true;
            } else {
                // Hide
                crayons[uid].table.css('margin-left', '0px');
                crayons[uid].numsVisible = false;
                numMargin = negWidth;
            }

            if (typeof instant != 'undefined') {
                crayons[uid].table.css('margin-left', numMargin);
                updateNumsButton(uid);
                return false;
            }

            // Stop jerking animation from scrollbar appearing for a split second due to
            // change in width. Prevents scrollbar disappearing if already visible.
            var h_scroll_visible = (crayons[uid].table.outerWidth() + pxToInt(crayons[uid].table.css('margin-left')) > crayons[uid].main.outerWidth());
            var v_scroll_visible = (crayons[uid].table.outerHeight() > crayons[uid].main.outerHeight());
            if (!h_scroll_visible && !v_scroll_visible) {
                crayons[uid].main.css('overflow', 'hidden');
            }
            crayons[uid].table.animate({
                marginLeft: numMargin
            }, animt(200, uid), function () {
                if (typeof crayons[uid] != 'undefined') {
                    updateNumsButton(uid);
                    if (!h_scroll_visible && !v_scroll_visible) {
                        crayons[uid].main.css('overflow', 'auto');
                    }
                }
            });
            return false;
        };

        base.toggleWrap = function (uid) {
            crayons[uid].wrapped = !crayons[uid].wrapped;
            updateWrap(uid);
        };

        base.toggleExpand = function (uid) {
            var expand = !CrayonUtil.setDefault(crayons[uid].expanded, false);
            toggleExpand(uid, expand);
        };

        var updateWrap = function (uid, restore) {
            restore = CrayonUtil.setDefault(restore, true);
            if (crayons[uid].wrapped) {
                crayons[uid].addClass(CRAYON_WRAPPED);
            } else {
                crayons[uid].removeClass(CRAYON_WRAPPED);
            }
            updateWrapButton(uid);
            if (!crayons[uid].expanded && restore) {
                restoreDimensions(uid);
            }
            crayons[uid].wrapTimes = 0;
            clearInterval(crayons[uid].wrapTimer);
            crayons[uid].wrapTimer = setInterval(function () {
                if (crayons[uid].is(':visible')) {
                    // XXX if hidden the height can't be determined
                    reconsileLines(uid);
                    crayons[uid].wrapTimes++;
                    if (crayons[uid].wrapTimes == 5) {
                        clearInterval(crayons[uid].wrapTimer);
                    }
                }
            }, 200);
        };

        var fixTableWidth = function (uid) {
            if (typeof crayons[uid] == 'undefined') {
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
            if (typeof crayons[uid] == 'undefined' || typeof crayons[uid].numsVisible == 'undefined') {
                return;
            }
            if (crayons[uid].numsVisible) {
                crayons[uid].numsButton.removeClass(UNPRESSED);
                crayons[uid].numsButton.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayons[uid].numsButton.removeClass(PRESSED);
                crayons[uid].numsButton.addClass(UNPRESSED);
            }
        };

        var updateWrapButton = function (uid) {
            if (typeof crayons[uid] == 'undefined' || typeof crayons[uid].wrapped == 'undefined') {
                return;
            }
            if (crayons[uid].wrapped) {
                crayons[uid].wrapButton.removeClass(UNPRESSED);
                crayons[uid].wrapButton.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayons[uid].wrapButton.removeClass(PRESSED);
                crayons[uid].wrapButton.addClass(UNPRESSED);
            }
        };

        var updateExpandButton = function (uid) {
            if (typeof crayons[uid] == 'undefined' || typeof crayons[uid].expanded == 'undefined') {
                return;
            }

            if (crayons[uid].expanded) {
                crayons[uid].expandButton.removeClass(UNPRESSED);
                crayons[uid].expandButton.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayons[uid].expandButton.removeClass(PRESSED);
                crayons[uid].expandButton.addClass(UNPRESSED);
            }
        };

        var updatePlainButton = function (uid) {
            if (typeof crayons[uid] == 'undefined' || typeof crayons[uid].plainVisible == 'undefined') {
                return;
            }

            if (crayons[uid].plainVisible) {
                crayons[uid].plainButton.removeClass(UNPRESSED);
                crayons[uid].plainButton.addClass(PRESSED);
            } else {
                // TODO doesn't work on iPhone
                crayons[uid].plainButton.removeClass(PRESSED);
                crayons[uid].plainButton.addClass(UNPRESSED);
            }
        };

        var toggleToolbar = function (uid, show, animTime, hideDelay) {
            if (typeof crayons[uid] == 'undefined') {
                return makeUID(uid);
            } else if (!crayons[uid].toolbarMouseover) {
                return;
            } else if (show == false && crayons[uid].toolbarPreventHide) {
                return;
            } else if (touchscreen) {
                return;
            }
            var toolbar = crayons[uid].toolbar;

            if (typeof hideDelay == 'undefined') {
                hideDelay = crayons[uid].toolbar_delay;
            }

            crayonSlide(uid, toolbar, show, animTime, hideDelay, function () {
                crayons[uid].toolbarVisible = show;
            });
        };

        var addSize = function (orig, add) {
            var copy = $.extend({}, orig);
            copy.width += add.width;
            copy.height += add.height;
            return copy;
        };

        var minusSize = function (orig, minus) {
            var copy = $.extend({}, orig);
            copy.width -= minus.width;
            copy.height -= minus.height;
            return copy;
        };

        var initSize = function (uid) {
            if (typeof crayons[uid].initialSize == 'undefined') {
                // Shared for scrollbars and expanding
                crayons[uid].toolbarHeight = crayons[uid].toolbar.outerHeight();
                crayons[uid].innerSize = {width: crayons[uid].width(), height: crayons[uid].height()};
                crayons[uid].outerSize = {width: crayons[uid].outerWidth(), height: crayons[uid].outerHeight()};
                crayons[uid].borderSize = minusSize(crayons[uid].outerSize, crayons[uid].innerSize);
                crayons[uid].initialSize = {width: crayons[uid].main.outerWidth(), height: crayons[uid].main.outerHeight()};
                crayons[uid].initialSize.height += crayons[uid].toolbarHeight;
                crayons[uid].initialOuterSize = addSize(crayons[uid].initialSize, crayons[uid].borderSize);
                crayons[uid].finalSize = {width: crayons[uid].table.outerWidth(), height: crayons[uid].table.outerHeight()};
                crayons[uid].finalSize.height += crayons[uid].toolbarHeight;
                // Ensure we don't shrink
                crayons[uid].finalSize.width = CrayonUtil.setMin(crayons[uid].finalSize.width, crayons[uid].initialSize.width);
                crayons[uid].finalSize.height = CrayonUtil.setMin(crayons[uid].finalSize.height, crayons[uid].initialSize.height);
                crayons[uid].diffSize = minusSize(crayons[uid].finalSize, crayons[uid].initialSize);
                crayons[uid].finalOuterSize = addSize(crayons[uid].finalSize, crayons[uid].borderSize);
                crayons[uid].initialSize.height += crayons[uid].toolbar.outerHeight();
            }
        };

        var toggleExpand = function (uid, expand) {
            if (typeof crayons[uid] == 'undefined') {
                return makeUID(uid);
            }
            if (typeof expand == 'undefined') {
                return;
            }

            var main = crayons[uid].main;
            var plain = crayons[uid].plain;

            if (expand) {
                if (typeof crayons[uid].expanded == 'undefined') {
                    initSize(uid);
                    crayons[uid].expandTime = CrayonUtil.setRange(crayons[uid].diffSize.width / 3, 300, 800);
                    crayons[uid].expanded = false;
                    var placeHolderSize = crayons[uid].finalOuterSize;
                    crayons[uid].placeholder = $('<div></div>');
                    crayons[uid].placeholder.addClass(CRAYON_PLACEHOLDER);
                    crayons[uid].placeholder.css(placeHolderSize);
                    crayons[uid].before(crayons[uid].placeholder);
                    crayons[uid].placeholder.css('margin', crayons[uid].css('margin'));
                    $(window).bind('resize', placeholderResize);
                }

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

                crayons[uid].outerWidth(crayons[uid].outerWidth());
                crayons[uid].css({
                    'min-width': 'none',
                    'max-width': 'none'
                });
                var newSize = {
                    width: crayons[uid].finalOuterSize.width
                };
                if (!crayons[uid].mainHeightAuto && !crayons[uid].hasOneLine) {
                    newSize.height = crayons[uid].finalOuterSize.height;
                    crayons[uid].outerHeight(crayons[uid].outerHeight());
                }

                main.css(expandHeight);
                main.css(expandWidth);
                crayons[uid].stop(true);

                crayons[uid].animate(newSize, animt(crayons[uid].expandTime, uid), function () {
                    crayons[uid].expanded = true;
                    updateExpandButton(uid);
                });

                crayons[uid].placeholder.show();
                $('body').prepend(crayons[uid]);
                crayons[uid].addClass(CRAYON_EXPANDED);
                placeholderResize();
            } else {
                var initialSize = crayons[uid].initialOuterSize;
                var delay = crayons[uid].toolbar_delay;
                if (initialSize) {
                    crayons[uid].stop(true);
                    if (!crayons[uid].expanded) {
                        crayons[uid].delay(delay);
                    }
                    var newSize = {
                        width: initialSize.width
                    };
                    if (!crayons[uid].mainHeightAuto && !crayons[uid].hasOneLine) {
                        newSize.height = initialSize.height;
                    }
                    crayons[uid].animate(newSize, animt(crayons[uid].expandTime, uid), function () {
                        expandFinish(uid);
                    });
                } else {
                    setTimeout(function () {
                       expandFinish(uid);
                    }, delay);
                }
                crayons[uid].placeholder.hide();
                crayons[uid].placeholder.before(crayons[uid]);
                crayons[uid].css({left: 'auto', top: 'auto'});
                crayons[uid].removeClass(CRAYON_EXPANDED);
            }

            reconsileDimensions(uid);
            if (expand) {
                updateWrap(uid, false);
            }
        };

        var placeholderResize = function () {
            for (uid in crayons) {
                if (crayons[uid].hasClass(CRAYON_EXPANDED)) {
                    crayons[uid].css(crayons[uid].placeholder.offset());
                }
            }
        };

        var expandFinish = function(uid) {
            crayons[uid].expanded = false;
            restoreDimensions(uid);
            updateExpandButton(uid);
            if (crayons[uid].wrapped) {
                updateWrap(uid);
            }
        };

        var toggle_scroll = function (uid, show, expand) {
            if (typeof crayons[uid] == 'undefined') {
                return makeUID(uid);
            }
            if (typeof show == 'undefined' || expand || crayons[uid].expanded) {
                return;
            }

            var main = crayons[uid].main;
            var plain = crayons[uid].plain;

            if (show) {
                // Show scrollbars
                main.css('overflow', 'auto');
                plain.css('overflow', 'auto');
                if (typeof crayons[uid].top != 'undefined') {
                    visible = (main.css('z-index') == 1 ? main : plain);
                    // Browser will not render until scrollbar moves, move it manually
                    visible.scrollTop(crayons[uid].top - 1);
                    visible.scrollTop(crayons[uid].top);
                    visible.scrollLeft(crayons[uid].left - 1);
                    visible.scrollLeft(crayons[uid].left);
                }
            } else {
                // Hide scrollbars
                visible = (main.css('z-index') == 1 ? main : plain);
                crayons[uid].top = visible.scrollTop();
                crayons[uid].left = visible.scrollLeft();
                main.css('overflow', 'hidden');
                plain.css('overflow', 'hidden');
            }
            // Register that overflow has changed
            crayons[uid].scrollChanged = true;
            fixScrollBlank(uid);
        };

        /* Fix weird draw error, causes blank area to appear where scrollbar once was. */
        var fixScrollBlank = function (uid) {
            // Scrollbar draw error in Chrome
            crayons[uid].table.style('width', '100%', 'important');
            var redraw = setTimeout(function () {
                crayons[uid].table.style('width', '');
                clearInterval(redraw);
            }, 10);
        };

        var restoreDimensions = function (uid) {
            // Restore dimensions
            var main = crayons[uid].main;
            var mainStyle = crayons[uid].mainStyle;
            main.css(mainStyle);
            // Width styles also apply to crayon
            crayons[uid].css('height', 'auto');
            crayons[uid].css('width', mainStyle['width']);
            crayons[uid].css('max-width', mainStyle['max-width']);
            crayons[uid].css('min-width', mainStyle['min-width']);
        };

        var reconsileDimensions = function (uid) {
            // Reconsile dimensions
            crayons[uid].plain.outerHeight(crayons[uid].main.outerHeight());
        };

        var reconsileLines = function (uid) {
            $(CRAYON_NUM, crayons[uid]).each(function () {
                var lineID = $(this).attr('data-line');
                var line = $('#' + lineID);
                var height = null;
                if (crayons[uid].wrapped) {
                    line.css('height', '');
                    height = line.outerHeight();
                    height = height ? height : '';
                    // TODO toolbar should overlay title if needed
                } else {
                    height = line.attr('data-height');
                    height = height ? height : '';
                    line.css('height', height);
                    //line.css('height', line.css('line-height'));
                }
                $(this).css('height', height);
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
            return x * crayons[uid].time;
        };

        var isNumber = function (x) {
            return typeof x == 'number';
        };

    };

    $(document).ready(function () {
        CrayonSyntax.init();
    });
})(jQueryCrayon);
