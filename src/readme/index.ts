import BaseGenerator from "../generator";

interface Options {
  typedoc: boolean;
}

/**  Configures project for `README.md` creation from `README.njk` using `readmeasy` package. */
export default class extends BaseGenerator<Options> {
  protected constructor(args: string | string[], options: Options) {
    super(args, options);
    this.option("typedoc", { type: Boolean, description: "Add TypeDoc support" });
  }

  protected configuring(): void {
    this.copyTemplate("installation", "module-files/template-partials/installation");
    this.copyScripts("readme");
    this.copyDependencies("readmeasy");
    this.renderTemplateSafe("README.njk.ejs", "README.njk", { typedoc: this.options.typedoc });
  }
}
