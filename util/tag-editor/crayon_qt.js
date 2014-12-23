(function ($) {

    var settings = CrayonTagEditorSettings;

    window.CrayonQuickTags = new function () {

        var base = this;

        base.init = function () {
            base.sel = '*[id*="crayon_quicktag"],*[class*="crayon_quicktag"]';
            var buttonText = settings.quicktag_text;
            buttonText = buttonText !== undefined ? buttonText : 'crayon';
            QTags.addButton('crayon_quicktag', buttonText, function () {
                CrayonTagEditor.showDialog({
                    insert: function (shortcode) {
                        QTags.insertContent(shortcode);
                    },
                    select: base.getSelectedText,
                    editor_str: 'html',
                    output: 'encode'
                });
                $(base.sel).removeClass('qt_crayon_highlight');
            });
            var qt_crayon;
            var find_qt_crayon = setInterval(function () {
                qt_crayon = $(base.sel).first();
                if (typeof qt_crayon != 'undefined') {
                    CrayonTagEditor.bind(base.sel);
                    clearInterval(find_qt_crayon);
                }
            }, 100);
        };

        base.getSelectedText = function () {
            if (QTags.instances.length == 0) {
                return null;
            } else {
                var qt = QTags.instances[0];
                var startPos = qt.canvas.selectionStart;
                var endPos = qt.canvas.selectionEnd;
                return qt.canvas.value.substring(startPos, endPos);
            }
        };

    };

    $(document).ready(function () {
        CrayonQuickTags.init();
    });

})(jQueryCrayon);