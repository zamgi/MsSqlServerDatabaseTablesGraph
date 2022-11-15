String.prototype.trimText = function () { return ((this + '').replace(/(^\s+)|(\s+$)/g, '')); };
String.prototype._isEmpty_ = function () { return ((this + '').replace(/(^\s+)|(\s+$)/g, '') === ''); };
String.prototype.insert = function (index, s) {
    if (0 < index)
        return (this.substring(0, index) + s + this.substring(index, this.length));
    return (s + this);
};
String.prototype.replaceAll = function (token, newToken, ignoreCase) {
    var s = this + '', i = -1;
    if (typeof token === 'string') {
        if (ignoreCase) {
            token = token.toLowerCase();
            while ((i = s.toLowerCase().indexOf(token, i >= 0 ? i + newToken.length : 0)) !== -1) {
                s = s.substring(0, i) + newToken + s.substring(i + token.length);
            }
        } else {
            return (this.split(token).join(newToken));
        }
    } return (s);
};
String.prototype.substringEx = function (max) {
    if (!max) max = 497; var s = (this + '');
    return (((max + 3) < s.length) ? (s.substring(0, max) + '...') : s);
};
String.prototype.countOf = function (token) { return (this.toUpperCase().split(token.toUpperCase()).length - 1); }
String.prototype.contains = function (token) { return (this.toLowerCase().indexOf(token.toLowerCase()) !== -1); }
String.prototype.insertByStep = function (token, step) {
    var i = 0, s = this.substr(i, step);
    for (i = step; i < this.length; i += step) {
        s += token + this.substr(i, step);
    } return (s);
}
String.prototype.trimEnd = function (token) {
    token = (token || ' ');    
    for (var s = this; token.length <= s.length;) {
        var end = s.substr(s.length - token.length, token.length);
        if (end === token) {
            s = s.substr(0, s.length - token.length);
        } else {
            break;
        }
    } return (s);
}

var browserScrollSize = {
    scrollSize: null,
    _get: function() {
        var css = { 'border': 'none', 'height': '200px', 'margin': '0', 'padding': '0', 'width': '200px' };
        var inner = $('<div>').css($.extend({}, css));
        var outer = $('<div>').css($.extend({ 'left': '-1000px', 'overflow': 'scroll', 'position': 'absolute', 'top': '-1000px' }, css))
                              .append(inner).appendTo('body').scrollLeft(1000).scrollTop(1000);
        var scrollSize = {
            'height': (outer.offset().top  - inner.offset().top)  || 0,
            'width' : (outer.offset().left - inner.offset().left) || 0
        };
        outer.remove();
        return (scrollSize);
    },
    height: function () {
        if (!this.scrollSize) {
            this.scrollSize = this._get();
        }
        return (this.scrollSize.height);
    },
    width: function () {
        if (!this.scrollSize) {
            this.scrollSize = this._get();
        }
        return (this.scrollSize.width);
    }
};

(function ($) {
    $.fn.hasScrollBar = function () { var e = this.get(0); return ({ vertical: (e.scrollHeight > e.clientHeight), horizontal: (e.scrollWidth  > e.clientWidth) }); };
    $.fn.firstOrNull = function () { return (this.length ? this.get(0) : null); };
    $.fn.focusByTimeout = function (timeout) { var $t = this; setTimeout(function () { $t.focus(); }, timeout || 50); return ($t); };
    $.fn.appendAtTitleAttr = function (title) {
        $.each(this, function (_, o) { var $o = $(o); var t = $o.attr('title'); $o.attr('title', (t || '') + title); });
        return (this);
    };
    $.fn.getValueAndClear = function () { var v = this.val(); this.val(''); return (v); };
    $.fn.pushCancelButton4DialogByEscape = function (dialogID) {
        return this.keydown(function (ev) {
            if (((ev || event).keyCode === 27) && (window.self !== window.parent) && (window.parent.document)) { //ESCAPE; in dialog
                $('#' + dialogID + ' .ui-dialog-buttonset button[ dialog-cancel-button ]', window.parent.document).click();
                //--important!--// ev.isImmediatePropagationEnabled = false;
                return (commonArea.CancelKeydownEvent(ev || event));
            }
        });
    };

    $.extend({
        detectIE: function() {
            var ua = window.navigator.userAgent;

            var msie = ua.indexOf('MSIE ');
            if (msie > 0) {
                // IE 10 or older => return version number
                return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10);
            }

            var trident = ua.indexOf('Trident/');
            if (trident > 0) {
                // IE 11 => return version number
                var rv = ua.indexOf('rv:');
                return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10);
            }

            var edge = ua.indexOf('Edge/');
            if (edge > 0) {
                // Edge (IE 12+) => return version number
                return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10);
            }

            // other browser
            return false;
        },
        detectFireFox: function () { return (window.navigator.userAgent.toLowerCase().indexOf('firefox') > -1); },
        sumArray: function (array) { var sum = 0; $.each(array, function (index, value) { sum += value; }); return (sum); },
        firstOrNull: function (array, propertyName) {
            if (array && array.length) {
                return (propertyName ? array[0][propertyName] : array[0]);
            } return (null);
        },
        deepCopyArray: function (array) { var copy = []; $.each(array, function (i, a) { copy.push($.extend({}, a)); }); return (copy); }
    });
})(jQuery);