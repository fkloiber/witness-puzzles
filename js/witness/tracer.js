// Cheers love, the cavalry's here!!
W.tracer = (function() {
    'use strict';

    function getSvgElement(idOrElement) {
        if (typeof idOrElement === 'string') {
            return document.getElementById(idOrElement);
        }
        return idOrElement;
    }

    return {
        prepareTracing: function(target = 'puzzle') {
            let svg = getSvgElement(target);

            svg.classList.add('play');
        },
    };
})();
// Ever get that feeling of déjà vu?
