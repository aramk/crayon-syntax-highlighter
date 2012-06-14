var CrayonTinyMCE = new function() {
	
	// TinyMCE specific
	var name = 'crayon_tinymce';
	var s = CrayonTagEditorSettings;
	var te = CrayonTagEditor;
	var isHighlighted = false;
	var currPre = null;
	// Switch events
	var switch_html_click = switch_tmce_click = null;
	
	var me = this;
//	var wasHighlighted = false;
	
	this.setHighlight = function(highlight) {
		if (highlight) {
			jQuery(s.tinymce_button).addClass('mce_crayon_tinymce_highlight');
		} else {
			jQuery(s.tinymce_button).removeClass('mce_crayon_tinymce_highlight');
		}
		isHighlighted = highlight;
	};
	
	this.selectPreCSS = function(selected) {
		if (currPre) {
			if (selected) {
				jQuery(currPre).addClass(s.css_selected);
			} else {
				jQuery(currPre).removeClass(s.css_selected);
			}
    	}
	};
	
	this.isPreSelectedCSS = function() {
		if (currPre) {
			return jQuery(currPre).hasClass(s.css_selected);
		}
		return false;
	};
	
	this.loadTinyMCE = function() {
	    tinymce.PluginManager.requireLangPack(name);

	    tinymce.create('tinymce.plugins.Crayon', {
	        init : function(ed, url) {
	    		jQuery(function() {
	    			te.loadDialog();
	        	});
	    		
	    		ed.onInit.add(function(ed) {
	    			ed.dom.loadCSS(url + '/crayon_te.css');
				});
				
	    		// Prevent <p> on enter, turn into \n
				ed.onKeyDown.add(function( ed, e ) {
					var selection = ed.selection;
					if ( e.keyCode == 13) {
						var node = selection.getNode();
						if (node.nodeName == 'PRE') {
							selection.setContent('\n', {format : 'raw'});
							return tinymce.dom.Event.cancel(e);
						} else if (te.isCrayon(node)) {
							// Only triggers for inline <span>, ignore enter in inline 
							return tinymce.dom.Event.cancel(e);
						}
					}
				});
	    		
	    		ed.onInit.add(function(ed) {
    				me.setHighlight(!s.used);
	    	    });
	    		
	            ed.addCommand('showCrayon', function() {
	            	te.showDialog(
		            	function(shortcode) {
		            		ed.execCommand('mceInsertContent', 0, shortcode);
		            	},
		            	function(shortcode) {
		            		// This will change the currPre object
		            		var newPre = jQuery(shortcode);
		            		jQuery(currPre).replaceWith(newPre);
		            		// XXX DOM element not jQuery
		            		currPre = newPre[0];
		            	}, 'tinymce', ed, currPre, 'decode', 'encode');
	            	
	            	if (!currPre) {
	            		// If no pre is selected, then button highlight depends on if it's used 
	            		me.setHighlight(!s.used);
	            	}
	            });
	            
	            // Remove onclick and call ourselves
	            var switch_html = jQuery(s.switch_html);
//	            switch_html_click = switch_html.prop('onclick');
	            switch_html.prop('onclick', null);
	            switch_html.click(function() {
	            	// Remove selected pre class when switching to HTML editor
	            	me.selectPreCSS(false);
	            	switchEditors.go('content','html');
//	            	switch_html_click();
	            });
	            
//	            // Remove onclick and call ourselves
//	            var switch_tmce = jQuery(s.switch_tmce);
////	            switch_tmce_click = switch_tmce.prop('onclick');
//	            switch_tmce.prop('onclick', null);
//	            switch_tmce.click(function() {
//	            	// Add selected pre class when switching to back to TinyMCE
////	            	if (!me.isPreSelectedCSS()) {
////	            		me.selectPreCSS(true);
////	            	}
//	            	switchEditors.go('content','tmce');
////	            	switch_tmce_click();
//	            });
	            
	            // Highlight selected 
	            ed.onNodeChange.add(function(ed, cm, n, co) {
	            	if (n != currPre) {
	            		// We only care if we select another same object
	            		if (currPre) {
			            	// If we have a previous pre, remove it
	            			me.selectPreCSS(false);
		        			currPre = null;
		        		}
		            	if (te.isCrayon(n)) {
		            		// Add new pre
		            		currPre = n;
		            		me.selectPreCSS(true);
		            		me.setHighlight(true);
		            	} else {
		            		// No pre selected
		            		me.setHighlight(!s.used);
		            	}
		            	var tooltip = currPre ? s.dialog_title_edit : s.dialog_title_add;
		            	jQuery(s.tinymce_button).attr('title', tooltip);
	            	}
				});
	            
	            ed.onBeforeSetContent.add(function(ed, o) {
	            	// Remove all selected pre tags
	            	var content = jQuery(o.content);
	            	var wrapper = jQuery('<div>');
	            	content.each(function() {
	            		jQuery(this).removeClass(s.css_selected);
	            		wrapper.append(jQuery(this).clone());
	            	});
	            	o.content = wrapper.html();
	            });
	            
	            ed.addButton(name, {
	            	// TODO add translation
	                title: s.dialog_title,
	                cmd: 'showCrayon'
	            });
	        },
	        createControl : function(n, cm){
	            return null;
	        },
	        getInfo : function(){
	            return {
	                longname: 'Crayon Syntax Highlighter',
	                author: 'Aram Kocharyan',
	                authorurl: 'http://ak.net84.net/',
	                infourl: 'http://bit.ly/crayonsyntax/',
	                version: "1.0"
	            };
	        }
	    });
	    
	    tinymce.PluginManager.add(name, tinymce.plugins.Crayon);
	};	
	
	// Load TinyMCE
	this.loadTinyMCE();
	
};
