(function ($) {

    window.CrayonTinyMCE = new function () {

        // TinyMCE specific
        var name = 'crayon_tinymce';
        var s, te = null;
        var isHighlighted = false;
        var currPre = null;
        // Switch events
        var switch_html_click = switch_tmce_click = null;

        var base = this;
        //	var wasHighlighted = false;

        base.setHighlight = function (highlight) {
            if (highlight) {
                $(s.tinymce_button).addClass('mce_crayon_tinymce_highlight');
            } else {
                $(s.tinymce_button).removeClass('mce_crayon_tinymce_highlight');
            }
            isHighlighted = highlight;
        };

        base.selectPreCSS = function (selected) {
            if (currPre) {
                if (selected) {
                    $(currPre).addClass(s.css_selected);
                } else {
                    $(currPre).removeClass(s.css_selected);
                }
            }
        };

        base.isPreSelectedCSS = function () {
            if (currPre) {
                return $(currPre).hasClass(s.css_selected);
            }
            return false;
        };

        base.init = function (button) {
            // TODO
        };

        base.loadTinyMCE = function () {
            s = CrayonTagEditorSettings;
            te = CrayonTagEditor;

            tinymce.PluginManager.requireLangPack(name);

            tinymce.create('tinymce.plugins.Crayon', {
                init: function (ed, url) {

                    ed.onInit.add(function (ed) {
                        ed.dom.loadCSS(url + '/crayon_te.css');
                    });

                    // Prevent <p> on enter, turn into \n
                    ed.onKeyDown.add(function (ed, e) {
                        var selection = ed.selection;
                        if (e.keyCode == 13) {
                            var node = selection.getNode();
                            if (node.nodeName == 'PRE') {
                                selection.setContent('\n', {format: 'raw'});
                                return tinymce.dom.Event.cancel(e);
                            } else if (te.isCrayon(node)) {
                                // Only triggers for inline <span>, ignore enter in inline
                                return tinymce.dom.Event.cancel(e);
                            }
                        }
                    });

                    ed.onInit.add(function (ed) {
                        CrayonTagEditor.bind(s.tinymce_button);
                    });

                    ed.addCommand('showCrayon', function () {
                        te.showDialog({
                            insert: function (shortcode) {
                                ed.execCommand('mceInsertContent', 0, shortcode);
                            },
                            edit: function (shortcode) {
                                // This will change the currPre object
                                var newPre = $(shortcode);
                                $(currPre).replaceWith(newPre);
                                // XXX DOM element not jQuery
                                currPre = newPre[0];
                            },
                            select: function () {
                                return ed.selection.getContent({format: 'text'});
                            },
                            editor_str: 'tinymce',
                            ed: ed,
                            node: currPre,
                            input: 'decode',
                            output: 'encode'
                        });
                    });

                    // Remove onclick and call ourselves
                    var switch_html = $(s.switch_html);
                    switch_html.prop('onclick', null);
                    switch_html.click(function () {
                        // Remove selected pre class when switching to HTML editor
                        base.selectPreCSS(false);
                        switchEditors.go('content', 'html');
                    });

                    // Highlight selected
                    ed.onNodeChange.add(function (ed, cm, n, co) {
                        if (n != currPre) {
                            // We only care if we select another same object
                            if (currPre) {
                                // If we have a previous pre, remove it
                                base.selectPreCSS(false);
                                currPre = null;
                            }
                            if (te.isCrayon(n)) {
                                // Add new pre
                                currPre = n;
                                base.selectPreCSS(true);
                                base.setHighlight(true);
                            } else {
                                // No pre selected
                                base.setHighlight(false);
                            }
//                            var tooltip = currPre ? s.dialog_title_edit : s.dialog_title_add;
//                            $(s.tinymce_button).attr('title', tooltip);
                        }
                    });

                    ed.onBeforeSetContent.add(function (ed, o) {
                        // Remove all selected pre tags
                        var content = $(o.content);
                        var wrapper = $('<div>');
                        content.each(function () {
                            $(this).removeClass(s.css_selected);
                            wrapper.append($(this).clone());
                        });
                        o.content = wrapper.html();
                    });

                    ed.addButton(name, {
                        // TODO add translation
                        title: s.dialog_title,
                        cmd: 'showCrayon'
                    });
                },
                createControl: function (n, cm) {
                    return null;
                },
                getInfo: function () {
                    return {
                        longname: 'Crayon Syntax Highlighter',
                        author: 'Aram Kocharyan',
                        authorurl: 'http://aramk.com/',
                        infourl: 'https://github.com/aramk/crayon-syntax-highlighter',
                        version: "1.0"
                    };
                }
            });

            tinymce.PluginManager.add(name, tinymce.plugins.Crayon);
        };

    };

    $(document).ready(function () {
        // Load TinyMCE
        CrayonTinyMCE.loadTinyMCE();
    });

})(jQueryCrayon);
