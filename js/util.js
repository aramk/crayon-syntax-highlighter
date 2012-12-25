// To avoid duplicates conflicting
var jQueryCrayon = jQuery;

var CRAYON_DEBUG = false;

(function ($) {

    $(document).ready(function () {
        CrayonUtil.init();
    });

    CrayonUtil = new function () {

        var base = this;
        var settings = null;

        base.init = function () {
            settings = CrayonSyntaxSettings;
            base.initGET();
        };

        base.addPrefixToID = function (id) {
            return id.replace(/^([#.])?(.*)$/, '$1' + settings.prefix + '$2');
        };

        base.removePrefixFromID = function (id) {
            var re = new RegExp('^[#.]?' + settings.prefix, 'i');
            return id.replace(re, '');
        };

        base.cssElem = function (id) {
            return $(base.addPrefixToID(id));
        };

        base.setDefault = function (v, d) {
            return (typeof v == 'undefined') ? d : v;
        };

        base.setMax = function (v, max) {
            return v <= max ? v : max;
        };

        base.setMin = function (v, min) {
            return v >= min ? v : min;
        };

        base.setRange = function (v, min, max) {
            return base.setMax(base.setMin(v, min), max);
        };

        base.initFancybox = function () {
            if (fancyboxInit) {
                // Initialise a custom version of Fancybox to avoid conflicting
                fancyboxInit(window, document, $, 'crayonFancybox');
            }
        };

        base.getExt = function (str) {
            if (str.indexOf('.') == -1) {
                return undefined;
            }
            var ext = str.split('.');
            if (ext.length) {
                ext = ext[ext.length - 1];
            } else {
                ext = '';
            }
            return ext;
        };

        base.initGET = function () {
            // URLs
            window.currentURL = window.location.protocol + '//' + window.location.host + window.location.pathname;
            window.currentDir = window.currentURL.substring(0, window.currentURL.lastIndexOf('/'));

            // http://stackoverflow.com/questions/439463
            function getQueryParams(qs) {
                qs = qs.split("+").join(" ");
                var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;
                while (tokens = re.exec(qs)) {
                    params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
                }
                return params;
            }

            window.GET = getQueryParams(document.location.search);
        };

        base.escape = function (string) {
            if (typeof encodeURIComponent == 'function') {
                return encodeURIComponent(string);
            } else if (typeof escape != 'function') {
                return escape(string);
            } else {
                return string;
            }
        };

        base.log = function (string) {
            if (typeof console != 'undefined' && CRAYON_DEBUG) {
                console.log(string);
            }
        };

        base.decode_html = function (str) {
            return String(str).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(
                /&gt;/g, '>');
        };

        base.encode_html = function (str) {
            return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(
                />/g, '&gt;');
        };

    };

    // http://stackoverflow.com/questions/2360655/jquery-event-handlers-always-execute-in-order-they-were-bound-any-way-around-t

    // [name] is the name of the event "click", "mouseover", ..
    // same as you'd pass it to bind()
    // [fn] is the handler function
    $.fn.bindFirst = function (name, fn) {
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

    // http://stackoverflow.com/questions/4079274/how-to-get-an-objects-properties-in-javascript-jquery
    $.keys = function (obj) {
        var keys = [];
        for (var key in obj) {
            keys.push(key);
        }
        return keys;
    }

    // Prototype modifications

    RegExp.prototype.execAll = function (string) {
        var matches = [];
        var match = null;
        while ((match = this.exec(string)) != null) {
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

    // Escape regex chars with \
    RegExp.prototype.escape = function (text) {
        return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    String.prototype.sliceReplace = function (start, end, repl) {
        return this.substring(0, start) + repl + this.substring(end);
    };

    String.prototype.escape = function () {
        var tagsToReplace = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;'
        };
        return this.replace(/[&<>]/g, function (tag) {
            return tagsToReplace[tag] || tag;
        });
    };

    String.prototype.linkify = function (target) {
        target = typeof target != 'undefined' ? target : '';
        return this.replace(/(http(s)?:\/\/(\S)+)/gmi, '<a href="$1" target="' + target + '">$1</a>');
    };

    String.prototype.toTitleCase = function () {
        var parts = this.split(/\s+/);
        var title = '';
        $.each(parts, function (i, part) {
            if (part != '') {
                title += part.slice(0, 1).toUpperCase() + part.slice(1, part.length);
                if (i != parts.length - 1 && parts[i + 1] != '') {
                    title += ' ';
                }
            }
        });
        return title;
    };

})(jQueryCrayon);
