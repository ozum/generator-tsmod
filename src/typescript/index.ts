import { join } from "path";
import BaseGenerator from "../generator";

interface Options {
  projectRoot: string;
}

/**  Configures project for TypeScript. */
export default class extends BaseGenerator<Options> {
  protected constructor(args: string | string[], options: Options) {
    super(args, options);
    this.option("projectRoot", { type: String, default: "dist", description: "Relative path to the project transpiled code root" });
  }

  /** Adds `main`, `types` and `files` entries to `package.json` and  copies `tsconfig.json` (if not exists)  and `tsconfig.base.json` (overwrites) files. */
  protected configuring(): void {
    this.mergePackage({
      main: join(this.options.projectRoot, "index.js").replace(/\\/g, "/"),
      types: join(this.options.projectRoot, "index.d.ts").replace(/\\/g, "/"),
      files: ["@types"],
    });

    this.copyScripts("watch", "execute", "build");
    this.copyDependencies("@types/node", "ts-node-dev", "tslib", "typescript");
    this.copyConfig("tsconfig.json", undefined, this.options);
  }
}
