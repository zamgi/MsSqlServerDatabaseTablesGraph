function connectionDialog(dal, rollerImageUrl) {
    var requiredHtml = '<span class="requiredError" title="required">*</span>';
    var $d = $('<div id="ConnectionDialog">' +
                '<table>' +
                  '<tr>' +
                    '<td>Server-Name: </td>' +
                    '<td>' +
                        //'<input id="ServerName" type="text" value="' + dal.ServerName() + '" />' +
                        '<div id="ServerName"></div>' +
                    '</td>' +
                    '<td />' +
                  '</tr>' +
                  '<tr>' +
                    '<td>Database-Name: </td>' +
                    '<td>' +
                        //'<input id="DatabaseName" type="text" value="' + dal.DatabaseName() + '" />' +
                        '<div id="DatabaseName"></div>' +
                    '</td>' +
                    '<td />' +
                  '</tr>' +
                  '<tr>' +
                    '<td>User-Name: </td>' +
                    '<td>' +
                        '<input id="UserName" type="text" style="display:none;" />' +
                        '<input id="UserName" class="real" type="text" value="' + dal.UserName() + '" />' +
                    '</td>' +
                    '<td />' +
                  '</tr>' +
                  '<tr>' +
                    '<td>Password: </td>' +
                    '<td>' +
                        '<input id="Password" type="password" style="display:none;" />' +
                        '<input id="Password" class="real" type="password" value="' + dal.Password() + '" />' +
                    '</td>' +
                    '<td />' +
                  '</tr>' +
                '</table>' +
               '</div>');

    var _selectivityValue = function (selector, value) {
        var $s = $d.find(selector);
        if (value) {
            $s.selectivity('value', value);
        } else {
            var values = $s.selectivity('value');
            return (values.length ? values[0] : null); //$d.find('#DatabaseName').val(),
        }
    };
    var _tryShowDatabaseNameRequestError = function (error) {
        var $dn = $d.find('#DatabaseName');
        $dn.parent().next('td').html('');
        $d.find('#DatabaseNameRequestError').remove();
        if (error) {
            $('<div id="DatabaseNameRequestError" title="error">' + error + '</div>').insertAfter($dn);
            $dn.selectivity('close');
        }
    };

    var _anySelectivityIsOpen = false;
    var _servers = dal.getServers();
    $d.find('#ServerName').selectivity({
        items: _servers.array,
        tokenSeparators: [' '],
        createTokenItem: function (text) {
            _selectivityValue('#ServerName', []);
            return ({ id: text, text: text });
        },
        multiple: true,
        placeholder: 'No server selected',
        value: (dal.ServerName() ? [dal.ServerName()] : [])
    })
    .on('selectivity-selecting', function () {
        _selectivityValue('#ServerName', []);
    })
    .on('selectivity-selected', function () {
        var o = _servers.getUserNameAndPasswordByServerName( _selectivityValue('#ServerName') );
        if (o) {
            $d.find('#UserName.real').val( o.UserName );
            $d.find('#Password.real').val( o.Password );
            _selectivityValue('#DatabaseName', (o.DatabaseName ? [o.DatabaseName] : []));

            commonArea.animate.opacity( $d.find('#UserName.real, #Password.real, #DatabaseName') );
        }
    })
    .on('selectivity-open', function () {
        _anySelectivityIsOpen = true;
    })
    .on('selectivity-close', function () {
        _anySelectivityIsOpen = false;
    })
    .find('input.selectivity-multiple-input').focusout(function () {
        var v1 = _selectivityValue('#ServerName'),
            v2 = $.trim($(this).val());
        if (!!v2 && v1 != (v2 || null)) {
            _selectivityValue('#ServerName', []);
            $d.find('#ServerName').selectivity('add', { id: v2, text: v2 });
        }
    });

    $d.find('#DatabaseName').selectivity({
        ajax: {
            formatError: function (term, jqXHR, textStatus, errorThrown) {
                var error = 'Failed to fetch results...';
                _tryShowDatabaseNameRequestError(error);
                return (error);
            },
            results: function (data, offset) {
                _tryShowDatabaseNameRequestError(data.error);
                if (!data.error && data.databases.length) {
                    $d.find('#DatabaseName').selectivity('open');
                }
                return {
                    results: (data.error ? [] : data.databases),
                    more: false
                };
            },
            url: function () {
                var o = {
                    ServerName: _selectivityValue('#ServerName'),
                    UserName  : $d.find('#UserName.real').val(),
                    Password  : $d.find('#Password.real').val()
                };
                return (dal.ToApiUrlGetDatabases(o));
            },
            dataType: 'json',
            minimumInputLength: 0
        },
        tokenSeparators: [' '],
        createTokenItem: function (text) {
            _selectivityValue('#DatabaseName', []);
            return ({ id: text, text: text });
        },
        multiple: true, 
        placeholder: 'No database selected',
        value: (dal.DatabaseName() ? [dal.DatabaseName()] : [])
        //, showSearchInputInDropdown: false
        //, allowClear: true
    })
    .on('selectivity-opening', function (e) {
        var $tdImg = $d.find('#DatabaseName').parent().next('td');
        if ($tdImg.find('img').length) {
            e.preventDefault();
            return;
        }

        var $s  = $d.find('#ServerName'),
            $td = $s.parent().next('td'),
            cancel = ($.trim(_selectivityValue('#ServerName')) == '');
        $td.html( (cancel ? requiredHtml : '') );
        var $s  = $d.find('#UserName.real');
            $td = $s.parent().next('td');
            cancel = ($.trim($s.val()) == '');
        $td.html( (cancel ? requiredHtml : '') );
        if (cancel) {
            e.preventDefault();
            return;
        }

        $tdImg.html('<img src="' + rollerImageUrl + '" title="loading..." />');
        $d.find('#DatabaseNameRequestError').remove();
    })
    .on('selectivity-selecting', function () {
        _selectivityValue('#DatabaseName', []);
    })
    .on('selectivity-open', function () {
        _anySelectivityIsOpen = true;
    })
    .on('selectivity-close', function () {
        _anySelectivityIsOpen = false;
    })
    .find('input.selectivity-multiple-input').focusout(function () {
        var v1 = _selectivityValue('#DatabaseName'),
            v2 = $.trim($(this).val());
        if (!!v2 && v1 != (v2 || null)) {
            _selectivityValue('#DatabaseName', []);
            $d.find('#DatabaseName').selectivity('add', { id: v2, text: v2 });
        }
    });

    var success = false;
    var _fnCheckYes = function (fnCheckYes) {
        var o = {
            ServerName  : _selectivityValue('#ServerName'),
            DatabaseName: _selectivityValue('#DatabaseName'),
            UserName    : $d.find('#UserName.real').val(),
            Password    : $d.find('#Password.real').val()
        };
        var $ia;
        if (!o.ServerName) {
            $ia = $d.find('#ServerName');
        } if (!o.DatabaseName) {
            $ia = $d.find('#DatabaseName');
        } if (!o.UserName) {
            $ia = $d.find('#UserName.real');
        } if ($ia) {
            $ia.parent().next('td').html( requiredHtml );
            return (false);
        }
        if (fnCheckYes(o) === false) {
            return (false);
        }
        success = true;
        return (true);
    };
    var _fnShow = function (fnCheckYes, fnYes, fnClose) {
        _notification.dialogConnection2DB({
            msg: $d,
            title: 'Connection to Database', buttonYes: 'Ok', buttonNo: 'Cancel',
            fnCheckYes: function () {
                return (_fnCheckYes( fnCheckYes ));
            },
            fnYes: fnYes, 
            fnClose: function () {
                fnClose(success);
            },
            size: { height: 480, width: 640 },
            eventDialogOpen: function (event, ui) {
                var $this = $(this);
                if (!_selectivityValue('#ServerName')) {
                    $this.find('#ServerName input.selectivity-multiple-input').css('width', '');
                }
                if (!_selectivityValue('#DatabaseName')) {
                    $this.find('#DatabaseName input.selectivity-multiple-input').css('width', '');
                }

                $d.keydown(function (ev) {
                    if (!_anySelectivityIsOpen) {
                        switch ((ev || event).keyCode) {
                            case 13:
                                $this.parent('.ui-dialog').find('.ui-dialog-buttonset button[ dialog-yes-button ]').click();
                                break;

                            case 27:
                                $this.parent('.ui-dialog').find('.ui-dialog-buttonset button[ dialog-no-button ]').click();
                                break;
                        }
                    }
                });
            }
        });
    };

    return ({
        Show: _fnShow
    });
};