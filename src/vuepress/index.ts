import BaseGenerator from "../generator";

/**  Enables VuePress support. */
export default class extends BaseGenerator {
  protected configuring(): void {
    this.copyScripts();
    this.copyDependencies();
    this.copyTemplate("01.typedoc-iframe.md", "module-files/vuepress/01.typedoc-iframe.md");
  }
}
