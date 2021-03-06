/* eslint-disable no-template-curly-in-string */
import type { PackageJson } from "../generator";

type Step = Record<string, any>;

const preDefaultFeatureSteps: Record<string, Step[]> = {
  // Use preinstalled PostgreSQL on GitHub runner.
  pg: [
    { name: "Start PostgreSQL on Ubuntu", run: "sudo systemctl start postgresql.service\npg_isready\n" },
    {
      name: "Create additional user",
      run:
        'sudo -u postgres psql --command="CREATE USER \\"user\\" PASSWORD \'password\' SUPERUSER CREATEDB REPLICATION" --command="\\du"\n',
    },
  ],
};

const postDefaultFeatureSteps: Record<string, Step[]> = {};

export function getWorkflow(features: Array<keyof typeof preDefaultFeatureSteps> = [], pkg: PackageJson): Record<string, any> {
  const registry = pkg?.publishConfig?.registry === "https://npm.pkg.github.com/" ? "github" : "npm";
  const NPM_TOKEN = registry === "npm" ? "${{ secrets.NPM_TOKEN }}" : "${{ secrets.GITHUB_TOKEN }}";

  const workflow = {
    name: "CI / CD",
    on: { push: { branches: ["master", "next", "next-major", "alpha", "beta"] }, pull_request: { branches: ["*"] } },
    jobs: {
      build: {
        "runs-on": "ubuntu-latest",
        steps: [
          { run: "echo ${{github.ref}}" },
          { run: "echo Condition met", if: "github.event_name == 'push' && github.ref == 'refs/heads/master'" },
        ],
      },
    },
  };

  const defaultSteps: Step[] = [
    { name: "Begin CI...", uses: "actions/checkout@v2" },
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
  ];

  const workflowSteps: Step[] = workflow.jobs.build.steps;
  const preDeafultSteps: Step[] = [];
  const postDeafultSteps: Step[] = [];

  features.forEach((feature) => {
    if (preDefaultFeatureSteps[feature]) preDeafultSteps.push(...preDefaultFeatureSteps[feature]);
    else if (postDefaultFeatureSteps[feature]) postDeafultSteps.push(...postDefaultFeatureSteps[feature]);
  });

  workflowSteps.push(...preDeafultSteps, ...defaultSteps, ...postDeafultSteps);

  return workflow;
}

/** Deleted steps, somehow flaws, but promsing, consider in the future. */

// - name: Run linters
//   uses: samuelmeuli/lint-action@v1
//   with:
//     github_token: ${{ secrets.github_token }}
//     eslint: true
//     eslint_extensions: js,jsx,ts,tsx,vue
//     eslint_args: --max-warnings 0 'src/**/*.+(js|jsx|ts|tsx|vue)'
//     prettier: true
//     prettier_extensions: json,less,css,md,gql,graphql,html,yaml
//     prettier_args: --ignore-path .eslintignore

// - name: Lint and create report
//   run: yarn lint --output-file eslint_report.json --format json
//   continue-on-error: true

// - name: Annotate linting results
//   uses: ataylorme/eslint-annotate-action@1.0.4
//   with:
//     repo-token: "${{ secrets.GITHUB_TOKEN }}"
//     report-json: "eslint_report.json"

// - name: Upload ESLint report
//   uses: actions/upload-artifact@v1
//   with:
//     name: eslint_report.json
//     path: eslint_report.json

// - name: Check format
//   run: yarn format

// - name: Wait for ESLint
//   uses: fountainhead/action-wait-for-check@v1.0.0
//   id: wait-for-eslint
//   with:
//     token: ${{ secrets.GITHUB_TOKEN }}
//     checkName: ESLint
//     ref: ${{ github.event.pull_request.head.sha || github.sha }}

// - name: Wait for Prettier
//   uses: fountainhead/action-wait-for-check@v1.0.0
//   id: wait-for-prettier
//   with:
//     token: ${{ secrets.GITHUB_TOKEN }}
//     checkName: Prettier
//     ref: ${{ github.event.pull_request.head.sha || github.sha }}

// - name: Do something with a passing build
//   run: exit 1
//   if: steps.wait-for-eslint.outputs.conclusion != 'success' || steps.wait-for-prettier.outputs.conclusion != 'success'
