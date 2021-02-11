/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import Generator from "yeoman-generator";
import camelCase from "lodash.camelcase";
import upperFirst from "lodash.upperfirst";
import { basename, extname } from "path";

export function getOptions<T extends Generator.GeneratorOptions = Generator.GeneratorOptions>(this: T) {
  return {
    /** app */
    boilerplate: { type: Boolean, default: true, description: "Include boilerplate files" },
    cli: { type: Boolean, default: false, description: "Add a CLI" },
    license: { type: Boolean, default: true, description: "Include a license" },
    name: { type: String, description: "Project name" },
    projectRoot: { type: String, default: "dist", description: "Relative path to the project transpiled code root" },
    readme: { type: String, description: "Content to insert in the README.md file" },
    vuepress: { type: Boolean, description: "Add VuePress site support" },
    typedoc: { type: Boolean, default: true, description: "Add TypeDoc support" },
    main: { type: String, default: "index", description: "main file for 'package.json' (without extension or project root)." },

    /** Boilerplate */
    dir: { type: String, default: "src", description: "Directory to create source file into" },
    testPlace: { type: String, default: "root", description: "Place to put test files" },

    /** git */
    githubAccount: { type: String, description: "GitHub username or organization" },
    repositoryName: { type: String, description: "Name of the GitHub repository" },
    githubWorkflow: { type: String, description: "(CSV) Features to be added GitHub workflow. Options: (pg)" },

    /** jest (Additionally: projectRoot) */
    testEnvironment: { type: String, description: "Test environment (jsdom or node)" },
    coverage: { type: Boolean, default: true, description: "Add test coverage" },

    /** jest-boilerplate (Additionally: testPlace) */
    componentName: {
      type: String,
      default: upperFirst(camelCase(basename(this.options.sourceFilePath || "", extname(this.options.sourceFilePath || "")))),
      description: "Name of the component to test",
    },

    /** not-sync */
    notSync: {
      type: Boolean,
      default: true,
      description:
        "Disable synchronization of default paths with cloud storage such as iCloudDrive, Dropbox or OneDirve. To add additional paths use --not-sync-paths.",
    },
    notSyncPaths: {
      type: String,
      description: "Directories (as CSV) to disable synchronization with cloud storage such as iCloudDrive, Dropbox or OneDirve.",
    },

    /** readme (Additionally: testPlace) */

    /** typescript (Additionally: projectRoot) */
    builder: { type: String, description: "Builder to use. (rollup)" },
  };
}

export type OptionNames = Array<keyof ReturnType<typeof getOptions>>;
