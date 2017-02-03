var DAL = (function ( cfg ) {
    var config = JSON.parse( JSON.stringify( cfg ) );
    var _ = {
        ServerName    : config.Model.ServerName,
        DatabaseName  : config.Model.DatabaseName,
        UserName      : config.Model.UserName,
        Password      : config.Model.Password,
        RootTableNames: config.Model.RootTableNames
    };
    var _Servers = {};

    var DATABASENAME_KEY = "\u0000-DatabaseName-\u0000";
    var USERNAME_KEY     = "\u0000-UserName-\u0000";
    var PASSWORD_KEY     = "\u0000-Password-\u0000";
    var _public = {
        ServerName    : function () { return (_.ServerName); },
        DatabaseName  : function () { return (_.DatabaseName); },
        UserName      : function () { return (_.UserName); },
        Password      : function () { return (_.Password); },
        SetConnectionParams: function (o) {
            _.ServerName   = o.ServerName;
            _.DatabaseName = o.DatabaseName;
            _.UserName     = o.UserName;
            _.Password     = o.Password;

            _.RootTableNames = (_.ServerName ? (_Servers[_.ServerName] || {})[_.DatabaseName] : null);
        },
        RootTableNames: function (rootTableNames) {
            if (rootTableNames !== undefined) {
                _.RootTableNames = rootTableNames;
            }
            return (_.RootTableNames);
        },

        getRootTableNamesHashSet: function () {
            var hs = {};
            if (_.RootTableNames) {
                _.RootTableNames.split(',').forEach(function (o) {
                    hs[o] = 1;
                });
            }
            return (hs);
        },
        /*getRootTableNamesByServerNameAndDatabaseName: function (serverName, databaseName) {
            var rootTableNames = (serverName ? (_Servers[serverName] || {})[databaseName] : null);
            return (rootTableNames || null);
        },*/
        getServers: function () {
            var a = [];
            for (var p in _Servers) {
                var server = $.trim(p);
                if (server != '') {
                    a.push(server);
                }
            }
            if (_.ServerName && a.indexOf(_.ServerName) == -1) {
                a.push(_.ServerName);
            }
            if (!_Servers[_.ServerName]) { _Servers[_.ServerName] = {}; }
            _Servers[_.ServerName][ DATABASENAME_KEY ] = _.DatabaseName;
            _Servers[_.ServerName][ USERNAME_KEY     ] = _.UserName;
            _Servers[_.ServerName][ PASSWORD_KEY     ] = _.Password;
            return ({
                array: a,
                getUserNameAndPasswordByServerName: function (serverName) {
                    var server = (serverName ? _Servers[ serverName ] : null);
                    return (server ? {
                        DatabaseName: server[DATABASENAME_KEY],
                        UserName    : server[USERNAME_KEY],
                        Password    : server[PASSWORD_KEY],
                    } : null);
                }                        
            });
        },

        IsEmpty: function () {
            return (!_.ServerName || !_.DatabaseName || !_.UserName);
        },
        ToUrlParams: function (size) {
            var p = "/" + encodeURIComponent(_.ServerName.replace('\\', '_XYZ_SLASH_ZYX_')) +
                    "/" + encodeURIComponent(_.DatabaseName);
            if (_.RootTableNames) {
                p += "/" + encodeURIComponent(_.RootTableNames);
            }
            p += "/?UserName=" + encodeURIComponent(_.UserName) +
                    "&Password=" + encodeURIComponent(_.Password);
            if (size) {
                p += "&GraphWidth=" + encodeURIComponent(parseInt(size.w)) +
                     "&GraphHeight=" + encodeURIComponent(parseInt(size.h));
            }
            /*
            $.cookie('UserName', _.UserName, { path: '/' });
            $.cookie('Password', _.Password, { path: '/' });
            $.cookie('GraphWidth', parseInt(size.w), { path: '/' });
            $.cookie('GraphHeight', parseInt(size.h), { path: '/' });
            */
            return (p);
        },
        ToApiUrlGetDatabases: function (o) {
            var p = "/" + encodeURIComponent((o || _).ServerName.replace('\\', '_XYZ_SLASH_ZYX_')) +
                    "/?UserName=" + encodeURIComponent((o || _).UserName) +
                    "&Password=" + encodeURIComponent((o || _).Password);
            return (config.URL_API_GET_DATABASES + p);
        },
        ToApiUrlGetTables: function () {
            return (config.URL_API_GET_TABLES + this.ToUrlParams());
        },
        ToApiUrlGetRefs: function (size) {
            return (config.URL_API_GET_REFS + this.ToUrlParams(size));
        },
        ToUrlV1: function (size) {
            return (config.URL_V1 + this.ToUrlParams(size));
        },
        ToUrlV2: function (size) {
            return (config.URL_V2 + this.ToUrlParams(size));
        },

        LoadFromLocalStorage: function () {
            var o = localStorageEx.DAL.load();
            if (o) {
                if (o.ActiveServer) {
                    if (!_.ServerName)   _.ServerName   = (o.ActiveServer.ServerName   || '').toString();
                    if (!_.DatabaseName) _.DatabaseName = (o.ActiveServer.DatabaseName || '').toString();
                    if (!_.UserName)     _.UserName     = (o.ActiveServer.UserName     || '').toString();
                    if (!_.Password)     _.Password     = (o.ActiveServer.Password     || '').toString();
                }
                if (typeof (o.Servers) == 'object') _Servers = o.Servers;
                /*if (!_.RootTableNames) {
                    var rootTableNames = (_Servers[_.ServerName] || {})[_.DatabaseName];
                    if (rootTableNames) {
                        _.RootTableNames = rootTableNames.toString();
                    }
                }*/
            }

            this.PutToView();
        },
        SaveToLocalStorage: function () {
            var o = {
                ActiveServer: JSON.parse(JSON.stringify(_)),
                Servers: _Servers
            };
            if (_.ServerName && _.DatabaseName) {
                if (!o.Servers[_.ServerName]) { o.Servers[_.ServerName] = {}; }
                o.Servers[_.ServerName][ DATABASENAME_KEY ] = _.DatabaseName;
                o.Servers[_.ServerName][ USERNAME_KEY     ] = _.UserName;
                o.Servers[_.ServerName][ PASSWORD_KEY     ] = _.Password;
                o.Servers[_.ServerName][_.DatabaseName    ] = _.RootTableNames;
            }
            delete o.ActiveServer.RootTableNames;
            localStorageEx.DAL.save(o);

            this.PutToView();
        },
        PutToView: function () {
            $('#ServerNameLabel').text((_.ServerName || '-').replace('_XYZ_SLASH_ZYX_', '\\'));
            $('#DatabaseNameLabel').text((_.DatabaseName || '-'));
            $('#UserNameLabel').text((_.UserName || '-'));
            $('#RootTableNameLabel').html((_.RootTableNames || "<i>All table in database</i>"));
        }
    };
    return (_public);
})(config);