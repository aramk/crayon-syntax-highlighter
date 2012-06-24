var CRAYON_DEBUG = false;

if (typeof CrayonTagEditorSettings == 'undefined') {
	// WP may have already added it
	CrayonTagEditorSettings = {};
	CrayonSettings = {};
}

RegExp.prototype.execAll = function(string) {
	var matches = [];
	var match = null;
	while ( (match = this.exec(string)) != null ) {
		var matchArray = [];
		for (var i in match) {
			if (parseInt(i) == i) {
				matchArray.push(match[i]);
			}
		}
		matches.push(matchArray);
	}
	return matches;
};

function console_log(string) {
    if (typeof console != 'undefined' && CRAYON_DEBUG) {
        console.log(string);
    }
}

//# is left unencoded
function crayon_escape(string) {
    if (typeof encodeURIComponent == 'function') {
    	return encodeURIComponent(string);
    } else if (typeof escape != 'function') {
    	return escape(string);
    } else {
    	return string;
    }
}

function crayon_decode_html(str) {
    return String(str)
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
}

function crayon_encode_html(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
}

//http://stackoverflow.com/questions/2360655/jquery-event-handlers-always-execute-in-order-they-were-bound-any-way-around-t

//[name] is the name of the event "click", "mouseover", .. 
//same as you'd pass it to bind()
//[fn] is the handler function
jQuery.fn.bindFirst = function(name, fn) {
	// bind as you normally would
	// don't want to miss out on any jQuery magic
	this.bind(name, fn);

	// Thanks to a comment by @Martin, adding support for
	// namespaced events too.
	var handlers = this.data('events')[name.split('.')[0]];
	// take out the handler we just inserted from the end
	var handler = handlers.pop();
	// move it at the beginning
	handlers.splice(0, 0, handler);
};