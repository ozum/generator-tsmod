# generator-tsmod

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->

- [Installation](#installation)
- [Synopsis](#synopsis)
- [Features Overview](#features-overview)
- [Details](#details)
  - [Notes](#notes)
- [Scripts from `package.json`](#scripts-from-packagejson)
  - [For Projects](#for-projects)
  - [For Internal Use](#for-internal-use)
  - [TODO](#todo)
- [Features](#features)
  - [Uninstall](#uninstall)
  - [Semantic Release](#semantic-release)
  - [Commitizen](#commitizen)
  - [Commit Lint & Standard Version](#commit-lint--standard-version)
  - [Husky](#husky)
  - [Lint Staged](#lint-staged)
  - [Documentation](#documentation)
    - [TypeDoc](#typedoc)
    - [VuePress](#vuepress)
  - [Additional Notes](#additional-notes)
    - [.npmignore (or lack of)](#npmignore-or-lack-of)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

# Installation

```sh
npm install -g yo
npm install -g generator-tsmod
```

# Synopsis

- Generate project scaffold. Also executes `npm init` if no `package.json` found.

```sh
yo tsmod
```

- Generate project scaffold with additional options.

```sh
yo tsmod --vuepress --typedoc --license MIT --no-coverage --no-import-helpers --no-typedoc --no-not-sync
```

- Remove generated but unmodified files safely. `--no-install` prevents running `npm install` command.

```sh
yo tsmod:uninstall --no-install --force
```

- Update already generated project using auto created `yo:update` script from `package.json`.

```sh
npm run yo:update
```

# Features Overview

This is a yeoman generator which is used to create TypeScript project. It features:

- Uninstall
- [semantic-release](https://semantic-release.gitbook.io/)
- [EditorConfig](https://editorconfig.org/)
- [ESLint](https://eslint.org/)
- [Prettier](https://prettier.io/)
- Git
  - [GitHub Actions](https://github.com/features/actions)
  - .gitignore
  - .gitattributes
- [Commitizen](https://github.com/commitizen/cz-cli)
- [commitlint](https://commitlint.js.org/)
- [husky](https://typicode.github.io/husky)
- [Jest](https://jestjs.io/)
- [lint-staged](https://github.com/okonet/lint-staged#readme)
- [readmeasy](https://www.npmjs.com/package/readmeasy)
- [TypeDoc](https://typedoc.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [VuePress](https://vuepress.vuejs.org/)
  - [vuepress-bar](https://www.npmjs.com/package/vuepress-bar)

# Details

## Notes

- Add `NPM_TOKEN` via `GitHub > Settings > Secrets`. (GitHub Actions workflow use it in Semantic Release step to publish your package to npm)

# Scripts from `package.json`

## For Projects

| Script              | Description                                                                                                                                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **`release`**       | See [below](#release) Update README, add changed files to git and push. Github Actions releases your code.                                                                                                         |
| **`yo:update`**     | Uninstall and re-generate project safely.                                                                                                                                                                          |
| `execute`           | Run given source file.                                                                                                                                                                                             |
| `watch`             | Run given source file and watch for changes to re-run.                                                                                                                                                             |
| `lint`              | Lint and format source code.                                                                                                                                                                                       |
| `format`            | Format all supported files (source code, css, graphql etc.).                                                                                                                                                       |
| `test`              | Test project. Use `-- --no-coverage --watch` for watching.                                                                                                                                                         |
| `readme`            | Update `README.md` file using [readmeasy](https://www.npmjs.com/package/readmeasy).                                                                                                                                |
| `build`             | Build project using TypeScript. `-- --watch` for watching.                                                                                                                                                         |
| `docs:build`        | Build [VuePress](https://vuepress.vuejs.org/) for production. Can be used by [netlify](https://www.netlify.com/) for building.                                                                                     |
| `docs:dev`          | Starts [VuePress](https://vuepress.vuejs.org/) development web site. (TypeDoc should be updated manually during development.)                                                                                      |
| `typedoc:html`      | Generate TypeDoc HTML documentation web site into `api-docs-html` directory.                                                                                                                                       |
| `typedoc:md`        | Generate VuePress compatible Markdown from TypeDoc comments into `api-docs-md` directory. (Renames all `index.md` files (i.e. for `Index` class) as `index2.md`, because VuePress throws error for index.md files) |
| `typedoc:single-md` | Generates Markdown files from TypeDoc and concatenates them into `api.md` file.                                                                                                                                    |

## For Internal Use

| Script                | Description                                                   |
| --------------------- | ------------------------------------------------------------- |
| **`update-packages`** | Update dependencies in all `package.json` files in templates. |
| `postinstall`         | Install `husky`.                                              |

## TODO

| Script       | Command            | Description                                                                                                                                                |
| ------------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `postreadme` | `oclif-dev readme` | Inserts [oclif](https://oclif.io/) documenatition into `README.md` after `README.md` is generated by [readmeasy](https://www.npmjs.com/package/readmeasy). |

# Features

## Uninstall

```sh
yo tsmod:uninstall --force --no-install
```

Above command removes non-user modifiable files and other files not modified by user from project. Also removes added configurations if they are not modified by user. To track modifications, this module uses Yeoman config file `.yo-rc.json`. `--no-install` prevents `npm install` usually not mandatory after dependencies are removed, to speed up uninstall.

## Semantic Release

Fully automated version management and package publishing. [semantic-release](https://semantic-release.gitbook.io/semantic-release/) automates the whole package release workflow including: determining the next version number, generating the release notes and publishing the package.
This removes the immediate connection between human emotions and version numbers, strictly following the Semantic Versioning specification.

Used in `.github/workflows/main.yml` release step.

## Commitizen

Packages: [commitizen](https://github.com/commitizen/cz-cli), [cz-conventional-changelog](https://github.com/commitizen/cz-conventional-changelog)

When you commit with Commitizen, you'll be prompted to fill out any required commit fields at commit time.

## Commit Lint & Standard Version

Packages: [@commitlint/cli & @commitlint/config-conventional](https://github.com/conventional-changelog/commitlint), [standard-version](https://github.com/conventional-changelog/standard-version),

commitlint checks if your commit messages meet the [conventional commit format](https://conventionalcommits.org/).

**Standard Version**: Automate versioning and CHANGELOG generation, with semver.org and conventionalcommits.org

**Commitlint**: Checks if your commit messages meet the conventional commit format.

#### First Release

`standard-version --first-release` will tag a release without bumping the version

`standard-version` will tag a release and bump the version

## Husky

Packages: [husky](https://github.com/typicode/husky)

Git hooks made easy. Husky can prevent bad git commit, git push and more. It is used here to execute

- `lint-staged` at `precommit`,
- `commitlint` at `commit-msg`,
- `commitizen` at `prepare-commit-msg` (currently disabled, see [this issue](https://github.com/commitizen/cz-cli/issues/558#event-2490437059))

## Lint Staged

Packages: [lint-staged](https://github.com/okonet/lint-staged)

Run linters against staged git files, so non-changed files are excluded from linters.

| File Type                | What                 |
| ------------------------ | -------------------- |
| `js`, `ts`               | Lint, test, coverage |
| `json`, `md`, `css` etc. | Format               |
| `rc`, `json`             | Lint                 |

## Documentation

### TypeDoc

[TypeDoc](https://typedoc.org/) TypeDoc converts comments in TypeScript source code into rendered HTML documentation. Also it is possible to create multiple Markdown files using
[typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown) plugin. Using [concat-md](https://www.npmjs.com/package/concat-md) it is possible to create single
Markdown file.

### VuePress

[VuePress](https://vuepress.vuejs.org/) is used to create documentation web sites. [vuepress-bar](https://www.npmjs.com/package/vuepress-bar) is used to generate VuePress menu.
Also [TypeDoc](https://typedoc.org/) HTML and [typedoc-plugin-markdown](https://github.com/tgreyuk/typedoc-plugin-markdown) generated API docs is included in VuePress site.

Netlify may be used to publish documentation.

## Additional Notes

### .npmignore (or lack of)

`.npmignore` is not used, because this file overrides `.gitignore` and may results unpredictable behavior. Instead of using a blacklist for node modules, it is safer to write
whitelisted files to be published in `files` key in `package.json`.
