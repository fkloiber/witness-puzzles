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
        let dimension = 2 * (C.Dim.FieldBorder + C.Dim.FieldPadding);
        dimension += size * C.Dim.CellWidth;
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

    function createLocalReferenceInto(parent, _class, id, transform) {
        let ref = createInto(parent, 'use', _class);
        ref.setAttributeNS(null, 'href', '#' + id);
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
        let puzzleWidth  = getDimensionFromGridSize(puzzle.cellWidth);
        let puzzleHeight = getDimensionFromGridSize(puzzle.cellHeight);
        createRectInto(layer, 'border', 0, 0, puzzleWidth, puzzleHeight);
        let bg = createRectInto(
            layer, 'background', C.Dim.FieldBorder, C.Dim.FieldBorder, puzzleWidth - 2 * C.Dim.FieldBorder,
            puzzleHeight - 2 * C.Dim.FieldBorder);
        bg.setAttributeNS(null, 'rx', 5);
        bg.setAttributeNS(null, 'ry', 5);
    }

    function drawPillarBackground(puzzle, layer) {
        let puzzleWidth  = getDimensionFromGridSize(puzzle.cellWidth);
        let puzzleHeight = getDimensionFromGridSize(puzzle.cellHeight);
        createRectInto(layer, 'border', 0, 0, puzzleWidth, puzzleHeight);
        createRectInto(layer, 'background', 0, C.Dim.FieldBorder, puzzleWidth, puzzleHeight - 2 * C.Dim.FieldBorder);
    }

    function drawLinesInternal(puzzle, layer, defs /*, options = {}*/) {
        drawLines(layer, puzzle, defs, puzzle.lineWidth, puzzle.cellHeight, 0, C.Dim.CellWidth);
        drawLines(layer, puzzle, defs, puzzle.cellWidth, puzzle.lineHeight, C.Dim.CellWidth, 0);
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
    }

    function drawObjectsInternal(puzzle, layer) {
        for (let y = 0; y < puzzle.height; ++y) {
            for (let x = 0; x < puzzle.width; ++x) {
                let object = puzzle.getGrid(x, y);
                if (object.kind) {
                    drawObject(layer, object, x, y);
                }
            }
        }
    }

    /*
    function drawButtons(layer, width) {
        let transform = `translate(${width - 40},40)`;
        createReferenceInto(layer, 'button', 'button-edit', transform);
        transform = `translate(${width - 90},40)`;
        createReferenceInto(layer, 'button', 'button-play', transform);
    }
    //*/

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

    let refIdNr = 0;
    function getReferenceId() {
        return 'ref-' + refIdNr++;
    }

    function createStop(gradient, offset, opacity) {
        let stop = createInto(gradient, 'stop');
        stop.setAttributeNS(null, 'offset', offset);
        stop.setAttributeNS(null, 'stop-color', 'white');
        stop.setAttributeNS(null, 'stop-opacity', opacity);
    }

    function createMaskGradient(defs, puzzle) {
        let id       = getReferenceId();
        let gradient = createElement('linearGradient');
        gradient.id  = id;

        let totalWidth   = getDimensionFromGridSize(puzzle.cellWidth);
        let runningWidth = C.Dim.FieldBorder + C.Dim.FieldPadding - C.Dim.LineWidth / 2;

        createStop(gradient, 0, 0);
        createStop(gradient, runningWidth / totalWidth, 1);
        runningWidth += C.Dim.CellWidth * puzzle.cellWidth + C.Dim.LineWidth;
        createStop(gradient, runningWidth / totalWidth, 1);
        createStop(gradient, 1, 0);

        defs.appendChild(gradient);
        return id;
    }

    function createMask(defs, gradientId, puzzle) {
        let id   = getReferenceId();
        let mask = createInto(defs, 'mask');
        mask.id  = id;

        let width  = getDimensionFromGridSize(puzzle.cellWidth);
        let height = getDimensionFromGridSize(puzzle.cellHeight);
        let rect   = createRectInto(mask, null, 0, 0, width, height);
        rect.setAttributeNS(null, 'fill', `url(#${gradientId})`);

        return id;
    }

    function restructureForPillarRendering(svg, puzzle) {
        // move the layers containing the puzzle objects into a wrapper
        // in the defs instead of having them naked in the svg
        let defs = svg.querySelector('defs');

        let refWrapper = createGroupInto(defs, 'refwrapper');
        let wrapperId  = getReferenceId();
        refWrapper.id  = wrapperId;

        let ref = createGroupInto(refWrapper, 'ref');
        let id  = getReferenceId();
        ref.id  = id;

        ref.appendChild(svg.querySelector('.layer-lines'));
        ref.appendChild(svg.querySelector('.layer-endpoints'));
        ref.appendChild(svg.querySelector('.layer-objects'));
        ref.appendChild(svg.querySelector('.layer-selectors'));

        // repeat the reference in left and right tiles
        let deltaX = puzzle.cellWidth * C.Dim.CellWidth;

        createLocalReferenceInto(refWrapper, 'ref', id, `translate(${- deltaX},0)`);
        createLocalReferenceInto(refWrapper, 'ref', id, `translate(${deltaX},0)`);

        let useWrapper  = createGroupInto(svg, 'usewrapper');
        let moveWrapper = createLocalReferenceInto(useWrapper, 'ref', wrapperId, `translate(0,0)`);

        // create a mask to blend the repeating pillar tiles onto the static background
        let gradientId = createMaskGradient(defs, puzzle);
        let maskId     = createMask(defs, gradientId, puzzle);

        // apply mask
        useWrapper.setAttributeNS(null, 'mask', `url(#${maskId})`);

        function preventEventAction(e) {
            e.preventDefault();
            return false;
        }
        svg.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            return false;
        });
        let oldClientX, oldTransformX = 0, currentTransformX = 0;
        svg.addEventListener('pointerdown', function(e) {
            if (e.pointerType === 'mouse' && e.buttons === 2) {
                svg.setPointerCapture(e.pointerId);
                oldClientX = e.clientX;
            }
            e.preventDefault();
            return false;
        });
        function pointermoveHandler(e) {
            currentTransformX = (oldTransformX + e.clientX - oldClientX) % deltaX;
            if (currentTransformX < 0) {
                currentTransformX += deltaX;
            }
            if (currentTransformX > deltaX / 2) {
                currentTransformX -= deltaX;
            }
            moveWrapper.setAttributeNS(null, 'transform', `translate(${currentTransformX})`);
        }
        svg.addEventListener('gotpointercapture', function() {
            svg.classList.add('dragging');
            svg.addEventListener('pointermove', pointermoveHandler);
            document.documentElement.addEventListener('contextmenu', preventEventAction);
        });
        svg.addEventListener('lostpointercapture', function() {
            svg.classList.remove('dragging');
            svg.removeEventListener('pointermove', pointermoveHandler);
            window.setTimeout(function() {
                document.documentElement.removeEventListener('contextmenu', preventEventAction);
            }, 10);
            oldTransformX = currentTransformX;
        });
    }

    function createElementFromString(str) {
        let wrapper       = document.createElement('div');
        wrapper.innerHTML = str;
        return wrapper.firstElementChild;
    }

    function fetchReference(url, cache) {
        let request = new XMLHttpRequest();

        request.onreadystatechange = () => {
            if (request.readyState === XMLHttpRequest.DONE) {
                let doc    = request.responseText;
                cache[url] = createElementFromString(doc);
            }
        };
        request.open('GET', url, false);
        request.send();
        return cache[url];
    }

    function inlineUseElements(elem, cache = {}, reference = null) {
        let passReference = reference != null;
        if (elem.nodeName === 'use') {
            let match = /(.*)#(.*)/.exec(elem.getAttributeNS(null, 'href'));
            if (match[1] === '' && reference == null) {
                return;
            }
            reference = reference || cache[match[1]] || fetchReference(match[1], cache);
            let group = createElement('g');
            elem.parentElement.insertBefore(group, elem);
            let _class = elem.getAttributeNS(null, 'class');
            if (_class) {
                group.setAttributeNS(null, 'class', _class);
            }
            let transform = elem.getAttributeNS(null, 'transform');
            if (transform) {
                group.setAttributeNS(null, 'transform', transform);
            }
            group.parentElement.removeChild(elem);
            let object = reference.querySelector('#' + match[2]).cloneNode(true);
            group.appendChild(object);
            elem          = group;
            passReference = true;
        }
        for (let i = 0; i < elem.children.length; ++i) {
            inlineUseElements(elem.children[i], cache, passReference ? reference : null);
        }
    }

    function applyStyleRecursive(/** @type {HTMLElement} */ elem) {
        let style          = getComputedStyle(elem);
        elem.style.cssText = style.cssText;
        for (let i = 0; i < elem.children.length; ++i) {
            applyStyleRecursive(elem.children[i]);
        }
    }

    return {
        draw: function(puzzle, target = 'puzzle' /*, options = {}*/) {
            let svg = getSvgElement(target);
            if (!svg.parentElement.classList.contains('svg-wrapper')) {
                let wrapper = document.createElement('div');
                wrapper.classList.add('svg-wrapper');
                svg.parentElement.insertBefore(wrapper, svg);
                wrapper.appendChild(svg);
            }

            data.put(svg, 'puzzle', puzzle);

            L.groupCollapsed('info', `Rendering "${puzzle.name}" into element "${svg.id}"`);
            L.info('Rendering', puzzle, 'into', svg);
            L.time('info', 'rendering');

            clearElement(svg);
            svg.classList.add('puzzle');

            let puzzleWidth  = getDimensionFromGridSize(puzzle.cellWidth);
            let puzzleHeight = getDimensionFromGridSize(puzzle.cellHeight);
            svg.setAttributeNS(null, 'width', puzzleWidth);
            svg.setAttributeNS(null, 'height', puzzleHeight);

            let defs = createInto(svg, 'defs');

            let background = createGroupInto(svg, 'layer-background');
            let lines      = createGroupInto(svg, 'layer-lines');
            let endpoints  = createGroupInto(svg, 'layer-endpoints');
            let objects    = createGroupInto(svg, 'layer-objects');
            let selectors  = createGroupInto(svg, 'layer-selectors');
            // let buttons    = createGroupInto(svg, 'layer-buttons');

            drawBackground(puzzle, background);
            drawLinesInternal(puzzle, lines, defs);
            drawEndpointsInternal(puzzle, endpoints, selectors);
            drawObjectsInternal(puzzle, objects);

            // drawButtons(buttons, puzzleWidth);
            drawLineSelectors(puzzle, selectors);

            if (puzzle.topology === C.Topology.Pillar) {
                restructureForPillarRendering(svg, puzzle);
                clearElement(background);
                drawPillarBackground(puzzle, background);
            }

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
        saveImage: function(target = 'puzzle', scale = 1) {
            let svg = getSvgElement(target);
            svg     = svg.cloneNode(true);
            document.body.appendChild(svg);
            inlineUseElements(svg);
            applyStyleRecursive(svg);
            document.body.removeChild(svg);
            let img       = new Image();
            let xml       = new XMLSerializer().serializeToString(svg);
            let data      = 'data:image/svg+xml;base64,' + btoa(xml);
            let canvas    = document.createElement('canvas');
            canvas.width  = svg.getAttributeNS(null, 'width');
            canvas.height = svg.getAttributeNS(null, 'height');
            let ctx       = canvas.getContext('2d');

            canvas.style.display = 'none';
            document.body.appendChild(canvas);

            document.body.appendChild(img);
            img.onload = () => {
                ctx.drawImage(img, 0, 0);
                ctx.getImageData(0, 0, canvas.width, canvas.height);
                let uri = canvas.toDataURL('image/png', 0.8);

                let saveLink = document.createElement('a');

                saveLink.download      = 'puzzle.png';
                saveLink.style.display = 'none';
                document.body.appendChild(saveLink);
                saveLink.onclick = () => {

                };
                saveLink.href = uri;
                saveLink.click();
                document.body.removeChild(saveLink);
                document.body.removeChild(img);
                document.body.removeChild(canvas);
            };
            img.src = data;
            /*saveSvgAsPng(svg, 'test.png', {
                scale: scale,
            });*/
        },
    };
})();
