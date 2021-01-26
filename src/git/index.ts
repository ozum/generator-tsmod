import originUrl from "git-remote-origin-url";
import Generator from "../generator";
import type { OptionNames } from "../options";

interface Options {
  githubAccount: string;
  repositoryName: string;
}

/**
 * - Enables git for GitHub, configures project, initializes git and adds remote origin.
 * - Adds commitlint support.
 * - Adds commitizen support.
 * - Adds GitHub workflows.
 */
export default class extends Generator<Options> {
  protected static optionNames: OptionNames = ["githubAccount", "repositoryName"];
  private originUrl?: string;

  protected async configuring(): Promise<void> {
    const pkg = this.readDestinationPackage();

    this.copyTemplate(".gitattributes", ".gitattributes");
    this.copyTemplateNoLog("_gitignore", ".gitignore");
    this.copyTemplate("workflows/main.yml", ".github/workflows/main.yml");
    this.copyTemplate(".commitlintrc", ".commitlintrc");
    this.copyTemplate(".czrc", ".czrc");
    this.addCreatedDir(".github");
    this.copyDependencies({ dependencies: ["commitizen", "@commitlint/cli", "@commitlint/config-conventional"] });

    try {
      this.originUrl = await originUrl(this.destinationPath());
    } catch (err) {
      this.originUrl = "";
    }

    this.mergePackage({
      repository: this._urlFromOption ?? pkg.repository ?? this.originUrl,
      homepage: pkg.homepage ?? (this._homePageUrlFromOption as any),
      bugs: pkg.bugs ?? (this._bugsUrl as any),
    });
  }

  /** Init git and add remote origin. */
  protected writing(): void {
    const pkg = this.readDestinationPackage();
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
  private get _homePageUrlFromOption(): string | undefined {
    return this._urlFromOption ? `https://github.com/${this._urlFromOption}` : undefined;
  }

  /** Generate bugs URL. */
  private get _bugsUrl(): string | undefined {
    return this._homePageUrlFromOption ? `${this._homePageUrlFromOption}/issues` : undefined;
  }
}
