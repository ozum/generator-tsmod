import BaseGenerator from "../generator";
import type { OptionNames } from "../options";

/**  Enables VuePress support. */
export default class extends BaseGenerator {
  protected static optionNames: OptionNames = [];

  protected configuring(): void {
    this.copyScripts();
    this.copyDependencies();
    this.copyTemplate("01.typedoc-iframe.md", "module-files/vuepress/01.typedoc-iframe.md");
    this.mergePackage({
      vuepress: { "google-analytics-id": "" },
    });
  }
}
