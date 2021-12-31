import originUrl from "git-remote-origin-url";
import { dump } from "js-yaml";
import Generator from "../generator";
import { OptionNames } from "../options";
import getWorkflow from "./workflows/default";

interface Options {
  githubAccount: string;
  repositoryName: string;
  githubWorkflow: string;
}

/**
 * - Enables git for GitHub, configures project, initializes git and adds remote origin.
 * - Adds commitlint support.
 * - Adds commitizen support.
 * - Adds GitHub workflows.
 */
export default class extends Generator<Options> {
  protected static optionNames: OptionNames = ["githubAccount", "repositoryName", "githubWorkflow"];
  private originUrl?: string;

  protected async configuring(): Promise<void> {
    try {
      this.originUrl = await originUrl(this.destinationPath());
    } catch (err) {
      // Ignore error
    }

    const pkg = this.destinationPackage;

    this.copyTemplate(".gitattributes", ".gitattributes");
    this.copyTemplate("_gitignore", ".gitignore");
    this.writeDestination(".github/workflows/main.yml", dump(getWorkflow(this), { lineWidth: 400, condenseFlow: true }));
    this.copyTemplate(".commitlintrc", ".commitlintrc");
    this.copyTemplate(".czrc", ".czrc");
    this.package.copyDependencies(this.sourcePackage, ["commitizen", "@commitlint/cli", "@commitlint/config-conventional"]);
    this.copyTemplateSafe("github.env", ".github/workflows/github.env");
    this.assignSafe("package.json", {
      repository: this._urlFromOption ?? pkg.repository ?? this.originUrl,
      homepage: pkg.homepage ?? (this.#homePageUrlFromOption as any),
      bugs: pkg.bugs ?? (this.#bugsUrl as any),
    });
  }

  /** Init git and add remote origin. */
  protected writing(): void {
    const pkg = this.destinationPackage;
    this.spawnCommandSync("git", ["init", "--quiet"], { cwd: this.destinationPath() });
    if (pkg.repository && !this.originUrl) {
      const repository = typeof pkg.repository === "string" ? pkg.repository : pkg.repository.url;
      const repoSSH = !repository.includes(".git") ? `git@github.com:${repository}.git` : repository;
      this.spawnCommandSync("git", ["remote", "add", "origin", repoSSH], { cwd: this.destinationPath() });
    }
  }

  /** Generate GitHub URL from options. */
  private get _urlFromOption(): string | undefined {
    return this.options.githubAccount && this.options.repositoryName
      ? `${this.options.githubAccount}/${this.options.repositoryName}`
      : undefined;
  }

  /** Guess home page URL from options. */
  get #homePageUrlFromOption(): string | undefined {
    return this._urlFromOption ? `https://github.com/${this._urlFromOption}` : undefined;
  }

  /** Generate bugs URL. */
  get #bugsUrl(): string | undefined {
    return this.#homePageUrlFromOption ? `${this.#homePageUrlFromOption}/issues` : undefined;
  }
}
