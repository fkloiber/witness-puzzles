W.editor = (function() {
    'use strict';

    /** @type {HTMLElement} */
    let title;
    /** @type {HTMLElement} */
    let toolsMenu;
    /** @type {SVGSVGElement} */
    let panel;
    /** @type {HTMLElement} */
    let toolButtons;
    /** @type {HTMLElement} */
    let colorButtons;

    /** @type {HTMLInputElement} */
    let inputPuzzleWidth;
    /** @type {HTMLInputElement} */
    let inputPuzzleHeight;
    /** @type {HTMLInputElement} */
    let inputSymmetryH;
    /** @type {HTMLInputElement} */
    let inputSymmetryV;
    /** @type {HTMLInputElement} */
    let inputSymmetryP;
    /** @type {HTMLInputElement} */
    let inputSymmetryDL;
    /** @type {HTMLInputElement} */
    let inputTopoPlane;
    /** @type {HTMLInputElement} */
    let inputTopoPillar;

    let puzzle;
    let currentTool, currentSelectionMode;
    let currentColor = 'black';

    function changeSelectionMode(newMode) {
        if (currentSelectionMode) {
            if (Array.isArray(currentSelectionMode)) {
                DOMTokenList.prototype.remove.apply(panel.classList, currentSelectionMode);
            } else {
                panel.classList.remove(currentSelectionMode);
            }
        }

        currentSelectionMode = newMode;

        if (currentSelectionMode) {
            if (Array.isArray(currentSelectionMode)) {
                DOMTokenList.prototype.add.apply(panel.classList, currentSelectionMode);
            } else {
                panel.classList.add(currentSelectionMode);
            }
        }
    }

    function checkIfSelectorApplies(selector) {
        let classes = selector.classList;
        for (let i = 0; i < classes.length; ++i) {
            let c = classes[i];
            if (c.startsWith('select-') && panel.classList.contains(c)) {
                return true;
            }
        }
        return false;
    }

    let colors = [
        'black-elem',
        'white-elem',
        'red-elem',
        'orange-elem',
        'yellow-elem',
        'green-elem',
        'blue-elem',
        'purple-elem',
    ];
    function getColorNameFromClassList(list) {
        let theColor = null;
        colors.forEach(function(c) {
            if (list.contains(c)) {
                theColor = c;
            }
        });
        return theColor;
    }

    function handleToolButton(e) {
        if (!e.target.classList.contains('btn')) {
            return;
        }
        currentTool = e.target.id;
        U.RemoveClassFromChildren(toolButtons, 'selected');
        e.target.classList.add('selected');

        let newSelectionMode;
        switch (currentTool) {
            case C.Tool.Gap:
                newSelectionMode = C.SelMode.Line;
                break;
            case C.Tool.Hexagon:
            case C.Tool.StartPoint:
            case C.Tool.EndPoint:
                newSelectionMode = [
                    C.SelMode.Node,
                    C.SelMode.Line,
                ];
                break;
            case C.Tool.Square:
            case C.Tool.Star:
            case C.Tool.Elimination:
            case C.Tool.Triangle:
                newSelectionMode = C.SelMode.Cell;
                break;
            default:
                throw `Invalid tool id ${currentTool}`;
        }
        changeSelectionMode(newSelectionMode);
    }

    function handleColorButton(/** @type {MouseEvent} */ e) {
        if (!e.target.classList.contains('btn')) {
            return;
        }
        let newColor = getColorNameFromClassList(e.target.classList);
        if (newColor == null) {
            L.error(`Clicked color button, but couldn't detect color (${e.target.className})`);
            return;
        }
        U.RemoveClassFromChildren(toolButtons, currentColor);
        currentColor = newColor.slice(0, newColor.indexOf('-'));
        U.RemoveClassFromChildren(colorButtons, 'selected');
        e.target.classList.add('selected');

        toolButtons.querySelectorAll('.tool-btn svg').forEach(function(e) {
            e.classList.add(currentColor);
        });
    }

    function canToggleStartPoint(x, y, isSymmetric) {
        let result = !((x % 2) && (y % 2));

        if (isSymmetric) {
            let sp = puzzle.getSymmetricPoint(x, y);
            result = result && !(x === sp.x && y === sp.y);
        }

        return result;
    }

    function doToggleStartPoint(x, y, isSymmetric) {
        let e  = puzzle.getGrid(x, y);
        let sp = puzzle.getSymmetricPoint(x, y);
        let e2 = puzzle.getGrid(sp.x, sp.y);
        if (e.startPoint) {
            e.startPoint = undefined;
            if (isSymmetric) {
                e2.startPoint = undefined;
            }
        } else {
            e.startPoint = true;
            if (isSymmetric) {
                e2.startPoint = true;
            }
        }
    }

    function handleStartPoint(x, y) {
        let isSymmetric = puzzle.symmetry.horizontal || puzzle.symmetry.vertical || puzzle.symmetry.pillar;
        let success     = true;
        if (isSymmetric) {
            let sp  = puzzle.getSymmetricPoint(x, y);
            success = success && canToggleStartPoint(sp.x, sp.y, true);
        }
        success = success && canToggleStartPoint(x, y, isSymmetric);
        if (success) {
            doToggleStartPoint(x, y, isSymmetric);
        }
    }

    function canToggleEndPoint(x, y, isSymmetric) {
        let result = !((x % 2) && (y % 2));

        if (isSymmetric) {
            let sp = puzzle.getSymmetricPoint(x, y);
            result = result && !(x === sp.x && y === sp.y);
        }

        return result;
    }

    function getNextDirection(dir) {
        switch (dir) {
            case undefined:
                return 'N';
            case 'N':
                return 'NE';
            case 'NE':
                return 'E';
            case 'E':
                return 'SE';
            case 'SE':
                return 'S';
            case 'S':
                return 'SW';
            case 'SW':
                return 'W';
            case 'W':
                return 'NW';
            default:
            case 'NW':
                return undefined;
        }
    }

    function canDirectionFit(x, y, dir) {
        if (dir === undefined) {
            return true;
        }
        let e = puzzle.getGrid(x, y);
        if (e.line) {
            if (e.line === 'h') {
                return dir === 'N' || dir === 'S';
            } else if (e.line === 'v') {
                return dir === 'E' || dir === 'W';
            }
        } else if (e.node) {
            let gridPositionsToCheck = [];
            if (['NW', 'N', 'NE'].includes(dir)) {
                gridPositionsToCheck.push([x, y - 1]);
            }
            if (['N', 'NE', 'E'].includes(dir)) {
                gridPositionsToCheck.push([x + 1, y - 1]);
            }
            if (['NE', 'E', 'SE'].includes(dir)) {
                gridPositionsToCheck.push([x + 1, y]);
            }
            if (['E', 'SE', 'S'].includes(dir)) {
                gridPositionsToCheck.push([x + 1, y + 1]);
            }
            if (['SE', 'S', 'SW'].includes(dir)) {
                gridPositionsToCheck.push([x, y + 1]);
            }
            if (['S', 'SW', 'W'].includes(dir)) {
                gridPositionsToCheck.push([x - 1, y + 1]);
            }
            if (['SW', 'W', 'NW'].includes(dir)) {
                gridPositionsToCheck.push([x - 1, y]);
            }
            if (['W', 'NW', 'N'].includes(dir)) {
                gridPositionsToCheck.push([x - 1, y - 1]);
            }
            for (let pos of gridPositionsToCheck) {
                let el = puzzle.getGrid(pos[0], pos[1]);
                if (el.line) {
                    return false;
                }
            }
            return true;
        }
    }

    function getNextWorkingDirection(x, y, dir) {
        do {
            dir = getNextDirection(dir);
        } while (!canDirectionFit(x, y, dir));
        return dir;
    }

    function doToggleEndPoint(x, y, isSymmetric) {
        let e  = puzzle.getGrid(x, y);
        let sp = puzzle.getSymmetricPoint(x, y);
        let e2 = puzzle.getGrid(sp.x, sp.y);

        while (true) {
            let candidateDirection = getNextWorkingDirection(x, y, e.endPoint);
            if (isSymmetric) {
                let symmetricDirection = puzzle.getSymmetricDirection(candidateDirection);
                if (!canDirectionFit(sp.x, sp.y, symmetricDirection)) {
                    continue;
                }
                e2.endPoint = symmetricDirection;
            }
            e.endPoint = candidateDirection;
            break;
        }
    }

    function handleEndPoint(x, y) {
        let isSymmetric = puzzle.symmetry.horizontal || puzzle.symmetry.vertical || puzzle.symmetry.pillar;
        let success     = true;
        if (isSymmetric) {
            let sp  = puzzle.getSymmetricPoint(x, y);
            success = success && canToggleEndPoint(sp.x, sp.y, true);
        }
        success = success && canToggleEndPoint(x, y, isSymmetric);
        if (success) {
            doToggleEndPoint(x, y, isSymmetric);
        }
    }

    function handleSelectorClick(/** @type {MouseEvent} */ e) {
        if (!e.target.classList.contains(C.Class.EditorSelector)) {
            return;
        }
        let selector = e.target;
        if (!checkIfSelectorApplies(selector)) {
            return;
        }

        let x = parseInt(selector.getAttributeNS(null, C.Attr.GridX), 10);
        let y = parseInt(selector.getAttributeNS(null, C.Attr.GridY), 10);

        if (currentTool === C.Tool.StartPoint || currentTool === C.Tool.EndPoint) {
            if (currentTool === C.Tool.StartPoint) {
                handleStartPoint(x, y);
            } else {
                handleEndPoint(x, y);
            }
        }

        let object = puzzle.getGrid(x, y);
        let obj_bu = JSON.stringify(object);

        switch (currentTool) {
            case C.Tool.Gap: {
                if (object.kind === C.ObjKind.Gap) {
                    object.kind = undefined;
                } else {
                    object.kind = C.ObjKind.Gap;
                }
                break;
            }
            case C.Tool.Triangle: {
                if (object.kind === C.ObjKind.Triangle && object.color === currentColor) {
                    if (object.count === C.TrianglesMaxCount) {
                        object.kind  = undefined;
                        object.color = undefined;
                        object.count = undefined;
                    } else {
                        object.count += 1;
                    }
                } else {
                    if (object.kind === C.ObjKind.Triangle) {
                        object.color = currentColor;
                    } else {
                        object.kind  = currentTool;
                        object.color = currentColor;
                        object.count = 1;
                    }
                }
                break;
            }
            case C.Tool.Hexagon:
            case C.Tool.Square:
            case C.Tool.Star:
            case C.Tool.Elimination: {
                if (object.kind === currentTool && object.color === currentColor) {
                    object.kind  = undefined;
                    object.color = undefined;
                } else {
                    object.kind  = currentTool;
                    object.color = currentColor;
                }
                break;
            }
            case C.Tool.StartPoint:
            case C.Tool.EndPoint:
        }

        L.log(`Setting (${x},${y}) to ${currentTool}; old: ${obj_bu}; new: ${JSON.stringify(object)}`);
        puzzle.setGrid(x, y, object);

        W.renderer.draw(puzzle, panel);
    }

    function setTitle(newTitle) {
        title.innerText = newTitle;
        document.title  = newTitle;
    }

    const maxTitleLength = 30;
    function canInsertIntoTitle(chunk) {
        let titleText = title.innerText;
        let selection = getSelection();
        if (selection.isCollapsed) {
            return titleText.length + chunk.length <= maxTitleLength;
        }
        let range = selection.getRangeAt(0);
        if (!title.contains(range.commonAncestorContainer)) {
            return false;
        }
        return titleText.length - (range.endOffset - range.startOffset) + chunk.length <= maxTitleLength;
    }

    function setupTitleEventHandlers() {
        let permittedCharacters = 'a-zA-Z0-9_\\-.';
        let rejectFilter        = new RegExp(`[^${permittedCharacters}]`, 'g');

        title.addEventListener('keypress', function(e) {
            if (e.key.length !== 1 || rejectFilter.test(e.key)) {
                e.stopPropagation();
                e.preventDefault();
                if (e.key === 'Enter') {
                    title.blur();
                }
                return;
            }
            rejectFilter.lastIndex = 0;

            if (!canInsertIntoTitle(e.key)) {
                e.stopPropagation();
                e.preventDefault();
            }
        });
        title.addEventListener('paste', (e) => {
            e.stopPropagation();
            e.preventDefault();

            let clipboardData      = e.clipboardData || window.clipboardData;
            let text               = clipboardData.getData('Text').replace(rejectFilter, '');
            rejectFilter.lastIndex = 0;

            if (canInsertIntoTitle(text)) {
                let range = getSelection().getRangeAt(0);
                range.deleteContents();
                range.insertNode(document.createTextNode(text));
                range.collapse();
            }
        });
        title.addEventListener('blur', () => {
            setTitle(title.innerText);
        });
        title.addEventListener('dragstart', (e) => {
            e.preventDefault();
        });
    }

    function openPuzzle(p) {
        puzzle = p;

        inputPuzzleWidth.value  = puzzle.cellWidth;
        inputPuzzleHeight.value = puzzle.cellHeight;

        inputSymmetryH.checked  = puzzle.symmetry.horizontal;
        inputSymmetryV.checked  = puzzle.symmetry.vertical;
        inputSymmetryP.checked  = puzzle.symmetry.pillar;
        inputSymmetryDL.checked = puzzle.symmetry.differentLines;

        if (puzzle.topology === C.Topology.Pillar) {
            inputTopoPillar.checked = true;
        } else {
            inputTopoPlane.checked = true;
        }

        W.renderer.draw(puzzle, panel);
        setTitle(puzzle.name);

        handleToolButton({
            target: toolButtons.querySelector('.btn'),
        });
        handleColorButton({
            target: colorButtons.querySelector('.btn'),
        });
    }

    function getSettings() {
        let symmetry = {
            horizontal: inputSymmetryH.checked,
            vertical: inputSymmetryV.checked,
            pillar: inputSymmetryP.checked,
            differentLines: inputSymmetryDL.checked,
        };
        let op = {
            width: parseInt(inputPuzzleWidth.value, 10),
            height: parseInt(inputPuzzleHeight.value, 10),
            symmetry: symmetry,
            topology: inputTopoPillar.checked ? C.Topology.Pillar : C.Topology.Plane,
        };
        return op;
    }

    function handleNewButton() {
        let options = getSettings();

        let p = new Puzzle(options.width, options.height, C.NewPuzzleName, options);
        openPuzzle(p);
    }

    function setupClickHandlers() {
        panel.addEventListener('click', handleSelectorClick);
        toolButtons.addEventListener('click', handleToolButton);
        colorButtons.addEventListener('click', handleColorButton);

        let reveal = document.querySelectorAll('.reveal-toggle');
        reveal.forEach((elem) => {
            elem.addEventListener('click', () => {
                let content = elem.parentElement.querySelector('.toggleable');
                let toggles = elem.parentElement.querySelectorAll('.reveal-toggle');
                toggles.forEach((e) => {
                    e.classList.toggle('visible');
                });
                if (content.style.maxHeight) {
                    content.style.maxHeight = null;
                } else {
                    content.style.maxHeight = content.scrollHeight + 'px';
                }
            });
        });

        document.getElementById('button-new').addEventListener('click', handleNewButton);
        document.getElementById('button-play').addEventListener('click', () => {
            W.tracer.prepareTracing();
        });
    }

    return {
        init: function() {
            title             = document.getElementById('title');
            toolsMenu         = document.getElementById('tools-menu');
            toolButtons       = document.getElementById('tool-buttons');
            colorButtons      = document.getElementById('color-buttons');
            panel             = document.getElementById('puzzle');
            inputPuzzleWidth  = document.getElementById('puzzle-width');
            inputPuzzleHeight = document.getElementById('puzzle-height');
            inputSymmetryH    = document.getElementById('sym-h');
            inputSymmetryV    = document.getElementById('sym-v');
            inputSymmetryP    = document.getElementById('sym-p');
            inputSymmetryDL   = document.getElementById('sym-c');
            inputTopoPlane    = document.getElementById('topo-plane');
            inputTopoPillar   = document.getElementById('topo-pillar');

            panel.classList.add('edit');

            setupTitleEventHandlers();
            setupClickHandlers();

            let params = (new URL(document.location)).searchParams;
            let b64    = params.get('p');
            let p;
            try {
                p = Puzzle.deserialize(b64);
            } catch (e) {
                p = new Puzzle(4, 4);
            }

            openPuzzle(p);
        },
        getPuzzle: function() {
            return puzzle;
        }
    };
})();
