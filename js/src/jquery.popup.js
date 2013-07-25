// Default Settings
jqueryPopup = Object();
jqueryPopup.defaultSettings = {
		centerBrowser:0, // center window over browser window? {1 (YES) or 0 (NO)}. overrides top and left
		centerScreen:0, // center window over entire screen? {1 (YES) or 0 (NO)}. overrides top and left
		height:500, // sets the height in pixels of the window.
		left:0, // left position when the window appears.
		location:0, // determines whether the address bar is displayed {1 (YES) or 0 (NO)}.
		menubar:0, // determines whether the menu bar is displayed {1 (YES) or 0 (NO)}.
		resizable:0, // whether the window can be resized {1 (YES) or 0 (NO)}. Can also be overloaded using resizable.
		scrollbars:0, // determines whether scrollbars appear on the window {1 (YES) or 0 (NO)}.
		status:0, // whether a status line appears at the bottom of the window {1 (YES) or 0 (NO)}.
		width:500, // sets the width in pixels of the window.
		windowName:null, // name of window set from the name attribute of the element that invokes the click
		windowURL:null, // url used for the popup
		top:0, // top position when the window appears.
		toolbar:0, // determines whether a toolbar (includes the forward and back buttons) is displayed {1 (YES) or 0 (NO)}.
		data:null,
		event:'click'
	};

(function ($) {

	popupWindow = function (object, instanceSettings, beforeCallback, afterCallback) {
		beforeCallback = typeof beforeCallback !== 'undefined' ? beforeCallback : null;
		afterCallback = typeof afterCallback !== 'undefined' ? afterCallback : null;
	
		if (typeof object == 'string') {
			object = jQuery(object);
		}
		if (!(object instanceof jQuery)) {
			return false;
		}
		var settings = jQuery.extend({}, jqueryPopup.defaultSettings, instanceSettings || {});
		object.handler = jQuery(object).bind(settings.event, function() {
			
			if (beforeCallback) {
				beforeCallback();
			}
			
			var windowFeatures =    'height=' + settings.height +
									',width=' + settings.width +
									',toolbar=' + settings.toolbar +
									',scrollbars=' + settings.scrollbars +
									',status=' + settings.status + 
									',resizable=' + settings.resizable +
									',location=' + settings.location +
									',menuBar=' + settings.menubar;
		
			settings.windowName = settings.windowName || jQuery(this).attr('name');
			var href = jQuery(this).attr('href');
			if (!settings.windowURL && !(href == '#') && !(href == '')) {
				settings.windowURL = jQuery(this).attr('href');
			}
			
			var centeredY,centeredX;
			
			var win = null;
			if (settings.centerBrowser) {
				if (typeof window.screenY == 'undefined') {// not defined for old IE versions
					centeredY = (window.screenTop - 120) + ((((document.documentElement.clientHeight + 120)/2) - (settings.height/2)));
					centeredX = window.screenLeft + ((((document.body.offsetWidth + 20)/2) - (settings.width/2)));
				} else {
					centeredY = window.screenY + (((window.outerHeight/2) - (settings.height/2)));
					centeredX = window.screenX + (((window.outerWidth/2) - (settings.width/2)));
				}
				win = window.open(settings.windowURL, settings.windowName, windowFeatures+',left=' + centeredX +',top=' + centeredY);
			} else if (settings.centerScreen) {
				centeredY = (screen.height - settings.height)/2;
				centeredX = (screen.width - settings.width)/2;
				win = window.open(settings.windowURL, settings.windowName, windowFeatures+',left=' + centeredX +',top=' + centeredY);
			} else {
				win = window.open(settings.windowURL, settings.windowName, windowFeatures+',left=' + settings.left +',top=' + settings.top);
			}
			if (win != null) {
				win.focus();
				if (settings.data) {
					win.document.write(settings.data);
				}
			}
			
			if (afterCallback) {
				afterCallback();
			}
		});
		return settings;
	};

	popdownWindow = function(object, event) {
		if (typeof event == 'undefined') {
			event = 'click';
		}
		object = jQuery(object);
		if (!(object instanceof jQuery)) {
			return false;
		}
		object.unbind(event, object.handler);
	};

})(jQueryCrayon);

