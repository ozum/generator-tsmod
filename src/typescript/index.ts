import { join, parse } from "path";
import BaseGenerator from "../generator";
import type { OptionNames } from "../options";

interface Options {
  projectRoot: string;
  builder?: "rollup";
  main?: string;
}

const BUILDER = {
  rollup: "_rollup",
};

/**  Configures project for TypeScript. */
export default class extends BaseGenerator<Options> {
  protected static optionNames: OptionNames = ["projectRoot", "main", "builder"];

  /** Adds `main`, `types` and `files` entries to `package.json` and  copies `tsconfig.json` (if not exists)  and `tsconfig.base.json` (overwrites) files. */
  protected configuring(): void {
    this.deleteDefaultMain();
    const { name } = parse(this.options.main || "dist/index.js");
    this.mergePackage({ types: join(this.options.projectRoot, `${name}.d.ts`).replace(/\\/g, "/") });

    const dependencies = ["@types/node", "ts-node-dev", "typescript"];
    this.copyScripts({ scripts: ["watch", "execute"] });
    this.copyDependencies({ dependencies });

    this[this._builderMethod]();
  }

  /** Deletes default main entry from package.json */
  protected deleteDefaultMain(): void {
    const pkg = this.readDestinationPackage();
    if (pkg.main === "index.js") delete pkg.main;
    this.writeDestinationJSON("package.json", pkg);
  }

  protected get _builderMethod(): "_rollup" | "_default" {
    if (this.options.builder && !Object.prototype.hasOwnProperty.call(BUILDER, this.options.builder))
      throw new Error("Unknown builder option.");
    return this.options.builder ? (BUILDER[this.options.builder] as any) : "_default";
  }

  protected _rollup(): void {
    const { name } = parse(this.options.main || "index.js");
    this.mergePackage({
      main: join(this.options.projectRoot, "cjs", `${name}.js`).replace(/\\/g, "/"),
      module: join(this.options.projectRoot, "esm", `${name}.mjs`).replace(/\\/g, "/"),
      "umd:main": join(this.options.projectRoot, "umd", `${name}.js`).replace(/\\/g, "/"),
    });

    this.addScripts({ build: `rollup -c rollup.config.js` });

    const config = {
      target: "ESNEXT",
      module: "ESNext",
      outDir: this.options?.projectRoot ?? "dist",
      declarationDir: "dist",
    };

    this.copyConfig("tsconfig.json", undefined, config);
    this.copyConfig("rollup.config.js");
    this.copyDependencies({ dir: "rollup" });
    this.copyScripts({ dir: "rollup" });
  }

  protected _default(): void {
    const { name } = parse(this.options.main || "index.js");
    this.mergePackage({ main: join(this.options.projectRoot, `${name}.js`).replace(/\\/g, "/") });
    this.addScripts({ build: `tsc` });

    const config = {
      target: "ES2020",
      module: "commonjs",
      outDir: this.options?.projectRoot ?? "dist",
      declarationDir: undefined,
    };

    this.copyConfig("tsconfig.json", undefined, config);
  }
}
