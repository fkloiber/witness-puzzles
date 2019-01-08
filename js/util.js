window.U = (function() {
    'use strict';

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
