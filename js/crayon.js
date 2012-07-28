// Crayon Syntax Highlighter JavaScript

(function($) {

	// BEGIN AUXILIARY FUNCTIONS
	
	$.fn.exists = function () {
	    return this.length !== 0;
	};
	
	// This makes IE < 9 doesn't support CSSStyleDeclaration, can't use this
	CrayonSyntaxUnused = function () {
		// For those who need them (< IE 9), add support for CSS functions
		var isStyleFuncSupported = null;
		if (typeof(CSSStyleDeclaration) != 'undefined') {
			isStyleFuncSupported = CSSStyleDeclaration.prototype.getPropertyValue != null;
			if (!isStyleFuncSupported) {
				CSSStyleDeclaration.prototype.getPropertyValue = function(a) {
			        return this.getAttribute(a);
			    };
			    CSSStyleDeclaration.prototype.setProperty = function(styleName, value, priority) {
			        this.setAttribute(styleName,value);
			        var priority = typeof priority != 'undefined' ? priority : '';
			        if (priority != '') {
				        // Add priority manually
						var rule = new RegExp(RegExp.escape(styleName) + '\\s*:\\s*' + RegExp.escape(value) + '(\\s*;)?', 'gmi');
						this.cssText = this.cssText.replace(rule, styleName + ': ' + value + ' !' + priority + ';');
			        } 
			    };
			    CSSStyleDeclaration.prototype.removeProperty = function(a) {
			        return this.removeAttribute(a);
			    };
			    CSSStyleDeclaration.prototype.getPropertyPriority = function(styleName) {
			    	var rule = new RegExp(RegExp.escape(styleName) + '\\s*:\\s*[^\\s]*\\s*!important(\\s*;)?', 'gmi');
			        return rule.test(this.cssText) ? 'important' : '';
			    };
			}
		}
	};
	
	// Escape regex chars with \
	RegExp.escape = function(text) {
	    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
	};
	
	
	var hasCSSStyleDeclaration = typeof(CSSStyleDeclaration) != 'undefined';
	$.fn.style = function(styleName, value, priority) {
		// DOM node
		var node = this.get(0);
		// Ensure we have a DOM node 
		if (typeof node == 'undefined') {
			return;
		}
		// CSSStyleDeclaration
		var style = node.style;
		// Getter/Setter
		if (typeof styleName != 'undefined') {
			if (typeof value != 'undefined') {
				// Set style property
				var priority = typeof priority != 'undefined' ? priority : '';
				if (typeof style.setProperty != 'undefined') {
					style.setProperty(styleName, value, priority);
				} else {
					style.styleName = value + ' ' + priority;
				}
			} else {
				// Get style property
				if (hasCSSStyleDeclaration) {
					return style.getPropertyValue(styleName);
				} else {
					return style.styleName;
				}
			}
		} else {
			// Get CSSStyleDeclaration
			return style;
		}
	};
	
	// END AUXILIARY FUNCTIONS
	
	var PRESSED = 'crayon-pressed';
	var UNPRESSED = '';
	
	var CRAYON_SYNTAX = 'div.crayon-syntax';
	var CRAYON_TOOLBAR = '.crayon-toolbar';
	var CRAYON_INFO = '.crayon-info';
	var CRAYON_PLAIN = '.crayon-plain';
	var CRAYON_MAIN = '.crayon-main';
	var CRAYON_TABLE = '.crayon-table';
	var CRAYON_CODE = '.crayon-code';
	var CRAYON_NUMS = '.crayon-nums';
	var CRAYON_NUMS_CONTENT = '.crayon-nums-content';
	var CRAYON_NUMS_BUTTON = '.crayon-nums-button';
	var CRAYON_POPUP_BUTTON = '.crayon-popup-button';
	var CRAYON_COPY_BUTTON = '.crayon-copy-button';
	var CRAYON_PLAIN_BUTTON = '.crayon-plain-button';
	
	$(document).ready(function() {
	    CrayonSyntax.init();
	});
	
	CrayonSyntax = new function() {
		var crayon = new Object();
		var currUID = 0;
		
		this.init = function() {
			if (typeof crayon == 'undefined') {
			    crayon = new Object();
			}
			
		    $(CRAYON_SYNTAX).each(function() {
		    	CrayonSyntax.process(this);
		    });
		};
		
		this.process = function(c, replace) {
	        c = $(c);
			var uid = c.attr('id');
	        if (uid == 'crayon-') {
	        	// No ID, generate one
	        	uid += getUID();
	        }
	        c.attr('id', uid);
	        console_log(uid);
	        
	        if (typeof replace == 'undefined') {
	        	replace = false;
	        }
	        
	        if (!replace && !make_uid(uid)) {
	        	// Already a Crayon
	        	return;
	        }
	        
	        var toolbar = c.find(CRAYON_TOOLBAR);
	        var info = c.find(CRAYON_INFO);
	        var plain = c.find(CRAYON_PLAIN);
	        var main = c.find(CRAYON_MAIN);
	        var table = c.find(CRAYON_TABLE);
	        var code = c.find(CRAYON_CODE);
	        var nums = c.find(CRAYON_NUMS);
	        var nums_content = c.find(CRAYON_NUMS_CONTENT);
	        var nums_button = c.find(CRAYON_NUMS_BUTTON);
	        var popup_button = c.find(CRAYON_POPUP_BUTTON);
	        var copy_button = c.find(CRAYON_COPY_BUTTON);
	        var plain_button = c.find(CRAYON_PLAIN_BUTTON);
	        
	        crayon[uid] = c;
	        crayon[uid].toolbar = toolbar;
	        crayon[uid].plain = plain;
	        crayon[uid].info = info;
	        crayon[uid].main = main;
	        crayon[uid].table = table;
	        crayon[uid].code = code;
	        crayon[uid].nums = nums;
	        crayon[uid].nums_content = nums_content;
	        crayon[uid].nums_button = nums_button;
	        crayon[uid].popup_button = popup_button;
	        crayon[uid].copy_button = copy_button;
	        crayon[uid].plain_button = plain_button;
	        crayon[uid].nums_visible = true;
	        crayon[uid].plain_visible = false;
	        
	        crayon[uid].toolbar_delay = 0;
	        crayon[uid].time = 1;
	        
	        // Set plain
	        $(CRAYON_PLAIN).css('z-index', 0);
	        
	        // XXX Remember CSS dimensions
	        var main_style = main.style();
	        crayon[uid].main_style = {
	        	height: main_style && main_style.height || '',
	            max_height: main_style && main_style.maxHeight || '',
	            min_height: main_style && main_style.minHeight || '',
	            width: main_style && main_style.width || ''
	        };
	        
	        var load_timer;
	        var i = 0;
	        crayon[uid].loading = true;
	        crayon[uid].scroll_block_fix = false;
	        
	        // Register click events
	        nums_button.click(function() { CrayonSyntax.toggle_nums(uid); });
	        plain_button.click(function() { CrayonSyntax.toggle_plain(uid); });
	        copy_button.click(function() { CrayonSyntax.copy_plain(uid); });
	        
	        var load_func = function() {
	        	if (main.height() < 30) {
	        		crayon[uid].scroll_block_fix = true;
	        	}
	        	
	//        	reconsile_dimensions(uid);
	    	    
	            // If nums hidden by default
	            if (nums.filter('[data-settings~="hide"]').length != 0) {
	            	nums_content.ready(function() {
	            		console_log('function' + uid);
	            		CrayonSyntax.toggle_nums(uid, true, true);
	            	});
	            } else {
	            	update_nums_button(uid);
	            }
	            
	            // TODO If width has changed or timeout, stop timer
	            if (/*last_num_width != nums.width() ||*/ i == 5) {
	            	clearInterval(load_timer);
	            	crayon[uid].loading = false;
	            }
	            i++;
	        };
	//        main.ready(function() {
	//        	alert();
	        	load_timer = setInterval(load_func, 300);
	        	fix_scroll_blank(uid);
	//        });
	        
	        // Used for toggling
	        main.css('position', 'relative');
	        main.css('z-index', 1);
	        
	        // Update clickable buttons
	        update_nums_button(uid);
	        update_plain_button(uid);
	        
	        // Disable certain features for touchscreen devices
	        touchscreen = (c.filter('[data-settings~="touchscreen"]').length != 0);
	        
	        // Used to hide info
	        if (!touchscreen) {
		        main.click(function() { crayon_info(uid, '', false); });
	        	plain.click(function() { crayon_info(uid, '', false); });
	        	info.click(function() { crayon_info(uid, '', false); });
	        }
	        
	        // Used for code popup
	        crayon[uid].popup_settings = popupWindow(popup_button, { 
	    		height:screen.height - 200, 
	    		width:screen.width - 100,
	    		top:75,
	    		left:50,
	    		scrollbars:1,
	    		windowURL:'',
	    		data:'' // Data overrides URL
	    	}, function() {
	    		code_popup(uid);
	    	}, function() {
	    		//console_log('after');
	    	});
	
	        plain.css('opacity', 0);
	        // If a toolbar with mouseover was found
	        if (toolbar.filter('[data-settings~="mouseover"]').length != 0 && !touchscreen) {
	        	crayon[uid].toolbar_mouseover = true;
	            
	            toolbar.css('margin-top', '-' + toolbar.height() + 'px');
	            toolbar.hide();
	            // Overlay the toolbar if needed, only if doing so will not hide the
				// whole code!
	            if (toolbar.filter('[data-settings~="overlay"]').length != 0
	                && main.height() > toolbar.height() * 2) {
	                toolbar.css('position', 'absolute');
	                toolbar.css('z-index', 2);
	                // Hide on single click when overlayed
	                if (toolbar.filter('[data-settings~="hide"]').length != 0) {
	                    main.click(function() { toolbar_toggle(uid, undefined, undefined, 0); });
	                    plain.click(function() { toolbar_toggle(uid, false, undefined, 0); });
	                }
	            } else {
	            	toolbar.css('z-index', 4);
	            }
	            // Enable delay on mouseout
	            if (toolbar.filter('[data-settings~="delay"]').length != 0) {
	                crayon[uid].toolbar_delay = 500;
	            }
	            // Use .hover() for chrome, but in firefox mouseover/mouseout worked best
	            c.mouseenter(function() { toolbar_toggle(uid, true); })
	            			.mouseleave(function() { toolbar_toggle(uid, false); });
	            
	        } else if (touchscreen) {
	            toolbar.show();
	        }
	        // Plain show events
	        if (plain.length != 0 && !touchscreen) {
	            if (plain.filter('[data-settings~="dblclick"]').length != 0) {
	                main.dblclick(function() { CrayonSyntax.toggle_plain(uid); });
	            } else if (plain.filter('[data-settings~="click"]').length != 0) {
	                main.click(function() { CrayonSyntax.toggle_plain(uid); });
	            } else if (plain.filter('[data-settings~="mouseover"]').length != 0) {
	                c.mouseenter(function() { CrayonSyntax.toggle_plain(uid, true); })
	                            .mouseleave(function() { CrayonSyntax.toggle_plain(uid, false); });
	                nums_button.hide();
	            }
	            if (plain.filter('[data-settings~="show-plain-default"]').length != 0) {
	            	// XXX
	            	CrayonSyntax.toggle_plain(uid, true);
	            }
	        }
	        // Scrollbar show events
	        if (!touchscreen && c.filter('[data-settings~="scroll-mouseover"]').length != 0) {
	            // Disable on touchscreen devices and when set to mouseover
	            main.css('overflow', 'hidden');
	            plain.css('overflow', 'hidden');
	            
	            console_log(plain.css('overflow'));
	            
				c.mouseenter(function() { toggle_scroll(uid, true); })
	                        .mouseleave(function() { toggle_scroll(uid, false); });
	        }
	        // Disable animations
	        if ( c.filter('[data-settings~="disable-anim"]').length != 0 ) {
	            crayon[uid].time = 0;
	        }
	        
	        // Determine if Mac
	        crayon[uid].mac = c.hasClass('crayon-os-mac');
		};
		
		var make_uid = function(uid) {
			console_log(crayon);
		    if (typeof crayon[uid] == 'undefined') {
		        crayon[uid] = $('#'+uid);
		        console_log('make ' + uid);
		        return true;
		    }
		    
		    console_log('no make ' + uid);
		    return false;
		};
		
		var getUID = function() {
			return currUID++;
		};
		
		var code_popup = function(uid) {
			if (typeof crayon[uid] == 'undefined') {
			    return make_uid(uid);
			}
			var code = crayon[uid].plain_visible ? crayon[uid].plain : crayon[uid].main;
			var settings = crayon[uid].popup_settings;
			settings.data = get_all_css() + '<body style="padding:0; margin:0;"><div class="' + crayon[uid].attr('class') + 
				' crayon-popup">' + remove_css_inline(get_jquery_str(code)) + '</div></body>';
			if (typeof settings == 'undefined') {
				return;
			}
		};
		
		var get_jquery_str = function(object) {
			return $('<div>').append(object.clone()).remove().html();
		};
		
		var remove_css_inline = function(string) {
			return string.replace(/style\s*=\s*["'][^"]+["']/gmi, '');
		};
		
		// Get all CSS on the page as a string
		var get_all_css = function() {
			var css_str = '';
			css = $('link[rel="stylesheet"]').each(function() {
				var string = get_jquery_str($(this));
				css_str += string;
			});
			return css_str;
		};
		
		this.copy_plain = function(uid, hover) {
			if (typeof crayon[uid] == 'undefined') {
			    return make_uid(uid);
			}
			
			var plain = crayon[uid].plain;
			
			this.toggle_plain(uid, true, true);
			toolbar_toggle(uid, true);
			
			key = crayon[uid].mac ? '\u2318' : 'CTRL';
			var text = crayon[uid].copy_button.attr('data-text');
			text = text.replace(/%s/, key + '+C');
			text = text.replace(/%s/, key + '+V');
			crayon_info(uid, text);
			return false;
		};
		
		var crayon_info = function(uid, text, show) {
			if (typeof crayon[uid] == 'undefined') {
			    return make_uid(uid);
			}
			
			var info = crayon[uid].info;
			
			if (typeof text == 'undefined') {
				text = '';
			}
			if (typeof show == 'undefined') {
				show = true;
			}
			
			if (crayon_is_slide_hidden(info) && show) {
				info.html('<div>' + text + '</div>');
				info.css('margin-top', -info.height());
				info.show();
				crayon_slide(uid, info, true);
				setTimeout(function() {
					crayon_slide(uid, info, false);
				}, 5000);
			}
			
			if (!show) {
				crayon_slide(uid, info, false);
			}
		
		};
		
		var crayon_is_slide_hidden = function(object) {
			var object_neg_height = '-' + object.height() + 'px';	
			if (object.css('margin-top') == object_neg_height || object.css('display') == 'none') {
		        return true;
		    } else {
		        return false;            
		    }
		};
		
		var crayon_slide = function(uid, object, show, anim_time, hide_delay) {
			var object_neg_height = '-' + object.height() + 'px';
			
			if (typeof show == 'undefined') {
		        if (crayon_is_slide_hidden(object)) {
		            show = true;
		        } else {
		            show = false;            
		        }
		    }
		    // Instant means no time delay for showing/hiding
		    if (typeof anim_time == 'undefined') {
		    	anim_time = 100;
		    }
		    if (anim_time == false) {
		    	anim_time = false;
		    }
		    if (typeof hide_delay== 'undefined') {
		    	hide_delay = 0;
		    }
		    object.stop(true);
		    if (show == true) {
		        object.show();
		        object.animate({
		            marginTop: 0
		        }, animt(anim_time, uid));
		    } else if (show == false) {
		        // Delay if fully visible
		        if (/*instant == false && */object.css('margin-top') == '0px' && hide_delay) {
		             object.delay(hide_delay);
		        }
		        object.animate({
		            marginTop: object_neg_height
		        }, animt(anim_time, uid), function() {
		            object.hide();
		        });
		    }
		};
		
		this.toggle_plain = function(uid, hover, select) {
			if (typeof crayon[uid] == 'undefined') {
			    return make_uid(uid);
			}
		    
		    var main = crayon[uid].main;
		    var plain = crayon[uid].plain;
		    
		    if ( (main.is(':animated') || plain.is(':animated')) && typeof hover == 'undefined' ) {
		        return;
		    }
		    
		    reconsile_dimensions(uid);
		    
		    var visible, hidden;
		    if (typeof hover != 'undefined') {
		        if (hover) {
		            visible = main;
		            hidden = plain;
		        } else {
		            visible = plain;
		            hidden = main;
		        }
		    } else {
		    	if (main.css('z-index') == 1) {
		    		visible = main;
		    		hidden = plain;
		    	} else {
		    		visible = plain;
		    		hidden = main;
		    	}
		    }
		    	    
		    crayon[uid].plain_visible = (hidden == plain);
		    
		    // Remember scroll positions of visible
		    crayon[uid].top = visible.scrollTop();
		    crayon[uid].left = visible.scrollLeft();
			
			/* Used to detect a change in overflow when the mouse moves out
			 * of the Crayon. If it does, then overflow has already been changed,
			 * no need to revert it after toggling plain. */
			crayon[uid].scroll_changed = false;
			
			// Hide scrollbars during toggle to avoid Chrome weird draw error
	//		visible.css('overflow', 'hidden');
	//		hidden.css('overflow', 'hidden');
			
			fix_scroll_blank(uid);
			
			// Show hidden, hide visible
		    visible.stop(true);
		    visible.fadeTo(animt(500, uid), 0,
				function() {
					visible.css('z-index', 0);
	//				if (!crayon[uid].scroll_changed) {
	//					visible.css('overflow', vis_over);
	//				}
				});
		    hidden.stop(true);
		    hidden.fadeTo(animt(500, uid), 1,
				function() {
					hidden.css('z-index', 1);
	//				if (!crayon[uid].scroll_changed) {
	//					hidden.css('overflow', hid_over);
	//				}
					
					// Give focus to plain code
					if (hidden == plain) {
						if (select) {
							plain.select();
						} else {
							// XXX not needed
							// plain.focus();
						}
					}
					
					// Refresh scrollbar draw
					hidden.scrollTop(crayon[uid].top + 1);
					hidden.scrollTop(crayon[uid].top);
					hidden.scrollLeft(crayon[uid].left + 1);
					hidden.scrollLeft(crayon[uid].left);
				});
		    
			// Restore scroll positions to hidden
		    hidden.scrollTop(crayon[uid].top);
		    hidden.scrollLeft(crayon[uid].left);
		    
		    update_plain_button(uid);
		    
		    // Hide toolbar if possible
		    toolbar_toggle(uid, false);
		    return false;
		};
		
		this.toggle_nums = function(uid, hide, instant) {
			if (typeof crayon[uid] == 'undefined') {
				make_uid(uid);
			    return false;
			}
			
			if (crayon[uid].table.is(':animated')) {
		        return false;
		    }
			var nums_width = Math.round(crayon[uid].nums_content.width() + 1);
			var neg_width = '-' + nums_width + 'px';
			
			// Force hiding
			var num_hidden;
			if (typeof hide != 'undefined') {
				num_hidden = false; 
			} else {
				// Check hiding
				num_hidden = (crayon[uid].table.css('margin-left') == neg_width);
			}
				
		    var num_margin;
		    if (num_hidden) {
		    	// Show
		        num_margin = '0px';
		        crayon[uid].nums_visible = true;
		    } else {
		    	// Hide
		        crayon[uid].table.css('margin-left', '0px');
		        crayon[uid].nums_visible = false;
		        num_margin = neg_width;
		    }
		    
		    if (typeof instant != 'undefined') {
		    	crayon[uid].table.css('margin-left', num_margin);
		    	update_nums_button(uid);
		    	return false;
		    }
		    
		    // Stop jerking animation from scrollbar appearing for a split second due to
		    // change in width. Prevents scrollbar disappearing if already visible.
		    h_scroll_visible = (crayon[uid].table.width() + px_to_int(crayon[uid].table.css('margin-left')) > crayon[uid].main.width());
		    v_scroll_visible = (crayon[uid].table.height() > crayon[uid].main.height());
		    if (!h_scroll_visible && !v_scroll_visible) {
		    	crayon[uid].main.css('overflow', 'hidden');
		    }
		    crayon[uid].table.animate({
		        marginLeft: num_margin
		    }, animt(200, uid), function() {        
		        if (typeof crayon[uid] != 'undefined') {
		        	update_nums_button(uid);
		        	if (!h_scroll_visible && !v_scroll_visible) {
		            	crayon[uid].main.css('overflow', 'auto');
		            }
		        }
		    });
		    return false;
		};
		
		var fix_table_width = function(uid) {
			if (typeof crayon[uid] == 'undefined') {
				make_uid(uid);
			    return false;
			}
		};
		
		// Convert '-10px' to -10
		var px_to_int = function(pixels) {
			if (typeof pixels != 'string') {
				return 0;
			}
			var result = pixels.replace(/[^-0-9]/g, '');
			if (result.length == 0) {
				return 0;
			} else {
				return parseInt(result);
			}
		};
		
		var update_nums_button = function(uid) {
			if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].nums_visible == 'undefined') {
				return;
			}
			if (crayon[uid].nums_visible) {
				crayon[uid].nums_button.removeClass(UNPRESSED);
				crayon[uid].nums_button.addClass(PRESSED);
			} else {
				// TODO doesn't work on iPhone
				crayon[uid].nums_button.removeClass(PRESSED);
				crayon[uid].nums_button.addClass(UNPRESSED);
			}
		};
		
		var update_plain_button = function(uid) {
			if (typeof crayon[uid] == 'undefined' || typeof crayon[uid].plain_visible == 'undefined') {
				return;
			}
			
			if (crayon[uid].plain_visible) {
				crayon[uid].plain_button.removeClass(UNPRESSED);
				crayon[uid].plain_button.addClass(PRESSED);
			} else {
				// TODO doesn't work on iPhone
				crayon[uid].plain_button.removeClass(PRESSED);
				crayon[uid].plain_button.addClass(UNPRESSED);
			}
		};
		
		var toolbar_toggle = function(uid, show, anim_time, hide_delay) {
		    if (typeof crayon[uid] == 'undefined') {
			    return make_uid(uid);
			} else if (!crayon[uid].toolbar_mouseover) {
		    	return;
		    }
		    var toolbar = crayon[uid].toolbar;
		    
		    if (typeof hide_delay == 'undefined') {
		    	hide_delay = crayon[uid].toolbar_delay;
		    }
		    
		    crayon_slide(uid, toolbar, show, anim_time, hide_delay);
	//	    reconsile_dimensions(uid);
		};
		
		var toggle_scroll = function(uid, show) {
		    if (typeof crayon[uid] == 'undefined') {
			    return make_uid(uid);
			}
		    if (typeof show == 'undefined') {
		        return;
		    }
		    
		    var main = crayon[uid].main;
		    var plain = crayon[uid].plain;
		    
		    var main_size = {width:main.width(), height:main.height()};
		    
		    if (show) {
		        main.css('overflow', 'auto');
		        plain.css('overflow', 'auto');
		        if (typeof crayon[uid].top != 'undefined') {
		            visible = (main.css('z-index') == 1 ? main : plain);
		            // Browser will not render until scrollbar moves, move it manually
		            visible.scrollTop(crayon[uid].top-1);
		            visible.scrollTop(crayon[uid].top);
		            visible.scrollLeft(crayon[uid].left-1);
		            visible.scrollLeft(crayon[uid].left);
		        }
		        if (!crayon[uid].scroll_block_fix) {
		        	// Fix dimensions so scrollbars stay inside
		        	main.css('height', main_size.height);
		        	main.css('width', main_size.width);
		        } else {
		        	// Relax dimensions so scrollbars are visible
		        	main.css('height', '');
		        	main.css('max-height', '');
		        	main.css('min-height', '');
		        	main.css('width', '');
		        }
		    } else {
		        visible = (main.css('z-index') == 1 ? main : plain);
		        crayon[uid].top = visible.scrollTop();
		        crayon[uid].left = visible.scrollLeft();
		        main.css('overflow', 'hidden');
		        plain.css('overflow', 'hidden');
		        if (!crayon[uid].scroll_block_fix) {
		        	// Restore dimensions
		        	main.css('height', crayon[uid].main_style['height']);
		        	main.css('max-height', crayon[uid].main_style['max-height']);
		        	main.css('min-height', crayon[uid].main_style['min-height']);
		        	main.css('width', crayon[uid].main_style['width']);
		        }
		    }
			// Register that overflow has changed
			crayon[uid].scroll_changed = true;
			fix_scroll_blank(uid);
			reconsile_dimensions(uid);
		};
		
		/* Fix weird draw error, causes blank area to appear where scrollbar once was. */
		var fix_scroll_blank = function(uid) {
			// Scrollbar draw error in Chrome
			crayon[uid].table.style('width', '100%', 'important');
			var redraw = setTimeout(function() {
				crayon[uid].table.style('width', '');
				clearInterval(redraw);
			}, 10);
		};
		
		var reconsile_dimensions = function(uid) {
			// Reconsile dimensions
			crayon[uid].plain.height(crayon[uid].main.height());
			//crayon[uid].plain.width(crayon[uid].main.width());
			
	//		console_log('main: ' + crayon[uid].main.height() + ' plain: ' + crayon[uid].plain.height());
		};
		
		var animt = function(x, uid) {
		    if (x == 'fast') {
		        x = 200;
		    } else if (x == 'slow') {
		        x = 600;
		    } else if (!isNumber(x)) {
		        x = parseInt(x);
		        if (isNaN(x)) {
		            return 0;
		        }
		    }
		    return x * crayon[uid].time;
		};
		
		var isNumber = function(x) {
		    return typeof x == 'number';
		};
		
	};

})(jQueryCrayon);
