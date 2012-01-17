<!--
// Crayon Syntax Highlighter Theme Editor JavaScript

if (typeof DEBUG == 'undefined') {
	var DEBUG = false;
}

if (typeof crayon_log == 'undefined') {
	function crayon_log(string) {
	    if (typeof console != 'undefined' && DEBUG) {
	        console.log(string);
	    }
	}
}

//jQuery(document).ready(function() {
//	crayon_log('editor loaded');
//	CrayonSyntaxThemeEditor.init();
//});

var CrayonSyntaxThemeEditor = new function() {
	
	var preview, preview_loaded, preview_url, preview_get, preview_callback, editor_controls, editor_top_controls;
	var preview_objects;
	var theme_dropdown;
	var theme_css, is_theme_changed;
	
	this.init = function() {
		crayon_log('editor init');
		preview = jQuery('#crayon-editor-preview');
		preview_loaded = false;
		editor_controls = jQuery('#crayon-editor-controls');
		editor_top_controls = jQuery('#crayon-editor-top-controls');
		preview_url = preview.attr('url');
		theme_css = {};
		preview_objects = {};
		is_theme_changed = false;
		
		preview_callback = function() {
			preview_update();
		};
		
		// Duplicate controls from settings screen
//		theme_dropdown = jQuery('#theme').clone();
//		theme_dropdown.attr('id', 'editor-theme');
		
		theme_dropdown = add_preview_object('#theme');
		
		editor_top_controls.html(theme_dropdown);
		
//		obj.change(preview_callback);
		
		// Initial load
		preview_update();
	}
	
	var preview_update = function() {
		crayon_log('editor_preview_update');
		update_get();
		// Load Preview
		jQuery.get(preview_url + preview_get, function(data) {
			preview.html(data);
			CrayonSyntax.init();
			if (!preview_loaded) {
				CrayonSyntaxAdmin.show_theme_editor_now();
				preview_loaded = true;
			}
		});
	}
	
	var add_preview_object = function(selector) {
		var obj = jQuery(selector);
		if (obj.length == 0) {
			crayon_log('add_preview_object selector: ' + selector + ' gives null');
			return null;
		}
		obj = obj.clone();
		obj.attr('old-id', obj.attr('id'));
		obj.attr('id', 'editor-' + obj.attr('id'));
		preview_objects[obj.attr('old-id')] = obj;
		obj.change(preview_callback);
		return obj;
	}
	
	var update_get = function() {
		preview_get = '?toolbar=1&';
		for (id in preview_objects) {
			obj = preview_objects[id];
			preview_get += id + '=' + obj.val() + '&';
		}
		crayon_log(preview_get);
	}
	
}

//-->