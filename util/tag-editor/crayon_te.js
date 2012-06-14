// Sets the TINYMCE_USED setting
CrayonTagEditorSettings.setUsed = function(is_used) {
	if (typeof this.ajax_url != 'undefined') {
		if (this.ajax_url && !this.used) {
			is_used = is_used ? '1' : '0';
			this.used = is_used; // Save the setting
			var used_url = this.ajax_url + '?' + this.used_setting + '=' + is_used;
			jQuery.get(used_url);
		}
	}
};

var CrayonTagEditor = new function() {
	
	var loaded = false;
	var editing = false;
	var insertCallback = null;
	var editCallback = null;
	// Used for encoding, decoding
	var inputHTML = null;
	var outputHTML = null;
	var editor_name = null;
	var ajax_class_timer = null;
	var ajax_class_timer_count = 0;
	
	var code_refresh = url_refresh = null;
	
	// Current jQuery obj of pre node
	var currCrayon = null;
	// Classes from pre node, excl. settings
	var currClasses = '';
	// Whether to make span or pre
	var is_inline = false;
	
	// Generated in WP and contains the settings
	var s = CrayonTagEditorSettings;
	var gs = CrayonSyntaxSettings;
	var admin = CrayonSyntaxAdmin;
	// For use in async functions
	var me = this;
	
	// CSS
	var dialog = code = clear = submit = null;
	
	// XXX Loads dialog contents
    this.loadDialog = function() {
    	// Loaded once url is given
    	if (!loaded) {
    		loaded = true;
    	} else {
    		return;
    	}
    	
        // Load the editor content 
        jQuery.get(s.url, function(data) {
        	dialog = jQuery('<div id="'+s.css+'"></div>');
            dialog.appendTo('body').hide();
        	dialog.html(data);
        	
        	dialog.ready(function() {
        		// Some settings have dependencies, need to load js for that
        		admin.init();
        	});
        	
        	me.setOrigValues();
        	
        	submit = dialog.find('.'+s.submit_css);
        	
        	// Save default global settings
//        	defaults = [];
//    		jQuery('.'+gs.setting+'[id]').each(function() {
//        		var id = jQuery(this).attr('id');
//        		var value = jQuery(this).attr(s.data_value);
//        		// Remove prefix
////        		id = admin.removePrefixFromID(id);
//        		atts[id] = value;
////        		console_log(id + ' ' + value);
//        	});
        	
        	code = jQuery(s.code_css);
        	clear = jQuery('#crayon-te-clear');
        	code_refresh = function () {
        		var clear_visible = clear.is(":visible");
        		if (code.val().length > 0 && !clear_visible) {
        			clear.show();
        			code.removeClass(gs.selected);
        		} else if (code.val().length <= 0) {
        			clear.hide();
        		}
        	};

        	code.keyup(code_refresh);
        	code.change(code_refresh);
        	clear.click(function() {
        		code.val('');
        		code.removeClass(gs.selected);
        		code.focus();
        	});
        	
        	var url = jQuery(s.url_css);
        	var url_info = jQuery(s.url_info_css);
        	url_refresh = function () {
        		if (url.val().length > 0 && !url_info.is(":visible")) {
        			url_info.show();
        			url.removeClass(gs.selected);
        		} else if (url.val().length <= 0) {
        			url_info.hide();
        		}
        	};
        	url.keyup(url_refresh);
        	url.change(url_refresh);
        	
        	var setting_change = function() {
    			var setting = jQuery(this);
        		var orig_value = jQuery(this).attr(gs.orig_value);
        		if (typeof orig_value == 'undefined') {
        			orig_value = '';
        		}
        		// Depends on type
        		var value = me.settingValue(setting);
        		console_log(setting.attr('id') + ' value: ' + value);
        		var highlight = null;
        		if (setting.is('input[type=checkbox]')) {
    				highlight = setting.next('span');
    			}
    			
        		console_log('   >>> ' + setting.attr('id') + ' is ' + orig_value + ' = ' + value);
        		if (orig_value == value) {
        			// No change
    				setting.removeClass(gs.changed);
    				if (highlight) {
    					highlight.removeClass(gs.changed);
    				}
     			} else {
    				// Changed
     				setting.addClass(gs.changed);
     				if (highlight) {
     					highlight.addClass(gs.changed);
     				}
    			}
    			// Save standardized value for later
    			me.settingValue(setting, value);
    		};
        	jQuery('.'+gs.setting+'[id]:not(.'+gs.special+')').each(function() {
        		jQuery(this).change(setting_change);
        		jQuery(this).keyup(setting_change);
        	});
        });
    };
    
    // XXX Displays the dialog.
	this.showDialog = function(insert, edit, editor_str, ed, node, input, output) {
		// Need to reset all settings back to original, clear yellow highlighting
		me.resetSettings();
		// Save these for when we add a Crayon
		insertCallback = insert;
    	editCallback = edit;
    	inputHTML = input;
    	outputHTML = output;
    	editor_name = editor_str;
		// If we have selected a Crayon, load in the contents
		// TODO put this in a separate function
		var currNode = null;
		is_inline = false;
		if (typeof node != 'undefined' && node != null) {
			currNode = node;
		} else {
			// Get it from editor selection, not as precise
			currNode = ed != null ? ed.selection.getNode() : null;
		}
		
    	// Unbind submit
    	submit.unbind();
    	submit.click(function() {
    		me.submitButton();
    	});
    	me.setSubmitText(s.submit_add);
		
		if (me.isCrayon(currNode)) {
			currCrayon = jQuery(currNode); 
			if (currCrayon.length != 0) {
				// Read back settings for editing
				currClasses = currCrayon.attr('class');
				var re = new RegExp('\\b([A-Za-z-]+)'+s.attr_sep+'(\\S+)', 'gim');
				var matches = re.execAll(currClasses);
				// Retain all other classes, remove settings
				currClasses = jQuery.trim(currClasses.replace(re, ''));
//				console_log('classes:');
//				console_log(currClasses);
//				console_log('load match:');
//				console_log(matches);
				var atts = {};
				for (var i in matches) {
					var id = matches[i][1];
					var value = matches[i][2];
					atts[id] = value;
				}
				
				// Title
				var title = currCrayon.attr('title');
				if (title) {
					atts['title'] = title;
				}
				
				// URL
				var url = currCrayon.attr('data-url');
				if (url) {
					atts['url'] = url;
				}
				
				// Inverted settings
				if (typeof atts['highlight'] != 'undefined') {
					atts['highlight'] = '0' ? '1' : '0';
				}

				// Inline
				is_inline = currCrayon.hasClass(s.inline_css);
				atts['inline'] = is_inline ? '1' : '0';
				
				// Ensure language goes to fallback if invalid
				var avail_langs = [];
				jQuery(s.lang_css + ' option').each(function(){
					var value = jQuery(this).val();
					if (value) {
						avail_langs.push(value);
					}
				});
				if (jQuery.inArray(atts['lang'], avail_langs) == -1) {
					atts['lang'] = s.fallback_lang;
				}
				
				// Validate the attributes
				atts = me.validate(atts);
				
				// Load in attributes, add prefix
				for (var att in atts) {
					var setting = jQuery('#' + gs.prefix + att + '.' + gs.setting);
					var value = atts[att];
					me.settingValue(setting, value);
					// Update highlights 
					setting.change();
					// If global setting changes and we access settings, it should declare loaded settings as changed even if they equal the global value, just so they aren't lost on save
					if (!setting.hasClass(gs.special)) {
						setting.addClass(gs.changed);
						if (setting.is('input[type=checkbox]')) {
		    				highlight = setting.next('span');
		    				highlight.addClass(gs.changed);
		    			}
					}
					console_log('loaded: ' + att + ':' + atts[att]);
				}
				
				editing = true;
				me.setSubmitText(s.submit_edit);
				
				// Code
				var content = currCrayon.html();
				if (inputHTML == 'encode') {
					content = crayon_encode_html(content); 
				} else if (inputHTML == 'decode') {
					content = crayon_decode_html(content);
				}
				code.val(content);
				
			} else {
				console_log('cannot load currNode of type pre');
			}
		} else {
			// We are creating a new Crayon, not editing
			editing = false;
			me.setSubmitText(s.submit_add);
			currCrayon = null;
			currClasses = '';
		}
		
		// Inline
		var inline = jQuery('#' + s.inline_css);
		inline.change(function() {
			is_inline = jQuery(this).is(':checked');
			var inline_hide = jQuery('.' + s.inline_hide_css);
			var inline_single = jQuery('.' + s.inline_hide_only_css);
			var disabled = [s.mark_css, s.title_css, s.url_css];
//			var mark = jQuery(s.mark_css);
//			var title = jQuery(s.title_css);
//			var url = jQuery(s.url_css);
			
			for (var i in disabled) {
				var obj = jQuery(disabled[i]);
				obj.attr('disabled', is_inline);
			}
			
//			mark.attr('disabled', is_inline);
//			title.attr('disabled', is_inline);
//			url.attr('disabled', is_inline);
			if (is_inline) {
				inline_hide.hide();
				inline_single.hide();
				inline_hide.closest('tr').hide();
				for (var i in disabled) {
					var obj = jQuery(disabled[i]);
					obj.addClass('crayon-disabled');
				}
//				mark.addClass('crayon-disabled');
//				title.addClass('crayon-disabled');
//				url.addClass('crayon-disabled');
			} else {
				inline_hide.show();
				inline_single.show();
				inline_hide.closest('tr').show();
				for (var i in disabled) {
					var obj = jQuery(disabled[i]);
					obj.removeClass('crayon-disabled');
				}
//				mark.removeClass('crayon-disabled');
//				title.removeClass('crayon-disabled');
//				title.removeClass('crayon-disabled');
			}
		});
		inline.change();
		
		// Show the dialog
		var dialog_title = editing ? s.dialog_title_edit : s.dialog_title_add;
    	tb_show(dialog_title, '#TB_inline?inlineId=' + s.css);
    	code.focus();
    	code_refresh();
    	url_refresh();
    	if (ajax_class_timer) {
    		clearInterval(ajax_class_timer);
    		ajax_class_timer_count = 0;
    	}
    	
    	// Position submit button
		jQuery('#TB_title').append(submit);
    	
    	var ajax_window = jQuery('#TB_window');
    	ajax_window.hide();
    	var fallback = function () {
    		ajax_window.show();
    		// Prevent draw artifacts
    		var oldScroll = jQuery(window).scrollTop();
    		jQuery(window).scrollTop(oldScroll+10);
    		jQuery(window).scrollTop(oldScroll-10);
    	};
    	
    	ajax_class_timer = setInterval(function () {
        	if ( typeof ajax_window != 'undefined' && !ajax_window.hasClass('crayon-te-ajax') ) {
        		ajax_window.addClass('crayon-te-ajax');
        		clearInterval(ajax_class_timer);
        		fallback();
        	}
        	if (ajax_class_timer_count >= 100) {
        		// In case it never loads, terminate
        		clearInterval(ajax_class_timer);
        		fallback();
        	}
        	ajax_class_timer_count++;
    	}, 40);
    	
    	s.setUsed(true);
    };
    
    // XXX Add Crayon to editor
    this.addCrayon = function() {
    	var url = jQuery(s.url_css);
    	if (url.val().length == 0 && code.val().length == 0) {
			code.addClass(gs.selected);
			code.focus();
			return false;
    	}
    	code.removeClass(gs.selected);
		
		// Add inline for matching with CSS
		var inline = jQuery('#' + s.inline_css);
		is_inline = inline.length != 0 && inline.is(':checked');
		
		// Spacing only for <pre>
		var br_before = br_after = '';
		if (!editing) {
			// Don't add spaces if editting
			if (!is_inline) {
				if (editor_name == 'html') {
					br_after = br_before = ' \n'; 
				} else {
					br_after = '<p>&nbsp;</p>';
				}
			} else {
				// Add a space after
				if (editor_name == 'html') {
					br_after = br_before = ' '; 
				} else {
					br_after = '&nbsp;';
				}
			}
		}
		
		var tag = (is_inline ? 'span' : 'pre');
		var shortcode = br_before + '<' + tag + ' ';
		
		var atts = {};
		shortcode += 'class="';
		
		var inline_re = new RegExp('\\b' + s.inline_css + '\\b', 'gim');
		if (is_inline) {
			// If don't have inline class, add it
			if (inline_re.exec(currClasses) == null) {
				currClasses += ' ' + s.inline_css + ' ';
			}
		} else {
			// Remove inline css if it exists
			currClasses = currClasses.replace(inline_re,'');
		}
		
		// Grab settings as attributes
		jQuery('.'+gs.changed+'[id],.'+gs.changed+'['+s.data_value+']').each(function() {
    		var id = jQuery(this).attr('id');
    		var value = jQuery(this).attr(s.data_value);
    		// Remove prefix
    		id = admin.removePrefixFromID(id);
    		atts[id] = value;
//    		console_log(id + ' ' + value);
    	});
		
		// Settings
		atts['lang'] = jQuery(s.lang_css).val();
		var mark = jQuery(s.mark_css).val();
		if (mark.length != 0 && !is_inline) {
			atts['mark'] = mark;			
		}
		
		// XXX Code highlighting, checked means 0!
		if (jQuery(s.hl_css).is(':checked')) {
			atts['highlight'] = '0';
		}
		
		// XXX Very important when working with editor
    	atts['decode'] = 'true';
    	
    	// Validate the attributes
		atts = me.validate(atts);
    	
		for (var id in atts) {
    		// Remove prefix, if exists
//    		var id = admin.removePrefixFromID(att);
    		var value = atts[id];
    		console_log('add '+id+':'+value);
			shortcode += id + s.attr_sep + value + ' ';
		}
		
		// Add classes
		shortcode += currClasses;
		// Don't forget to close quote for class
		shortcode += '" ';
		
		if (!is_inline) {
			// Title
			var title = jQuery(s.title_css).val();
			if (title.length != 0) {
				shortcode += 'title="' + title + '" ';
			}
			// URL
			var url = jQuery(s.url_css).val();
			if (url.length != 0) {
				shortcode += 'data-url="' + url + '" ';
			}
		}
		
		var content = jQuery(s.code_css).val();
		if (outputHTML == 'encode') {
			content = crayon_encode_html(content); 
		} else if (outputHTML == 'decode') {
			content = crayon_decode_html(content);
		}
		content = typeof content != 'undefined' ? content : '';
		shortcode += '>' + content + '</' + tag + '>' + br_after;
		
		if (editing) {
			// Edit the current selected node, update refere
			/*currPre =*/ editCallback(shortcode);
		} else {
			// Insert the tag and hide dialog
			insertCallback(shortcode);
		}
		
		return true;
	};
	
	this.submitButton = function() {
		console_log('submit');
		if (me.addCrayon() != false) {
			me.hideDialog();
		}
	};
	
	this.hideDialog = function() {
		console_log('hide');
		// Hide dialog
		tb_remove();
		var ajax = jQuery('#TB_ajaxContent');
    	if ( typeof ajax == 'undefined' ) {
    		ajax.removeClass('crayon-te-ajax');
    	}
    	// Title is destroyed, so move the submit out
    	jQuery(s.submit_wrapper_css).append(submit);
	};
	
	// XXX Auxiliary methods
	
	this.setOrigValues = function() {
		jQuery('.'+gs.setting+'[id]').each(function() {
			var setting = jQuery(this);
			setting.attr(gs.orig_value, me.settingValue(setting));
		});
	};
	
	this.resetSettings = function() {
		console_log('reset');
		jQuery('.'+gs.setting).each(function() {
			var setting = jQuery(this);
			me.settingValue(setting, setting.attr(gs.orig_value));
			// Update highlights
			setting.change();
		});
		code.val('');
	};
	
	this.settingValue = function(setting, value) {
		if (typeof value == 'undefined') {
			// getter
			value = '';
			if (setting.is('input[type=checkbox]')) {
				// Boolean is stored as string
				value = setting.is(':checked') ? 'true' : 'false'; 
			} else {
				value = setting.val();
			}
			return value;
		} else {
			// setter
			if (setting.is('input[type=checkbox]')) {
				if (typeof value == 'string') {
					if (value == 'true' || value == '1') {
						value = true;
					} else if (value == 'false' || value == '0') {
						value = false;
					}
				}
				setting.prop('checked', value);
			} else {
				setting.val(value);
			}
			setting.attr(s.data_value, value);
		}
	};
	
	this.validate = function(atts) {
		if (typeof atts['mark'] != 'undefined') {
			atts['mark'] = atts['mark'].replace(/\s/g, '');
		}
		return atts;
	};
	
	this.isCrayon = function(node) {
		return node != null &&
			(node.nodeName == 'PRE' || (node.nodeName == 'SPAN' && jQuery(node).hasClass(s.inline_css)));
	};
	
	this.elemValue = function(obj) {
		var value = null;
		if (obj.is('input[type=checkbox]')) {
			value = obj.is(':checked');
		} else {
			value = obj.val();
		}
		return value;
	};
	
	this.setSubmitText = function(text) {
		submit.val(text);
	}; 
	
};
