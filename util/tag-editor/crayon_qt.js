(function($) {

	window.CrayonQuickTags = function() {
	
		var base = this;
		
		jQuery(function() {CrayonTagEditor.loadDialog(); });
		
		base.sel = '#qt_content_crayon_quicktag, #qt_bbp_topic_content_crayon_quicktag';
		
		QTags.addButton( 'crayon_quicktag', 'crayon', function() {
			CrayonTinyMCE.init(base.sel);
			CrayonTagEditor.showDialog(
				function(shortcode) {
					QTags.insertContent(shortcode);
				},
				function(shortcode) {/* Can't edit */}, null, CrayonTinyMCE.hide, 'html', null, null, null, 'encode');
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