import Generator from "../generator";

const JEST_ENV = ["jsdom", "node"];

interface Options {
  testEnvironment: "jsdom" | "node";
  projectRoot: string;
  coverage: boolean;
}

type Props = Options;

/** Adds Jest configuration to project. */
export default class extends Generator<Options> {
  private props: Props = this.options;

  protected constructor(args: string | string[], options: Options) {
    super(args, options);
    this.option("testEnvironment", { type: String, description: "Test environment (jsdom or node)" });
    this.option("projectRoot", { type: String, default: "dist", description: "Relative path to the project transpiled code root" });
    this.option("coverage", { type: Boolean, default: true, description: "Add test coverage" }); // to disabel: --no-coverage
  }

  protected async prompting(): Promise<void> {
    const prompts = [
      {
        type: "list",
        name: "testEnvironment",
        message: "What environment do you want to use",
        choices: JEST_ENV,
        default: this.options.testEnvironment,
        when: JEST_ENV.indexOf(this.options.testEnvironment) === -1,
      },
    ];

    const answers = await this.prompt(prompts);
    this.props = { ...this.props, ...answers };
  }

  /** Copy dependencies and configuration files and add `test` script to `package.json`. */
  protected configuring(): void {
    this._deleteDefaultTestScript();
    this.copyDependencies("@types/jest", "jest", "ts-jest");
    this.copyScripts("test");
    this.copyConfig("jest.config.js", undefined, this.props);
    this.copyTemplate("test/tsconfig.json", "test/tsconfig.json");
  }

  protected _deleteDefaultTestScript(): void {
    const destinationPackage = this.readDestinationPackage();
    const destinationTestScript = destinationPackage.scripts?.test || "";
    if (destinationTestScript.includes("no test specified")) {
      delete destinationPackage?.scripts?.test;
      this.writeDestinationJSON("package.json", destinationPackage);
    }
  }
}
