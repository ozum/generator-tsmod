import Generator from "../generator";
import type { OptionNames } from "../options";

const JEST_ENV = ["jsdom", "node"];

interface Options {
  testEnvironment: "jsdom" | "node";
  projectRoot: string;
  coverage: boolean;
  notSync: boolean;
  notSyncPaths: string;
}

type Props = Options;

/** Adds Jest configuration to project. */
export default class extends Generator<Options> {
  private props: Props = this.options;
  protected static optionNames: OptionNames = ["testEnvironment", "projectRoot", "coverage", "notSync", "notSyncPaths"];

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
    const notSync = (this.options.notSync || this.options.notSyncPaths) && this.options.coverage ? "npm run not-sync && " : "";
    const coverage = this.options.coverage ? " --coverage" : "";

    this._deleteDefaultTestScript();
    this.copyDependencies({ dependencies: ["@types/jest", "jest", "ts-jest"] });
    this.copyConfig("jest.config.js", undefined, this.props);
    this.copyTemplate("test/tsconfig.json", "test/tsconfig.json");
    this.mergePackage({ scripts: { test: `${notSync}jest${coverage}` } });
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
