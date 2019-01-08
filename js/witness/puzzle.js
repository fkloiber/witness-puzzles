window.Puzzle = (function() {
    'use strict';
    let Puzzle = class Puzzle {
        constructor(cellW, cellH, name = 'Unnamed Puzzle') {
            this.width      = cellW * 2 + 1;
            this.height     = cellH * 2 + 1;
            this.cellWidth  = cellW;
            this.cellHeight = cellH;
            this.lineWidth  = cellW + 1;
            this.lineHeight = cellH + 1;

            this.options = {};
            this.name    = name;

            this.data = [];
            for (let i = 0; i < this.width * this.height; ++i) {
                this.data[i] = {};
            }
            this.startPoints = [
                {
                    x: 0,
                    y: this.height - 1,
                },
            ];
            this.endPoints = [
                {
                    x: this.width - 1,
                    y: 0,
                    dir: 'NE',
                },
            ];
        }

        serialize() {
            let data = JSON.stringify({
                width: this.cellWidth,
                height: this.cellHeight,
                options: this.options,
                name: this.name,
                data: this.data,
                startPoints: this.startPoints,
                endPoints: this.endPoints,
            });

            data = pako.gzip(data, {
                level: 9,
            });

            return base64.encodeUint8Array(data);
        }

        static deserialize(data) {
            data = base64.decodeToUint8Array(data);
            data = pako.ungzip(data, {
                to: 'string',
            });
            data = JSON.parse(data);

            let puzzle = new Puzzle(data.width, data.height);

            puzzle.options     = data.options;
            puzzle.data        = data.data;
            puzzle.name        = data.name;
            puzzle.startPoints = data.startPoints;
            puzzle.endPoints   = data.endPoints;

            return puzzle;
        }

        get(idx) {
            return this.data[idx];
        }
        set(idx, obj) {
            this.data[idx] = obj;
        }
        getGrid(x, y) {
            let idx = y * this.width + x;
            return this.data[idx];
        }
        setGrid(x, y, obj) {
            let idx        = y * this.width + x;
            this.data[idx] = obj;
        }
        getCell(x, y) {
            let idx = (y * 2 + 1) * this.width + x * 2 + 1;
            return this.data[idx];
        }
        setCell(x, y, obj) {
            let idx        = (y * 2 + 1) * this.width + x * 2 + 1;
            this.data[idx] = obj;
        }
        getLineV(x, y) {
            let idx = (y * 2 + 1) * this.width + x * 2;
            return this.data[idx];
        }
        setLineV(x, y, obj) {
            let idx        = (y * 2 + 1) * this.width + x * 2;
            this.data[idx] = obj;
        }
        getLineH(x, y) {
            let idx = y * 2 * this.width + x * 2 + 1;
            return this.data[idx];
        }
        setLineH(x, y, obj) {
            let idx        = y * 2 * this.width + x * 2 + 1;
            this.data[idx] = obj;
        }
        getNode(x, y) {
            let idx = y * 2 * this.width + x * 2;
            return this.data[idx];
        }
        setNode(x, y, obj) {
            let idx        = y * 2 * this.width + x * 2;
            this.data[idx] = obj;
        }
    };
    return Puzzle;
})();
