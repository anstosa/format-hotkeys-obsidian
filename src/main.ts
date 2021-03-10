import {
  buildRegex,
  getIndent,
  matches,
  REGEX_ANY,
  REGEX_HEADING,
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

interface TogglePrefixBase {
  searches: string[];
  replace?: string[];
  force?: boolean;
  replaceMatches?: string[];
  remove?: (content: string, searches: TogglePrefixBase["searches"]) => string;
}

interface TogglePrefixLiteral extends TogglePrefixBase {
  prefix: string;
  add?: undefined;
}

interface TogglePrefixFunction extends TogglePrefixBase {
  prefix?: undefined;
  add: (content: string, searches: TogglePrefixBase["searches"]) => string;
}

type TogglePrefix = TogglePrefixLiteral | TogglePrefixFunction;

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
          key: "0",
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
      id: "fho-indent",
      name: "Increase indent for selection",
      callback: this.indent,
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: "]",
        },
      ],
    });

    this.addCommand({
      id: "fho-outdent",
      name: "Decrease indent for selection",
      callback: this.outdent,
      hotkeys: [
        {
          modifiers: ["Mod"],
          key: "[",
        },
      ],
    });
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

  getDefaultIndent = (): string => {
    const editor = this.getActiveEditor();
    if (!editor) {
      return "";
    }
    return editor.getOption("indentWithTabs")
      ? "\t"
      : times(editor.getOption("tabSize") || 4, () => " ").join("");
  };

  togglePrefix = ({
    searches,
    replace = [],
    prefix = "",
    force,
    add: customAdder,
    remove: customRemover,
  }: TogglePrefix): void => {
    const editor = this.getActiveEditor();
    if (!editor) {
      return;
    }
    const selection = getSelection(editor);
    const { start, end, content } = selection;

    let updatedContent: string = "";

    const remove = () => {
      if (customRemover) {
        updatedContent = customRemover(content, searches);
      } else {
        updatedContent = content.replace(buildRegex(searches), "");
      }
      editor.replaceRange(updatedContent, start, end);
    };

    const add = () => {
      if (customAdder) {
        updatedContent = customAdder(content, [...searches, ...replace]);
      } else {
        updatedContent = prefixLines({
          content,
          prefix,
          replace: [...searches, ...replace, REGEX_ANY],
          preserveIndent: true,
        });
      }
      editor.replaceRange(updatedContent, start, end);
    };

    if (force === true) {
      add();
    } else if (force === false) {
      remove();
    } else if (
      every(content.split("\n"), (line) => matches(line, buildRegex(searches)))
    ) {
      // full match, remove prefixes
      remove();
    } else {
      // partially or no match. Add prefixes
      add();
    }

    restoreCursor(selection, content, updatedContent);
  };

  removePrefix = (preserveIndent: boolean = false): void => {
    this.togglePrefix({
      searches: [REGEX_UL, REGEX_TODO, REGEX_HEADING, REGEX_OL, REGEX_QUOTE],
      prefix: "",
      remove: (text, searches) => {
        if (!preserveIndent) {
          return text.replace(buildRegex(searches), "");
        }
        const lines = text.split("\n");
        each(lines, (line, index) => {
          const indent = getIndent(line);
          const content = line.replace(buildRegex(searches), "");
          lines[index] = `${indent}${content}`;
        });
        return lines.join("\n");
      },
    });
  };

  /**==================================
   * Command handlers
   **=================================*/

  // TODO
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
      add: (text, searches) => {
        // We have to do the loop our here to pull the number for the line
        const lines = text.split("\n");
        each(lines, (line, index) => {
          lines[index] = prefixLines({
            content: line,
            prefix: `${index + 1}. `,
            preserveIndent: true,
            replace: searches,
          });
        });
        return lines.join("\n");
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

  indent = (): void => {
    this.togglePrefix({
      searches: [REGEX_ANY],
      force: true,
      add: (text) => text.replace(/^/gm, this.getDefaultIndent()),
    });
  };

  outdent = (): void => {
    this.togglePrefix({
      searches: [REGEX_ANY],
      force: false,
      prefix: "",
      remove: (text) =>
        text.replace(new RegExp(`^${this.getDefaultIndent()}`, "gm"), ""),
    });
  };

  removeFormatting = (): void => {
    this.removePrefix();
  };

  getFormatHeading = (level: number) => (): void => {
    this.removePrefix();
    this.togglePrefix({
      searches: [REGEX_ANY],
      force: true,
      prefix: [...times(level, () => "#"), " "].join(""),
    });
  };
}
