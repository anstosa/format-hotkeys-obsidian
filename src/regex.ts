import { isString } from "lodash";

export const REGEX_ANY = "^(\\s*)";
export const REGEX_BOLD = "\\*\\*(.*)\\*\\*";
export const REGEX_HEADING = "^#+ ";
export const REGEX_ITALICS = "[^*]\\*(.*)\\*[^*]";
export const REGEX_OL = "^(\\s*)[\\d]\\. ";
export const REGEX_QUOTE = "^>\\s*";
export const REGEX_STRIKE = "~~(.*)~~";
export const REGEX_TODO = "^(\\s*)[-*] \\[[ xX]\\] ";
export const REGEX_UL = "^(\\s*)([-*]) ";

export const PREFIXES = [
  REGEX_HEADING,
  REGEX_OL,
  REGEX_QUOTE,
  REGEX_TODO,
  REGEX_UL,
];

export const buildRegex = (
  inputs: string | string[],
  flags: string = "gm"
): RegExp => {
  if (isString(inputs)) {
    inputs = [inputs];
  }
  return new RegExp(inputs.join("|"), flags);
};

export const matches = (text: string, search: RegExp | string): boolean => {
  if (isString(search)) {
    search = buildRegex(search);
  }
  return text.search(search) !== -1;
};

export const getIndent = (text: string): string => {
  const [, indent] = text.match(REGEX_ANY) || [];
  return indent || "";
};
