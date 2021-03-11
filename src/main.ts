import {
  buildRegex,
  matches,
  PREFIXES,
  REGEX_OL,
  REGEX_QUOTE,
  REGEX_TODO,
  REGEX_UL,
} from "./regex";
import { each, every, times } from "lodash";
import { Editor } from "codemirror";
import { getSelection, prefixLines, restoreCursor } from "./codemirror";
import { log } from "./log";
import { MarkdownView, Plugin } from "obsidian";

const UL_CHAR = "-";

interface AddPrefix {
  replace?: string[];
  prefix?: string;
}

interface RemovePrefix {
  searches?: string[];
}

interface TogglePrefix extends AddPrefix, RemovePrefix {
  add?: (options: AddPrefix) => void;
  remove?: (options: RemovePrefix) => void;
}
export default class FormatHotkeys extends Plugin {
  /**==================================
   * Event handlers
   **=================================*/

  onload = (): void => {
    log("Loading...");
    this.registerCommands();
    log("Loaded!");
  };

  onunload = (): void => {
    log("Cleanly shutdown");
  };

  registerCommands = (): void => {
    this.addCommand({
      id: "fho-todo",
      name: "Toggle checklist for selection",
      callback: this.toggleTodo,
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "6",
        },
      ],
    });

    this.addCommand({
      id: "fho-quote",
      name: "Toggle blockquote for selection",
      callback: this.toggleQuote,
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "9",
        },
      ],
    });

    this.addCommand({
      id: "fho-ul",
      name: "Toggle bulleted List for selection",
      callback: this.toggleUL,
      hotkeys: [
        {
          modifiers: ["Mod", "Shift"],
          key: "8",
        },
      ],
    });

    this.addCommand({
      id: "fho-ol",
      name: "Toggle numbered List for selection",
      callback: this.toggleOL,
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

    this.addCommand({
      id: "fho-normal",
      name: "Remove formatting",
      callback: this.removeFormatting,
      hotkeys: [
        {
          modifiers: ["Mod", "Alt"],
          key: "0",
        },
      ],
    });

    this.addCommand({
      id: "fho-h1",
      name: "Apply Heading 1 to selection",
      callback: this.getFormatHeading(1),
      hotkeys: [
        {
          modifiers: ["Mod", "Alt"],
          key: "1",
        },
      ],
    });

    this.addCommand({
      id: "fho-h2",
      name: "Apply Heading 2 to selection",
      callback: this.getFormatHeading(2),
      hotkeys: [
        {
          modifiers: ["Mod", "Alt"],
          key: "2",
        },
      ],
    });

    this.addCommand({
      id: "fho-h3",
      name: "Apply Heading 3 to selection",
      callback: this.getFormatHeading(3),
      hotkeys: [
        {
          modifiers: ["Mod", "Alt"],
          key: "3",
        },
      ],
    });

    this.addCommand({
      id: "fho-h4",
      name: "Apply Heading 4 to selection",
      callback: this.getFormatHeading(4),
      hotkeys: [
        {
          modifiers: ["Mod", "Alt"],
          key: "4",
        },
      ],
    });

    this.addCommand({
      id: "fho-h5",
      name: "Apply Heading 5 to selection",
      callback: this.getFormatHeading(5),
      hotkeys: [
        {
          modifiers: ["Mod", "Alt"],
          key: "5",
        },
      ],
    });

    this.addCommand({
      id: "fho-h6",
      name: "Apply Heading 6 to selection",
      callback: this.getFormatHeading(6),
      hotkeys: [
        {
          modifiers: ["Mod", "Alt"],
          key: "6",
        },
      ],
    });
  };

  /**==================================
   * Utility functions
   **=================================*/

  getActiveEditor = (): Editor | null => {
    const { workspace } = this.app;
    const activeView = workspace.getActiveViewOfType(MarkdownView);
    return activeView?.sourceMode?.cmEditor || null;
  };

  /**
   * Adds a prefix to the current selection or line
   *
   * replace: list of RegEx prefix patterns
   *          that should be replaced if they already exist
   *
   * prefix: the string prefix to add
   */
  addPrefix = ({ replace = [], prefix = "" }: AddPrefix): void => {
    const editor = this.getActiveEditor();
    if (!editor) {
      return;
    }

    const selection = getSelection(editor);
    const { start, end, content } = selection;

    const updatedContent = prefixLines({
      content,
      prefix,
      replace,
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
  removePrefix = ({ searches = PREFIXES }: RemovePrefix = {}): void => {
    const editor = this.getActiveEditor();
    if (!editor) {
      return;
    }

    const selection = getSelection(editor);
    const { start, end, content } = selection;

    const updatedContent = content.replace(buildRegex(searches), "");
    editor.replaceRange(updatedContent, start, end);
    restoreCursor(selection, content, updatedContent);
  };

  togglePrefix = ({
    searches = [],
    replace = [],
    prefix = "",
    remove,
    add,
  }: TogglePrefix): void => {
    const editor = this.getActiveEditor();
    if (!editor) {
      return;
    }
    const selection = getSelection(editor);
    const { content } = selection;

    if (
      every(content.split("\n"), (line) =>
        matches(line, buildRegex(searches || [prefix]))
      )
    ) {
      // full match, remove prefixes
      (remove || this.removePrefix)({ searches });
    } else {
      // partially or no match. Add prefixes
      (add || this.addPrefix)({
        replace: [...searches, ...replace],
        prefix,
      });
    }
  };

  /**==================================
   * Command handlers
   **=================================*/

  toggleTodo = (): void => {
    this.togglePrefix({
      searches: [REGEX_TODO],
      prefix: `${UL_CHAR} [ ] `,
      replace: [REGEX_OL, REGEX_UL],
    });
  };

  toggleQuote = (): void =>
    this.togglePrefix({ searches: [REGEX_QUOTE], prefix: "> " });

  toggleOL = (): void => {
    this.togglePrefix({
      searches: [REGEX_OL],
      replace: [REGEX_TODO, REGEX_UL],
      add: ({ replace = [] }) => {
        // We have to do the loop our here to pull the number for the line

        const editor = this.getActiveEditor();
        if (!editor) {
          return;
        }

        const selection = getSelection(editor);
        const { start, end, content } = selection;

        const lines = content.split("\n");
        each(lines, (line, index) => {
          lines[index] = prefixLines({
            content: line,
            prefix: `${index + 1}. `,
            preserveIndent: true,
            replace,
          });
        });
        const updatedContent = lines.join("\n");
        editor.replaceRange(updatedContent, start, end);
        restoreCursor(selection, content, updatedContent);
      },
    });
  };

  toggleUL = (): void => {
    this.togglePrefix({
      searches: [REGEX_UL],
      prefix: `${UL_CHAR} `,
      replace: [REGEX_TODO, REGEX_OL],
    });
  };

  removeFormatting = (): void => {
    this.removePrefix();
  };

  getFormatHeading = (level: number) => (): void => {
    this.addPrefix({
      replace: PREFIXES,
      prefix: [...times(level, () => "#"), " "].join(""),
    });
  };
}
