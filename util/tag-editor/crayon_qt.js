(function($) {

	window.CrayonQuickTags = function() {
	
		var base = this;
		
		base.sel = '*[id*="crayon_quicktag"],*[class*="crayon_quicktag"]';
		
		QTags.addButton( 'crayon_quicktag', 'crayon', function() {
			CrayonTagEditor.init(base.sel);
			CrayonTagEditor.showDialog(
				function(shortcode) {
					QTags.insertContent(shortcode);
				},
				function(shortcode) {/* Can't edit */}, null, CrayonTagEditor.hide, 'html', null, null, null, 'encode');
			jQuery(base.sel).removeClass('qt_crayon_highlight');
		});
		
		var qt_crayon;
		var find_qt_crayon = setInterval(function() {
			qt_crayon = jQuery(base.sel).first();
			if (typeof qt_crayon != 'undefined') {
				if (!CrayonTagEditorSettings.used) {
					qt_crayon.addClass('qt_crayon_highlight');
				}
				clearInterval(find_qt_crayon);
			}
		}, 100);
		
	};
	
	CrayonQuickTags();

})(jQueryCrayon);