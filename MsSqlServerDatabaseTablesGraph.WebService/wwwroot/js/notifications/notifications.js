var _notification = (function () {
    var self = {};
    var messageHideTimeoutID = null;
    var messageHideTimeoutValue = 3000;

    var buttonOk = 'Ok';
    var buttonYes = 'Да';
    var buttonNo = 'Нет';
    var buttonCancel = 'Отмена';
    var ajaxLoaderPath = 'images/ajax-loader.gif'
    var imagesRelativePath = 'css/notifications/';

    var _ErrorSaveDataTitle = 'Ошибка сохранения данных на сервере';
    var _ErrorNoLoadDataMsg = 'Данные не загружены';
    var _AppRootPath = '/';
    var _UserLoginUrl = 'User/Login';
    var _UserLoginAjaxUrl = 'User/LoginAjax';
    var _DialogLoginID = 'wtf-dialogLogin';
    var GetBtnRefreshHtml = function (caption) {
        return ("<button onclick='window.location.reload(true);' class='btn-refresh-notification'>" +
                (caption || "Перезагрузить") + "</button>");
    };
    var GetBtnLoginHtml = function (caption) {
        return ("<button onclick='_notification.makeLoginRoutine();' class='btn-refresh-notification'>" +
                (caption || "Вход") + "</button>");
    };

    self.makeLoginRoutine = function () {
        var this_ = this;
        var fnSuccess = function () {
            this_.messageRemove();
            this_.dialogLoginClose();
        };
        var fnFail = function () { this_.dialogLogin(); };
        _sessionKeepAliver.Test(fnSuccess, fnFail);
    };

    //Инициализация текстовых полей {buttonOk:'',buttonYes:'',buttonNo:'',buttonCancel:''}
    self.init = function (cfg) {
        if (cfg.buttonOk) buttonOk = cfg.buttonOk;
        if (cfg.buttonYes) buttonYes = cfg.buttonYes;
        if (cfg.buttonNo) buttonNo = cfg.buttonNo;
        if (cfg.buttonCancel) buttonCancel = cfg.buttonCancel;
        if (cfg.ajaxLoaderPath) ajaxLoaderPath = cfg.ajaxLoaderPath;
        if (cfg.imagesRelativePath) {
            imagesRelativePath = cfg.imagesRelativePath;
            if (imagesRelativePath[imagesRelativePath.length - 1] === '/') {
                imagesRelativePath = imagesRelativePath.substring(0, imagesRelativePath.length - 1);
            }
        }
        if (cfg.appRootPath) this.setAppRootPath(cfg.appRootPath);
    };
    self.setAppRootPath = function (appRootPath) {
        _AppRootPath = appRootPath || '/';
        if (_AppRootPath[_AppRootPath.length - 1] !== '/') _AppRootPath += '/';
    };

    self.messageInfo = function (message, title, hideTimeoutValue) {
        this._message(title || '', message, true, hideTimeoutValue);
    };
    self.messageError = function (message, title, messageErrorID) {
        var $s = this._message(title || '', message, false);
        if (messageErrorID)  $s.attr('wtf-msg-id', messageErrorID);
    };
    self.messageErrorNoLoadData = function (title) { this.messageErrorWithButtons(_ErrorNoLoadDataMsg, title, { showRefreshButton: true, refreshButtonText: 'Загрузить' }); };
    self.messageErrorSaveData = function (message) { this._message(_ErrorSaveDataTitle, message, false); };
    self.messageErrorWithButtons = function (message, title, config) {
        config = config || { showRefreshButton: true };
        var btns = (config.showRefreshButton ? GetBtnRefreshHtml(config.refreshButtonText) : '') +
                   (config.showLoginButton ? GetBtnLoginHtml(config.loginButtonText) : '');
        var $s = this._message(title || '', message + btns, false);
        if (config.messageErrorID) $s.attr('wtf-msg-id', config.messageErrorID);
    };
    self.messageIsVisible = function (messageErrorID) {
        if (messageErrorID) {
            return (0 < $('.notification-message[wtf-msg-id="' + messageErrorID + '"]').length);
        }
        return (0 < $('.notification-message').length);
    };
    self.messageRemove = function (messageErrorID) {
        if (messageErrorID) {
            $('.notification-message-container[wtf-msg-id="' + messageErrorID + '"], ' +
              '.notification-message[wtf-msg-id="' + messageErrorID + '"]').remove();
        } else {
            $('.notification-message-container, .notification-message').remove();
        }
    };
    //Закрытие сообщения
    self.messageClose = function () {
        $(".notification-message").hide('fast');

        if (messageHideTimeoutID !== null) {
            clearTimeout(messageHideTimeoutID);
            messageHideTimeoutID = null;
        }
    };

    self._message = function (title, message, isInfo, hideTimeoutValue) {
        var $s = $('.notification-message');
        $s.remove();

        if (isInfo) {
            if (title) {
                $s = $("<div class='notification-message'><table>" +
                            "<tr>" +
                            "<td> <div class='notification-title'>...</div> </td>" +
                            "<td> <i><img src='" + _AppRootPath + imagesRelativePath + "images/notify-close.png' title='close' /></i> </td>" +
                            "</tr>" +
                            "<tr> <td><span>...</span></td> <td/> </tr>" +
                        "</table></div>").appendTo($(document.body));
            } else {
                $s = $("<div class='notification-message'><table>" +
                            "<tr>" +
                            "<td> <td><span>...</span></td> </td>" +
                            "<td> <i><img src='" + _AppRootPath + imagesRelativePath + "images/notify-close.png' title='close' /></i> </td>" +
                            "</tr>" +
                        "</table></div>").appendTo($(document.body));
            }
        } else {
            $s = $("<div class='notification-message'><table>" +
                        "<tr>" +
                        "<td><img class='error' src='" + _AppRootPath + imagesRelativePath + "images/dlg-error.png' /></td>" +
                        "<td><div class='notification-title'>...</div></td>" +
                        "<td><i><img src='" + _AppRootPath + imagesRelativePath + "images/notify-close.png' title='close' /></i></td>" +
                        "</tr>" +
                        "<tr> <td/> <td><span>...</span></td> <td/> </tr>" +
                    "</table></div>").appendTo($(document.body));
        }
        $s.find("i").click(function () { $s.hide('fast', function () { $s.remove(); }); });

        if (isInfo) {
            $s.addClass("notification-message-info");
            if (typeof (hideTimeoutValue) === "undefined" || hideTimeoutValue === null) {
                hideTimeoutValue = messageHideTimeoutValue;
            } else {
                hideTimeoutValue = parseInt(hideTimeoutValue);
                if (isNaN(hideTimeoutValue)) hideTimeoutValue = messageHideTimeoutValue;
            }
            if (hideTimeoutValue) {
                setTimeout(function () { $s.find("i").click(); }, hideTimeoutValue);
            }
        } else {
            $s.addClass("notification-message-error");
        }

        $s.find("div").html(title);
        $s.find("span").html('<div class="notification-text">' + message + '</div>');
        $s.find("*").show();
        $s.show('fast');

        return ($s);
    };
    self._message2Container = function (title, message, isInfo) {
        var $c = $(".notification-message-container");
        if (!$c.length) {
            $c = $("<div class='notification-message-container'></div>").appendTo($(document.body));
        }

        var $s = $("<div class='notification-message-2'>" +
                     (isInfo ? "" : "<img class='error' src='" + _AppRootPath + imagesRelativePath + "images/dlg-error.png' />") +
                     "<span>...</span>" +
                     "<i><img src='" + _AppRootPath + imagesRelativePath + "images/notify-close.png' title='close' /></i>" +
                   "</div>").appendTo($c);
        if ($c.children().length > 1) {
            $s.hide();
        }
        $s.find("i").click(function () {
            $s.hide('fast', function () {
                $s.remove();
                if (!$c.children().length) $c.remove();
            });
        });

        if (isInfo) {
            $s.addClass("notification-message-info");
            setTimeout(function () { $s.find("i").click(); }, messageHideTimeoutValue);
        } else {
            $s.addClass("notification-message-error");
        }

        $s.find("span").html('<div class="notification-title">' + title + '</div><div class="notification-text">' + message + '</div>');
        $c.show('fast');
        $s.show('fast');
    };
    var getOrCreateDialogBaseHtml = function (notificationDialogClass) {
        var $d = $('.' + notificationDialogClass);
        if (!$d.length) {
            $d = $('<div class="notification-dialog ' + notificationDialogClass + '"><span>&nbsp;</span></div>');
            return { $d: $d, created: true };
        } else {
            return { $d: $d, created: false };
        }
    }

    //Диалог с ошибкой
    self.dialogError = function (msg, title, fnClose) {
        var t = getOrCreateDialogBaseHtml('notification-dialog-error');
        t.$d.find("span").html(msg);
        return t.$d.dialog({
            minWidth: $(window).width() / 2,
            title: title || "", resizable: true, modal: true,
            buttons: { buttonOk: function () { $(this).dialog("close"); } },
            close: function () {
                if (fnClose) fnClose();
                if (t.created) t.$d.remove();
            }
        });
    };
    //Диалог информационных
    self.dialogInfo = function (msg, title, fnClose, size) {
        var t = getOrCreateDialogBaseHtml('notification-dialog-info');
        t.$d.find("span").html(msg);
        return t.$d.dialog({
            title: title || "", resizable: true, modal: true,
            height: (size && size.height) ? size.height : undefined,
            width: (size && size.width) ? size.width : 550,
            buttons: { buttonOk: function () { $(this).dialog("close"); } },
            close: function () {
                if (fnClose) fnClose();
                if (t.created) t.$d.remove();
            }
        });
    };
    //Диалог ожидания
    self.dialogWait = function (title, fnCancel) {
        var t = getOrCreateDialogBaseHtml('notification-dialog-wait');
        t.$d.get(0).close = function () { t.$d.dialog("close"); };
        return t.$d.dialog({
            dialogClass: 'notification-dialog-wait-root',
            title: title || "", resizable: false, modal: true,
            buttons: { buttonCancel: (fnCancel ? function () { $(this).dialog("close"); } : undefined) },
            close: function () {
                if (fnCancel) fnCancel();
                if (t.created) t.$d.remove();
            }
        });
    };
    //Диалог -вопрос
    self.dialogQuest = function (msg, title, fnYes, fnNo, fnCancel, size, eventDialogOpen) {
        var hasYes = false, hasNo = false;

        var t = getOrCreateDialogBaseHtml('notification-dialog-quest');
        t.$d.find("span").html(msg);
        var buttons = {
            buttonYes: function () {
                hasYes = true;
                $(this).dialog("close");
            },
            buttonNo: function () {
                hasNo = true;
                $(this).dialog("close");
            },
            buttonCancel: (fnCancel ? function () { $(this).dialog("close"); } : undefined)
        };
        return t.$d.dialog({
            title: title || "", resizable: true, modal: true,
            open: eventDialogOpen || function () { },
            height: (size && size.height) ? size.height : undefined,
            width: (size && size.width) ? size.width : 400,
            buttons: buttons,
            close: function () {
                if (hasNo && fnNo)
                    fnNo();
                else if (hasYes && fnYes)
                    fnYes();
                else if (fnCancel)
                    fnCancel();

                if (t.created) t.$d.remove();
            }
        });
    };
    self.dialogConnection2DB = function (cfg) {
        var hasYes = false, hasNo = false;

        var t = getOrCreateDialogBaseHtml('notification-dialog-connection-to-db');
        t.$d.find("span").html(cfg.msg);
        var buttons = {};
        buttons[(cfg.buttonYes || buttonYes)] = {
            text: (cfg.buttonYes || buttonYes), 'dialog-yes-button': true,
            click: function () {
                if (!cfg.fnCheckYes || cfg.fnCheckYes()) {
                    hasYes = true;
                    $(this).dialog("close");
                }
            }
        };
        //if (cfg.fnNo)
        buttons[(cfg.buttonNo || buttonNo)] = {
            text: (cfg.buttonNo || buttonNo), 'dialog-no-button': true,
            click: function () {
                if (!cfg.fnCheckNo || cfg.fnCheckNo()) {
                    hasNo = true;
                    $(this).dialog("close");
                }
            }
        };
        if (cfg.fnCancel)
            buttons[(cfg.buttonCancel || buttonCancel)] = {
                text: (cfg.buttonCancel || buttonCancel), 'dialog-cancel-button': true,
                click: function () { $(this).dialog("close"); }
            };

        return t.$d.dialog({
            title: cfg.title || "", resizable: true, modal: true,
            open: cfg.eventDialogOpen || function () { },
            height: (cfg.size && cfg.size.height) ? cfg.size.height : undefined,
            width: (cfg.size && cfg.size.width) ? cfg.size.width : 400,
            buttons: buttons,
            close: function () {
                if (cfg.fnClose)
                    cfg.fnClose();
                if (hasNo && cfg.fnNo)
                    cfg.fnNo();
                else if (hasYes && cfg.fnYes)
                    cfg.fnYes();
                else if (cfg.fnCancel)
                    cfg.fnCancel();
                if (t.created) t.$d.remove();
            }
        });
    };

    var makeLogin = function (userName, password, fnSuccess, fnFail) {
        var data = { UserName: userName, Password: password };

        $.post(_AppRootPath + _UserLoginAjaxUrl, data)
         .done(function (resp) {
             if (typeof (resp) !== 'object') {
                 fnFail("Ошибка входа => [typeof resp != 'object']");
             } else if (resp.Success) {
                 fnSuccess();
             } else {
                 fnFail(resp.Exception);
             }
         })
         .fail(function () { fnFail('Сетевая ошибка - приложение не доступно по сети'); });
    };
    self.dialogLogin = function () {
        $.showModalDialog({
            dialogID: _DialogLoginID, url: _AppRootPath + _UserLoginUrl + '?r=' + Math.random(),
            showButtons: false, height: 370, width: 480, iframe_padding_bottom: 0,
            open: function (event, ui) {
                var $frame = $(this);
                $frame.load(function () {
                    var $form = $(this.contentWindow.document.body).find('form');
                    $form.find('input[type="submit"]').click(function () {
                        var user = $form.find('input#UserName').val(),
                            password = $form.find('input#Password').val();

                        var $btn = $(this); $btn.hide();
                        _notification.showLoader($form);
                        $form.find('label#error-msg').remove();

                        makeLogin(user, password,
                            function () { $frame.dialog('close'); },
                            function (msg) {
                                $('<label id="error-msg" style="color: red">' + msg + '</label>').appendTo($form);
                                $btn.show();
                                _notification.hideLoader($form);
                            });

                        return (false);
                    });
                });
            }
        });
    };
    self.dialogLoginClose = function () {
        var $s = $('div#' + _DialogLoginID);
        if ($s.dialog) $s.dialog('close');
    }
    self.dialogLoginIsVisible = function () { return (0 < $('div#' + _DialogLoginID).length); };

    //Отображение индикатора загрузки
    self.showLoader = function (selector, showMany) {
        if (showMany || !$(selector).find(".ajax-loader").length) {
            $('<img class="ajax-loader" src="' + _AppRootPath + imagesRelativePath + ajaxLoaderPath + '" />').appendTo(selector);
        }
    };
    //проверка наличия индикатора загрузки
    self.isLoaderVisible = function (selector) { return (0 < $(selector).find(".ajax-loader").length); };
    //Скрытие индикатора загрузки
    self.hideLoader = function (selector) { $(selector).find(".ajax-loader").remove(); };

    return (self);
})();
