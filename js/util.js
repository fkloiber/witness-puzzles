window.U = (function() {
    'use strict';

    window.data = {
        _storage: new WeakMap(),
        put: function(element, key, obj) {
            if (!this._storage.has(key)) {
                this._storage.set(element, new Map());
            }
            this._storage.get(element).set(key, obj);
        },
        get: function(element, key) {
            return this._storage.get(element).get(key);
        },
        has: function(element, key) {
            return this._storage.get(element).has(key);
        },
        remove: function(element, key) {
            let ret = this._storage.get(element).delete(key);
            if (this._storage.get(key).size !== 0) {
                this._storage.delete(element);
            }
            return ret;
        },
    };

    function toHex(i) {
        return ('0000000' + i.toString(16)).substr(-8);
    }

    function getUUID() {
        let data = new Uint32Array(4);
        crypto.getRandomValues(data);
        data[1] &= 0xffff0fff;
        data[1] |= 0x00004000;
        data[2] &= 0x3fffffff;
        data[2] |= 0x80000000;
        let result = toHex(data[0]) + '-' + toHex(data[1]) + '-' + toHex(data[2]) + toHex(data[3]);

        result = result.substr(0, 13) + '-' + result.substr(13, 9) + '-' + result.substr(22);
        return result;
    }

    return {
        SetPrefixUniqueClass: function(/** @type {HTMLElement} */ elem, /** @type {string} */ _class) {
            let prefix = _class.slice(0, _class.indexOf('-') + 1);

            for (let c of elem.classList.values()) {
                if (c.startsWith(prefix)) {
                    elem.classList.remove(c);
                }
            }

            elem.classList.add(_class);
        },
        RemoveClassFromChildren: function(/** @type {HTMLElement} */ parent, /** @type {string} */ _class) {
            if (_class == null) {
                return;
            }
            let selector = '.' + _class;
            let children = parent.querySelectorAll(selector);

            for (let elem of children) {
                elem.classList.remove(_class);
            }
        },
        GetUUID: getUUID,
    };
})();
