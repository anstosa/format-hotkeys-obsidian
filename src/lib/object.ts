interface Dictionary {
  [key: string]: any | Dictionary;
}

export const get = (object: Dictionary, path: string | string[], defaultVal?: any) => {
  const [key, nextSegments]: string[] = Array.isArray(path) ? path : path.split('.');
  const value = object[key];
  if (object && nextSegments.length) {
    return get(object, nextSegments);
  }
  return typeof value === 'undefined' ? defaultVal : value;
}