/* eslint-disable no-unused-expressions */
import get from "lodash.get";
import unset from "lodash.unset";
import isEqual from "lodash.isequal";
import isEmpty from "lodash.isempty";
import deepClean from "clean-deep";
import deleteEmpty from "delete-empty";
import type { Config } from "../utils/helper";
import type { OptionNames } from "../options";

import BaseGenerator from "../generator";

const CONFIG_TYPES: Array<keyof Config> = ["addedData", "addedFiles", "addedFilesSafe"];

/**  Removes added files and configuration data added by this generator. */
export default class extends BaseGenerator {
  protected static optionNames: OptionNames = [];

  /** Delete empty objects and arrays from config. */
  private _cleanEmptyConfig(): void {
    // Get copy of config from file.
    const config = this.config.getAll() as Config;

    CONFIG_TYPES.forEach((configType) => {
      // Clean empty config paths from copied config.
      config[configType] = deepClean(config[configType]) as any;

      // If key is empty delete it from original config.
      if (isEmpty(config[configType])) this.config.delete(configType);
    });
  }

  protected async configuring(): Promise<void> {
    const config = this.config.getAll() as Config;

    // Delete added files and added safe files.
    (config.addedFiles || []).forEach((file) => this.deleteDestination(file));
    Object.keys(config.addedFilesSafe || {}).forEach((file) => this.deleteDestinationSafe(file));

    // Delete added data from JSON files.
    Object.keys(config.addedData || {}).forEach((file) => {
      const dataFromFile = this.readDestinationJSON(file) as Record<string, any>;
      Object.entries(config.addedData[file]?.safe || {})
        .filter(([dataPath, value]) => isEqual(get(dataFromFile, dataPath), value))
        .forEach(([dataPath]) => {
          unset(dataFromFile, dataPath);
          delete config.addedData[file].safe[dataPath];
        });

      Object.entries(config.addedData[file]?.normal || {}).forEach(([dataPath]) => {
        unset(dataFromFile, dataPath);
        delete config.addedData[file].normal[dataPath];
      });

      this.writeDestinationJSON(file, deepClean(dataFromFile));
    });

    this.config.set("addedData", config.addedData);
  }

  protected async end(): Promise<void> {
    const config: Config = this.config.getAll() as Config;
    const sourcePackage = this.readSourcePackage();

    // Delete empty dirs created by this generator.
    const dirsToDeleteIfEmpty: string[] = (config.createdDirs || []).map((path: string) => this.destinationPath(path));
    await Promise.all(dirsToDeleteIfEmpty.map(deleteEmpty));
    this.config.delete("createdDirs");
    this.config.delete("addedFiles");

    this._cleanEmptyConfig();

    // Delete .y-*rc.json if it is empty.
    if (isEqual(this.readDestinationJSON(".yo-rc.json"), { [sourcePackage.name as string]: {} })) {
      this.deleteDestination(".yo-rc.json");
    }
  }
}
