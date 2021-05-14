interface Dictionary {
  [key: string]: unknown | Dictionary;
}

export const get = (
  object: Dictionary,
  path: string | string[],
  defaultVal?: unknown
): unknown => {
  const [key, nextSegments]: string[] = Array.isArray(path)
    ? path
    : path.split(".");
  const value = object[key];
  if (object && nextSegments.length) {
    return get(object, nextSegments);
  }
  return typeof value === "undefined" ? defaultVal : value;
};
