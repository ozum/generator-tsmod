const getVuePressBars = require("vuepress-bar");
const packageData = require("../../package.json");

const { nav, sidebar } = getVuePressBars(`${__dirname}/..`);
const vuepressConfig = require("../../.devkeeperrc.json").vuepress || {}; // eslint-disable-line global-require

const plugins = ["@vuepress/active-header-links", "@vuepress/pwa"];

if (vuepressConfig.googleAnalytics && vuepressConfig.googleAnalytics.id)
  plugins.push(["@vuepress/google-analytics", { ga: vuepressConfig.googleAnalytics.id }]);

module.exports = {
  title: packageData.label || packageData.name,
  description: packageData.description,
  plugins,
  themeConfig: {
    repo: typeof packageData.repository === "string" ? packageData.repository : packageData.repository.url,
    nav,
    sidebar,
    sidebarDepth: 2,
  },
};
