// Crayon Syntax Highlighter Theme Editor JavaScript

(function ($) {

    CrayonSyntaxThemeEditor = new function () {

        var base = this;

        var crayonSettings = CrayonSyntaxSettings;
        var adminSettings = CrayonAdminSettings;
        var settings = CrayonThemeEditorSettings;
        var strings = CrayonThemeEditorStrings;
        var adminStrings = CrayonAdminStrings;
        var admin = CrayonSyntaxAdmin;

        var preview, previewCrayon, previewCSS, status, title, info;
        var colorPickerPos;
        var changed, loaded;
        var themeID, themeJSON, themeCSS, themeStr, themeInfo;
        var reImportant = /\s+!important$/gmi;
        var reSize = /^[0-9-]+px$/;
        var reCopy = /-copy(-\d+)?$/;
        var changedAttr = 'data-value';
        var borderCSS = {'border': true, 'border-left': true, 'border-right': true, 'border-top': true, 'border-bottom': true};

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
            previewCrayon = crayon.find('.crayon-syntax');
            preview.append(crayon)
            base.load();
            if (callback) {
                callback();
            }
        };

        base.load = function () {
            loaded = false;
            themeStr = adminSettings.currThemeCSS;
            themeID = adminSettings.currTheme;
            changed = false;
            themeJSON = CSSJSON.toJSON(themeStr, {
                stripComments: true,
                split: true
            });
            themeJSON = base.filterCSS(themeJSON);
            CrayonUtil.log(themeJSON);
            themeInfo = base.readCSSInfo(themeStr);
            base.removeExistingCSS();
            base.initInfoUI();
            base.updateTitle();
            base.updateInfo();
            base.setFieldValues(themeInfo);
            base.populateAttributes();
            base.updateLiveCSS();
            base.updateUI();
            loaded = true;
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
            // Save
            themeCSS = CSSJSON.toCSS(themeJSON);
            var newThemeStr = base.writeCSSInfo(info) + themeCSS;
            CrayonUtil.postAJAX({
                action: 'crayon-theme-editor-save',
                id: themeID,
                name: base.getName(),
                css: newThemeStr
            }, function (result) {
                status.show();
                result = parseInt(result);
                if (result > 0) {
                    status.html(strings.success);
                    if (result === 2) {
                        window.GET['theme-editor'] = 1;
                        CrayonUtil.reload();
                    }
                } else {
                    status.html(strings.fail);
                }
                changed = false;
                setTimeout(function () {
                    status.fadeOut();
                }, 1000);
            });
        };

        base.del = function (id, name) {
            admin.createDialog({
                title: strings.del,
                html: strings.deleteThemeConfirm.replace('%s', name),
                yes: function () {
                    CrayonUtil.postAJAX({
                        action: 'crayon-theme-editor-delete',
                        id: id
                    }, function (result) {
                        if (result > 0) {
                            CrayonUtil.reload();
                        } else {
                            admin.createAlert({
                                html: strings.deleteFail + ' ' + strings.checkLog
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
                title: strings.duplicate,
                text: strings.newName,
                value: base.getNextAvailableName(id),
                ok: function (val) {
                    CrayonUtil.postAJAX({
                        action: 'crayon-theme-editor-duplicate',
                        id: id,
                        name: val
                    }, function (result) {
                        if (result > 0) {
                            CrayonUtil.reload();
                        } else {
                            admin.createAlert({
                                html: strings.duplicateFail + ' ' + strings.checkLog
                            });
                        }
                    });
                }
            });
        };

        base.submit = function (id, name) {
            base.createPrompt({
                title: strings.submit,
                desc: strings.submitText,
                text: strings.message,
                value: strings.submitMessage,
                ok: function (val) {
                    CrayonUtil.postAJAX({
                        action: 'crayon-theme-editor-submit',
                        id: id,
                        message: val
                    }, function (result) {
                        var msg = result > 0 ? strings.submitSucceed : strings.submitFail + ' ' + strings.checkLog;
                        admin.createAlert({
                            html: msg
                        });
                    });
                }
            });
        };

        base.getNextAvailableName = function (id) {
            var next = base.getNextAvailableID(id);
            return base.idToName(next[1]);
        };

        base.getNextAvailableID = function (id) {
            var themes = adminSettings.themes;
            var count = 0;
            if (reCopy.test(id)) {
                // Remove the "copy" if it already exists
                var newID = id.replace(reCopy, '');
                if (newID.length > 0) {
                    id = newID;
                }
            }
            var nextID = id;
            while (nextID in themes) {
                count++;
                if (count == 1) {
                    nextID = id + '-copy';
                } else {
                    nextID = id + '-copy-' + count.toString();
                }
            }
            return [count, nextID];
        };

        base.readCSSInfo = function (cssStr) {
            var infoStr = /^\s*\/\*[\s\S]*?\*\//gmi.exec(cssStr);
            var themeInfo = {};
            var match = null;
            var infoRegex = /([^\r\n:]*[^\r\n\s:])\s*:\s*([^\r\n]+)/gmi;
            while ((match = infoRegex.exec(infoStr)) != null) {
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

        base.removeExistingCSS = function () {
            // Remove the old <style> tag to prevent clashes
            preview.find('link[rel="stylesheet"][href*="' + adminSettings.currThemeURL + '"]').remove()
        };

        base.initInfoUI = function () {
            CrayonUtil.log(themeInfo);
            // TODO abstract
            var names = base.getFieldNames(themeInfo);
            var fields = {};
            for (var id in names) {
                var name = names[id];
                var value = themeInfo[id];
                fields[name] = base.createInput(id, value);
            }
            $('#tabs-1-contents').html(base.createForm(fields));
            base.getField('name').bind('change keydown keyup', function () {
                themeInfo.name = base.getFieldValue('name');
                base.updateTitle();
            });
        };

        base.nameToID = function (name) {
            return name.toLowerCase().replace(/\s+/gmi, '-');
        };

        base.idToName = function (id) {
            id = id.replace(/-/gmi, ' ');
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

        base.visitAttribute = function (attr, callback) {
            var elems = themeJSON.children;
            var root = settings.cssThemePrefix + base.nameToID(themeInfo.name);
            var dataElem = attr.attr('data-element');
            var dataAttr = attr.attr('data-attribute');
            var elem = elems[root + dataElem];
            callback(attr, elem, dataElem, dataAttr, root, elems);
        };

        base.persistAttributes = function (remove_default) {
            remove_default = CrayonUtil.setDefault(remove_default, true);
            base.getAttributes().each(function () {
                base.persistAttribute($(this), remove_default);
            });
        };

        base.persistAttribute = function (attr, remove_default) {
            remove_default = CrayonUtil.setDefault(remove_default, true);
            base.visitAttribute(attr, function (attr, elem, dataElem, dataAttr, root, elems) {
                if (remove_default && attr.prop('tagName') == 'SELECT' && attr.val() == attr.attr('data-default')) {
                    if (elem) {
                        // If default is selected in a dropdown, then remove
                        delete elem.attributes[dataAttr];
                    }
                    return;
                }
                var val = base.getElemValue(attr);
                if ((val == null || val == '')) {
                    // No value given
                    if (remove_default && elem) {
                        delete elem.attributes[dataAttr];
                        return;
                    }
                } else {
                    val = base.addImportant(val);
                    if (!elem) {
                        elem = elems[root + dataElem] = {
                            attributes: {},
                            children: {}
                        };
                    }
                    elem.attributes[dataAttr] = val;
                }
                CrayonUtil.log(dataElem + ' ' + dataAttr);
            });
        };

        base.populateAttributes = function ($change) {
            var elems = themeJSON.children;
            var root = settings.cssThemePrefix + base.nameToID(themeInfo.name);
            CrayonUtil.log(elems, root);
            base.getAttributes().each(function () {
                base.visitAttribute($(this), function (attr, elem, dataElem, dataAttr, root, elems) {
                    if (elem) {
                        if (dataAttr in elem.attributes) {
                            var val = base.removeImportant(elem.attributes[dataAttr]);
                            base.setElemValue(attr, val);
                            attr.trigger('change');
                        }
                    }
                });
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

        base.isImportant = function (attr) {
            return reImportant.exec(attr) != null;
        };

        base.appendStyle = function (css) {
            previewCSS.html('<style>' + css + '</style>');
        };

        base.removeStyle = function () {
            previewCSS.html('');
        };

        base.writeCSSInfo = function (info) {
            var infoStr = '/*\n';
            for (var field in info) {
                infoStr += field + ': ' + info[field] + '\n';
            }
            return infoStr + '*/\n';
        };

        base.filterCSS = function (css) {
            // Split all border CSS attributes into individual attributes
            for (var child in css.children) {
                var atts = css.children[child].attributes;
                for (var att in atts) {
                    if (att in borderCSS) {
                        var rules = base.getBorderCSS(atts[att]);
                        for (var rule in rules) {
                            atts[att + '-' + rule] = rules[rule];
                        }
                        delete atts[att];
                    }
                }
            }
            return css;
        },

            base.getBorderCSS = function (css) {
                var result = {};
                var important = base.isImportant(css);
                $.each(strings.borderStyles, function (i, style) {
                    if (css.indexOf(style) >= 0) {
                        result.style = style;
                    }
                });
                var width = /\d+\s*(px|%|em|rem)/gi.exec(css);
                if (width) {
                    result.width = width[0];
                }
                var color = /#\w+/gi.exec(css);
                if (color) {
                    result.color = color[0];
                }
                if (important) {
                    for (var rule in result) {
                        result[rule] = base.addImportant(result[rule]);
                    }
                }
                return result;
            },

            base.createPrompt = function (args) {
                args = $.extend({
                    title: adminStrings.prompt,
                    text: adminStrings.value,
                    desc: null,
                    value: '',
                    options: {
                        buttons: {
                            "OK": function () {
                                if (args.ok) {
                                    args.ok(base.getFieldValue('prompt-text'));
                                }
                                $(this).crayonDialog('close');
                            },
                            "Cancel": function () {
                                $(this).crayonDialog('close');
                            }
                        },
                        open: function () {
                            base.getField('prompt-text').val(args.value).focus();
                        }
                    }
                }, args);
                args.html = '<table class="field-table crayon-prompt-' + base.nameToID(args.title) + '">';
                if (args.desc) {
                    args.html += '<tr><td colspan="2">' + args.desc + '</td></tr>';
                }
                args.html += '<tr><td>' + args.text + ':</td><td>' + base.createInput('prompt-text') + '</td></tr>';
                args.html += '</table>';
                var options = {width: '400px'};
                admin.createDialog(args, options);
            };

        base.initUI = function () {
            // Bind events
            preview = $('#crayon-editor-preview');
            previewCSS = $('#crayon-editor-preview-css');
            status = $('#crayon-editor-status');
            title = $('#crayon-theme-editor-name');
            info = $('#crayon-theme-editor-info');
            $('#crayon-editor-controls').tabs();
            $('#crayon-editor-back').click(function () {
                if (changed) {
                    admin.createDialog({
                        html: strings.discardConfirm,
                        title: adminStrings.confirm,
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
                var attr = $(this);
                var type = attr.attr('data-group');
                if (type == 'color') {
                    var args = {
                        parts: 'full',
                        showNoneButton: true,
                        colorFormat: '#HEX'
                    };
                    args.open = function (e, color) {
                        $('.ui-colorpicker-dialog .ui-button').addClass('button-primary');
                        if (colorPickerPos) {
                            var picker = $('.ui-colorpicker-dialog:visible');
                            picker.css('left', colorPickerPos.left);
//                            picker.css('top', colorPickerPos.top);
                        }
                    };
                    args.select = function (e, color) {
                        attr.trigger('change');
                    };
                    args.close = function (e, color) {
                        attr.trigger('change');
                    };
                    attr.colorpicker(args);
                    attr.bind('change', function () {
                        var hex = attr.val();
                        attr.css('background-color', hex);
                        attr.css('color', CrayonUtil.getReadableColor(hex));
                    });
                } else if (type == 'size') {
                    attr.bind('change', function () {
                        var val = attr.val();
                        if (!reSize.test(val)) {
                            val = CrayonUtil.removeChars('^0-9-', val);
                            if (val != '') {
                                attr.val(val + 'px');
                            }
                        }
                    });
                }
                if (type != 'color') {
                    // For regular text boxes, capture changes on keys
                    attr.bind('keydown keyup', function () {
                        if (attr.attr(changedAttr) != attr.val()) {
                            CrayonUtil.log('triggering', attr.attr(changedAttr), attr.val());
                            attr.trigger('change');
                        }
                    });
                }
                // Update CSS changes to the live instance
                attr.bind('change', function () {
                    if (attr.attr(changedAttr) == attr.val()) {
                        return;
                    } else {
                        attr.attr(changedAttr, attr.val());
                    }
                    if (loaded) {
                        base.persistAttribute(attr);
                        base.updateLiveCSS();
                    }
                });
            });
            $('.ui-colorpicker-dialog').addClass('wp-dialog');
            $('.ui-colorpicker-dialog').mouseup(function () {
                base.colorPickerMove($(this));
            });
        };

        base.colorPickerMove = function (picker) {
            if (picker) {
                colorPickerPos = {left: picker.css('left'), top: picker.css('top')};
            }
        };

        base.updateLiveCSS = function (clone) {
            clone = CrayonUtil.setDefault(clone, false);
            if (previewCrayon) {
                var json;
                if (clone) {
                    var id = previewCrayon.attr('id');
                    json = $.extend(true, {}, themeJSON);
                    $.each(json.children, function (child) {
                        json.children['#' + id + child] = json.children[child];
                        delete json.children[child];
                    });
                } else {
                    json = themeJSON;
                }
                base.appendStyle(CSSJSON.toCSS(json));
            }
        };

        base.updateUI = function () {
            $('#crayon-editor-controls input, #crayon-editor-controls select').bind('change', function () {
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
            admin.resetPreview();
            admin.preview_update();
            admin.show_theme_info();
            admin.show_main();
            //preview.html('');
        };

        base.updateTitle = function () {
            var name = base.getName();
            if (adminSettings.editing_theme) {
                title.html(strings.editingTheme.replace('%s', name));
            } else {
                title.html(strings.creatingTheme.replace('%s', name));
            }
        };

        base.updateInfo = function () {
            info.html('<a target="_blank" href="' + adminSettings.currThemeURL + '">' + adminSettings.currThemeURL + '</a>');
        };

    };

})(jQueryCrayon);
