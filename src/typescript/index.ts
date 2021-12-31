import { join, parse } from "path";
import Generator from "../generator";
import { OptionNames } from "../options";

interface Options {
  projectRoot: string;
  builder?: "rollup";
  main?: string;
}

const BUILDER = {
  rollup: "_rollup",
};

/**  Configures project for TypeScript. */
export default class extends Generator<Options> {
  protected static optionNames: OptionNames = ["projectRoot", "main", "builder"];

  /** Adds `main`, `types` and `files` entries to `package.json` and  copies `tsconfig.json` (if not exists)  and `tsconfig.base.json` (overwrites) files. */
  protected configuring(): void {
    this._deleteDefaultMain();
    this.assign("package.json", { types: join(this.options.projectRoot, `${this.#mainFileName}.d.ts`).replace(/\\/g, "/") });
    this.package.copyScripts(this.sourcePackage, ["watch", "execute"]);
    this.package.copyDependencies(this.sourcePackage, ["@types/node", "ts-node-dev", "typescript", "tslib"]);
    this[this._builderMethod]();
  }

  /** Deletes default main entry from package.json */
  protected _deleteDefaultMain(): void {
    const pkg = this.destinationPackage;
    if (pkg.main === "index.js") this.assign("package.json", "main");
  }

  protected get _builderMethod(): "_rollup" | "_default" {
    if (this.options.builder && !Object.prototype.hasOwnProperty.call(BUILDER, this.options.builder))
      throw new Error("Unknown builder option.");
    return this.options.builder ? (BUILDER[this.options.builder] as any) : "_default";
  }

  get #mainFileName(): string {
    return parse(this.options.main ?? "index.js").name;
  }

  protected _rollup(): void {
    this.assign("package.json", {
      main: join(this.options.projectRoot, "cjs", `${this.#mainFileName}.js`).replace(/\\/g, "/"),
      module: join(this.options.projectRoot, "esm", `${this.#mainFileName}.mjs`).replace(/\\/g, "/"),
      "umd:main": join(this.options.projectRoot, "umd", `${this.#mainFileName}.js`).replace(/\\/g, "/"),
    });

    this.copyConfig("rollup/tsconfig.json");
    this.copyConfig("rollup/rollup.config.js");
    this.package.copyDependencies(this.readTemplatePackage("rollup"));
    this.package.copyScripts(this.readTemplatePackage("rollup"));
  }

  protected _default(): void {
    this.assign("package.json", { main: join(this.options.projectRoot, `${this.#mainFileName}.js`).replace(/\\/g, "/") });
    this.package.addScript("build", "tsc");
    this.copyConfig("default/tsconfig.json");
  }
}
