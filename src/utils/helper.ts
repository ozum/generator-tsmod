import { extname } from "path";
import uniq from "lodash.uniq";

import isEqual from "lodash.isequal";
import get from "lodash.get";
import set from "lodash.set";
import mapToObject from "array-map-to-object";
import type { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package"; // eslint-disable-line import/order

const packageKeysStart = [
  "name",
  "label",
  "version",
  "description",
  "author",
  "keywords",
  "engines",
  "source",
  "main",
  "types",
  "module",
  "umd:main",
  "files",
  "bin",
  "homepage",
  "bugs",
  "repository",
  "license",
  "scripts",
  "shields",
  "identities",
  "vuepress",
];

const packageKeysEnd = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
const scriptsStart = [
  "execute",
  "watch",
  "lint",
  "format",
  "release",
  "pretest",
  "test",
  "readme",
  "prebuild",
  "build",
  "docs:build",
  "docs:dev",
  "preinstall",
  "postinstall",
  "prepublish",
  "prepublishOnly",
  "postpublish",
  "not-sync",
  "tsmod",
  "yo:update",
];

export function cleanConfigFileName(fileName: string): string {
  return fileName.replace(/^_/, "").replace(new RegExp(`.base(${extname(fileName)})$`), "$1");
}

/**
 * Returns all given arrays and values concatenated as duplicate free. Does not modify inputs.
 *
 * @param array is the array to be concatenated.
 * @param others are arrays or values to be added.
 * @returns duplicate free array.
 */
export function concatUniq<T>(array?: T[], ...others: Array<T | T[]>): T[] {
  return uniq((array || []).concat(...others));
}

/**
 * Sort object alphabetically based on key. Keys on `start` placed at start, keys on `end` placed at end as it is.
 *
 * @ignore
 * @param object is the object to order keys of.
 * @param start are ordered keys to appear at the beginning of given path when saved.
 * @param end are ordered keys to appear at the end of given path when saved.
 * @returns a new object with ordered keys.
 */
function sortObjectKeys<T extends Record<string, any>>(object: T, { start = [] as string[], end = [] as string[] } = {}): T {
  const objectKeys = Object.getOwnPropertyNames(object);
  const sortedKeys: Array<keyof T> = [...start, ...objectKeys.filter((k) => !start.concat(end).includes(k)).sort(), ...end];
  if (isEqual(sortedKeys, objectKeys)) return object;
  return mapToObject(sortedKeys, (key) => [key, object[key]]) as T;
}

/**
 * When keys/values added which are previously does not exist, they are added to the end of the file during file write.
 * This method allows reordering of the keys in given path. Required keys may be put at the beginning and of the order.
 *
 * If you would like sort root object (`data`) use empty array `[]` as path, because `undefined`, '' and `null` are valid object keys.
 *
 * @param path is data path of the property to order keys of.
 * @param start are ordered keys to appear at the beginning of given path when saved.
 * @param end are ordered keys to appear at the end of given path when saved.
 *
 * @example
 * sortKeys(packageJson, "scripts", { start: ["build", "lint"], end: ["release"] });
 * sortKeys(packageJson, { start: ["name", "description"], end: ["dependencies", "devDependencies"] });
 */
export function sortKeys<T extends Record<string, any>>(
  data: T,
  path: string | string[] = [],
  { start, end }: { start?: string[]; end?: string[] } = {}
): T {
  const pathProvided = !(Array.isArray(path) && path.length === 0);
  if (pathProvided && get(data, path) !== undefined) return set(data, path, sortObjectKeys(get(data, path), { start, end }));
  return sortObjectKeys(data, { start, end });
}

/**
 * Sorts given data keys as `package.json` standards of this module.
 *
 * @param data is the data of `package.json`.
 */
export function sortPackageKeys(data: PackageJson): PackageJson {
  let result = data;
  result = sortKeys(result, ["scripts"], { start: scriptsStart });
  result = sortKeys(result, ["dependencies"]);
  result = sortKeys(result, ["devDependencies"]);
  result = sortKeys(result, ["peerDependencies"]);
  result = sortKeys(data, [], { start: packageKeysStart, end: packageKeysEnd });
  return result;
}

// /**
//  * Parses given string and returns format and object. If no format given, tries to parse first as json using JSON5, then yaml.
//  *
//  * @ignore
//  * @param content is string to parse
//  * @param rootDataPath is the path to return data from.
//  * @returns parsed object or input string.
//  * @throws `Error` if data cannot be parsed.
//  * @example
//  * parseString('{"a": { "b": {"c": 1} } }', "a.b"); // Parses and returns "a.b" path: { c: 1 }
//  */
// function parseObject(content: string, rootDataPath?: string | string[]): { format: "json" | "yaml"; data: any } {
//   const errors: Error[] = [];

//   try {
//     const data = commentJson.parse(content);
//     return { format: "json", data: rootDataPath ? get(data, rootDataPath as any) : data };
//   } catch (error: any) {
//     errors.push(error);
//   }

//   try {
//     const data = yaml.load(content);
//     return { format: "yaml", data: rootDataPath ? get(data, rootDataPath as any) : data };
//   } catch (error: any) {
//     errors.push(error);
//   }

//   const errorMessage = errors.reduce((previous, e) => `${previous}${e.name}: ${e.message}. `, "").trim();
//   throw new Error(`Cannot parse data. Supported formats are "json" and "yaml". ${errorMessage}`);
// }

// function hashJs(input: string, type: "js" | "ts"): string {
//   const syntax: Record<string, "ecmascript" | "typescript"> = { js: "ecmascript", ts: "typescript" };
//   const parserOptions: swc.Options = { sourceMaps: true, minify: true, jsc: { parser: { syntax: syntax[type] } } };
//   const { code } = swc.transformSync(input, parserOptions);
//   return _hash({ code });
// }

// function getHashType(file?: string): "js" | "ts" | undefined {
//   if (file === undefined) return undefined;
//   const fileType = extname(file).substring(1);
//   return fileType === "js" || fileType === "ts" ? fileType : undefined;
// }

// export function hash(rawData: unknown, options: { type?: "js" | "ts"; file?: string }): string | undefined {
//   if (rawData === undefined) return undefined;
//   const type = options?.type ?? getHashType(options.file);

//   let data = rawData;
//   if (typeof data === "string") {
//     if (type === "js" || type === "ts") return hashJs(data, type);
//     try {
//       data = parseObject(data).data;
//     } catch (e) {} // eslint-disable-line no-empty
//   }
//   return _hash({ data }, { unorderedArrays: true });
// }

// export function getStringPath(filePath: string | string[]): string {
//   return Array.isArray(filePath) ? filePath.join("/") : filePath;
// }

/**
 * Gets CLI commands from argv and single quotes every parameter.
 *
 * @example
 * $ --some "a v" x y
 * getArgv(); // => '--some' 'a v' 'x' 'y'
 */
export function getArgv(): string {
  return process.argv
    .slice(2)
    .map((arg) => `'${arg.replace(/'/g, "'\\''")}'`)
    .join(" ");
}

/**
 * Gets module name without scope.
 *
 * @param name is the module name.
 * @returns module name without scope.
 * @example
 * getModuleNameWithoutScope("@ozum/some-module"); // some-module
 */
// export function getModuleNameWithoutScope(name: undefined): undefined {}
// export function getModuleNameWithoutScope(name: string): string;
export function getModuleNameWithoutScope<T extends string | undefined>(name: T): T {
  return (name === undefined ? undefined : name.replace(/@(.+?)\//, "")) as T;
}
