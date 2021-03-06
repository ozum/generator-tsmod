/* eslint-disable no-return-assign, @typescript-eslint/ban-ts-comment, @typescript-eslint/no-var-requires */

// TODO: Detect changing files using `this.fs` instead of complex and slow file comparisons.
// * Add a special generator for updating logs.
// See: https://github.com/yeoman/generator/issues/1273

import Generator from "yeoman-generator";
import { parse, join } from "path";
import type { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package";
import set from "lodash.set";
import pick from "lodash.pick";
import type { JSONSchema7Object } from "json-schema";
import { readFileSync } from "fs";
import isEqual from "lodash.isequal";
import fastGlob from "fast-glob";
import uniq from "lodash.uniq";
import { sortKeys, sortPackageKeys, hash, getFileModificationTime, getStringPath } from "./utils/helper";
import { merge } from "./utils/merge";
import { getOptions, OptionNames } from "./options";

export type { PackageJson };

const DependencyTypes = ["dependencies", "devDependencies", "peerDependencies"];

export type File = string;
type Hash = string;
type DependencyName = string;
type Version = string;
type DataPath = string;
type ScriptName = string;
type ScriptText = string;

export interface AddedData {
  normal: Record<DataPath, any>;
  safe: Record<DataPath, any>;
}

interface MergeOptions {
  rootPath?: string | string[];
  overwrite?: boolean;
  sort?: { start?: string[]; end?: string[] };
  safe?: boolean;
}

interface Options {
  install: boolean;
}

export default abstract class Base<T extends Generator.GeneratorOptions = Options> extends Generator<T> {
  protected static optionNames: OptionNames = [];
  #fileSafety: Map<File, boolean> = new Map();
  #fileHashes: Record<File, Hash> = {};
  #fileModificationTimes: Record<File, Date | undefined> = {};
  #initialDependencies: Record<File, Record<DependencyName, Version>> = this.snaphotDependencies();
  #addedData?: Record<File, AddedData>;
  #packageModified = false;
  #manualAddedFiles: string[] = [];

  protected constructor(args: string | string[], options: T) {
    super(args, options);

    const subClassOptionNames = (this.constructor as any).optionNames as OptionNames; // Get static optionNames from sub class.
    if (subClassOptionNames === undefined) throw new Error("Static 'optionNames' attribute is required in sub generators.");
    const generatorOptions = getOptions.apply(this);
    subClassOptionNames.forEach((name) => this.option(name, generatorOptions[name]));

    this.option("install", { type: Boolean, default: true, description: "Install if package dependencies changed" });

    // @ts-ignore: registerPriorities is not present in types, but is written in docs: https://yeoman.github.io/generator/Generator.html#registerPriorities
    this.registerPriorities([
      { priorityName: "beforeConflicts", before: "conflicts", queueName: "beforeConflicts" },
      { priorityName: "loggingData", before: "beforeConflicts", queueName: "loggingData" },
      { priorityName: "beforeInstall", before: "install", queueName: "beforeInstall" },
    ]);

    this.queueMethod(async () => this.copy(), `copy default preset files and config entries`, "configuring");
    this.queueMethod(async () => this.loggingData(), `copy added data from shared file to class attribute`, "loggingData");
    this.queueMethod(async () => this.beforeConflicts(), `execute tasks which should be done before conflicts`, "beforeConflicts");
    this.queueMethod(async () => this.beforeInstall(), `execute tasks which should be done before install`, "beforeInstall");

    this.addCreatedDir("module-files");
  }

  private async loggingData(): Promise<void> {
    this.#addedData = this.tempAddedData;
  }

  private async beforeConflicts(): Promise<void> {
    this.config.delete("createdScripts");
    await this.sortPackage();
    await this.populateFileModificationTimes();
    super.deleteDestination("temp-added-data.json");
  }

  private async beforeInstall(): Promise<void> {
    await this.logModifiedFiles();
    if (this.options.install) await this.queueInstall();
  }

  private async queueInstall(): Promise<void> {
    if (!isEqual(this.snaphotDependencies(false), this.#initialDependencies)) this.scheduleInstallTask(this.packageManager);
  }

  private async logModifiedFiles(): Promise<void> {
    const modifiedFiles = await this.getModifiedFiles();
    const addedFilesSafe: Record<string, string> = this.config.get("addedFilesSafe") ?? {};
    const addedFiles: Set<string> = new Set((this.config.get("addedFiles") ?? []).concat(this.#manualAddedFiles));

    modifiedFiles.forEach((file) => {
      if (this.#addedData?.[file]) {
        const oldData = this.config.getPath(["addedData", file] as any);
        const newData = this.#addedData[file];
        if (!isEqual(oldData, newData)) this.config.setPath(["addedData", file] as any, sortKeys(sortKeys(newData, "safe"), "normal"));
      } else if (!this.existsDestination(file)) {
        delete addedFilesSafe[file];
        addedFiles.delete(file);
      } else if (this.#fileSafety.has(file)) addedFilesSafe[file] = this.getHash(file, "memory") as string;
      else addedFiles.add(file);
    });

    this.config.set("addedFilesSafe", sortKeys(addedFilesSafe));
    this.config.set("addedFiles", Array.from(addedFiles).sort());
  }

  private async getModifiedFiles(): Promise<string[]> {
    const files = Object.keys(this.#fileModificationTimes);
    const modificationTimes = await Promise.all(files.map((file) => getFileModificationTime(this.destinationPath(file))));

    return files.filter((file, i) => this.#fileModificationTimes[files[i]]?.getTime() !== modificationTimes[i]?.getTime());
  }

  private async sortPackage(): Promise<void> {
    if (this.#packageModified) this.writeDestinationJSON("package.json", sortPackageKeys(this.readDestinationPackage()));
  }

  private async populateFileModificationTimes(): Promise<void> {
    const files = Object.keys(this.#fileModificationTimes).filter((file) => this.#fileModificationTimes[file] === undefined);
    const modificationTimes = await Promise.all(files.map((file) => getFileModificationTime(this.destinationPath(file))));
    files.forEach((file, i) => (this.#fileModificationTimes[file] = modificationTimes[i]));
  }

  /** Return destination `package.json` JSON data as object. */
  protected readDestinationPackage(): PackageJson {
    return this.readDestinationJSON(join(this.options.generateInto || "", "package.json"), {}) as PackageJson;
  }

  /** Read and return this module's `package.json` JSON data as object. */
  protected readSourcePackage(): PackageJson {
    return this.fs.readJSON(this.templatePath("../../../package.json")) as PackageJson;
  }

  /** Read and return `package.json` file located in templates directory. `undefined` if not available.  */
  protected readTemplatePackage(dir: string): PackageJson | undefined {
    return this.fs.readJSON(join(this.templatePath(join(dir, "package.json")))) as PackageJson | undefined;
  }

  /** Merges given data with destination `package.json` and writes it after ordering keys. */
  protected mergePackage(data: Partial<PackageJson>, { overwrite, safe }: { overwrite?: boolean; safe?: boolean } = {}): void {
    this.#packageModified = true;
    return this.mergeFile("package.json", data, { overwrite, safe });
  }

  private get tempAddedData(): Record<File, AddedData> {
    let tempData;
    if (!this.existsDestination("temp-added-data.json")) {
      tempData = this.config.getPath("addedData") || {};
      this.writeDestinationJSON("temp-added-data.json", tempData);
    } else {
      tempData = this.readDestinationJSON("temp-added-data.json");
    }

    return tempData;
  }

  protected mergeFile(file: string, newData: JSONSchema7Object, { overwrite, sort, rootPath = [], safe = true }: MergeOptions = {}): void {
    const type: keyof AddedData = safe ? "safe" : "normal";
    let data = this.readDestinationJSON(join(this.options.generateInto || "", file), {}) as JSONSchema7Object;
    const addedData = this.tempAddedData;
    addedData[file] = addedData[file] ?? {};
    let log = addedData[file][type] || {};

    [data, log] = merge(log, data, newData, overwrite, rootPath);
    if (sort) data = sortKeys(data, rootPath, sort);

    this.writeDestinationJSON(file, data);
    this.#fileModificationTimes[file] = undefined;
    addedData[file][type] = log;
    this.writeDestinationJSON("temp-added-data.json", addedData);
  }

  private get packageManager(): "npm" | "yarn" {
    return this.existsDestination("yarn.lock") ? "yarn" : "npm";
  }

  private snaphotDependencies(memory = true): Record<string, Record<string, string>> {
    const destinationPackage: PackageJson = memory
      ? this.readDestinationPackage()
      : JSON.parse(readFileSync(this.destinationPath("package.json"), { encoding: "utf8" }));

    return {
      dependencies: { ...destinationPackage.dependencies },
      devDependencies: { ...destinationPackage.devDependencies },
      peerDependencies: { ...destinationPackage.peerDependencies },
    };
  }

  protected addCreatedDir(...paths: string[]): void {
    const createdDirs = this.config.get("createdDirs") || [];
    this.config.set("createdDirs", uniq(createdDirs.concat(paths)));
  }

  /**
   * Copies given scripts from this module's package to destination.
   * Also copies all scripts from template `package.json` too.
   * If script is not found on source `package.json` or template `package.json`, it is not added.
   *
   * @param scriptNames are script names to copy.
   */
  protected copyScripts({ scripts = [], dir = "" }: { scripts?: string[]; dir?: string } = {}): void {
    const sourcePkg = this.readSourcePackage();
    const templatePackage = this.readTemplatePackage(dir);
    const combinedScripts = { ...pick(sourcePkg.scripts, scripts), ...templatePackage?.scripts };
    this.addScripts(combinedScripts);
  }

  /**
   * Checks whether a package.json script is added by a generator.
   *
   * @param name is the name of the package.json script.
   */
  protected willScriptAddedByGenerator(name: string): boolean {
    const destinationScripts = this.readDestinationPackage().scripts || {};
    return destinationScripts[name] === undefined || this.config.getPath(["createdScripts", name] as any);
  }

  /**
   * Marks given package.json script is added by a generator.
   *
   * @param name is the name of the package.json script.
   */
  protected markScriptAddedByGenerator(name: string): void {
    this.config.setPath(["createdScripts", name] as any, true);
  }

  /**
   * Adds scripts to `package.json`. If multiple generator calls for same script name, they will be combined with '&&`.
   *
   * @param scripts are the scripts to be added package.json.
   * @param prepend is whether to add script at the beginning of the scripts.
   * @example
   * this.addScripts({ "postinstall": "install husky" });         // "postinstall": "install husky"
   * this.addScripts({ "postinstall": "not-sync node_modules" }); // "postinstall": "(install husky) && (not-sync node_modules)"
   */
  protected addScripts(scripts: Record<ScriptName, ScriptText | undefined>, { prepend = false } = {}): void {
    const destinationScripts = this.readDestinationPackage().scripts || {};
    const combinedScripts: typeof destinationScripts = {};

    Object.entries(scripts).forEach(([name, script]) => {
      const hasSame = (destinationScripts[name] || "").includes(script || "");
      if (script === undefined || !this.willScriptAddedByGenerator(name) || hasSame) return;
      this.markScriptAddedByGenerator(name);
      const addParenthesis = destinationScripts[name] !== undefined && !destinationScripts[name]?.startsWith("(");
      const destinationScript = addParenthesis ? `(${destinationScripts[name]})` : destinationScripts[name];

      if (destinationScript)
        combinedScripts[name] = prepend ? `(${script}) && ${destinationScript}` : `${destinationScript} && (${script})`;
      else combinedScripts[name] = script;
    });
    this.mergePackage({ scripts: combinedScripts }, { overwrite: true });
  }

  /**
   * Copies given dependencies with same type (normal, dev or peer) and same version from source module's package to destination.
   * If dependency is not found on source `package.json` or template `package.json`, it is not added.
   * Copies all dependencies from template `package.json` in template directory or in given subdir of template directory.
   *
   * @param dependencies are list of dependencies to copy.
   */
  protected copyDependencies({ dependencies = [], dir = "" }: { dependencies?: string[]; dir?: string } = {}): void {
    const sourcePkg = this.readSourcePackage();
    const templatePackage = this.readTemplatePackage(dir);
    const data: Record<string, Record<string, string>> = {};
    const types = DependencyTypes;

    // Copy given dependencies from this module's `package.json` to target `package.json`.
    dependencies.forEach((dependency) =>
      types.filter((type) => sourcePkg?.[type]?.[dependency]).forEach((type) => set(data, [type, dependency], sourcePkg[type][dependency]))
    );

    // Copy all dependencies from template `package.json` (if available) to target `package.json`.
    types.filter((type) => templatePackage?.[type]).forEach((type) => (data[type] = { ...data[type], ...templatePackage?.[type] }));

    this.mergePackage(data, { safe: false });
  }

  writeDestination = (...args: Parameters<Generator["writeDestination"]>): ReturnType<Generator["writeDestination"]> => {
    this.#fileModificationTimes[args[0]] = undefined;
    return super.writeDestination(...args);
  };

  copyTemplate = (...args: Parameters<Generator["copyTemplate"]>): ReturnType<Generator["copyTemplate"]> => {
    this.#fileModificationTimes[args[1]] = undefined;
    return super.copyTemplate(...args);
  };

  renderTemplate = (...args: Parameters<Generator["renderTemplate"]>): ReturnType<Generator["renderTemplate"]> => {
    this.#fileModificationTimes[getStringPath(args[1] ?? args[0])] = undefined;
    return super.renderTemplate(...args);
  };

  deleteDestination = (...args: Parameters<Generator["deleteDestination"]>): ReturnType<Generator["deleteDestination"]> => {
    this.#fileModificationTimes[getStringPath(args[0])] = undefined;
    return super.deleteDestination(...args);
  };

  protected addToAddedFiles(file: string): void {
    this.#manualAddedFiles.push(file);
  }

  /** Copy only if destination file is created by this generator. */
  protected copyTemplateSafe(...args: Parameters<Generator["copyTemplate"]>): ReturnType<Generator["copyTemplate"]> {
    if (this.isSafe(args[1])) this.copyTemplate(...args);
  }

  /** Renden only if destination file is created by this generator. */
  protected renderTemplateSafe(...args: Parameters<Generator["renderTemplate"]>): ReturnType<Generator["renderTemplate"]> {
    const destination = getStringPath(args[1] ?? args[0]);
    if (this.isSafe(destination)) this.renderTemplate(...args);
  }

  /** Copy only if destination file is created by this generator, but do not add to log. */
  protected copyTemplateSafeNoLog(...args: Parameters<Generator["copyTemplate"]>): ReturnType<Generator["copyTemplate"]> {
    if (this.isSafe(args[1])) super.copyTemplate(...args);
  }

  /** Copy template, but do not add to log. Like it is created by user manually. */
  protected copyTemplateNoLog(...args: Parameters<Generator["copyTemplate"]>): ReturnType<Generator["copyTemplate"]> {
    super.copyTemplate(...args);
  }

  /** Render template, but do not add to log. Like it is created by user manually. */
  protected renderTemplateNoLog(...args: Parameters<Generator["renderTemplate"]>): ReturnType<Generator["renderTemplate"]> {
    super.renderTemplate(...args);
  }

  /** Renden only if destination file is created by this generator, but do not add to log. */
  protected renderTemplateSafeNoLog(...args: Parameters<Generator["renderTemplate"]>): ReturnType<Generator["renderTemplate"]> {
    const destination = getStringPath(args[1] ?? args[0]);
    if (this.isSafe(destination)) super.renderTemplate(...args);
  }

  protected deleteDestinationSafe(...args: Parameters<Generator["deleteDestination"]>): ReturnType<Generator["deleteDestination"]> {
    if (this.isSafe(getStringPath(args[0]))) this.deleteDestination(...args);
  }

  private getHash(file: string, from: "disk" | "memory" | "log"): string | undefined {
    if (from === "log") return this.config.getPath(["addedFilesSafe", file] as any);
    if (from === "memory") return hash(this.readDestination(file), { file });
    try {
      return hash(readFileSync(this.destinationPath(file), { encoding: "utf8" }), { file });
    } catch (err) {
      if (err.code === "ENOENT") return undefined;
      throw err;
    }
  }

  private isSafe(file: string): boolean {
    if (!this.#fileSafety.has(file)) {
      const hashFromLog = this.getHash(file, "log");
      if (!this.existsDestination(file)) this.#fileSafety.set(file, true);
      else {
        const hashFromDisk = this.getHash(file, "disk");
        if (hashFromDisk === undefined) this.#fileSafety.set(file, true);
        else {
          this.#fileSafety.set(file, hashFromDisk === hashFromLog);
          this.#fileHashes[file] = hashFromDisk;
        }
      }
    }
    return this.#fileSafety.get(file) as boolean;
  }

  /**
   * Copies given given file in given path to same path in destination if destination file does not exist.
   * Also if available copies base config file (i.e. tscnfig.base.json) into destination's `module-files/configs` directory.
   * Base config files are files whose names have `.base` added before the file extension.
   *
   * @param configFilePath is the source file path relative to templates folder.
   * @param targetFilePath is the target file path relative to target folder. By default this is same as sourceFilePath.
   * @param configData is the data to be used if config file is a template.
   * @param baseData is the data to be used if config base file is a template.
   */
  protected copyConfig(
    configFilePath: string,
    targetFilePath = configFilePath,
    configData: Record<string, any> = {},
    baseData: Record<string, any> = configData
  ): void {
    const { dir, name, ext } = parse(configFilePath);
    const { dir: targetDir, base: targetBase } = parse(targetFilePath);
    const baseConfigPath = this.templatePath(join(dir, `${name}.base${ext}`)); // i.e: tsconfig.json -> tsconfig.base.json

    // i.e. tsconfig.base.json -> module-files/configs/tsconfig.json
    if (this.fs.exists(baseConfigPath)) this.copyTemplate(baseConfigPath, join("module-files/configs", targetDir, targetBase));
    else if (this.fs.exists(`${baseConfigPath}.ejs`))
      this.renderTemplate(`${baseConfigPath}.ejs`, join("module-files/configs", targetDir, targetBase), configData); // i.e. tsconfig.base.json -> module-files/configs/tsconfig.json

    if (this.fs.exists(this.templatePath(configFilePath))) this.copyTemplateSafe(configFilePath, targetFilePath);
    else if (this.fs.exists(this.templatePath(`${configFilePath}.ejs`)))
      this.renderTemplateSafe(`${configFilePath}.ejs`, targetFilePath, baseData);
  }

  protected async copy(): Promise<void> {
    const overwritePaths = await fastGlob("**/*", { dot: true, cwd: this.templatePath("overwrite") });
    overwritePaths.forEach((path) => this.copyTemplate(join("overwrite", path), path));
    const dontOverwritePaths = await fastGlob("**/*", { dot: true, cwd: this.templatePath("dont-overwrite") });
    dontOverwritePaths.forEach((path) => this.copyTemplateSafe(join("dont-overwrite", path), path));
  }

  protected get targetItself(): boolean {
    return this.readDestinationPackage()?.name === this.readSourcePackage()?.name;
  }
}
