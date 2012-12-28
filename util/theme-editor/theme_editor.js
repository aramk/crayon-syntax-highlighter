// Crayon Syntax Highlighter Theme Editor JavaScript

(function ($) {

    CrayonSyntaxThemeEditor = new function () {

        var base = this;

        var crayonSettings = CrayonSyntaxSettings;
        var adminSettings = CrayonAdminSettings;
        var settings = CrayonThemeEditorSettings;
        var strings = CrayonThemeEditorStrings;
        var admin = CrayonSyntaxAdmin;

        var preview, status, title, info;
        var changed;
        var themeID, themeJSON, themeCSS, themeStr, themeInfo;
        var reImportant = /\s+!important$/gmi;

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
            themeStr = adminSettings.currThemeCSS;
            themeID = adminSettings.currTheme;
            changed = false;
            themeJSON = CSSJSON.toJSON(themeStr, {
                stripComments: true,
                split: true
            });
            console.log(themeJSON);
            themeInfo = base.readCSSInfo(themeStr);
            base.initInfoUI();
            base.updateTitle();
            base.updateInfo();
            base.setFieldValues(themeInfo);
            base.populateAttributes();
            base.updateUI();
        };

        base.save = function () {
            // Update info from form fields
            themeInfo = base.getFieldValues($.keys(themeInfo));
            // Get the names of the fields and map them to their values
            var names = base.getFieldNames(themeInfo);
            var info = {};
            for (var id in themeInfo) {
                info[names[id]] = themeInfo[id];
            }
            // Update attributes
            base.persistAttributes();
            return false;
            // Save
            themeCSS = CSSJSON.toCSS(themeJSON);
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
                        window.GET['theme-editor'] = 1;
                        CrayonUtil.reload();
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

        base.delete = function (id, name) {
            base.createDialog({
                title: "Delete",
                html: "Are you sure you want to delete the \"" + name + "\" theme?",
                yes: function () {
                    $.post(crayonSettings.ajaxurl, {
                        action: 'crayon-theme-editor-delete',
                        id: id
                    }, function (result) {
                        if (result == 1) {
                            CrayonUtil.reload();
                        } else {
                            base.createAlert({
                                html: "Delete failed! Please check the log for details."
                            });
                        }
                    });
                },
                options: {
                    selectedButtonIndex: 2
                }
            });
        };

        base.duplicate = function (id, name) {
            base.createPrompt({
                //html: "Are you sure you want to duplicate the '" + name + "' theme?",
                title: "Duplicate",
                text: "New Name",
                value: name + ' Copy',
                ok: function (val) {
                    // TODO implement delete
                    $.post(crayonSettings.ajaxurl, {
                        action: 'crayon-theme-editor-duplicate',
                        id: id,
                        name: val
                    }, function (result) {
                        if (result > 0) {
                            CrayonUtil.reload();
                        } else {
                            base.createAlert({
                                html: "Duplicate failed! Please check the log for details."
                            });
                        }
                    });
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
                themeInfo[base.nameToID(match[1])] = CrayonUtil.encode_html(match[2]);
            }
            // Force title case on the name
            if (themeInfo.name) {
                themeInfo.name = base.idToName(themeInfo.name);
            }
            return themeInfo;
        };

        base.getFieldName = function (id) {
            var name = '';
            if (id in settings.fields) {
                name = settings.fields[id];
            } else {
                name = base.idToName(id);
            }
            return name;
        };

        base.getFieldNames = function (fields) {
            var names = {};
            for (var id in fields) {
                names[id] = base.getFieldName(id);
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
                var value = themeInfo[id];
                fields[name] = base.createInput(id, value);
            }
            $('#tabs-1').html(base.createForm(fields));
            base.getField('name').bind('change keydown keyup', function () {
                themeInfo.name = base.getFieldValue('name');
                base.updateTitle();
            });
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
            return $('#' + settings.cssInputPrefix + id);
        };

        base.getFieldValue = function (id) {
            return base.getElemValue(base.getField(id));
        };

        base.getElemValue = function (elem) {
            if (elem) {
                // TODO add support for checkboxes etc.
                return elem.val();
            } else {
                return null;
            }
        };

        base.getFieldValues = function (fields) {
            var info = {};
            $(fields).each(function (i, id) {
                info[id] = base.getFieldValue(id);
            });
            return info;
        };

        base.setFieldValue = function (id, value) {
            base.setElemValue(base.getField(id), value);
        };

        base.setFieldValues = function (obj) {
            for (var i in obj) {
                base.setFieldValue(i, obj[i]);
            }
        };

        base.setElemValue = function (elem, val) {
            if (elem) {
                // TODO add support for checkboxes etc.
                return elem.val(val);
            } else {
                return false;
            }
        };

        base.getAttribute = function (element, attribute) {
            return base.getField(element + '_' + attribute);
        };

        base.getAttributes = function () {
            return $('.' + settings.cssInputPrefix + settings.attribute);
        };

        base.persistAttributes = function () {
            var elems = themeJSON.children;
            var root = settings.cssThemePrefix + base.nameToID(themeInfo.name);
            console.log(elems, root);
            base.getAttributes().each(function () {
                var attr = $(this);
                var dataElem = attr.attr('data-element');
                var dataAttr = attr.attr('data-attribute');
                var elem = elems[root + dataElem];
                if (elem) {
                    console.log(elem);
                    if (dataAttr in elem.attributes) {
                        var val = base.addImportant(base.getElemValue(attr));
                        elem.attributes[dataAttr] = val;
                        console.log(elem.attributes);
                    }
                }
            });
        };

        base.populateAttributes = function () {
            var elems = themeJSON.children;
            var root = settings.cssThemePrefix + base.nameToID(themeInfo.name);
            console.log(elems, root);
            base.getAttributes().each(function () {
                var attr = $(this);
                var dataElem = attr.attr('data-element');
                var dataAttr = attr.attr('data-attribute');
                var elem = elems[root + dataElem];
                if (elem) {
                    if (dataAttr in elem.attributes) {
                        var val = base.removeImportant(elem.attributes[dataAttr]);
                        base.setElemValue(attr, val);
                        attr.trigger('change');
                    }
                }
            });
        };

        base.addImportant = function (attr) {
            if (!reImportant.test(attr)) {
                attr = attr + ' !important';
            }
            return attr;
        };

        base.removeImportant = function (attr) {
            return attr.replace(reImportant, '');
        };

        base.writeCSSInfo = function (info) {
            var infoStr = '/*\n';
            for (field in info) {
                infoStr += field + ': ' + info[field] + '\n';
            }
            return infoStr + '*/\n';
        };

        base.initUI = function () {
            // Bind events
            preview = $('#crayon-editor-preview');
            status = $('#crayon-editor-status');
            title = $('#crayon-theme-editor-name');
            info = $('#crayon-theme-editor-info');
            $('#crayon-editor-controls').tabs();
            $('#crayon-editor-back').click(function () {
                if (changed) {
                    base.createDialog({
                        html: "Are you sure you want to discard all changes?",
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

            // Set up jQuery UI
            base.getAttributes().each(function () {
                console.log(1);
                var attr = $(this);
                var type = attr.attr('data-type');
                if (type == 'color') {
                    var args = {
                        parts: 'full',
                        showNoneButton: true,
                        colorFormat: '#HEX'
                    };
                    args.select = function (e, color) {
                        var hex = color.formatted;
                        attr.css('background-color', hex);
                        attr.css('color', CrayonUtil.getReadableColor(hex));
                    };
                    args.close = function (e, color) {
                        attr.val(color.formatted);
                        args.select(e, color);
                    };
                    attr.colorpicker(args);
                    attr.bind('change', function () {
                        args.select(null, {formatted: attr.val()});
                    });
                } else if (type == 'size') {
                    attr.bind('change', function () {
                        var val = CrayonUtil.removeChars('^0-9-', attr.val());
                        if (val != '') {
                            attr.val(val + 'px');
                        }
                    });
                }
            });
        };

        base.updateUI = function () {
            $('#crayon-editor-controls input, #crayon-editor-controls select').bind('change keyup keydown', function () {
                changed = true;
            });
        };

        base.createInput = function (id, value, type) {
            value = CrayonUtil.setDefault(value, '');
            type = CrayonUtil.setDefault(type, 'text');
            return '<input id="' + settings.cssInputPrefix + id + '" class="' + settings.cssInputPrefix + type + '" type="' + type + '" value="' + value + '" />';
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
            info.html('<a target="_blank" href="' + adminSettings.currThemeURL + '">' + adminSettings.currThemeURL + '</a>');
        };

        base.createPrompt = function (args) {
            args = $.extend({
                title: "Prompt",
                text: "Value",
                value: '',
                options: {
                    buttons: {
                        "OK": function () {
                            if (args.ok) {
                                args.ok(base.getFieldValue('prompt-text'));
                            }
                            $(this).dialog('close');
                        },
                        "Cancel": function () {
                            $(this).dialog('close');
                        }
                    },
                    open: function () {
                        base.getField('prompt-text').val(args.value).focus();
                    }
                }
            }, args);
            args.html = args.text + ': ' + base.createInput('prompt-text');
            base.createDialog(args);
        };

        base.createAlert = function (args) {
            args = $.extend({
                title: "Alert",
                options: {
                    buttons: {
                        "OK": function () {
                            $(this).dialog('close');
                        }
                    }
                }
            }, args);
            base.createDialog(args);
        };

        base.createDialog = function (args) {
            var defaultArgs = {
                yesLabel: strings.Yes,
                noLabel: strings.No,
                title: "Confirm"
            };
            args = $.extend(defaultArgs, args);
            var options = {
                modal: true, title: args.title, zIndex: 10000, autoOpen: true,
                width: 'auto', resizable: false,
                buttons: {
                },
                selectedButtonIndex: 1, // starts from 1
                close: function (event, ui) {
                    $(this).remove();
                }
            };
            options.open = function () {
                $(this).parent().find('button:nth-child(' + options.selectedButtonIndex + ')').focus();
            };
            options.buttons[args.yesLabel] = function () {
                if (args.yes) {
                    args.yes();
                }
                $(this).dialog('close');
            };
            options.buttons[args.noLabel] = function () {
                if (args.no) {
                    args.no();
                }
                $(this).dialog('close');
            };
            options = $.extend(options, args.options);
            $('<div></div>').appendTo('body').html(args.html).dialog(options);
            // Can be modified afterwards
            return args;
        }

    };

})(jQueryCrayon);
