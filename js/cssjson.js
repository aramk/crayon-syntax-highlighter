/*

CSS-JSON Converter for JavaScript, v.1.0
By Aram Kocharyan, http://ak.net84.net/

Converts CSS to JSON and back.

*/

// String functions
var StringExtensions = new function() {
	// Added natively now
	this.trim = function() {
    	return this.replace(/^\s+|\s+$/g, '');
	};
	String.prototype.trim = this.trim;
	
	this.repeat = function(n) {
	    return new Array(1 + n).join(this);
	}
	String.prototype.repeat = this.repeat;
}

var CSSJSON = new function() {
	
	// These aren't used, just shown for convenience
	var selX = /([^\s\;\{\}][^\;\{\}]*)\{/g;
	var endX = /\}/g;
	var lineX = /([^\;\{\}]*)\;/g;
	var commentX = /\/\*.*?\*\//g;
	var lineAttrX = /([^\:]+):([^\;]*);/;
	
	// This is used, a concatenation of all above. We use alternation to capture.
	var altX = /(\/\*[\s\S]*?\*\/)|([^\s\;\{\}][^\;\{\}]*(?=\{))|(\})|([^\;\{\}]+\;)/gmi;
	
	// Capture groups
	var capComment = 1;
	var capSel = 2
	var capEnd = 3;
	var capAttr = 4;
	
	// The main JSON converter function. Set keepOrder to true to keep order of comments etc.
	this.toJSON = function(css, keepOrder) {
		return getCSSRuleNode(css, keepOrder);
	}

	var isEmpty = function(x) {
		return typeof x == 'undefined' || x.length == 0 || x == null;
	}

	// Input is css string and current pos, returns JSON object
	var getCSSRuleNode = function(cssString, keepOrder) {
		var node = {};
		var match = null;
		var count = 0;

		while ( (match = altX.exec(cssString)) != null ) {
			console.log(match);
			if (!isEmpty(match[capComment])) {
				// Comment
				var add = match[capComment].trim();
				node[count++] = add;
			} else if (!isEmpty(match[capSel])) {
			//} else if (typeof match[capSel] != 'undefined') {
				// New node, we recurse
				var name = match[capSel].trim();
				var newNode = getCSSRuleNode(cssString, keepOrder);
				if (keepOrder) {
					var obj = {};
					obj['name'] = name;
					obj['value'] = newNode;
					// Since we must use key as index to keep order and not name,
					// this will differentiate between a Rule Node and an Attribute,
					// since both contain a name and value pair.
					obj['type'] = 'rule';
					node[count++] = obj;
				} else {
					node[name] = newNode;
				}
			} else if (!isEmpty(match[capEnd])) {
				// Node has finished
				return node;
			} else if (!isEmpty(match[capAttr])) {
				var line = match[capAttr].trim();
				var attr = lineAttrX.exec(line);
				if (attr) {
					// Attribute
					var name = attr[1].trim();
					var value = attr[2].trim();
					if (keepOrder) {
						var obj = {};
						obj['name'] = name;
						obj['value'] = value;
						obj['type'] = 'attr';
						node[count++] = obj;
					} else {
						node[name] = value;
					}
				} else {
					// Semicolon terminated line
					node[count++] = line;
				}
			}
		}
		
		return node;
	}
	
	// The main CSS converter function.
	this.toCSS = function(json) {
		return strCSSRuleNode(json);
	}
	
	// Print a JSON node as CSS
	var strCSSRuleNode = function(node, level) {
		var cssString = '';
		if (typeof level == 'undefined') {
			level = 0;
		}
		for (i in node) {
			var subNode = node[i];
			if (typeof i == 'number' || parseInt(i) == i) {
				// Ordered
				if (typeof subNode == 'object') {
					if (subNode.type == 'rule') {
						// Selector
						cssString += strNode(subNode.name, subNode.value, level);
					} else {
						// Attribute
						cssString += strAttr(subNode.name, subNode.value, level);
					}
				} else {
					// Line/Comment
					cssString += '\t'.repeat(level) + subNode + '\n';
				}
			} else if (typeof i == 'string') {
				// Unordered
				if (typeof subNode == 'object') {
					// Selector
					cssString += strNode(i, subNode, level);
				} else {
					// Attribute
					cssString += strAttr(i, subNode, level);
				}
			}
		}
		return cssString;
	}
	
	// Helpers
	
	var strAttr = function(name, value, level) {
		return '\t'.repeat(level) + name + ': ' + value + ';\n';
	}
	
	var strNode = function(name, value, level) {
		var cssString = '\t'.repeat(level) + name + ' {\n';
		cssString += strCSSRuleNode(value, level+1);
		cssString += '\t'.repeat(level) + '}\n\n';
		return cssString;
	}

}
