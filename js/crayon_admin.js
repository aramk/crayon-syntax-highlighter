// Crayon Syntax Highlighter Admin JavaScript

var CrayonSyntaxAdmin = new function() {
	
	// Preview
	var preview = preview_info = preview_cbox = preview_url = preview_delay_timer = preview_get = null;
	// The DOM object ids that trigger a preview update
	var preview_obj_names = [];
	// The jQuery objects for these objects
	var preview_objs = [];
	var preview_last_values = [];
	// Alignment
	var align_drop = float = null;
	// Toolbar
	var overlay = toolbar = null;
	// Error
	var msg_cbox = msg = null;
	// Log
	var log_button = log_text = null;
	
	var main_wrap = theme_editor_wrap = editor_url = theme_editor_edit_button = theme_editor_create_button = null;
//	var theme_editor_loaded = false;
//	var theme_editor_loading = false;

	var settings = CrayonSyntaxSettings;
	var me = this;
	
	this.cssElem = function(id) {
		return jQuery(this.addPrefixToID(id));
	};
	
	// Used in Tag Editor
	this.addPrefixToID = function(id) {
		return id.replace(/^([#.])?(.*)$/, '$1'+settings.prefix+'$2');
	};
	
	this.removePrefixFromID = function(id) {
		var re = new RegExp('^[#.]?'+settings.prefix, 'i');
		return id.replace(re,'');
	};
	
	this.init = function() {
		console_log('admin init');
		
		// Wraps
		main_wrap = jQuery('#crayon-main-wrap');
		theme_editor_wrap = jQuery('#crayon-theme-editor-wrap');
		editor_url = theme_editor_wrap.attr('url');
		theme_editor_edit_button = jQuery('#crayon-theme-editor-edit-button');
		theme_editor_create_button = jQuery('#crayon-theme-editor-create-button');
		theme_editor_edit_button.click(function() { CrayonSyntaxAdmin.show_theme_editor(theme_editor_edit_button, true); });
		theme_editor_create_button.click(function() { CrayonSyntaxAdmin.show_theme_editor(theme_editor_create_button, false); });
		
		// Theme editor
		var get_vars = this.get_vars();
		if (get_vars['subpage'] == 'theme_editor') {
			this.show_theme_editor();
		} else {
			this.show_main();
		}
		
		// Help
		help = jQuery('.crayon-help-close');
		help.click(function() {
			jQuery('.crayon-help').hide();
			jQuery.get(help.attr('url'));
		});
		
		// Preview
		preview = jQuery('#crayon-live-preview');
		preview_info = jQuery('#crayon-preview-info');
		preview_url = preview.attr('url');
		preview_cbox = me.cssElem('#preview');
		if (preview.length != 0) {
			// Preview not needed in Tag Editor
			preview_register();
			preview.ready(function() {
				preview_toggle();
			});
		preview_cbox.change(function() { preview_toggle(); });
		}
		
		// Alignment
		align_drop = me.cssElem('#h-align');
		float = jQuery('#crayon-subsection-float');
		align_drop.change(function() { float_toggle(); });
		align_drop.ready(function() { float_toggle(); });
		
	    // Custom Error
	    msg_cbox = me.cssElem('#error-msg-show');
	    msg = me.cssElem('#error-msg');
	    toggle_error();
	    msg_cbox.change(function() { toggle_error(); });
	
	    // Toolbar
	    overlay = jQuery('#crayon-subsection-toolbar');
	    toolbar = me.cssElem('#toolbar');
	    toggle_toolbar();
	    toolbar.change(function() { toggle_toolbar(); });
	    
	    // Copy
	    plain = me.cssElem('#plain');
	    copy = jQuery('#crayon-subsection-copy-check');
	    plain.change(function() {
	    	if (plain.is(':checked')) {
	    		copy.show();
	    	} else {
	    		copy.hide();
	    	}
		});
	    
	    // Log
	    log_wrapper = jQuery('#crayon-log-wrapper');
	    log_button = jQuery('#crayon-log-toggle');
	    log_text = jQuery('#crayon-log-text');
	    var show_log = log_button.attr('show_txt');
	    var hide_log = log_button.attr('hide_txt');
	    clog = jQuery('#crayon-log');
	    log_button.val(show_log);
	    log_button.click(function() {
	    	clog.width(log_wrapper.width());
	    	clog.toggle();
	        // Scrolls content
	        clog.scrollTop(log_text.height());
	        var text = ( log_button.val() == show_log ? hide_log : show_log );
	        log_button.val(text);
	    });
	    
	};
	
	/* Whenever a control changes preview */
	var preview_update = function() {
//		console_log('preview_update');
		preview_get = '?';
		var val = 0;
		var obj;
		for (var i = 0; i < preview_obj_names.length; i++) {
			obj = preview_objs[i];
			if (obj.attr('type') == 'checkbox') {
				val = obj.is(':checked');
			} else {
				val = obj.val();
			}
			preview_get += preview_obj_names[i] + '=' + crayon_escape(val) + "&";
		}
		
		// XXX Scroll to top of themes
		// Disabled for now, too annoying
		//var top = jQuery('a[name="crayon-theme"]');
		//jQuery(window).scrollTop(top.position().top);
		
		// Delay resize
//		preview.css('height', preview.height());
//		preview.css('overflow', 'hidden');
//		preview_timer = setInterval(function() {
//			preview.css('height', '');
//			preview.css('overflow', 'visible');
//			clearInterval(preview_timer);
//		}, 1000);
	
		// Load Preview
		jQuery.get(preview_url + preview_get, function(data) {
			preview.html(data);
			// Important! Calls the crayon.js init
			CrayonSyntax.init();
		});
	};
	
	var preview_toggle = function() {
//		console_log('preview_toggle');
	    if ( preview_cbox.is(':checked') ) {
	    	preview.show();
	    	preview_info.show();
	    	preview_update();
	    } else {
	    	preview.hide();
	    	preview_info.hide();
	    }
	};
	
	var float_toggle = function() {
	    if ( align_drop.val() != 0 ) {
	    	float.show();
	    } else {
	    	float.hide();
	    }
	};
	
	// List of callbacks
	var preview_callback;
	var preview_txt_change;
	var preview_txt_callback; // Only updates if text value changed
	var preview_txt_callback_delayed;
	//var height_set;
	
	// Register all event handlers for preview objects
	var preview_register = function() {
//		console_log('preview_register');
		preview_get = '?';
	
		// Instant callback
		preview_callback = function() {
			preview_update();
		};
		
		// Checks if the text input is changed, if so, runs the callback with given event
		preview_txt_change = function(callback, event) {
			//console_log('checking if changed');
			var obj = event.target;
			var last = preview_last_values[obj.id];
			//console_log('last' + preview_last_values[obj.id]);
			
			if (obj.value != last) {
				//console_log('changed');
				// Update last value to current
				preview_last_values[obj.id] = obj.value;
				// Run callback with event
				callback(event);
			}
		};
		
		// Only updates when text is changed
		preview_txt_callback = function(event) {
			//console_log('txt callback');
			preview_txt_change(preview_update, event);
		};
		
		// Only updates when text is changed, but  callback
		preview_txt_callback_delayed = function(event) {
			preview_txt_change(function() {
				clearInterval(preview_delay_timer);
				preview_delay_timer = setInterval(function() {
					//console_log('delayed update');				
					preview_update();
					clearInterval(preview_delay_timer);
				}, 500);
			}, event);
		};
		
		// Retreive preview objects
		jQuery('[crayon-preview="1"]').each(function(i) {
			var obj = jQuery(this);
			var id = obj.attr('id');
			// XXX Remove prefix
			id = me.removePrefixFromID(id);
			preview_obj_names[i] = id;
			preview_objs[i] = obj;
			// To capture key up events when typing
			if (obj.attr('type') == 'text') {
				preview_last_values[obj.attr('id')] = obj.val();
				obj.bind('keyup', preview_txt_callback_delayed);
				obj.change(preview_txt_callback);
			} else {
				// For all other objects
				obj.change(preview_callback);
			}
		});
	};
	
	var toggle_error = function() {
	    if ( msg_cbox.is(':checked') ) {
	        msg.show();
	    } else {
	        msg.hide();
	    }
	};
	
	var toggle_toolbar = function() {
	    if ( toolbar.val() == 0 ) {
	        overlay.show();
	    } else {
	        overlay.hide();
	    }
	};
	
	this.show_langs = function(url) {
//		jQuery('#show-lang').hide();
		jQuery.get(url, function(data) {
//			jQuery('#lang-info').show();
			jQuery('#crayon-subsection-lang-info').html(data);
		});
		return false;
	};
	
	this.get_vars = function() {
		var vars = {};
		window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
			vars[key] = value;
		});
		return vars;
	};
	
	// Changing wrap views
	this.show_main = function() {
		theme_editor_wrap.hide();
		main_wrap.show();
		jQuery(window).scrollTop(0);
		return false;
	};
	
	this.show_theme_editor_now = function(button) {
		main_wrap.hide();
		theme_editor_wrap.show();
		jQuery(window).scrollTop(0);
		
		theme_editor_loading = false;
		button.html(button.attr('loaded'));
	};
	
	this.show_theme_editor = function(button, editing) {
//		if (theme_editor_loading) {
//			return;
//		}
//		theme_editor_button.css('width', theme_editor_button.width());
//		if (!theme_editor_loaded) {
//			theme_editor_loading = true;
		button.html(button.attr('loading'));
			
			// Simulate loading with timer
//			editor_timer = setInterval(function() {
//				clearInterval(editor_timer);
				
			CrayonThemeEditorSettings.curr_theme = jQuery('#crayon-theme').val();
			CrayonThemeEditorSettings.editing = editing;
			
			// Load theme editor
			jQuery.get(editor_url + '?curr_theme=' + CrayonThemeEditorSettings.curr_theme + '&editing=' + editing, function(data) {
				theme_editor_wrap.html(data);
//					CrayonSyntax.init();
				
				// Load url from preview into theme editor
//				jQuery('#crayon-editor-preview').attr('url', preview_url);
				
				// Load preview into editor
				CrayonSyntaxThemeEditor.init(function () {
						CrayonSyntaxAdmin.show_theme_editor_now(button);
					}, preview.clone()
				);
				
//					show_theme_editor_now();
			});
				
//			}, 2000);
			
//			theme_editor_loaded = true;
//		} else {
//			this.show_theme_editor_now();
//		}
		return false;
	};
	
};
