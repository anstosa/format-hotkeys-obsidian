'use strict';

var obsidian = require('obsidian');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    if (typeof b !== "function" && b !== null)
        throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

function __spreadArray(to, from) {
    for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
        to[j] = from[i];
    return to;
}

var isString = function (input) {
    return typeof input === "string" || input instanceof String;
};
/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} search            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 *
 * @author Vitim.us https://gist.github.com/victornpb/7736865
 * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
 * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
 */
var occurrences = function (string, search, allowOverlapping) {
    if (allowOverlapping === void 0) { allowOverlapping = false; }
    if (search.length <= 0) {
        return string.length + 1;
    }
    var n = 0;
    var pos = 0;
    var step = allowOverlapping ? 1 : search.length;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        pos = string.indexOf(search, pos);
        if (pos >= 0) {
            ++n;
            pos += step;
        }
        else {
            break;
        }
    }
    return n;
};

var REGEX_ANY = "^(\\s*)";
var REGEX_HEADING = "^(#+) ";
var REGEX_OL = "^(\\s*)\\d+\\. ";
var REGEX_QUOTE = "^>\\s*";
var REGEX_TODO = "^(\\s*)[-*] \\[[ xX]\\] ";
var REGEX_UL = "^(\\s*)([-*]) ";
var PREFIXES = [
    REGEX_HEADING,
    REGEX_OL,
    REGEX_QUOTE,
    REGEX_TODO,
    REGEX_UL,
];
var buildRegex = function (inputs, flags) {
    if (flags === void 0) { flags = "gm"; }
    if (isString(inputs)) {
        inputs = [inputs];
    }
    return new RegExp(inputs.join("|"), flags);
};
var matches = function (text, search) {
    if (isString(search)) {
        search = buildRegex(search);
    }
    return text.search(search) !== -1;
};
var getIndent = function (text) {
    var _a = text.match(REGEX_ANY) || [], indent = _a[1];
    return indent || "";
};

/**
 * Send tagged log message
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
var log = function (message) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    console.log.apply(console, __spreadArray(["[FormatHotkeys] " + message], args));
};

/**
 * Generate a Selection object based on the current state
 */
var getSelection = function (editor) {
    if (editor.somethingSelected()) {
        // if there is a selection, return it
        var cursorStart = editor.getCursor("from");
        var cursorEnd = editor.getCursor("to");
        var start = { line: cursorStart.line, ch: 0 };
        var end = {
            line: cursorEnd.line,
            ch: editor.getLine(cursorEnd.line).length,
        };
        var content = editor.getRange(start, end);
        return { start: start, end: end, content: content, hasSelection: true, editor: editor };
    }
    else {
        // otherwise select the current line
        var line = editor.getCursor().line;
        var contents = editor.getDoc().getLine(line);
        var start = { line: line, ch: 0 };
        var end = { line: line, ch: contents.length };
        var content = editor.getRange(start, end);
        var originalHead = editor.getCursor("head");
        return {
            start: start,
            end: end,
            content: content,
            hasSelection: false,
            editor: editor,
            originalHead: originalHead,
        };
    }
};
/**
 * Uses regex to get the nth line of a given selection content
 */
var getLineContent = function (line, content) {
    var _a = content.match(new RegExp("(.*\n?){" + line + "}(.*)(\n?)")) || [], match = _a[2];
    return match || "";
};
/**
 * Takes a Selection object and restores the cursor if applicable
 */
var restoreCursor = function (_a, content, updatedContent) {
    var start = _a.start, end = _a.end, editor = _a.editor, hasSelection = _a.hasSelection, originalHead = _a.originalHead;
    if (hasSelection) {
        editor.setSelection(start, {
            line: end.line,
            ch: editor.getLine(end.line).length,
        });
    }
    else if (originalHead) {
        var line = originalHead.line;
        var delta = 0;
        var relativeLine = originalHead.line - start.line;
        log("test", content, updatedContent);
        if (isString(content) && isString(updatedContent)) {
            delta =
                getLineContent(relativeLine, updatedContent).length -
                    getLineContent(relativeLine, content).length;
        }
        var ch = originalHead.ch + delta;
        editor.setSelection({ line: line, ch: ch });
    }
};
var prefixLines = function (_a) {
    var content = _a.content, prefix = _a.prefix, _b = _a.preserveIndent, preserveIndent = _b === void 0 ? false : _b, _c = _a.replace, replace = _c === void 0 ? [] : _c;
    if (preserveIndent) {
        var lines_1 = content.split("\n");
        lines_1.forEach(function (line, index) {
            var indent = getIndent(line);
            var content = line.replace(buildRegex(__spreadArray(__spreadArray([], replace), [REGEX_ANY])), "");
            lines_1[index] = "" + indent + prefix + content;
        });
        return lines_1.join("\n");
    }
    else {
        return content.replace(buildRegex(__spreadArray(__spreadArray([], replace), [REGEX_ANY])), prefix);
    }
};

