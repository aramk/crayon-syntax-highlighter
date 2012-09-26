// Crayon Syntax Highlighter Admin JavaScript

(function($) {

	window.CrayonSyntaxAdmin = new function() {
		var base = this;

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
		// var theme_editor_loaded = false;
		// var theme_editor_loading = false;

		var settings = CrayonSyntaxSettings;

		base.cssElem = function(id) {
			return $(base.addPrefixToID(id));
		};

		// Used in Tag Editor
		base.addPrefixToID = function(id) {
			return id.replace(/^([#.])?(.*)$/, '$1' + settings.prefix + '$2');
		};

		base.removePrefixFromID = function(id) {
			var re = new RegExp('^[#.]?' + settings.prefix, 'i');
			return id.replace(re, '');
		};

		base.init = function() {
			console_log('admin init');

			// Wraps
			main_wrap = $('#crayon-main-wrap');
			theme_editor_wrap = $('#crayon-theme-editor-wrap');
			editor_url = theme_editor_wrap.attr('url');
			theme_editor_edit_button = $('#crayon-theme-editor-edit-button');
			theme_editor_create_button = $('#crayon-theme-editor-create-button');
			theme_editor_edit_button.click(function() {
				CrayonSyntaxAdmin.show_theme_editor(theme_editor_edit_button,
						true);
			});
			theme_editor_create_button.click(function() {
				CrayonSyntaxAdmin.show_theme_editor(theme_editor_create_button,
						false);
			});

			// Theme editor
			var get_vars = base.get_vars();
			if (get_vars['subpage'] == 'theme_editor') {
				base.show_theme_editor();
			} else {
				base.show_main();
			}

			// Help
			help = $('.crayon-help-close');
			help.click(function() {
				$('.crayon-help').hide();
				$.get(help.attr('url'));
			});

			// Preview
			preview = $('#crayon-live-preview');
			preview_info = $('#crayon-preview-info');
			preview_url = preview.attr('url');
			preview_cbox = base.cssElem('#preview');
			if (preview.length != 0) {
				// Preview not needed in Tag Editor
				preview_register();
				preview.ready(function() {
					preview_toggle();
				});
				preview_cbox.change(function() {
					preview_toggle();
				});
			}
			
			$('#show-posts').click(function() {
				var url = settings.plugins_url + '/' + settings.crayon_dir + settings.list_posts + '?wp_load=' + settings.wp_load; 
				$.get(url, function(data) {
					$('#crayon-subsection-posts-info').html(data);
				});
			});

			// Convert
			$('#crayon-settings-form input').live('focusin focusout mouseup', function() {
				$('#crayon-settings-form').data('lastSelected', $(this));
			});
			$('#crayon-settings-form').submit(function() {
				var last = $(this).data('lastSelected').get(0);
				var target = $('#convert').get(0);
				if (last == target) {
					var r = confirm("Please BACKUP your database first! Converting will update your post content. Do you wish to continue?");
					return r;
				}
			});

			// Alignment
			align_drop = base.cssElem('#h-align');
			float = $('#crayon-subsection-float');
			align_drop.change(function() {
				float_toggle();
			});
			align_drop.ready(function() {
				float_toggle();
			});

			// Custom Error
			msg_cbox = base.cssElem('#error-msg-show');
			msg = base.cssElem('#error-msg');
			toggle_error();
			msg_cbox.change(function() {
				toggle_error();
			});

			// Toolbar
			overlay = $('#crayon-subsection-toolbar');
			toolbar = base.cssElem('#toolbar');
			toggle_toolbar();
			toolbar.change(function() {
				toggle_toolbar();
			});

			// Copy
			plain = base.cssElem('#plain');
			copy = $('#crayon-subsection-copy-check');
			plain.change(function() {
				if (plain.is(':checked')) {
					copy.show();
				} else {
					copy.hide();
				}
			});

			// Log
			log_wrapper = $('#crayon-log-wrapper');
			log_button = $('#crayon-log-toggle');
			log_text = $('#crayon-log-text');
			var show_log = log_button.attr('show_txt');
			var hide_log = log_button.attr('hide_txt');
			clog = $('#crayon-log');
			log_button.val(show_log);
			log_button
					.click(function() {
						clog.width(log_wrapper.width());
						clog.toggle();
						// Scrolls content
						clog.scrollTop(log_text.height());
						var text = (log_button.val() == show_log ? hide_log
								: show_log);
						log_button.val(text);
					});

		};

		/* Whenever a control changes preview */
		var preview_update = function() {
			// console_log('preview_update');
			preview_get = '?wp_load=' + CrayonSyntaxSettings.wp_load + '&';
			// preview_get += 'crayon_wp=' + CrayonSyntaxSettings.crayon_wp +
			// '&';
			var val = 0;
			var obj;
			for ( var i = 0; i < preview_obj_names.length; i++) {
				obj = preview_objs[i];
				if (obj.attr('type') == 'checkbox') {
					val = obj.is(':checked');
				} else {
					val = obj.val();
				}
				preview_get += preview_obj_names[i] + '=' + crayon_escape(val)
						+ "&";
			}

			// XXX Scroll to top of themes
			// Disabled for now, too annoying
			// var top = $('a[name="crayon-theme"]');
			// $(window).scrollTop(top.position().top);

			// Delay resize
			// preview.css('height', preview.height());
			// preview.css('overflow', 'hidden');
			// preview_timer = setInterval(function() {
			// preview.css('height', '');
			// preview.css('overflow', 'visible');
			// clearInterval(preview_timer);
			// }, 1000);

			// Load Preview
			$.get(preview_url + preview_get, function(data) {
				preview.html(data);
				// Important! Calls the crayon.js init
				CrayonSyntax.init();
			});
		};

		var preview_toggle = function() {
			// console_log('preview_toggle');
			if (preview_cbox.is(':checked')) {
				preview.show();
				preview_info.show();
				preview_update();
			} else {
				preview.hide();
				preview_info.hide();
			}
		};

		var float_toggle = function() {
			if (align_drop.val() != 0) {
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
		// var height_set;

		// Register all event handlers for preview objects
		var preview_register = function() {
			// Instant callback
			preview_callback = function() {
				preview_update();
			};

			// Checks if the text input is changed, if so, runs the callback
			// with given event
			preview_txt_change = function(callback, event) {
				// console_log('checking if changed');
				var obj = event.target;
				var last = preview_last_values[obj.id];
				// console_log('last' + preview_last_values[obj.id]);

				if (obj.value != last) {
					// console_log('changed');
					// Update last value to current
					preview_last_values[obj.id] = obj.value;
					// Run callback with event
					callback(event);
				}
			};

			// Only updates when text is changed
			preview_txt_callback = function(event) {
				// console_log('txt callback');
				preview_txt_change(preview_update, event);
			};

			// Only updates when text is changed, but callback
			preview_txt_callback_delayed = function(event) {
				preview_txt_change(function() {
					clearInterval(preview_delay_timer);
					preview_delay_timer = setInterval(function() {
						// console_log('delayed update');
						preview_update();
						clearInterval(preview_delay_timer);
					}, 500);
				}, event);
			};

			// Retreive preview objects
			$('[crayon-preview="1"]').each(function(i) {
				var obj = $(this);
				var id = obj.attr('id');
				// XXX Remove prefix
				id = base.removePrefixFromID(id);
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
			if (msg_cbox.is(':checked')) {
				msg.show();
			} else {
				msg.hide();
			}
		};

		var toggle_toolbar = function() {
			if (toolbar.val() == 0) {
				overlay.show();
			} else {
				overlay.hide();
			}
		};

		base.show_langs = function(url) {
			$.get(url, function(data) {
				$('#lang-info').hide();
				$('#crayon-subsection-lang-info').html(data);
			});
			return false;
		};

		base.get_vars = function() {
			var vars = {};
			window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,
					key, value) {
				vars[key] = value;
			});
			return vars;
		};

		// Changing wrap views
		base.show_main = function() {
			theme_editor_wrap.hide();
			main_wrap.show();
			// $(window).scrollTop(0);
			return false;
		};

		base.show_theme_editor_now = function(button) {
			main_wrap.hide();
			theme_editor_wrap.show();
			// $(window).scrollTop(0);

			theme_editor_loading = false;
			button.html(button.attr('loaded'));
		};

		base.show_theme_editor = function(button, editing) {
			// if (theme_editor_loading) {
			// return;
			// }
			// theme_editor_button.css('width', theme_editor_button.width());
			// if (!theme_editor_loaded) {
			// theme_editor_loading = true;
			button.html(button.attr('loading'));

			// Simulate loading with timer
			// editor_timer = setInterval(function() {
			// clearInterval(editor_timer);

			CrayonThemeEditorSettings.curr_theme = $('#crayon-theme').val();
			CrayonThemeEditorSettings.editing = editing;

			// Load theme editor
			$.get(editor_url + '?curr_theme='
					+ CrayonThemeEditorSettings.curr_theme + '&editing='
					+ editing, function(data) {
				theme_editor_wrap.html(data);
				// CrayonSyntax.init();

				// Load url from preview into theme editor
				// $('#crayon-editor-preview').attr('url', preview_url);

				// Load preview into editor
				CrayonSyntaxThemeEditor.init(function() {
					CrayonSyntaxAdmin.show_theme_editor_now(button);
				}, preview.clone());

				// show_theme_editor_now();
			});

			// }, 2000);

			// theme_editor_loaded = true;
			// } else {
			// base.show_theme_editor_now();
			// }
			return false;
		};

	};

})(jQueryCrayon);
