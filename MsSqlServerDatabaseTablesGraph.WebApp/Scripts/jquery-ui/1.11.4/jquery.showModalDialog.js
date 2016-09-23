(function ($) {
	$.fn.showModalDialog = function (options) {
		// build main options and merge them with default ones
		var optns = $.extend({}, $.fn.showModalDialog.defaults, options);

		// create the iframe which will open target page
		var $frame = $('<iframe />').attr({ 'src': optns.url, 'scrolling': optns.scrolling, 'tabindex': '0' });

		// set the padding to 0 to eliminate any padding, 
		// set padding-bottom: 10 so that it not overlaps with the resize element
		$frame.css({ 'padding': 0, 'margin': 0, 'padding-bottom': optns.iframe_padding_bottom });

		// create jquery dialog using recently created iframe
	    var $modalWindow = $frame.dialog({
	        buttons: optns.showButtons ? 
                [{
                    text: 'ОК', 'dialog-ok-button': true,
                    click: function () {
                        var ok = (optns.callback && optns.callback.apply) ? optns.callback.apply(this, [$frame]) : true;
                        if (ok !== false) {
                            $(this).dialog('close');
                        }
                    }
                }, {
                    text: 'Отмена', 'dialog-cancel-button': true,
                    click: function () {
                        $(this).dialog('close');
                    }
                }] : null,
			autoOpen: true,
			modal: optns.dialogModal, //true,
			width: optns.width,
			height: optns.height,
			resizable: optns.resizable,
			position: optns.position,
			overlay: { opacity: 0.5, background: 'black' },
			open: optns.open,
			close: function () {
			    // save the returnValue in options so that it is available in the callback function
			    optns.returnValue = $(this)[ 0 ].contentWindow.window.returnValue; //---optns.returnValue = $frame[0].contentWindow.window.returnValue;
			    $(this).dialog('destroy').remove(); //---$frame[0].parentNode.parentNode.removeChild($frame[0].parentNode);
				optns.close();
			},
			beforeClose: function (event, ui) {
                if (optns.hideInsteadOfClose) {
                    $(this).dialog('widget').hide();
                    $('div.ui-widget-overlay.ui-front').hide();
				        optns.returnValue = $(this)[ 0 ].contentWindow.window.returnValue;
				        optns.close();
                    return (false);
                }
			},
			resizeStop: function () {
			    $frame.css('width', '100%');
			}
		});
		if (optns.dialogExtendOptions) {		    
		    var _maximize = optns.dialogExtendOptions.maximize,
		        _restore  = optns.dialogExtendOptions.restore;
		    optns.dialogExtendOptions.maximize = function (evt) {
		        $(this).width('100%');
		        if (_maximize) { _maximize(evt); }
		    };
		    optns.dialogExtendOptions.restore = function (evt) {
		        $(this).width('100%');
		        if (_restore) { _restore(evt); }
		    };
		    $modalWindow.dialogExtend(optns.dialogExtendOptions);
		}

		if (optns.dialogID) {
			$('#' + optns.dialogID).remove();
			$frame.parent().attr('id', optns.dialogID);
		}

		// set the width of the frame to 100% right after the dialog was created
		// it will not work setting it before the dialog was created
		$frame.css('width', '100%');

		var wnd = $frame[0].contentWindow.window;
		if (optns.loadingHtml) {
            //don't care NOT FUSKING work on FUSKING IE
            /*if ((window.navigator.userAgent.indexOf('MSIE') != -1) || (window.navigator.userAgent.indexOf('Trident') != -1)) {
		        setTimeout(function () { $(wnd.document.body).html(optns.loadingHtml); }, 1);
		    } else {
		        $(wnd.document.body).html(optns.loadingHtml);
		    }*/
            $(wnd.document.body).html(optns.loadingHtml);
		    if (optns.loadingTitle) {
		        $modalWindow.dialog('option', 'title', optns.loadingTitle);
		    }
		}
		// pass dialogArguments to target page
		wnd.dialogArguments = optns.dialogArguments;
		// override default window.close() function for target page
		wnd.closeDialog = function () {
			$modalWindow.dialog('close');
		};
		wnd.close = wnd.closeDialog;
		wnd.dialog = $modalWindow;
		wnd.dialogOptions = optns;

		$frame.load(function () {
		    if ($modalWindow) {
		        var maxTitleLength = 150; // max title length
		        var title = $(this).contents().find('title').html(); // get target page's title
		        if (maxTitleLength < title.length) {
		            title = title.substring(0, maxTitleLength) + '...'; // trim title to max length
		        }

		        // set the dialog title to be the same as target page's title
		        $modalWindow.dialog('option', 'title', title);

		        try {
		            var pe = $(this)[0].parentElement;
		            if (pe.style.posLeft < 0) { pe.style.posLeft = 25; }
		            pe.style.posTop = 25;
		        } catch (ex) { ; }
		    }
		    if (optns.forceSetFocus) {
		        $(this).focus().contents().focus();
		    }
		});

		return (null);
	};

	$.fn.showModalDialogIfExists = function (dialogID, callbackIfExists/*(iframe)*/) {
        var $iframe = $('#' + dialogID + ' iframe');
        if ($iframe.length) {
            var $s = $('#' + dialogID + ', div.ui-widget-overlay.ui-front').css('visibility', 'hidden').show();
            if (typeof callbackIfExists == 'function') {
                var r = callbackIfExists($iframe[0]);
                if (r === false) {
                    return (false);
                }
            }
            $s.css('visibility', 'visible');
            $iframe.focus().contents().focus();
            return (true);
        }
        return (false);
	};

	// plugin defaults
	$.fn.showModalDialog.defaults = {
		url: null,
		dialogArguments: null,
		height: 'auto',
		width: 'auto',
		position: { my: 'center', at: 'center', of: window },
		resizable: true,
		scrolling: 'yes',
		open: function () { },
		close: function () { },
	    //---, callback: function () { ... } - when push 'Ok'
		returnValue: null,
		iframe_padding_bottom: 10,
		dialogModal: true,
		showButtons: true,
		loadingHtml: null,
		loadingTitle: null
        //, hideInsteadOfClose: false
	};
})(jQuery);

// do so that the plugin can be called $.showModalDialog({options}) instead of $().showModalDialog({options})
jQuery.showModalDialog = function (options) { jQuery().showModalDialog(options); };
jQuery.showModalDialogIfExists = function (dialogID, callbackIfExists) { return (jQuery().showModalDialogIfExists(dialogID, callbackIfExists)); };