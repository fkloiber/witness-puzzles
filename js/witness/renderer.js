W.renderer = (function() {
    'use strict';

    function getSvgElement(idOrElement) {
        if (typeof idOrElement === 'string') {
            return document.getElementById(idOrElement);
        }
        return idOrElement;
    }

    function clearElement(element) {
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }

    function getDimensionFromGridSize(size) {
        let numCells  = (size - 1) / 2;
        let dimension = 2 * (C.Dim.FieldBorder + C.Dim.FieldPadding);
        dimension += numCells * C.Dim.CellWidth;
        return dimension;
    }

    function createElement(name, _class) {
        let element = document.createElementNS('http://www.w3.org/2000/svg', name);
        if (_class) {
            element.classList.add(_class);
        }
        return element;
    }

    function createInto(parent, name, _class) {
        let element = document.createElementNS('http://www.w3.org/2000/svg', name);
        if (_class) {
            element.classList.add(_class);
        }
        parent.appendChild(element);
        return element;
    }

    function createRectInto(parent, _class, x, y, w, h) {
        let rect = createInto(parent, 'rect', _class);
        rect.setAttributeNS(null, 'x', x);
        rect.setAttributeNS(null, 'y', y);
        rect.setAttributeNS(null, 'width', w);
        rect.setAttributeNS(null, 'height', h);
        return rect;
    }

    function createCircleInto(parent, _class, x, y, r) {
        let circle = createInto(parent, 'circle', _class);
        circle.setAttributeNS(null, 'cx', x);
        circle.setAttributeNS(null, 'cy', y);
        circle.setAttributeNS(null, 'r', r);
        return circle;
    }

    function createGroupInto(parent, _class) {
        return createInto(parent, 'g', _class);
    }

    function createLineInto(parent, _class, x1, y1, x2, y2) {
        let line = createInto(parent, 'line', _class);
        line.setAttributeNS(null, 'x1', x1);
        line.setAttributeNS(null, 'y1', y1);
        line.setAttributeNS(null, 'x2', x2);
        line.setAttributeNS(null, 'y2', y2);
        return line;
    }

    function createReferenceInto(parent, _class, id, transform) {
        let ref = createInto(parent, 'use', _class);
        ref.setAttributeNS(null, 'href', 'img/obj.svg#' + id);
        ref.setAttributeNS(null, 'transform', transform);
        return ref;
    }

    let clipPathCounter = 0;
    function createLineGapClipPath(defs, x, y, isVertical) {
        let clipPath = createInto(defs, 'clipPath');
        let id       = 'clip-path-' + clipPathCounter++;
        clipPath.setAttributeNS(null, 'id', id);
        let width  = C.Dim.LineWidth + 2;
        let length = (C.Dim.CellWidth * (1 - C.Dim.LineGapPercent) + C.Dim.LineWidth) / 2 + 1;
        let x1     = x - C.Dim.LineWidth / 2 - 1;
        let y1     = y - C.Dim.LineWidth / 2 - 1;
        let w      = isVertical ? width : length;
        let h      = isVertical ? length : width;
        let x2     = isVertical ? x1 : x1 + C.Dim.CellWidth * (1 - C.Dim.LineGapPercent) + 2;
        let y2     = isVertical ? y1 + C.Dim.CellWidth * (1 - C.Dim.LineGapPercent) + 2 : y1;
        createRectInto(clipPath, null, x1, y1, w, h);
        createRectInto(clipPath, null, x2, y2, w, h);
        return id;
    }

    function drawLines(container, puzzle, defs, width, height, xDelta, yDelta) {
        for (let y = 0; y < height; ++y) {
            let yPos = C.Dim.FieldBorder + C.Dim.FieldPadding + y * C.Dim.CellWidth;
            for (let x = 0; x < width; ++x) {
                let xPos       = C.Dim.FieldBorder + C.Dim.FieldPadding + x * C.Dim.CellWidth;
                let line       = createLineInto(container, 'line', xPos, yPos, xPos + xDelta, yPos + yDelta);
                let isVertical = xDelta === 0;
                let data       = isVertical ? puzzle.getLineV(x, y) : puzzle.getLineH(x, y);
                if (data.kind === C.ObjKind.Gap) {
                    let clipPath = createLineGapClipPath(defs, xPos, yPos, isVertical);
                    line.setAttributeNS(null, 'clip-path', 'url(#' + clipPath + ')');
                }
            }
        }
    }

    function drawObject(container, object, x, y) {
        let xPos = C.Dim.FieldBorder + C.Dim.FieldPadding + C.Dim.CellWidth * x / 2;
        let yPos = C.Dim.FieldBorder + C.Dim.FieldPadding + C.Dim.CellWidth * y / 2;
        switch (object.kind) {
            case C.ObjKind.Square:
            case C.ObjKind.Star:
            case C.ObjKind.Elimination:
            case C.ObjKind.Triangle: {
                let id = object.kind;
                if (id === C.ObjKind.Triangle) {
                    id = 'triangle-' + object.count;
                }
                let transform = `translate(${xPos},${yPos}) scale(${C.Dim.CellObjectScale})`;
                createReferenceInto(container, object.color, id, transform);
                break;
            }
            case C.ObjKind.Hexagon: {
                let transform = `translate(${xPos},${yPos}) scale(${C.Dim.LineObjectScale})`;
                createReferenceInto(container, object.color, object.kind, transform);
                break;
            }
            case C.ObjKind.Gap: {
                break;
            }
            default: {
                L.error(`invalid object kind "${object.kind}" at (${x},${y})`);
                break;
            }
        }
    }

    function drawBackground(puzzle, layer) {
        L.time('log', 'drawBackground');
        let puzzleWidth  = getDimensionFromGridSize(puzzle.width);
        let puzzleHeight = getDimensionFromGridSize(puzzle.height);
        createRectInto(layer, 'border', 0, 0, puzzleWidth, puzzleHeight);
        let bg = createRectInto(
            layer, 'background', C.Dim.FieldBorder, C.Dim.FieldBorder, puzzleWidth - 2 * C.Dim.FieldBorder,
            puzzleWidth - 2 * C.Dim.FieldBorder);
        bg.setAttributeNS(null, 'rx', 5);
        bg.setAttributeNS(null, 'ry', 5);
        L.timeEnd('log', 'drawBackground');
    }

    function drawLinesInternal(puzzle, layer, defs /*, options = {}*/) {
        L.time('log', 'drawLinesInternal');
        drawLines(layer, puzzle, defs, puzzle.lineWidth, puzzle.cellHeight, 0, C.Dim.CellWidth);
        drawLines(layer, puzzle, defs, puzzle.cellWidth, puzzle.lineHeight, C.Dim.CellWidth, 0);
        L.timeEnd('log', 'drawLinesInternal');
    }

    function drawStartpointSelectors(puzzle, layer) {
        let selectors = layer.querySelectorAll(C.Class.PlaySelector);
        for (let i = 0; i < selectors.length; ++i) {
            layer.removeChild(selectors[i]);
        }
        let sp = puzzle.startPoints;
        for (let i = 0; i < sp.length; ++i) {
            let xPos = C.Dim.FieldBorder + C.Dim.FieldPadding + C.Dim.CellWidth * sp[i].x / 2;
            let yPos = C.Dim.FieldBorder + C.Dim.FieldPadding + C.Dim.CellWidth * sp[i].y / 2;
            createCircleInto(layer, C.Class.PlaySelector, xPos, yPos, C.Dim.StartPointRadius);
        }
    }

    function drawEndpointsInternal(puzzle, layer, selectorLayer) {
        L.time('log', 'drawEndpointsInternal');
        let sp = puzzle.startPoints;
        for (let i = 0; i < sp.length; ++i) {
            let xPos   = C.Dim.FieldBorder + C.Dim.FieldPadding + C.Dim.CellWidth * sp[i].x / 2;
            let yPos   = C.Dim.FieldBorder + C.Dim.FieldPadding + C.Dim.CellWidth * sp[i].y / 2;
            let circle = createCircleInto(layer, 'startpoint', xPos, yPos, C.Dim.StartPointRadius);
            circle.classList.add(`startpoint-${sp[i].x}-${sp[i].y}`);
        }
        drawStartpointSelectors(puzzle, selectorLayer);
        let ep = puzzle.endPoints;
        for (let i = 0; i < ep.length; ++i) {
            let xPos = C.Dim.FieldBorder + C.Dim.FieldPadding + C.Dim.CellWidth * ep[i].x / 2;
            let yPos = C.Dim.FieldBorder + C.Dim.FieldPadding + C.Dim.CellWidth * ep[i].y / 2;
            let line = createLineInto(layer, 'endpoint', 0, 0, C.Dim.EndLineLength, 0);
            line.classList.add(`endpoint-${ep[i].x}-${ep[i].y}`);
            let angle = C.Direction[ep[i].dir];
            line.setAttributeNS(null, 'transform', `translate(${xPos},${yPos}) rotate(${angle})`);
        }
        L.timeEnd('log', 'drawEndpointsInternal');
    }

    function drawObjectsInternal(puzzle, layer) {
        L.time('log', 'drawObjectsInternal');
        for (let y = 0; y < puzzle.height; ++y) {
            for (let x = 0; x < puzzle.width; ++x) {
                let object = puzzle.getGrid(x, y);
                if (object.kind) {
                    drawObject(layer, object, x, y);
                }
            }
        }
        L.timeEnd('log', 'drawObjectsInternal');
    }

    function drawButtons(layer, width) {
        let transform = `translate(${width - 40},40)`;
        createReferenceInto(layer, 'button', 'button-edit', transform);
        transform = `translate(${width - 90},40)`;
        createReferenceInto(layer, 'button', 'button-play', transform);
    }

    function drawLineSelectors(puzzle, layer) {
        for (let y = 0; y < puzzle.height; ++y) {
            for (let x = 0; x < puzzle.width; ++x) {
                let xPos = C.Dim.FieldBorder + C.Dim.FieldPadding + C.Dim.CellWidth * x / 2;
                let yPos = C.Dim.FieldBorder + C.Dim.FieldPadding + C.Dim.CellWidth * y / 2;
                let rx   = xPos - (x % 2 ? (C.Dim.CellWidth - C.Dim.LineWidth) / 2 : C.Dim.LineWidth / 2);
                let ry   = yPos - (y % 2 ? (C.Dim.CellWidth - C.Dim.LineWidth) / 2 : C.Dim.LineWidth / 2);
                let w    = (x % 2 ? C.Dim.CellWidth - C.Dim.LineWidth : C.Dim.LineWidth);
                let h    = (y % 2 ? C.Dim.CellWidth - C.Dim.LineWidth : C.Dim.LineWidth);

                let dx = x % 2, dy = y % 2;
                let typeClass;
                if (dx && dy) {
                    typeClass = 'select-cell';
                } else if (!dx && !dy) {
                    typeClass = 'select-node';
                } else {
                    typeClass = 'select-line';
                }

                let s = createRectInto(layer, C.Class.EditorSelector, rx, ry, w, h);
                s.classList.add(typeClass);
                s.setAttributeNS(null, C.Attr.GridX, x);
                s.setAttributeNS(null, C.Attr.GridY, y);
            }
        }
    }

    return {
        draw: function(puzzle, target = 'puzzle' /*, options = {}*/) {
            let svg = getSvgElement(target);

            L.groupCollapsed('info', `Rendering "${puzzle.name}" into element "${svg.id}"`);
            L.info('Rendering', puzzle, 'into', svg);
            L.time('info', 'rendering');

            clearElement(svg);
            svg.classList.add('puzzle');

            let puzzleWidth  = getDimensionFromGridSize(puzzle.width);
            let puzzleHeight = getDimensionFromGridSize(puzzle.height);
            svg.setAttributeNS(null, 'width', puzzleWidth);
            svg.setAttributeNS(null, 'height', puzzleHeight);

            let defs = createInto(svg, 'defs');

            let background = createGroupInto(svg, 'layer-background');
            let lines      = createGroupInto(svg, 'layer-lines');
            let endpoints  = createGroupInto(svg, 'layer-endpoints');
            let objects    = createGroupInto(svg, 'layer-objects');
            let selectors  = createGroupInto(svg, 'layer-selectors');
            let buttons    = createGroupInto(svg, 'layer-buttons');

            drawBackground(puzzle, background);
            drawLinesInternal(puzzle, lines, defs);
            drawEndpointsInternal(puzzle, endpoints, selectors);
            drawObjectsInternal(puzzle, objects);

            drawButtons(buttons, puzzleWidth);
            drawLineSelectors(puzzle, selectors);

            L.timeEnd('info', 'rendering');
            L.groupEnd();
        },
        redrawLines: function(puzzle, target = 'puzzle' /*, options = {}*/) {
            let svg   = getSvgElement(target);
            let layer = svg.getElementsByClassName('layer-lines')[0];
            let defs  = svg.getElementsByTagName('defs')[0];
            clearElement(layer);
            clearElement(defs);
            drawLinesInternal(puzzle, layer, defs);
        },
        redrawEndpoints: function(puzzle, target = 'puzzle' /*, options = {}*/) {
            let svg       = getSvgElement(target);
            let layer     = svg.getElementsByClassName('layer-endpoints')[0];
            let selectors = svg.getElementsByClassName('layer-selectors')[0];
            clearElement(layer);
            drawEndpointsInternal(puzzle, layer, selectors);
        },
        redrawObjects: function(puzzle, target = 'puzzle' /*, options = {}*/) {
            let svg      = getSvgElement(target);
            let layer    = svg.getElementsByClassName('layer-objects')[0];
            let newLayer = createElement('g', 'layer-objects');
            drawObjectsInternal(puzzle, newLayer);
            layer.parentElement.insertBefore(newLayer, layer);
            layer.parentElement.removeChild(layer);
        },
    };
})();
