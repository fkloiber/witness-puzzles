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
    };
})();