var UL_CHAR = "-";
var FormatHotkeys = /** @class */ (function (_super) {
    __extends(FormatHotkeys, _super);
    function FormatHotkeys() {
        /**==================================
         * Event handlers
         **=================================*/
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.onload = function () {
            log("Loading...");
            _this.registerCommands();
            log("Loaded!");
        };
        _this.onunload = function () {
            log("Cleanly shutdown");
        };
        _this.registerCommands = function () {
            _this.addCommand({
                id: "fho-todo",
                name: "Toggle checklist for selection",
                callback: _this.toggleTodo,
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift"],
                        key: "6",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-quote",
                name: "Toggle blockquote for selection",
                callback: _this.toggleQuote,
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift"],
                        key: "9",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-ul",
                name: "Toggle bulleted List for selection",
                callback: _this.toggleUL,
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift"],
                        key: "8",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-ol",
                name: "Toggle numbered List for selection",
                callback: _this.toggleOL,
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift"],
                        key: "7",
                    },
                ],
            });
            // this.addCommand({
            //   id: "fho-strikethrough",
            //   name: "Toggle strikethrough for selection",
            //   callback: this.toggleStrike,
            //   hotkeys: [
            //     {
            //       modifiers: ["Alt", "Shift"],
            //       key: "5",
            //     },
            //   ],
            // });
            // this.addCommand({
            //   id: "fho-bold",
            //   name: "Toggle bold for selection",
            //   callback: this.toggleBold,
            //   hotkeys: [
            //     {
            //       modifiers: ["Mod"],
            //       key: "b",
            //     },
            //   ],
            // });
            // this.addCommand({
            //   id: "fho-italics",
            //   name: "Toggle italics for selection",
            //   callback: this.toggleItalics,
            //   hotkeys: [
            //     {
            //       modifiers: ["Mod"],
            //       key: "i",
            //     },
            //   ],
            // });
            _this.addCommand({
                id: "fho-normal",
                name: "Remove formatting",
                callback: _this.removeFormatting,
                hotkeys: [
                    {
                        modifiers: ["Mod", "Alt"],
                        key: "0",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-h1",
                name: "Apply Heading 1 to selection",
                callback: _this.getFormatHeading(1),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Alt"],
                        key: "1",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-h2",
                name: "Apply Heading 2 to selection",
                callback: _this.getFormatHeading(2),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Alt"],
                        key: "2",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-h3",
                name: "Apply Heading 3 to selection",
                callback: _this.getFormatHeading(3),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Alt"],
                        key: "3",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-h4",
                name: "Apply Heading 4 to selection",
                callback: _this.getFormatHeading(4),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Alt"],
                        key: "4",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-h5",
                name: "Apply Heading 5 to selection",
                callback: _this.getFormatHeading(5),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Alt"],
                        key: "5",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-h6",
                name: "Apply Heading 6 to selection",
                callback: _this.getFormatHeading(6),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Alt"],
                        key: "6",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-heading-increase",
                name: "Increase heading level",
                callback: _this.getIncrementHeadingLevel("+"),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift"],
                        key: "+",
                    },
                ],
            });
            _this.addCommand({
                id: "fho-head-decrease",
                name: "Decrease heading level",
                callback: _this.getIncrementHeadingLevel("-"),
                hotkeys: [
                    {
                        modifiers: ["Mod", "Shift"],
                        key: "-",
                    },
                ],
            });
        };
        /**==================================
         * Utility functions
         **=================================*/
        _this.getActiveEditor = function () {
            var _a;
            var workspace = _this.app.workspace;
            var activeView = workspace.getActiveViewOfType(obsidian.MarkdownView);
            return ((_a = activeView === null || activeView === void 0 ? void 0 : activeView.sourceMode) === null || _a === void 0 ? void 0 : _a.cmEditor) || null;
        };
        /**
         * Adds a prefix to the current selection or line
         *
         * replace: list of RegEx prefix patterns
         *          that should be replaced if they already exist
         *
         * prefix: the string prefix to add
         */
        _this.addPrefix = function (_a) {
            var _b = _a.replace, replace = _b === void 0 ? [] : _b, _c = _a.prefix, prefix = _c === void 0 ? "" : _c;
            var editor = _this.getActiveEditor();
            if (!editor) {
                return;
            }
            var selection = getSelection(editor);
            var start = selection.start, end = selection.end, content = selection.content;
            var updatedContent = prefixLines({
                content: content,
                prefix: prefix,
                replace: replace,
                preserveIndent: true,
            });
            editor.replaceRange(updatedContent, start, end);
            restoreCursor(selection, content, updatedContent);
        };
        /**
         * Removes prefixes from the current selection or line
         *
         * searches: list of RegEx prefix patterns
         *           that should be removed. Defaults to all prefixes
         */
        _this.removePrefix = function (_a) {
            var _b = _a === void 0 ? {} : _a, _c = _b.searches, searches = _c === void 0 ? PREFIXES : _c;
            var editor = _this.getActiveEditor();
            if (!editor) {
                return;
            }
            var selection = getSelection(editor);
            var start = selection.start, end = selection.end, content = selection.content;
            var updatedContent = content.replace(buildRegex(searches), "");
            editor.replaceRange(updatedContent, start, end);
            restoreCursor(selection, content, updatedContent);
        };
        _this.togglePrefix = function (_a) {
            var _b = _a.searches, searches = _b === void 0 ? [] : _b, _c = _a.replace, replace = _c === void 0 ? [] : _c, _d = _a.prefix, prefix = _d === void 0 ? "" : _d, remove = _a.remove, add = _a.add;
            var editor = _this.getActiveEditor();
            if (!editor) {
                return;
            }
            var selection = getSelection(editor);
            var content = selection.content;
            if (content
                .split("\n")
                .every(function (line) { return matches(line, buildRegex(searches || [prefix])); })) {
                // full match, remove prefixes
                (remove || _this.removePrefix)({ searches: searches });
            }
            else {
                // partially or no match. Add prefixes
                (add || _this.addPrefix)({
                    replace: __spreadArray(__spreadArray([], searches), replace),
                    prefix: prefix,
                });
            }
        };
        /**==================================
         * Command handlers
         **=================================*/
        _this.toggleTodo = function () {
            _this.togglePrefix({
                searches: [REGEX_TODO],
                prefix: UL_CHAR + " [ ] ",
                replace: [REGEX_OL, REGEX_UL],
            });
        };
        _this.toggleQuote = function () {
            return _this.togglePrefix({ searches: [REGEX_QUOTE], prefix: "> " });
        };
        _this.toggleOL = function () {
            _this.togglePrefix({
                searches: [REGEX_OL],
                replace: [REGEX_TODO, REGEX_UL],
                add: function (_a) {
                    var _b = _a.replace, replace = _b === void 0 ? [] : _b;
                    var editor = _this.getActiveEditor();
                    if (!editor) {
                        return;
                    }
                    var selection = getSelection(editor);
                    var start = selection.start, end = selection.end, content = selection.content;
                    // We have to do the loop our here (even though prefixLines can loop)
                    // in order to pull the number for the line from this context
                    var lines = content.split("\n");
                    lines.forEach(function (line, index) {
                        lines[index] = prefixLines({
                            content: line,
                            prefix: index + 1 + ". ",
                            preserveIndent: true,
                            replace: replace,
                        });
                    });
                    var updatedContent = lines.join("\n");
                    editor.replaceRange(updatedContent, start, end);
                    restoreCursor(selection, content, updatedContent);
                },
            });
        };
        _this.toggleUL = function () {
            _this.togglePrefix({
                searches: [REGEX_UL],
                prefix: UL_CHAR + " ",
                replace: [REGEX_TODO, REGEX_OL],
            });
        };
        _this.removeFormatting = function () {
            _this.removePrefix();
        };
        _this.getFormatHeading = function (level) { return function () {
            _this.addPrefix({
                replace: PREFIXES,
                prefix: __spreadArray(__spreadArray([], new Array(level).fill("#")), [" "]).join(""),
            });
        }; };
        _this.getIncrementHeadingLevel = function (direction) { return function () {
            var editor = _this.getActiveEditor();
            if (!editor) {
                return;
            }
            var selection = getSelection(editor);
            var start = selection.start, end = selection.end, content = selection.content;
            var lines = content.split("\n");
            lines.forEach(function (line, index) {
                var currentHeading = line.match(REGEX_HEADING);
                if (currentHeading) {
                    // get the current heading level
                    var level = occurrences(currentHeading[1], "#");
                    if (level === 1 && direction === "+") ;
                    else if (level > 1 && direction === "+") {
                        // going up and not at the top, remove a #
                        lines[index] = line.substring(1);
                    }
                    else if (level < 6) {
                        // going down and not at the bottom, add a #
                        lines[index] = "#" + line;
                    }
                    else if (level === 6) {
                        // going down and at the bottom, remove all # and padding space
                        lines[index] = line.substring(7);
                    }
                }
                else {
                    // No heading yet.
                    // Do nothing if decreasing
                    // Step up to h6 if increasing
                    lines[index] = "" + (direction === "+" ? "###### " : "") + line;
                }
            });
            var updatedContent = lines.join("\n");
            editor.replaceRange(updatedContent, start, end);
            restoreCursor(selection, content, updatedContent);
        }; };
        return _this;
    }
    return FormatHotkeys;
}(obsidian.Plugin));

module.exports = FormatHotkeys;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFpbi5qcyIsInNvdXJjZXMiOltdLCJzb3VyY2VzQ29udGVudCI6W10sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7In0=
