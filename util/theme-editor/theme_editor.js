// Crayon Syntax Highlighter Theme Editor JavaScript

(function ($) {

    CrayonSyntaxThemeEditor = new function () {

        var settings = CrayonThemeEditorSettings;

        this.init = function (callback, crayon) {

            console_log(CrayonThemeEditorSettings);

            console_log('editor init');
            preview = jQuery('#crayon-editor-preview');

            crayon.attr('id', 'theme-editor-instance');
            CrayonSyntax.process(crayon, true);
            preview.html(crayon);

            jQuery.get(settings.themes_url + settings.curr_theme + '/' + settings.curr_theme + '.css', function (css) {
                console_log(css);

                var json = CSSJSON.toJSON(css, true);
                console_log(json);
            });

            callback();

        };

    };

})(jQueryCrayon);
