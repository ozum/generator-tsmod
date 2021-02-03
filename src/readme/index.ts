import BaseGenerator from "../generator";
import type { OptionNames } from "../options";

interface Options {
  typedoc: boolean;
}

/**  Configures project for `README.md` creation from `README.njk` using `readmeasy` package. */
export default class extends BaseGenerator<Options> {
  protected static optionNames: OptionNames = ["typedoc"];

  protected configuring(): void {
    this.copyTemplate("installation", "module-files/template-partials/installation");
    this.copyScripts({ scripts: ["readme"] });
    this.copyDependencies({ dependencies: ["readmeasy"] });
    this.renderTemplateSafeNoLog("README.njk.ejs", "README.njk", { typedoc: this.options.typedoc });
  }
}
