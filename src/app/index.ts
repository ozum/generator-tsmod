import merge from "lodash.merge";
import path from "path";
import askName from "inquirer-npm-name";
import type { JSONSchemaForNPMPackageJsonFiles as PackageJson } from "@schemastore/package";
import readGitUser from "read-git-user";
import { promises } from "fs";
import Generator from "../generator";
import { parseModuleName, parseAuthor, validatePackageName } from "./util";
import type { Person } from "./util";

const { readFile } = promises;

const { name: authorName, email: authorEmail, url: authorUrl } = require("user-meta"); // eslint-disable-line @typescript-eslint/no-var-requires

interface Props {
  name: PackageJson["name"];
  description?: PackageJson["description"];
  version?: PackageJson["version"];
  homepage?: PackageJson["homepage"];
  repositoryName?: string;
  githubAccount?: string;
  author?: Person;
  keywords?: PackageJson["keywords"];
  scopeName?: string;
}

interface Options {
  name: string;
  boilerplate: boolean;
  cli: boolean;
  license: boolean;
  githubAccount: string;
  repositoryName: string;
  projectRoot: string;
  readme: string;
  vuepress: boolean;
  typedoc: boolean;
  coverage: boolean;
  reinstall: boolean;
}

export default class extends Generator<Options> {
  private props: Props = {} as any;

  protected constructor(args: string | string[], options: Options) {
    super(args, options);
    this.option("boilerplate", { type: Boolean, default: true, description: "Include boilerplate files" });
    this.option("cli", { type: Boolean, default: false, description: "Add a CLI" });
    this.option("license", { type: Boolean, default: true, description: "Include a license" });
    this.option("name", { type: String, description: "Project name" });
    this.option("githubAccount", { type: String, description: "GitHub username or organization" });
    this.option("repositoryName", { type: String, description: "Name of the GitHub repository" });
    this.option("projectRoot", { type: String, default: "dist", description: "Relative path to the project transpiled code root" });
    this.option("readme", { type: String, description: "Content to insert in the README.md file" });
    this.option("coverage", { type: Boolean, description: "Add test coverage requirement" });
    this.option("vuepress", { type: Boolean, description: "Add VuePress site support" });
    this.option("typedoc", { type: Boolean, description: "Add TypeDoc support" });
    const nameError = validatePackageName(this.options.name);
    if (nameError) this.emit("error", nameError);
  }

  protected async initializing(): Promise<void> {
    if (!this.existsDestination("package.json")) await this._npmInit();

    const pkg = this.readDestinationPackage();
    this.props = {
      name: this.options.name ?? pkg.name,
      description: pkg.description,
      version: pkg.version,
      homepage: pkg.homepage,
      repositoryName: this.options.repositoryName || (pkg.repository as string) || this.options.name || pkg.name,
      githubAccount: this.options.githubAccount ?? (await readGitUser()).username ?? this.props.scopeName,
      author: parseAuthor(pkg.author),
    };
  }

  /**
   * If `package.json` does not exists, executes `npm init`. However `mem-fs` of Yeoman could not know that `package.json` is created.
   * Use `mem-fs`s own methods to inform it newly created `package.json`.
   */
  protected async _npmInit(): Promise<void> {
    this.spawnCommandSync("npm", ["init"]);
    const pkg = await readFile(this.destinationPath("package.json"), { encoding: "utf8" });
    this.writeDestination("package.json", pkg);
  }

  protected async prompting(): Promise<void> {
    await this._fillModuleNameDetails();
    await this._fillDetails();
  }

  protected configuring(): void {
    this.mergePackage({
      name: this.props.name,
      version: "0.0.0",
      description: this.props.description,
      author: this.props.author,
      files: [
        this.options.projectRoot,
        `!${this.options.projectRoot}/**/@(*.spec|*.test)*`,
        `!${this.options.projectRoot}/**/__test__`,
        "module-files",
      ],
      keywords: this.props.keywords,
      engines: { node: ">= 12.0.0" },
      scripts: {
        "yo:update": "yo tsmod:uninstall --no-install --force && yo tsmod",
      },
    });

    const pkg = this.readDestinationPackage();

    this.copyScripts("release");

    this.composeWith(require.resolve("../editorconfig"));
    this.composeWith(require.resolve("../eslint"));
    this.composeWith(require.resolve("../git"), { githubAccount: this.props.githubAccount, repositoryName: this.props.repositoryName });
    this.composeWith(require.resolve("../husky"));
    this.composeWith(require.resolve("../jest"), {
      projectRoot: this.options.projectRoot,
      testEnvironment: "node",
      coverage: this.options.coverage,
    });
    this.composeWith(require.resolve("../lint-staged"));
    this.composeWith(require.resolve("../readme"), { typedoc: this.options.typedoc });

    if (this.options.typedoc) this.composeWith(require.resolve("../typedoc"), { vuepress: this.options.vuepress });

    this.composeWith(require.resolve("../typescript"), { projectRoot: this.options.projectRoot });

    if (this.options.vuepress) this.composeWith(require.resolve("../vuepress"), { vuepress: this.options.vuepress });

    if (this.options.boilerplate)
      this.composeWith(require.resolve("../boilerplate"), { arguments: ["index.ts"], dir: "src", testPlace: "root" });

    if (this.options.license && !pkg.license) {
      this.composeWith(require.resolve("generator-license/app"), {
        name: this.props.author?.name,
        email: this.props.author?.email,
        website: this.props.author?.url,
      });
    }
  }

  private async _fillModuleNameDetails(): Promise<void> {
    const answer = this.props.name
      ? { name: this.props.name }
      : await askName({ name: "name", default: path.basename(process.cwd()) }, this as any);

    Object.assign(this.props, parseModuleName(answer.name));
  }

  private async _fillDetails(): Promise<void> {
    const pkg = this.readDestinationPackage();
    const prompts = [
      { name: "description", message: "Description", when: !this.props.description },
      { name: "homepage", message: "Project homepage url", when: !this.props.homepage, default: this._urlFromOption },
      { name: "author.name", message: "Author's Name", when: !this.props.author?.name, default: authorName, store: true },
      { name: "author.email", message: "Author's Email", when: !this.props.author?.email, default: authorEmail, store: true },
      { name: "author.url", message: "Author's Homepage", when: !this.props.author?.url, default: authorUrl, store: true },
      {
        name: "keywords",
        message: "Package keywords (comma to split)",
        when: !pkg.keywords,
        filter: (words: string) => words.split(/\s*,\s*/g),
      },
      {
        name: "githubAccount",
        message: "GitHub username or organization",
        when: !this.props.githubAccount,
        store: true,
      },
    ];

    const answers = await this.prompt(prompts);
    this.props = merge(this.props, answers);
  }

  private get _urlFromOption(): string | undefined {
    return this.props.githubAccount && this.props.repositoryName
      ? `https://github.com/${this.props.githubAccount}/${this.props.repositoryName}`
      : undefined;
  }
}
