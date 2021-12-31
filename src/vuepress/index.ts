import BaseGenerator from "../generator";
import { OptionNames } from "../options";

interface Options {
  "google-analytics-id"?: string;
}

/**  Enables VuePress support. */
export default class extends BaseGenerator<Options> {
  protected static optionNames: OptionNames = ["google-analytics-id"];

  protected configuring(): void {
    this.package.copyScripts();
    this.package.copyDependencies();
    this.copyTemplate("01.typedoc-iframe.md", "module-files/vuepress/01.typedoc-iframe.md");
    this.assign("package.json", {
      vuepress: { "google-analytics-id": this.options["google-analytics-id"] },
    });
  }
}
