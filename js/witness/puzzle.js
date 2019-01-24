window.Puzzle = (function() {
    'use strict';

    let defaultSymmetry = {
        horizontal: false,
        vertical: false,
        pillar: false,
        differentLines: false,
    };

    let Puzzle = class Puzzle {
        constructor(cellW, cellH, name = C.NewPuzzleName, options = {}) {
            this.width      = cellW * 2 + 1;
            this.height     = cellH * 2 + 1;
            this.cellWidth  = cellW;
            this.cellHeight = cellH;
            this.lineWidth  = cellW + 1;
            this.lineHeight = cellH + 1;

            this.name = name;

            this.symmetry = options.symmetry || defaultSymmetry;
            this.topology = options.topology || C.Topology.Plane;

            if (this.topology === C.Topology.Pillar) {
                this.width -= 1;
                this.lineWidth -= 1;
            }

            this.data = [];
            for (let i = 0; i < this.width * this.height; ++i) {
                this.data[i] = {};
            }
            if (this.topology === C.Topology.Pillar) {
                if (!this.symmetry.pillar && !this.symmetry.vertical) {
                    this.startPoints = [
                        {
                            x: 0,
                            y: this.height - 1,
                        },
                    ];
                    this.endPoints = [
                        {
                            x: 0,
                            y: 0,
                            dir: 'N',
                        },
                    ];
                } else if (!this.symmetry.pillar && this.symmetry.vertical) {
                    this.startPoints = [
                        {
                            x: 0,
                            y: 0,
                        },
                        {
                            x: 0,
                            y: this.height - 1,
                        },
                    ];
                    this.endPoints = [
                        {
                            x: this.width / 2,
                            y: 0,
                            dir: 'N',
                        },
                        {
                            x: this.width / 2,
                            y: this.height - 1,
                            dir: 'S',
                        },
                    ];
                } else if (this.symmetry.pillar) {
                    if (this.cellWidth % 2 === 1) {
                        throw 'A pillar puzzle with pillar symmetry and an odd width can never be solvable';
                    }
                    if (!this.symmetry.vertical) {
                        this.startPoints = [
                            {
                                x: 0,
                                y: this.height - 1,
                            },
                            {
                                x: this.width / 2,
                                y: this.height - 1,
                            },
                        ];
                        this.endPoints = [
                            {
                                x: 0,
                                y: 0,
                                dir: 'N',
                            },
                            {
                                x: this.width / 2,
                                y: 0,
                                dir: 'N',
                            },
                        ];
                    } else {
                        this.startPoints = [
                            {
                                x: 0,
                                y: 0,
                            },
                            {
                                x: 0,
                                y: this.height - 1,
                            },
                        ];
                        this.endPoints = [
                            {
                                x: this.width / 2,
                                y: 0,
                                dir: 'N',
                            },
                            {
                                x: this.width / 2,
                                y: this.height - 1,
                                dir: 'S',
                            },
                        ];
                    }
                }
            } else {
                if (!this.symmetry.horizontal && !this.symmetry.vertical) {
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
                } else if (this.symmetry.horizontal && !this.symmetry.vertical) {
                    this.startPoints = [
                        {
                            x: 0,
                            y: this.height - 1,
                        },
                        {
                            x: this.width - 1,
                            y: this.height - 1,
                        },
                    ];
                    this.endPoints = [
                        {
                            x: 0,
                            y: 0,
                            dir: 'N',
                        },
                        {
                            x: this.width - 1,
                            y: 0,
                            dir: 'N',
                        },
                    ];
                } else if (!this.symmetry.horizontal && this.symmetry.vertical) {
                    this.startPoints = [
                        {
                            x: 0,
                            y: 0,
                        },
                        {
                            x: 0,
                            y: this.height - 1,
                        },
                    ];
                    this.endPoints = [
                        {
                            x: this.width - 1,
                            y: 0,
                            dir: 'E',
                        },
                        {
                            x: this.width - 1,
                            y: this.height - 1,
                            dir: 'E',
                        },
                    ];
                } else {
                    this.startPoints = [
                        {
                            x: 0,
                            y: this.height - 1,
                        },
                        {
                            x: this.width - 1,
                            y: 0,
                        },
                    ];
                    this.endPoints = [
                        {
                            x: 0,
                            y: 0,
                            dir: 'NW',
                        },
                        {
                            x: this.width - 1,
                            y: this.height - 1,
                            dir: 'SE',
                        },
                    ];
                }
            }
        }

        toJSON() {
            return {
                width: this.cellWidth,
                height: this.cellHeight,
                name: this.name,
                symmetry: this.symmetry,
                topology: this.topology,
                data: this.data,
                startPoints: this.startPoints,
                endPoints: this.endPoints,
            };
        }
        serialize() {
            let data = JSON.stringify(this.toJSON());

            data = pako.gzip(data, {
                level: 9,
            });

            return base64.encodeUint8Array(data);
        }

        static fromJSON(data) {
            if (typeof data === 'string') {
                data = JSON.parse(data);
            }
            let puzzle = new Puzzle(data.width, data.height, data.name || C.NewPuzzleName, {
                symmetry: data.symmetry || defaultSymmetry,
                topology: data.topology || C.Topology.Plane,
            });

            puzzle.data        = data.data;
            puzzle.startPoints = data.startPoints;
            puzzle.endPoints   = data.endPoints;

            return puzzle;
        }
        static deserialize(data) {
            data = base64.decodeToUint8Array(data);
            data = pako.ungzip(data, {
                to: 'string',
            });

            return Puzzle.fromJSON(data);
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
