import BaseGenerator from "../generator";
import type { OptionNames } from "../options";

interface Options {
  vuepress: boolean;
}

/**  Configures project for TypeDoc. */
export default class extends BaseGenerator<Options> {
  protected static optionNames: OptionNames = [];

  protected constructor(args: string | string[], options: Options) {
    super(args, options);
    this.option("vuepress", { type: Boolean, description: "Add vuepress support" });
  }

  protected configuring(): void {
    const vuepress = this.options.vuepress ? "--platform vuepress" : "";

    const typeDocCommand = [
      "rm -rf api-docs-md",
      `typedoc ${vuepress} --plugin typedoc-plugin-example-tag,typedoc-plugin-markdown --excludeExternals --excludePrivate --excludeProtected --exclude 'src/bin/**/*' --theme markdown --readme none --out api-docs-md src/index.ts`,
      'find api-docs-md -name "index.md" -exec sh -c \'mv "$1" "${1%index.md}"index2.md\' - {} \\;', // eslint-disable-line no-template-curly-in-string
    ];

    this.mergePackage({
      scripts: {
        "typedoc:html": "rm -rf api-docs-html && typedoc --plugin typedoc-plugin-example-tag --out api-docs-html src/index.ts",
        "typedoc:md": typeDocCommand.join(" && "),
        "typedoc:single-md": "npm run typedoc:md && concat-md --dir-name-as-title api-docs-md > api.md && rm -rf api-docs-md",
      },
    });

    this.copyDependencies();
  }
}
