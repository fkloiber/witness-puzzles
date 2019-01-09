W.tests = (function() {
    'use strict';

    let tests = [
        new Puzzle(1, 1),
        Puzzle.fromJSON(
            '{"width":1,"height":1,"data":[{},{},{},{},{},{},{},{},{}],"startPoints":[{"x":0,"y":2}],"endPoints":[{"x":2,"y":0,"dir":"NE"}]}'),
        Puzzle.fromJSON(
            '{"width":1,"height":1,"data":[{},{},{},{},{},{},{},{},{}],"startPoints":[{"x":0,"y":2}],"endPoints":[{"x":2,"y":0,"dir":"N"}]}'),
        Puzzle.fromJSON(
            '{"width":1,"height":1,"data":[{},{},{},{},{},{},{},{},{}],"startPoints":[{"x":0,"y":2}],"endPoints":[{"x":2,"y":0,"dir":"E"}]}'),
        Puzzle.fromJSON(
            '{"width":1,"height":1,"data":[{},{},{},{},{},{},{},{},{}],"startPoints":[{"x":1,"y":2}],"endPoints":[{"x":1,"y":0,"dir":"N"}]}'),
        Puzzle.fromJSON(
            '{"width":1,"height":1,"data":[{},{},{},{},{},{},{},{},{}],"startPoints":[{"x":0,"y":1}],"endPoints":[{"x":1,"y":0,"dir":"S"}]}'),
        Puzzle.fromJSON(
            '{"width":3,"height":2,"data":[{"kind":"hexagon","color":"red"},{"kind":"hexagon","color":"green"},{},{},{},{},{},{"kind":"hexagon","color":"blue"},{"kind":"square","color":"black"},{},{"kind":"star","color":"white"},{},{"kind":"elimination","color":"yellow"},{},{},{},{},{},{},{},{},{},{"kind":"triangle","color":"orange","count":1},{},{"kind":"triangle","color":"orange","count":2},{},{"kind":"triangle","color":"purple","count":3},{},{},{},{},{},{},{},{}],"startPoints":[{"x":0,"y":4}],"endPoints":[{"x":6,"y":0,"dir":"NE"}]}'),
    ];

    return {
        run: function() {
            let container = document.getElementById('tests');
            let idnr      = 0;
            tests.forEach(puzzle => {
                let svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                let id  = 'test-' + idnr++;
                svg.id  = id;
                container.appendChild(svg);
                W.renderer.draw(puzzle, id);
            });
        },
    };
})();
