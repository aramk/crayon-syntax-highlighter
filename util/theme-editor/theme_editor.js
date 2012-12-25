// Crayon Syntax Highlighter Theme Editor JavaScript

(function ($) {

    CrayonSyntaxThemeEditor = new function () {

        var base = this;

        var crayonSettings = CrayonSyntaxSettings;
        var adminSettings = CrayonAdminSettings;
        var settings = CrayonThemeEditorSettings;
        var admin = CrayonSyntaxAdmin;

        var preview, status, title, info;
        var changed;
        var themeID, themeJSON, themeCSS, themeStr, themeInfo;

        base.init = function (callback) {
            // Called only once
            console_log('editor init');
            base.initUI();
            if (callback) {
                callback();
            }
        };

        base.show = function (callback, crayon) {
            // Called each time editor is shown
            crayon.attr('id', 'theme-editor-instance');
            CrayonSyntax.process(crayon, true);
            preview.html(crayon);
            base.load();
            if (callback) {
                callback();
            }
        };

        base.load = function () {
            themeStr = adminSettings.curr_theme_str;
            themeID = adminSettings.curr_theme;
            changed = false;
            themeJSON = CSSJSON.toJSON(themeStr, {
                stripComments: true,
                split: true
            });
//            console.log(themeJSON.children['.crayon-theme-classic .crayon-table .crayon-nums'].attributes);
//            console.log(settings);
            themeInfo = base.readCSSThemeInfo(themeStr);
            base.updateTitle();
            base.updateInfo();
            base.setFieldValues(themeInfo);
        };

        base.save = function () {
            themeCSS = CSSJSON.toCSS(themeJSON);
            themeInfo = base.getFieldValues($.keys(themeInfo));
            var info = {};
            for (var field in themeInfo) {
                info[settings.fields[field]] = themeInfo[field];
            }
            var newThemeStr = base.writeThemeInfo(info) + themeCSS;
            $.post(crayonSettings.ajaxurl, {
                action: 'crayon-theme-editor-save',
                id: themeID,
                name: themeInfo.name,
                css: newThemeStr
            }, function (result) {
                status.show();
                result = parseInt(result);
                if (result !== 0) {
                    status.html("Success!");
                    if (result === 2) {
                        window.GET['theme-editor'] == 1;
                        var get = '?';
                        for (var i in window.GET) {
                            get += i + '=' + window.GET[i] + '&';
                        }
                        window.location = window.currentURL + get;
                    }
                } else {
                    status.html("Failed!");
                }
                changed = false;
                setTimeout(function () {
                    status.fadeOut();
                }, 1000);
            });
        };

        base.delete = function () {
            base.createDialog({
                html: "Are you sure you want to delete the '" + themeInfo.name + "' theme?",
                title: "Confirm",
                yes: function () {
                    // TODO implement delete
                }
            });
        };

        base.duplicate = function () {
            base.createPrompt({
                html: "Are you sure you want to duplicate the '" + themeInfo.name + "' theme?",
                title: "Confirm",
                yes: function () {
                    // TODO implement delete
                }
            });
        };

        base.readCSSThemeInfo = function (cssStr) {
            var infoStr = /^\s*\/\*[\s\S]*?\*\//gmi.exec(cssStr);
            var themeInfo = {};
            var match = null;
            var infoRegex = /([^\r\n:]+)\s*:\s*([^\r\n]+)/gmi;
            while ((match = infoRegex.exec(infoStr)) != null) {
                var fieldID = settings.fieldsInverse[match[1]];
                if (fieldID) {
                    themeInfo[fieldID] = match[2];
                }
            }
            return themeInfo;
        };

        base.getField = function (id) {
            return $('#' + settings.cssPrefix + id);
        };

        base.getFieldValue = function (id) {
            // TODO add support for checkboxes etc.
            return base.getField(id).val();
        };

        base.getFieldValues = function (fields) {
            var info = {};
            $(fields).each(function (i, id) {
                info[id] = base.getFieldValue(id);
            });
            return info;
        };

        base.setFieldValue = function (id, value) {
            // TODO add support for checkboxes etc.
            base.getField(id).val(value);
        };

        base.setFieldValues = function (obj) {
            for (var i in obj) {
                base.setFieldValue(i, obj[i]);
            }
        };

        base.writeThemeInfo = function (info) {
            var infoStr = '/*\n';
            for (field in info) {
                infoStr += field + ': ' + info[field] + '\n';
            }
            return infoStr + '*/\n';
        };

        base.initUI = function () {
            preview = $('#crayon-editor-preview');
            status = $('#crayon-editor-status');
            title = $('#crayon-theme-editor-name');
            info = $('#crayon-theme-editor-info');
            base.getField('name').bind('change keydown', function () {
                themeInfo.name = base.getFieldValue('name');
                base.updateTitle();
            });
            $('#crayon-editor-controls input, #crayon-editor-controls select').change(function () {
                changed = true;
            });
            $('#crayon-editor-controls').tabs();
            $('#crayon-editor-back').click(function () {
                if (changed) {
                    base.createDialog({
                        html: "Are you sure you want to discard any changes?",
                        title: "Confirm",
                        yes: function () {
                            showMain();
                        }
                    });
                } else {
                    showMain();
                }
            });
            $('#crayon-editor-save').click(base.save);
        };

        var showMain = function () {
            admin.preview_update();
            admin.show_theme_info();
            admin.show_main();
            preview.html('');
        };

        base.updateTitle = function () {
            if (adminSettings.editing_theme) {
                title.html('Editing Theme: ' + themeInfo.name);
            } else {
                title.html('Creating Theme: ' + themeInfo.name);
            }
        };

        base.updateInfo = function() {
            info.html('<a target="_blank" href="' + adminSettings.curr_theme_url + '">' + adminSettings.curr_theme_url + '</a>');
        };

        base.createDialog = function (args) {
            args.yesLabel = CrayonUtil.setDefault(args.yesLabel, 'Yes');
            args.noLabel = CrayonUtil.setDefault(args.noLabel, 'No');
            var options = {
                modal: true, title: args.title, zIndex: 10000, autoOpen: true,
                width: 'auto', resizable: false,
                buttons: {
                },
                close: function (event, ui) {
                    $(this).remove();
                }
            };
            options.buttons[args.yesLabel] = function () {
                // $(obj).removeAttr('onclick');
                // $(obj).parents('.Parent').remove();
                if (args.yes) {
                    args.yes();
                }
                $(this).dialog("close");
            };
            options.buttons[args.noLabel] = function () {
                if (args.no) {
                    args.no();
                }
                $(this).dialog("close");
            };
            $('<div></div>').appendTo('body')
                .html(args.html)
                .dialog(options);
        }

    };

})(jQueryCrayon);
