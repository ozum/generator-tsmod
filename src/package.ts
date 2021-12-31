/* eslint-disable default-param-last */
import type { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package";
import pick from "lodash.pick";
import type Generator from "./generator";
import { sortPackageKeys } from "./utils/helper";

type Name = string;
type Value = string;

export default class Package {
  isChanged = false;
  readonly #generator: Generator;
  readonly #scripts: Record<Name, Value> = {};
  readonly #files: string[] = [];

  constructor(generator: Generator) {
    this.#generator = generator;
  }

  /**
   * Stores given script for adding it to the `package.json` file during process step. If there is a previously stored script, new one is concatenated.
   *
   * @param name is the name of the script.
   * @param value is the entry to add given script name.
   */
  addScript(name: Name, value?: Value): void {
    if (value === undefined) return;
    // Join previous script.
    this.#scripts[name] = this.#scripts[name] === undefined ? value : `${this.#scripts[name]} && ${value}`;
  }

  addScripts(scripts: { [name: Name]: Value | undefined }): void {
    Object.entries(scripts).forEach(([name, value]) => this.addScript(name, value));
  }

  addFiles(files: string[] = []): void {
    this.#files.push(...files);
  }

  removeDependencies(names: string[]): void {
    const pkg = this.#generator.destinationPackage;
    const dependencyCount = Object.keys(pkg?.dependencies ?? {}).length + Object.keys(pkg?.devDependencies ?? {}).length;

    names.forEach((name) => {
      if (pkg?.dependencies?.[name]) delete pkg.dependencies[name];
      if (pkg?.devDependencies?.[name]) delete pkg.devDependencies[name];
    });

    if (dependencyCount !== Object.keys(pkg?.dependencies ?? {}).length + Object.keys(pkg?.devDependencies ?? {}).length) {
      this.#generator.packageJson.setPath("dependencies", pkg.dependencies);
      this.#generator.packageJson.setPath("devDependencies", pkg.devDependencies);
      this.isChanged = true;
    }
  }

  /**
   * Copies all or only selected packages from given `package.json` to target `package.json`.
   *
   * @param packageJson is the source package to copy dependencies from.
   * @param packageNames is the optional list of dependency names to copy from source package.
   */
  copyDependencies(packageJson: PackageJson | undefined = this.#generator.readTemplatePackage(), packageNames?: string[]): void {
    this.#generator.assign(
      "package.json",
      "dependencies",
      packageNames ? pick(packageJson?.dependencies ?? {}, packageNames) : packageJson?.dependencies ?? {}
    );

    this.#generator.assign(
      "package.json",
      "devDependencies",
      packageNames ? pick(packageJson?.devDependencies ?? {}, packageNames) : packageJson?.devDependencies ?? {}
    );
  }

  /**
   * Stores all or only selected scripts from given `package.json` for adding them to the `package.json` file during process step.
   *
   * @param packageJson is the source package to copy dependencies from.
   * @param scriptNames is the optional list of script names to copy from source package.
   */
  copyScripts(packageJson: PackageJson | undefined = this.#generator.readTemplatePackage(), scriptNames?: string[]): void {
    const names = scriptNames ?? Object.keys(packageJson?.scripts ?? {});
    names.forEach((name) => this.addScript(name, packageJson?.scripts?.[name]));
  }

  /**
   * Transfer all changes to target `package.json` file.
   */
  process(): void {
    // Add scripts
    Object.entries(this.#scripts)
      .filter(([name, script]) => this.#generator.destinationPackage?.scripts?.[name] !== script)
      .forEach(([name, script]) => {
        this.isChanged = true;
        this.#generator.packageJson.setPath(`scripts.${name}`, script);
      });

    // Add files
    const existingFiles = this.#generator.destinationPackage.files || [];
    const newFiles = this.#files.filter((file) => !existingFiles.includes(file));
    if (newFiles.length > 0) this.#generator.packageJson.setPath("files", [...existingFiles, ...newFiles]); // No need to update isChanged. Does not need to sort or install.
  }

  async sort(): Promise<void> {
    if (this.isChanged) this.#generator.writeDestinationJSON("package.json", sortPackageKeys(this.#generator.destinationPackage));
  }
}
