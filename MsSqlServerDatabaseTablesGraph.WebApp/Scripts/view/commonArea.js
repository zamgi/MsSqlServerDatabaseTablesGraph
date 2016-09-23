function ModBanner() {
    var _n2 = function (n) { n = n.toString(); return ((n.length == 1) ? ('0' + n) : n); };
    var _getElapsed = function (timeSpan) {
        var days = Math.floor(timeSpan / (1000 * 60 * 60 * 24));
        timeSpan -= days * (1000 * 60 * 60 * 24);

        var hours = Math.floor(timeSpan / (1000 * 60 * 60));
        timeSpan -= hours * (1000 * 60 * 60);

        var mins = Math.floor(timeSpan / (1000 * 60));
        timeSpan -= mins * (1000 * 60);

        var seconds = Math.floor(timeSpan / (1000));
        //timeSpan -= seconds * (1000);
        return ({ days: days, hours: hours, mins: mins, seconds: seconds });
    };
    var _clockTick = function (startTime) {
        var $banner = $('body.arm-banner div.arm-banner td.clock');
        if ($banner.length) {
            var ts = new Date().getTime() - startTime;
            if (20000 < ts) { //< 20 sec.
                $.each($banner.parent().find('img'), function (_, o) {
                    $(o).attr('src', $(o).attr('src').replace('busy.gif', 'man-beating-head.gif'));
                });
            }
            var e = _getElapsed( ts );
            var t = _n2(e.hours) + ':' + _n2(e.mins) + ':' + _n2(e.seconds);
            $banner.html( t );
            setTimeout( _clockTick, 1000, startTime );
        }
    };

    ModBanner.prototype.Show = function (msg, appRootPath) {
        var $banner = $("<div class='arm-banner'>" + 
                          "<table>" +
                            "<tr><td><img src='" + (appRootPath || '/') + "Images/busy.gif'/></td><td>" + (msg || '') + "</td><td class='clock'></td></tr>" +
                            "<tr><td colspan='3' style='height: 1px'><a href='" + (appRootPath || '/') + "' title='cancel & go home'>home</a></td></tr>" +
                          "</table>" +
                         "</div>");
        $banner.appendTo($(document).find('body').addClass('arm-banner'));
        setTimeout( _clockTick, 5000, new Date().getTime() );
    };
    ModBanner.prototype.Hide = function () {
        $(document).find('body').removeClass('arm-banner').find('div.arm-banner').remove();
    };
};

var commonArea = {
    CancelKeydownEvent: function (ev) {
        if (ev.preventDefault) ev.preventDefault();
        if (ev.stopPropagation) ev.stopPropagation();
        if (ev.stopImmediatePropagation) ev.stopImmediatePropagation();
        ev.cancelBubble = true;
        return (false);
    },
    IsEmptyObject: function (obj) {
        if (obj) {
            for (var i in obj) {
                var o = obj[i];
                if (o !== null) {
                    if (typeof o === "string" && o._isEmpty_())
                        continue;
                    return (false);
                }
            }
        }
        return (true);
    },

    animate: {
        opacity: function ($s) {
            return ($s.css({ opacity: '0.2' }).animate({ opacity: '1' }, 'slow'));
        },
        backgroundColor: function ($s) {
            return ($s.css({ 'background-color': '#90EE90' })
                      .animate({ 'background-color': 'white' }, 'slow', function () { $s.css('background-color', ''); }));
        }
    },

    banner: new ModBanner(),
    $MainSpliter: null,

    _BeginSubmit: false,
    LOST_SESSION_MESSAGE: 'Возможно на сервере завершен сеанс.',
    BeginSubmit: function (appRootPath) {
        commonArea._BeginSubmit = true;
        _notification.messageRemove();
        commonArea.banner.Show('Сохранение данных...', appRootPath);
    },
    EndSubmit: function () {
        commonArea._BeginSubmit = false;
        commonArea.banner.Hide();
    },
    GetAjaxFailMessage: function (textStatus, errorThrown) {
        if (textStatus === "parsererror" && errorThrown && errorThrown.toString() == "SyntaxError: Unexpected token <") {
            return (commonArea.LOST_SESSION_MESSAGE);
        }
        return (textStatus + (errorThrown ? (" - " + errorThrown) : ""));
    },

    AjaxPostDataAndProcessResult: function (url, data, appRootPath, successFunc) {
        var this_ = this;
        this_.BeginSubmit(appRootPath);

        $.post( url, data )
         .done( function (resp, textStatus, jqXHR) {
             this_.EndSubmit();

             if (typeof resp != "object") {
                _notification.messageErrorSaveData( this_.LOST_SESSION_MESSAGE );
             } else if (resp.Success) {
                 if (typeof successFunc == "function") {
                     successFunc( resp.data );
                 } else {
                     window.location.reload(true);
                 }
             } else {
                 _notification.messageErrorSaveData(resp.Exception);
             }
         })
         .fail( function (jqXHR, textStatus, errorThrown) {
             this_.EndSubmit();
             _notification.messageError( this_.GetAjaxFailMessage(textStatus, errorThrown) + ',  [url: \'' + url + '\']', 'Сетевая ошибка сохранения данных на сервере' );
         });
    }
};

$(document).ready(function () {
    var vs_isCollapsed = localStorageEx.verticalSpliter.isCollapsed();
    var vs_position    = localStorageEx.verticalSpliter.position().toString(); //"300"
    var $spliter = $('#main_spliter_panel').outerHeight(window.innerHeight)
        .split({
            orientation: 'vertical',
            limit: 0,
            position: vs_isCollapsed ? '0' : vs_position,
            onDragEnd: function () {
                $(window).trigger('resize');
                localStorageEx.verticalSpliter.position($spliter.position());
            }
        });
    commonArea.$MainSpliter = $spliter;
    $spliter.trigger('spliter.resize');
    setTimeout(function () { $spliter.trigger('spliter.resize'); }, 100 );
    $(window).resize(function () {
        var h = window.innerHeight - 1;
        $spliter.outerHeight(h).trigger('spliter.resize');
        /*var $s = $('#logo_header');
        if ($s.length) {
            var t = $s.position().top + $s.outerHeight();
            var h = window.innerHeight - t - 1;
            $spliter.outerHeight(h).trigger('spliter.resize');
        }*/
    }).trigger('resize');

    var $ceb = $('#main_side_div > .collapse-expand-button');
    $ceb.click(function () {
        var $img = $(this).find('img');
        var src = $img.attr('src');
        var ssp = $(this).attr('save-split-pos');
        if (ssp) {
            $(this).removeAttr('save-split-pos').attr('title', 'collapsed');
            $img.attr('src', src.replace('/rightArrow.gif', '/leftArrow.gif'));
            $spliter.position( ssp );
        } else {
            $(this).attr({ 'save-split-pos': $spliter.position(), 'title': 'expanded' });
            $img.attr('src', src.replace('/leftArrow.gif', '/rightArrow.gif'));            
            $spliter.position('0');
        }
        $(window).trigger('resize');
        localStorageEx.verticalSpliter.isCollapsed( !ssp );
    });
    if (vs_isCollapsed) {
        $ceb.attr({ 'save-split-pos': vs_position, 'title': 'expanded' });
        var $img = $ceb.find('img'); $img.attr('src', $img.attr('src').replace('/leftArrow.gif', '/rightArrow.gif'));
    }
});