// Crayon Syntax Highlighter Theme Editor JavaScript

(function ($) {

    CrayonSyntaxThemeEditor = new function () {

        var base = this;

        var crayonSettings = CrayonSyntaxSettings;
        var adminSettings = CrayonAdminSettings;
        var settings = CrayonThemeEditorSettings;

        var preview;

        var themeID, themeJSON, themeCSS, themeStr, themeInfo;

        base.init = function (callback) {
            // Called only once
            console_log('editor init');
            preview = jQuery('#crayon-editor-preview');
            base.initUI();
            if (callback) {
                callback();
            }
        };

        base.load = function (callback, crayon) {
            // Called each time editor is shown
            crayon.attr('id', 'theme-editor-instance');
            CrayonSyntax.process(crayon, true);
            preview.html(crayon);
            base.loadTheme();
            if (callback) {
                callback();
            }
        };

        base.loadTheme = function () {
            themeStr = adminSettings.curr_theme_str;
            themeID = adminSettings.curr_theme;
            themeJSON = CSSJSON.toJSON(themeStr, {
                comments: false,
                split: true
            });
            console.log(themeStr);
            console.log(settings);
            themeInfo = base.readThemeInfo(themeStr);
            for (var field in themeInfo) {
                $('#' + settings.cssPrefix + field).val(themeInfo[field]);
            }
        };

        base.saveTheme = function () {
            themeCSS = CSSJSON.toCSS(themeJSON);
            var info = {};
            for (var field in themeInfo) {
                info[settings.fields[field]] = themeInfo[field];
            }
            var newThemeStr = base.writeThemeInfo(info) + themeCSS;
            $.get(crayonSettings.ajaxurl, {
                action : 'crayon-theme-editor-save',
                id : themeID,
                css : newThemeStr
            });
        };

        base.readThemeInfo = function (cssStr) {
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

        base.writeThemeInfo = function (info) {
            var infoStr = '/*\n';
            for (field in info) {
                infoStr += field + ': ' + info[field] + '\n';
            }
            return infoStr + '*/\n';
        };

        base.initUI = function () {
            $('#crayon-editor-controls').tabs();
            $('#crayon-editor-back').click(adminSettings.show_main);
            $('#crayon-editor-save').click(base.saveTheme);
        };

    };

})(jQueryCrayon);
