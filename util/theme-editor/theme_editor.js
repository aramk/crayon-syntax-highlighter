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
            CrayonUtil.log('editor init');
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
            themeInfo = base.readCSSInfo(themeStr);
            base.initInfoUI();
            base.updateTitle();
            base.updateInfo();
            base.setFieldValues(themeInfo);
        };

        base.save = function () {
            themeCSS = CSSJSON.toCSS(themeJSON);
            themeInfo = base.getFieldValues($.keys(themeInfo));
            // Get the names of the fields and map them to their values
            var names = base.getFieldNames(themeInfo);
            var info = {};
            for (var id in themeInfo) {
                info[names[id]] = themeInfo[id];
            }
            var newThemeStr = base.writeCSSInfo(info) + themeCSS;
            $.post(crayonSettings.ajaxurl, {
                action: 'crayon-theme-editor-save',
                id: themeID,
                name: base.getName(),
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

        base.readCSSInfo = function (cssStr) {
            var infoStr = /^\s*\/\*[\s\S]*?\*\//gmi.exec(cssStr);
            var themeInfo = {};
            var match = null;
            var infoRegex = /([^\r\n:]*[^\r\n\s:])\s*:\s*([^\r\n]+)/gmi;
            while ((match = infoRegex.exec(infoStr)) != null) {
//                var fieldID = settings.fieldsInverse[match[1]];
//                var fieldID = base.convertToID(match[1]);
//                if (fieldID) {
//                    themeInfo[fieldID] = match[2];
//                }
                themeInfo[base.nameToID(match[1])] = match[2];
            }
            return themeInfo;
        };
        
        base.getFieldNames = function (fields) {
            var names = {};
            for (var id in fields) {
                var name = '';
                if (id in settings.fields) {
                    name = settings.fields[id];
                } else {
                    name = base.idToName(id);
                }
                names[id] = name;
            }
            return names;
        };

        base.initInfoUI = function () {
            console.log(themeInfo);
            // TODO abstract
            var names = base.getFieldNames(themeInfo);
            var fields = {};
            for (var id in names) {
                var name = names[id];
                fields[name] = base.createInput(id, themeInfo[id]);
            }
            $('#tabs-1').html(base.createForm(fields));
        };

        base.nameToID = function (name) {
            return name.toLowerCase().replace(/\s+/, '-');
        };

        base.idToName = function (id) {
            id = id.replace('-', ' ');
            return id.toTitleCase();
        };

        base.getName = function () {
            var name = themeInfo.name;
            if (!name) {
                name = base.idToName(themeID);
            }
            return name;
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

        base.writeCSSInfo = function (info) {
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

        base.createInput = function (id, value, type) {
            value = CrayonUtil.setDefault(value, '');
            type = CrayonUtil.setDefault(type, 'text');
            return '<input id="' + settings.cssPrefix + id + '" class="' + settings.cssPrefix + type + '" type="' + type + '" value="' + value + '" />';
        };

        base.createForm = function (inputs) {
            var str = '<form class="' + settings.prefix + '-form"><table>';
            $.each(inputs, function (input) {
                str += '<tr><td class="field">' + input + '</td><td class="value">' + inputs[input] + '</td></tr>';
            });
            str += '</table></form>';
            return str;
        };

        var showMain = function () {
            admin.preview_update();
            admin.show_theme_info();
            admin.show_main();
            preview.html('');
        };

        base.updateTitle = function () {
            var name = base.getName();
            if (adminSettings.editing_theme) {
                title.html('Editing Theme: ' + name);
            } else {
                title.html('Creating Theme: ' + name);
            }
        };

        base.updateInfo = function () {
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
