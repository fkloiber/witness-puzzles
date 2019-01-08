window.C = (function() {
    'use strict';

    let cellWidth = 76;
    let lineWidth = 24;

    return {
        ObjKind: {
            Gap: 'gap',
            Hexagon: 'hexagon',
            Square: 'square',
            Star: 'star',
            Elimination: 'elimination',
            Triangle: 'triangle',
        },
        Tool: {
            Gap: 'gap',
            StartPoint: 'startpoint',
            EndPoint: 'endpoint',
            Hexagon: 'hexagon',
            Square: 'square',
            Star: 'star',
            Elimination: 'elimination',
            Triangle: 'triangle',
        },
        SelMode: {
            Node: 'select-node',
            Line: 'select-line',
            Cell: 'select-cell',
        },
        Class: {
            EditorSelector: 'editor-selector',
            PlaySelector: 'play-selector',
        },
        Attr: {
            GridX: 'grid-x',
            GridY: 'grid-y',
        },
        Dim: {
            FieldBorder: 10,
            FieldPadding: 50,
            CellWidth: cellWidth,
            LineWidth: lineWidth,
            LineGapPercent: 0.25,
            StartPointRadius: lineWidth,
            EndLineLength: cellWidth / 4,
            CellObjectScale: (cellWidth - lineWidth) / 65,
            LineObjectScale: lineWidth / 25,
        },
        Direction: {
            E: 0,
            NE: -45,
            N: -90,
            NW: -135,
            W: -180,
            SW: -225,
            S: -270,
            SE: -315,
        },
        TrianglesMaxCount: 3,
    };
})();
