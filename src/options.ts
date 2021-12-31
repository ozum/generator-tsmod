/* eslint-disable @typescript-eslint/explicit-function-return-type */
// import type { ArgumentConfig } from "yeoman-generator";

export const optionDefinitions = {
  // cli: { type: Boolean, default: false, description: "Add a CLI" },
  license: { type: Boolean as any, default: true, description: "Include a license" },
  name: { type: String, description: "Project name" },
  projectRoot: { type: String, default: "dist", description: "Relative path to the project transpiled code root" },
  readme: { type: String, description: "Content to insert in the README.md file" },
  vuepress: { type: Boolean as any, description: "Add VuePress site support" },
  typedoc: { type: Boolean as any, default: true, description: "Add TypeDoc support" },
  main: { type: String, default: "dist/index.js", description: "main file for 'package.json' (without extension or project root)." },

  /** git */
  githubAccount: { type: String, description: "GitHub username or organization" },
  repositoryName: { type: String, description: "Name of the GitHub repository" },
  githubWorkflow: { type: String, description: "(CSV) Features to be added GitHub workflow. Options: (pg)" },

  /** typescript (Additionally: projectRoot) */
  builder: { type: String, description: "Builder to use. (rollup)" },

  /** VuePress */
  "google-analytics-id": { type: String, description: "Google analytics ID" },
};

export type OptionNames = Array<keyof typeof optionDefinitions>;
