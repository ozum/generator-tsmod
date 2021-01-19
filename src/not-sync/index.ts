import { disable } from "not-sync";
import { promises as fs } from "fs";
import BaseGenerator from "../generator";
import type { OptionNames } from "../options";

interface Options {
  notSyncDirs: string;
  coverage: boolean;
}

/**  Configures project for TypeDoc. */
export default class extends BaseGenerator<Options> {
  protected static optionNames: OptionNames = ["notSyncDirs", "coverage"];

  protected async configuring(): Promise<void> {
    const paths = this.options.notSyncDirs.split(/\s*,\s*/);
    if (this.options.coverage) paths.push("coverage");

    await Promise.all(paths.map((path) => fs.mkdir(this.destinationPath(path), { recursive: true })));
    await disable(paths, { cwd: this.destinationPath(".") });
  }
}
