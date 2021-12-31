/* eslint-disable @typescript-eslint/explicit-function-return-type, default-param-last  */
import Generator from "yeoman-generator";
import { join, parse } from "path";
import isEqual from "lodash.isequal";
import type { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package";
import get from "lodash.get";
import set from "lodash.set";
import assignWith from "lodash.assignwith";
import fastGlob from "fast-glob";
import { cleanConfigFileName } from "./utils/helper";
import { optionDefinitions, OptionNames } from "./options";
import Package from "./package";

export type { PackageJson };

export default abstract class Base<T extends Generator.GeneratorOptions = any> extends Generator<T> {
  protected readonly package: Package;

  protected constructor(args: string | string[], options: T) {
    super(args, options);
    this.package = new Package(this);

    // this.env.options.nodePackageManager = "npm";

    const subClassOptionNames = (this.constructor as any).optionNames as OptionNames; // Get static optionNames from sub class.
    if (subClassOptionNames === undefined) throw new Error("Static 'optionNames' attribute is required in sub generators.");
    subClassOptionNames.forEach((name) => this.option(name, optionDefinitions[name]));

    this.queueMethod(async () => this.#copyCommonFiles(), `copy default preset files and config entries`, "configuring");
    this.queueMethod(async () => this.package.process(), `process package.json before install`, "install");
    this.queueMethod(async () => this.package.sort(), `sort package.json before end`, "end");
  }

  async #copyCommonFiles(): Promise<void> {
    const overwritePaths = await fastGlob("**/*", { dot: true, cwd: this.templatePath("overwrite") });
    overwritePaths.forEach((path) => this.copyTemplate(join("overwrite", path), path));
    const dontOverwritePaths = await fastGlob("**/*", { dot: true, cwd: this.templatePath("dont-overwrite") });
    dontOverwritePaths.forEach((path) => this.copyTemplateSafe(join("dont-overwrite", path), path));
  }

  copyTemplateSafe(...args: Parameters<Generator["copyTemplate"]>): ReturnType<Generator["copyTemplate"]> {
    if (!this.existsDestination(args[1])) this.copyTemplate(...args);
  }

  renderTemplateSafe(...args: Parameters<Generator["renderTemplate"]>): ReturnType<Generator["renderTemplate"]> {
    if (args[1] === undefined) throw new Error("renderTemplateSafe does not support undefined destination.");
    if (Array.isArray(args[0]) || Array.isArray(args[1])) throw new Error("renderTemplateSafe only supports single files.");
    if (!this.existsDestination(args[1])) this.renderTemplate(...args);
  }

  copyConfig(configPath: string, configData: Record<string, any> = {}, baseData: Record<string, any> = configData): void {
    const { dir, name, ext } = parse(configPath);
    const baseConfigFile = `${name}.base${ext}`; // i.e: dir/tsconfig.json -> tsconfig.base.json
    const baseConfigPath = join(dir, `${name}.base${ext}`); // i.e: dir/tsconfig.json -> dir/tsconfig.base.json
    const configFile = `${name}${ext}`; // i.e: dir/tsconfig.json -> tsconfig.json

    // Copy base config if exists.
    if (this.fs.exists(this.templatePath(baseConfigPath)))
      this.copyTemplate(baseConfigPath, join("config/", cleanConfigFileName(baseConfigFile)));
    else if (this.fs.exists(this.templatePath(`${baseConfigPath}.ejs`)))
      this.renderTemplate(`${baseConfigPath}.ejs`, join("config/", cleanConfigFileName(baseConfigFile)), baseData);

    if (this.fs.exists(this.templatePath(configPath))) this.copyTemplateSafe(configPath, cleanConfigFileName(configFile));
    else if (this.fs.exists(this.templatePath(`${configPath}.ejs`)))
      this.renderTemplateSafe(configPath, cleanConfigFileName(configFile), configData);
  }

  /** Read and return this module's `package.json` JSON data as object. */
  get sourcePackage(): PackageJson {
    return this.fs.readJSON(this.templatePath("../../../package.json")) as PackageJson;
  }

  /** Return destination `package.json` JSON data as object. */
  get destinationPackage(): PackageJson {
    return this.readDestinationJSON("package.json", {}) as PackageJson;
  }

  /** Read and return `package.json` file located in templates directory. `undefined` if not available.  */
  readTemplatePackage(dir = "."): PackageJson | undefined {
    return this.fs.readJSON(join(this.templatePath(join(dir, "package.json")))) as PackageJson | undefined;
  }

  #assign(safe: boolean, file: string, dataOrPath: string | Record<string, any>, dataOrVoid?: Record<string, any>): boolean {
    let isChanged = false;
    const fileContent = this.readDestinationJSON(file) as Record<string, any>;
    const path = typeof dataOrPath === "string" ? dataOrPath : undefined;
    const [originalData, newData] = path ? [get(fileContent, path), dataOrVoid] : [fileContent, dataOrPath];

    if (path && originalData === undefined) set(fileContent, path, newData);
    assignWith(originalData, newData, (originalValue, newValue) => {
      const shouldAssign = (safe && originalValue === undefined) || (!safe && !isEqual(originalValue, newValue));
      if (!shouldAssign) return originalValue;
      isChanged = true;
      return newValue;
    });

    if (isChanged) this.writeDestinationJSON(file, fileContent);
    if (file === "package.json" && isChanged) this.package.isChanged = true;
    return isChanged;
  }

  assign(file: string, dataOrPath: string | Record<string, any>, dataOrVoid?: Record<string, any>): boolean {
    return this.#assign(false, file, dataOrPath, dataOrVoid);
  }

  assignSafe(file: string, dataOrPath: string | Record<string, any>, dataOrVoid?: Record<string, any>): boolean {
    return this.#assign(true, file, dataOrPath, dataOrVoid);
  }
}
