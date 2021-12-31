/* eslint-disable no-template-curly-in-string */
import type Generator from "../../generator";

export default function getWorkflow(generator: Generator): Record<string, any> {
  const registry = generator.destinationPackage?.publishConfig?.registry === "https://npm.pkg.github.com/" ? "github" : "npm";
  const NPM_TOKEN = registry === "npm" ? "${{ secrets.NPM_TOKEN }}" : "${{ secrets.GITHUB_TOKEN }}";

  return {
    name: "CI / CD",
    on: { push: { branches: ["master", "next", "next-major", "alpha", "beta"] }, pull_request: { branches: ["*"] } },
    jobs: {
      build: {
        "runs-on": "ubuntu-latest",
        steps: [
          { run: "echo ${{github.ref}}" },
          { run: "echo Condition met", if: "github.event_name == 'push' && github.ref == 'refs/heads/master'" },

          //
          // ─── POSTGRESQL ─────────────────────────────────────────────────────────────────
          //

          { name: "Start PostgreSQL on Ubuntu", run: "sudo systemctl start postgresql.service\npg_isready\n" },
          {
            name: "Create additional PostgreSQL user",
            run: 'sudo -u postgres psql --command="CREATE USER \\"user\\" PASSWORD \'password\' SUPERUSER CREATEDB REPLICATION" --command="\\du"\n',
          },

          //
          // ─── COMMON STEPS ───────────────────────────────────────────────────────────────
          //

          { name: "Begin CI...", uses: "actions/checkout@v2" },
          {
            name: "Set environment variables from file.",
            shell: "bash",
            run: 'while read line; do\n  echo "$line" >> $GITHUB_ENV\ndone < .github/workflows/github.env',
          },
          { name: "Use Node 14", uses: "actions/setup-node@v2", with: { "node-version": "14.x" } },

          // Cache node modules. See cache examples here: https://github.com/actions/cache/blob/main/examples.md#node---yarn
          // See Cache hit condition here: https://stackoverflow.com/questions/61010294/how-to-cache-yarn-packages-in-github-actions/62244232#62244232
          { name: "Get yarn cache directory path", id: "yarn-cache-dir-path", run: 'echo "::set-output name=dir::$(yarn cache dir)"' },
          {
            name: "Cache node modules (yarn)",
            uses: "actions/cache@v2",
            id: "yarn-cache", // use this to check for `cache-hit` (`steps.yarn-cache.outputs.cache-hit != 'true'`)
            with: {
              path: "${{ steps.yarn-cache-dir-path.outputs.dir }}",
              key: "${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}",
              "restore-keys": "${{ runner.os }}-yarn-\n",
            },
          },
          { name: "Install project dependencies", run: "yarn" },
          { name: "Run ESLint", run: "yarn lint --no-fix" },
          { name: "Run Prettier", run: "yarn format --no-write --check" },
          { name: "Test", run: "yarn test --ci --maxWorkers=2", env: { CI: true } },
          { name: "Build", run: "yarn build", env: { CI: true } },
          {
            name: "Release",
            if: "github.event_name == 'push'", // "&& github.ref == 'refs/heads/master'",
            env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}", NPM_TOKEN },
            run: "npx semantic-release",
          },
        ],
      },
    },
  };

  // return [
  //   {
  //     name: "CI / CD",
  //     on: { push: { branches: ["master", "next", "next-major", "alpha", "beta"] }, pull_request: { branches: ["*"] } },
  //     jobs: {
  //       build: {
  //         "runs-on": "ubuntu-latest",
  //         steps: [
  //           { run: "echo ${{github.ref}}" },
  //           { run: "echo Condition met", if: "github.event_name == 'push' && github.ref == 'refs/heads/master'" },
  //         ],
  //       },
  //     },
  //   },

  //   //
  //   // ─── POSTGRESQL ─────────────────────────────────────────────────────────────────
  //   //

  //   { name: "Start PostgreSQL on Ubuntu", run: "sudo systemctl start postgresql.service\npg_isready\n" },
  //   {
  //     name: "Create additional PostgreSQL user",
  //     run: 'sudo -u postgres psql --command="CREATE USER \\"user\\" PASSWORD \'password\' SUPERUSER CREATEDB REPLICATION" --command="\\du"\n',
  //   },

  //   //
  //   // ─── COMMON STEPS ───────────────────────────────────────────────────────────────
  //   //

  //   { name: "Begin CI...", uses: "actions/checkout@v2" },
  //   {
  //     name: "Set environment variables from file.",
  //     shell: "bash",
  //     run: 'while read line; do\n  echo "$line" >> $GITHUB_ENV\ndone < .github/workflows/github.env',
  //   },
  //   { name: "Use Node 14", uses: "actions/setup-node@v2", with: { "node-version": "14.x" } },

  //   // Cache node modules. See cache examples here: https://github.com/actions/cache/blob/main/examples.md#node---yarn
  //   // See Cache hit condition here: https://stackoverflow.com/questions/61010294/how-to-cache-yarn-packages-in-github-actions/62244232#62244232
  //   { name: "Get yarn cache directory path", id: "yarn-cache-dir-path", run: 'echo "::set-output name=dir::$(yarn cache dir)"' },
  //   {
  //     name: "Cache node modules (yarn)",
  //     uses: "actions/cache@v2",
  //     id: "yarn-cache", // use this to check for `cache-hit` (`steps.yarn-cache.outputs.cache-hit != 'true'`)
  //     with: {
  //       path: "${{ steps.yarn-cache-dir-path.outputs.dir }}",
  //       key: "${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}",
  //       "restore-keys": "${{ runner.os }}-yarn-\n",
  //     },
  //   },
  //   { name: "Install project dependencies", run: "yarn" },
  //   { name: "Run ESLint", run: "yarn lint --no-fix" },
  //   { name: "Run Prettier", run: "yarn format --no-write --check" },
  //   { name: "Test", run: "yarn test --ci --maxWorkers=2", env: { CI: true } },
  //   { name: "Build", run: "yarn build", env: { CI: true } },
  //   {
  //     name: "Release",
  //     if: "github.event_name == 'push'", // "&& github.ref == 'refs/heads/master'",
  //     env: { GITHUB_TOKEN: "${{ secrets.GITHUB_TOKEN }}", NPM_TOKEN },
  //     run: "npx semantic-release",
  //   },
  // ];
}
