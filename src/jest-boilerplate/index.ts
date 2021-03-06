import path, { dirname, extname, parse, sep, join } from "path";
import merge from "lodash.merge";
import Generator from "../generator";
import type { OptionNames } from "../options";

/**
 * Location of the test file:
 * `near`: test file is located near source file.
 * `root`: test file is located in `test` directory in project root.
 * `src`: test file is located in `__test__` directory located near source file.
 */
export const TestPlaces = {
  near: "Near source file.",
  root: "Root 'test' dir.",
  src: "'__test__' dir in source file directory.",
};

interface Options {
  sourceFilePath: string;
  componentName: string;
  testPlace?: keyof typeof TestPlaces;
}

type Props = Options;

export default class extends Generator<Options> {
  protected static optionNames: OptionNames = ["componentName", "testPlace"];
  private props: Props = this.options;

  protected constructor(args: string | string[], options: Options) {
    super(args, options);
    this.argument("sourceFilePath", { type: String, description: "Path to the file to test relative to project root", required: true });
  }

  protected async prompting(): Promise<void> {
    const prompts = [
      {
        name: "place",
        type: "list",
        message: "Place of test file",
        choices: Object.entries(TestPlaces).map(([value, name]) => ({ name, value })),
        default: 1,
        when: !Object.keys(TestPlaces).includes(this.props.testPlace || ""),
      },
    ];
    const answers = await this.prompt(prompts);
    this.props = merge(this.props, answers);
  }

  /** Create a test file. */
  protected writing(): void {
    const testFilePath = this._relativeTestFilePath;
    if (testFilePath !== undefined) {
      const destinationFile = this.destinationPath(testFilePath);
      let relativePath = path
        .relative(dirname(destinationFile), this.destinationPath(this.props.sourceFilePath))
        .replace(extname(destinationFile), "");
      if (!relativePath.includes(sep)) relativePath = `.${sep}${relativePath}`;
      this.renderTemplateSafeNoLog("test.ejs", testFilePath, { filepath: relativePath, name: this.props.componentName });
    }
  }

  /** Test file path relative to project root. */
  private get _relativeTestFilePath(): string | undefined {
    const { dir, ext, name } = parse(this.props.sourceFilePath);
    const [sourceDirName, ...relativeDir] = dir.split(sep);
    const prefix = sourceDirName ? "" : "root-";
    let testPath = dir;

    if (!["near", "root", "src"].includes(this.props.testPlace || "")) {
      this.emit("error", new Error("'place' option must be one of 'near', 'root', 'src'"));
      return undefined;
    }

    if (sourceDirName === "" && this.props.testPlace !== "root") {
      this.emit("error", new Error("Source file in root directory may only have tests in `test` dir. Use with `--place root` option."));
      return undefined;
    }

    if (this.props.testPlace === "root") testPath = join("test", ...relativeDir);
    else if (this.props.testPlace === "src") testPath = join(dir, "__test__");
    return join(testPath, `${prefix}${name}.test${ext}`);
  }
}
