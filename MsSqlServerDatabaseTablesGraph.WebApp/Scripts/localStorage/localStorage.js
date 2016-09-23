if (typeof localStorage !== 'object') {
    localStorage = {};
}

(function () {
    'use strict';

    if (typeof localStorage.getItem === 'undefined') {
        localStorage.getItem = function (key) {
            //$.get(...)
            return (localStorageArray[key]);
        }
    }

    if (typeof localStorage.setItem === 'undefined') {
        localStorage.setItem = function (key, data) {
            //$.post(...)
            localStorageArray[key] = data;
        }
    }
}());

var localStorageEx = {
    verticalSpliter: {
        position: function (pos) {
            if (pos) {
                localStorage.setItem(this.KEY, pos);
            } else {
                pos = parseInt(localStorage.getItem(this.KEY));
                return (pos ? pos : 300);
            }
        },
        isCollapsed: function (collapsed) {
            if (collapsed !== undefined) {
                if (!!collapsed)
                    localStorage.setItem(this.KEY_ISCOLLAPSED, true);
                else
                    localStorage.removeItem(this.KEY_ISCOLLAPSED);
            } else {
                return (!!localStorage.getItem(this.KEY_ISCOLLAPSED));
            }
        },
        KEY: "sql-graph-splitpos",
        KEY_ISCOLLAPSED: "sql-graph-splitcollapse"
    },
    gvm: {
        load: function () {
            try {
                return (JSON.parse(localStorage.getItem(this.KEY)));
            } catch (e) {
                return (null);
            }
        },
        save: function (o) {
            localStorage.setItem(this.KEY, JSON.stringify(o));
        },
        KEY: "sql-graph-vm"
    },
    DAL: {
        load: function () {
            try {
                return (JSON.parse(localStorage.getItem(this.KEY)));
            } catch (e) {
                return (null);
            }
        },
        save: function (o) {
            localStorage.setItem(this.KEY, JSON.stringify(o));
        },
        KEY: "sql-graph-dal"
    }
};