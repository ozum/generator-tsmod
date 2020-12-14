import camelCase from "lodash.camelcase";
import { basename, extname, join } from "path";
import Generator from "../generator";
import type { TestPlaces } from "../jest-boilerplate";

interface Options {
  fileName: string;
  dir: string;
  testPlace?: keyof typeof TestPlaces;
}

/** Creates a source file and related test file. */
export default class extends Generator<Options> {
  protected constructor(args: string | string[], options: Options) {
    super(args, options);
    this.argument("fileName", { type: String, required: true, description: "Source file name" });
    this.option("dir", { type: String, default: "src", description: "Directory to create source file into" });
    this.option("testPlace", { type: String, default: "root", description: "Place to put test files" });
  }

  /** Create a source file and related test file. */
  protected writing(): void {
    const componentName = camelCase(basename(this.options.fileName, extname(this.options.fileName)));
    this.renderTemplateSafeNoLog("source.ts.ejs", [this.options.dir, this.options.fileName], { componentName });

    this.composeWith(require.resolve("../jest-boilerplate"), {
      arguments: [join(this.options.dir, this.options.fileName)],
      testPlace: this.options.testPlace,
      componentName,
    });
  }
}
