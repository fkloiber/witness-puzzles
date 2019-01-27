// Cheers love, the cavalry's here!!
W.tracer = (function() {
    'use strict';

    function getSvgElement(idOrElement) {
        if (typeof idOrElement === 'string') {
            return document.getElementById(idOrElement);
        }
        return idOrElement;
    }

    function startTracing(e) {
        let sp = e.target;
        let x  = parseInt(sp.getAttribute('grid-x'), 10);
        let y  = parseInt(sp.getAttribute('grid-y'), 10);
        L.info(`Starting tracing from ${x}, ${y}`);
    }

    return {
        prepareTracing: function(target = 'puzzle') {
            let svg = getSvgElement(target);

            svg.classList.add('play');
            svg.classList.remove('edit');
            svg.classList.remove('select-node');
            svg.classList.remove('select-line');
            svg.classList.remove('select-cell');
            for (let sp of svg.querySelectorAll('.play-selector')) {
                sp.addEventListener('click', startTracing);
            }
        },
    };
})();
// Ever get that feeling of déjà vu?
