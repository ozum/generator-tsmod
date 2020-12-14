import get from "lodash.get";
import isPlainObject from "lodash.isplainobject";
import _parseAuthor, { Author } from "parse-author";
import type { JSONSchema7Type } from "json-schema";
import _validatePackageName from "validate-npm-package-name";

// const parseRepo = require("parse-repo"); // eslint-disable-line @typescript-eslint/no-var-requires

/** Node module info. */
export interface Module {
  name: string;
  scopeName?: string;
  localName: string;
}

export interface Person {
  name?: string;
  email?: string;
  url?: string;
}

/**
 * Parses module name to be used in package.json and extracts info which may be useful in git repo.
 *
 * @param name is the name of the module.
 * @returns module info.
 */
export function parseModuleName(name: string): Module {
  const [scopeName, localName] = name.startsWith("@") ? name.slice(1).split("/") : [undefined, name];
  return { name, scopeName, localName };
}

export function parseAuthor(author?: JSONSchema7Type): Person | undefined {
  if (author === undefined || (!isPlainObject(author) && typeof author !== "string")) return undefined;
  return isPlainObject(author) ? (author as Author) : _parseAuthor(author as string);
}

/**
 * Validates given npm package name and returns `Error` if not validated.
 *
 * @param name is the name of the npm package to validate.
 * @returns `Error` object or undefined if there is no errors.
 */
export function validatePackageName(name?: string): Error | undefined {
  if (name !== undefined) {
    const packageNameValidity = _validatePackageName(name);
    if (!packageNameValidity.validForNewPackages)
      return new Error(get(packageNameValidity, "errors.0") || "The name option is not a valid npm package name.");
  }
  return undefined;
}
