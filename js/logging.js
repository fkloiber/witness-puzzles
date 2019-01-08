window.L = (function() {
    'use strict';

    const logLevels = {
        fatal: 0,
        error: 1,
        warning: 2,
        info: 3,
        log: 4,
    };

    let currentLogLevel;

    function stub() {}

    function fatal(msg, ...args) {
        if (args.length) {
            console.error(...args);
        }
        throw msg;
    }

    function assert(cond, ...args) {
        if (currentLogLevel < logLevels.error) {
            return;
        }
        if (!cond) {
            L.error(...args);
        }
        return cond;
    }

    function assertFatal(cond, ...args) {
        if (currentLogLevel < logLevels.fatal) {
            return;
        }
        if (!cond) {
            L.fatal(...args);
        }
    }

    let groupStack = [];

    function getSkipFunction(f) {
        return function(level, ...args) {
            if (typeof level === 'string') {
                if (!(level in logLevels)) {
                    L.error('invalid log level');
                    level = logLevels.log;
                } else {
                    level = logLevels[level];
                }
            }
            let skip = currentLogLevel < level;
            f(skip, level, ...args);
        };
    }

    function getGroupFunction(f) {
        return getSkipFunction(function(skip, level, label) 
            {
                let entry  = {};
                entry.skip = skip;
                if (skip) {
                    entry.logLevel = currentLogLevel;
                    L.setLogLevel(level - 1);
                } else {
                    f(label);
                }
                groupStack.push(entry);
            });
    }

    let group          = getGroupFunction(console.group);
    let groupCollapsed = getGroupFunction(console.groupCollapsed);

    function groupEnd() {
            let entry = groupStack.pop();
            if (entry.skip) {
                L.setLogLevel(entry.logLevel);
            } else {
                console.groupEnd();
            }
    }

    let time = getSkipFunction(function (skip, level, ...args){
            if (skip) {
                return;
            }
            console.time(...args);
    });

    let timeEnd = getSkipFunction(function (skip, level, ...args){
            if (skip) {
                return;
            }
            console.timeEnd(...args);
    });

    return {
        setLogLevel: function(level) {
            if (typeof level === 'string') {
                if (!(level in logLevels)) {
                    L.fatal('Invalid log level');
                }
                level = logLevels[level];
            }
            L.log     = stub;
            L.info    = stub;
            L.warning = stub;
            L.error   = stub;

            /* jshint -W086 */  // (missing break before case)
            switch (level) {
                default:
                case logLevels.log:
                    L.log = console.log;
                case logLevels.info:
                    L.info = console.info;
                case logLevels.warning:
                    L.warning = console.warn;
                case logLevels.error:
                    L.error = console.error;
                case logLevels.fatal:
            }
            /* jshint +W086 */

            currentLogLevel = level;
        },
        log: stub,
        info: stub,
        warning: stub,
        error: stub,
        fatal,

        assert,
        assertFatal,

        group,
        groupCollapsed,
        groupEnd,

        time,
        timeEnd,
    };
    })();

    L.setLogLevel('info');
