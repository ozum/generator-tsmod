/* eslint-disable no-param-reassign */
import get from "lodash.get";
import type { JSONSchema7Object } from "json-schema";
import difference from "lodash.difference";
import differenceWith from "lodash.differencewith";
import isEqual from "lodash.isequal";
import uniq from "lodash.uniq";
import _isPlainObject from "lodash.isplainobject";

type Data = Record<string, any>;

function joinPath(dataPath: string | string[], ...keys: string[]): string {
  const arrayRootPath = Array.isArray(dataPath) ? dataPath : dataPath.split(".");
  return arrayRootPath.concat(keys).join(".");
}

/**
 * Checks whether given value is a plain object and not null.
 *
 *
 * @param input is the candidate to test.
 * @returns whether input is a plain object and not null.
 */
function isPlainObject(input: any): input is Record<string, any> {
  return input !== null && _isPlainObject(input);
}

export function merge(log: Data, object: Data, newData: JSONSchema7Object, overwrite = false, dataPath: string | string[] = []): any {
  const data = isEqual(dataPath, []) ? object : get(object, dataPath);
  Object.entries(newData).forEach(([newKey, newValue]) => {
    // For arrays push values and write added values to log.
    if (Array.isArray(newValue)) {
      if (data[newKey] === undefined) data[newKey] = [];
      const fullPath = joinPath(dataPath, newKey);
      const addedValues = differenceWith(newValue, data[newKey], isEqual);
      data[newKey] = uniq(data[newKey].concat(addedValues));
      log[fullPath] = uniq((log[fullPath] || []).concat(addedValues));
    }
    // Merge objects and write merged values to log under stringified path. (i.e. { "a.b.c" : 2})
    else if (isPlainObject(newValue)) {
      data[newKey] = isPlainObject(data[newKey]) ? data[newKey] : {};
      const subKeys = overwrite ? Object.keys(newValue) : difference(Object.keys(newValue), Object.keys(data[newKey]));
      subKeys.forEach((subKey) => {
        const fullPath = joinPath(dataPath, newKey, subKey);
        data[newKey][subKey] = newValue[subKey];
        log[fullPath] = newValue[subKey];
      });
    }
    // If old value is undefined or overwrite is in effect, set value and write it to log.
    else if (overwrite || data[newKey] === undefined) {
      const fullPath = joinPath(dataPath, newKey);
      data[newKey] = newValue;
      log[fullPath] = newValue;
    }
  });
  return [object, log];
}
