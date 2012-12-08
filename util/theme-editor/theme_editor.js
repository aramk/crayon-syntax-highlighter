// Crayon Syntax Highlighter Theme Editor JavaScript

(function ($) {

    CrayonSyntaxThemeEditor = new function () {

        var base = this;

        var adminSettings = CrayonAdminSettings;
        var settings = CrayonThemeEditorSettings;

        var preview;

        base.init = function (callback, crayon) {
            console_log('editor init');
            preview = jQuery('#crayon-editor-preview');
            crayon.attr('id', 'theme-editor-instance');
            CrayonSyntax.process(crayon, true);
            preview.html(crayon);

            callback();
            base.initUI();
        };

        base.initUI = function() {
            $('#crayon-editor-controls').tabs();
            $('#crayon-editor-back').click(CrayonSyntaxAdmin.show_main);
            
        };

    };

})(jQueryCrayon);
