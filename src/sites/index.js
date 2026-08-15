// Registry of supported job sites. To add a new site:
//   1. Create src/sites/<siteId>.js exporting { id, name, buildSearchUrl, waitForSelector, extractJobs }
//   2. Register it below
//   3. Add "<siteId>" to the "websites" enum in INPUT_SCHEMA.json

const linkedin = require('./linkedin');
const mycareersfuture = require('./mycareersfuture');

module.exports = {
    [linkedin.id]: linkedin,
    [mycareersfuture.id]: mycareersfuture,
};
