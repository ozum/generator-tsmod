import Generator from "../generator";
import { OptionNames } from "../options";

interface Options {
  typedoc: boolean;
}

/**  Configures project for `README.md` creation from `README.njk` using `readmeasy` package. */
export default class extends Generator<Options> {
  protected static optionNames: OptionNames = ["typedoc"];

  protected configuring(): void {
    this.copyTemplate("installation", "module-files/template-partials/installation");
    this.package.copyScripts(this.sourcePackage, ["readme"]);
    this.package.copyDependencies(this.sourcePackage, ["readmeasy"]);
    this.renderTemplateSafe("README.njk.ejs", "README.njk", { typedoc: this.options.typedoc } as any);
  }
}
