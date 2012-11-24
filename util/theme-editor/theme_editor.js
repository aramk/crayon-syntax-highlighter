// Crayon Syntax Highlighter Theme Editor JavaScript

(function ($) {

    CrayonSyntaxThemeEditor = new function () {

        var base = this;

        var adminSettings = CrayonThemeEditorSettings;
        var settings = CrayonThemeEditorSettings;

        base.init = function (callback, crayon) {

            console_log(CrayonThemeEditorSettings);

            console_log('editor init');
            preview = jQuery('#crayon-editor-preview');

            crayon.attr('id', 'theme-editor-instance');
            CrayonSyntax.process(crayon, true);
            preview.html(crayon);

            jQuery.get(adminSettings.themes_url + adminSettings.curr_theme + '/' + adminSettings.curr_theme + '.css', function (css) {
                console_log(css);

                var json = CSSJSON.toJSON(css, true);
                console_log(json);
            });

            callback();

            base.initUI();
        };

        base.initUI = function() {
            $('#crayon-editor-controls').tabs();
        }

    };

})(jQueryCrayon);
