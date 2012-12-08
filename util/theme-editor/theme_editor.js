// Crayon Syntax Highlighter Theme Editor JavaScript

(function ($) {

    CrayonSyntaxThemeEditor = new function () {

        var base = this;

        var adminSettings = CrayonAdminSettings;
        var settings = CrayonThemeEditorSettings;

        var preview;

        base.init = function (callback) {
        	// Called only once
            console_log('editor init');
            preview = jQuery('#crayon-editor-preview');
            base.initUI();
            if (callback) {
            	callback();            	
            }
        };
        
        base.load = function(callback, crayon) {
        	// Called each time editor is shown
        	crayon.attr('id', 'theme-editor-instance');
            CrayonSyntax.process(crayon, true);
            preview.html(crayon);
            if (callback) {
            	callback();            	
            }
        };

        base.initUI = function() {
            $('#crayon-editor-controls').tabs();
            $('#crayon-editor-back').click(CrayonSyntaxAdmin.show_main);
        };

    };

})(jQueryCrayon);
