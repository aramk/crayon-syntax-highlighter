var CrayonQuickTags = function() {
	
	jQuery(function() {CrayonTagEditor.loadDialog(); });
	
	QTags.addButton( 'crayon_quicktag', 'crayon', function() {
		CrayonTagEditor.showDialog(
			function(shortcode) {
				QTags.insertContent(shortcode);
			},
			function(shortcode) {/* Can't edit */}, 'html', null, null, null, 'encode');
		jQuery('#qt_content_crayon_quicktag').removeClass('qt_crayon_highlight');
	});
	
	var qt_crayon;
	var find_qt_crayon = setInterval(function() {
		qt_crayon = jQuery('#qt_content_crayon_quicktag');
		if (typeof qt_crayon != 'undefined') {
			if (!CrayonTagEditorSettings.used) {
				qt_crayon.addClass('qt_crayon_highlight');
			}
			clearInterval(find_qt_crayon);
		}
	}, 100);
	
};

CrayonQuickTags();