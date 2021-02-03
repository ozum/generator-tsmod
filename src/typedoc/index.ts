import BaseGenerator from "../generator";

/**  Configures project for TypeDoc. */
export default class extends BaseGenerator {
  protected configuring(): void {
    this.copyDependencies();
  }
}
