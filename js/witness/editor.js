W.editor = (function() {
    'use strict';

    /** @type {HTMLElement} */
    let title;
    /** @type {HTMLElement} */
    let toolsMenu;
    /** @type {HTMLSVGElement} */
    let panel;
    /** @type {HTMLElement} */
    let toolButtons;
    /** @type {HTMLElement} */
    let colorButtons;
    /** @type {HTMLInputElement} */
    let inputPuzzleWidth;
    /** @type {HTMLInputElement} */
    let inputPuzzleHeight;

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
            handleEndPoints(x, y);
            return;
        }

        let object = puzzle.getGrid(x, y);
        let obj_bu = JSON.stringify(object);

        switch (currentTool) {
            case C.Tool.Gap: {
                if (object.kind === C.ObjKind.Gap) {
                    object = {};
                } else {
                    object.kind = C.ObjKind.Gap;
                }
                break;
            }
            case C.Tool.Triangle: {
                if (object.kind === C.ObjKind.Triangle && object.color === currentColor) {
                    if (object.count === C.TrianglesMaxCount) {
                        object = {};
                    } else {
                        object.count += 1;
                    }
                } else {
                    if (object.kind === C.ObjKind.Triangle) {
                        object.color = currentColor;
                    } else {
                        object = {
                            kind: currentTool,
                            color: currentColor,
                            count: 1,
                        };
                    }
                }
                break;
            }
            case C.Tool.Hexagon:
            case C.Tool.Square:
            case C.Tool.Star:
            case C.Tool.Elimination: {
                if (object.kind === currentTool && object.color === currentColor) {
                    object = {};
                } else {
                    object = {
                        kind: currentTool,
                        color: currentColor,
                    };
                }
                break;
            }
            case C.Tool.StartPoint:
            case C.Tool.EndPoint:
        }

        L.log(`Setting (${x},${y}) to ${currentTool}; old: ${obj_bu}; new: ${JSON.stringify(object)}`);
        puzzle.setGrid(x, y, object);

        switch (currentTool) {
            case C.Tool.Gap: {
                W.renderer.redrawLines(puzzle, panel);
                break;
            }
            case C.Tool.Triangle:
            case C.Tool.Hexagon:
            case C.Tool.Square:
            case C.Tool.Star:
            case C.Tool.Elimination: {
                W.renderer.redrawObjects(puzzle, panel);
                break;
            }
            case C.Tool.StartPoint:
            case C.Tool.EndPoint: {
                W.renderer.redrawEndpoints(puzzle, panel);
                break;
            }
        }
    }

    function setupTitleEventHandlers() {
        title.addEventListener('input', function(e) {
            L.log(e);
        });
    }

    function setupClickHandlers() {
        panel.addEventListener('click', handleSelectorClick);
        toolButtons.addEventListener('click', handleToolButton);
        colorButtons.addEventListener('click', handleColorButton);

        let reveal = document.querySelectorAll('.reveal-toggle');
        reveal.forEach((elem) => {
            elem.addEventListener('click', (e) => {
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
    }

    function setTitle(newTitle) {
        title.innerText = newTitle;
        document.title  = newTitle;
    }

    return {
        edit: function(p) {
            puzzle = p;

            title        = document.getElementById('title');
            toolsMenu    = document.getElementById('tools-menu');
            toolButtons  = document.getElementById('tool-buttons');
            colorButtons = document.getElementById('color-buttons');
            panel        = document.getElementById('puzzle');
            panel.classList.add('edit');

            setTitle(puzzle.name);

            setupTitleEventHandlers();
            setupClickHandlers();
            handleToolButton({
                target: toolButtons.querySelector('.btn'),
            });
            handleColorButton({
                target: colorButtons.querySelector('.btn'),
            });
        },
    };
})();
