export const isString = (input: unknown): input is string =>
  typeof input === "string" || input instanceof String;

/** Function that count occurrences of a substring in a string;
 * @param {String} string               The string
 * @param {String} search            The sub string to search for
 * @param {Boolean} [allowOverlapping]  Optional. (Default:false)
 *
 * @author Vitim.us https://gist.github.com/victornpb/7736865
 * @see Unit Test https://jsfiddle.net/Victornpb/5axuh96u/
 * @see http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string/7924240#7924240
 */
export const occurrences = (
  string: string,
  search: string,
  allowOverlapping: boolean = false
): number => {
  if (search.length <= 0) {
    return string.length + 1;
  }

  let n = 0;
  let pos = 0;
  const step = allowOverlapping ? 1 : search.length;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    pos = string.indexOf(search, pos);
    if (pos >= 0) {
      ++n;
      pos += step;
    } else {
      break;
    }
  }
  return n;
};
