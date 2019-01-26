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
            for (let y = 0; y < this.height; ++y) {
                for (let x = 0; x < this.width; ++x) {
                    let i = y * this.width + x;

                    this.data[i] = {};
                    if (x % 2) {
                        if (y % 2) {
                            this.data[i].cell = true;
                        } else {
                            this.data[i].line = 'h';
                        }
                    } else if (y % 2) {
                        this.data[i].line = 'v';
                    } else {
                        this.data[i].node = true;
                    }
                }
            }
            if (this.topology === C.Topology.Pillar) {
                if (!this.symmetry.pillar && !this.symmetry.vertical) {
                    this.getGrid(0, this.height - 1).startPoint = true;
                    this.getGrid(0, 0).endPoint                 = 'N';
                } else if (!this.symmetry.pillar && this.symmetry.vertical) {
                    this.getGrid(0, 0).startPoint                          = true;
                    this.getGrid(0, this.height - 1).startPoint            = true;
                    this.getGrid(this.width / 2, 0).endPoint               = 'N';
                    this.getGrid(this.width / 2, this.height - 1).endPoint = 'S';
                } else if (this.symmetry.pillar) {
                    if (this.cellWidth % 2) {
                        throw 'A pillar puzzle with pillar symmetry and an odd width can never be solvable';
                    }
                    if (!this.symmetry.vertical) {
                        this.getGrid(0, this.height - 1).startPoint              = true;
                        this.getGrid(this.width / 2, this.height - 1).startPoint = true;
                        this.getGrid(0, 0).endPoint                              = 'N';
                        this.getGrid(this.width / 2, 0).endPoint                 = 'N';
                    } else {
                        this.getGrid(0, 0).startPoint                          = true;
                        this.getGrid(0, this.height - 1).startPoint            = true;
                        this.getGrid(this.width / 2, 0).endPoint               = 'N';
                        this.getGrid(this.width / 2, this.height - 1).endPoint = 'S';
                    }
                }
            } else {
                if (!this.symmetry.horizontal && !this.symmetry.vertical) {
                    this.getGrid(0, this.height - 1).startPoint = true;
                    this.getGrid(this.width - 1, 0).endPoint    = 'NE';
                } else if (this.symmetry.horizontal && !this.symmetry.vertical) {
                    this.getGrid(0, this.height - 1).startPoint              = true;
                    this.getGrid(this.width - 1, this.height - 1).startPoint = true;
                    this.getGrid(0, 0).endPoint                              = 'N';
                    this.getGrid(this.width - 1, 0).endPoint                 = 'N';
                } else if (!this.symmetry.horizontal && this.symmetry.vertical) {
                    this.getGrid(0, 0).startPoint                          = true;
                    this.getGrid(0, this.height - 1).startPoint            = true;
                    this.getGrid(this.width - 1, 0).endPoint               = 'E';
                    this.getGrid(this.width - 1, this.height - 1).endPoint = 'E';
                } else {
                    this.getGrid(0, this.height - 1).startPoint            = true;
                    this.getGrid(this.width - 1, 0).startPoint             = true;
                    this.getGrid(0, 0).endPoint                            = 'NW';
                    this.getGrid(this.width - 1, this.height - 1).endPoint = 'SE';
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

        getGrid(x, y) {
            if (y < 0 || y >= this.height) {
                return {};
            } else if (x < 0 || x >= this.width) {
                if (this.topology === C.Topology.Pillar) {
                    if (x < 0) {
                        x += this.width;
                    } else {
                        x -= this.width;
                    }
                } else {
                    return {};
                }
            }
            let idx = y * this.width + x;
            return this.data[idx];
        }
        setGrid(x, y, obj) {
            let idx        = y * this.width + x;
            this.data[idx] = obj;
        }

        getSymmetricPoint(x, y) {
            let result = {
                x: x,
                y: y,
            };

            if (this.symmetry.vertical) {
                result.y = this.height - y - 1;
            }
            if (this.symmetry.horizontal) {
                result.x = this.width - x - 1;
            }
            if (this.symmetry.pillar) {
                result.x += this.width / 2;
                if (result.x >= this.width) {
                    result.x -= this.width;
                }
            }

            return result;
        }
    };
    return Puzzle;
})();
