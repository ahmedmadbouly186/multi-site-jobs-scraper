# Development Guide — Multi-Site Jobs Scraper

Technical documentation for maintaining and extending this Actor. For the user-facing description (what it does, pricing, how to use it), see [README.md](README.md).

**Current state:** Node.js + Playwright + Apify SDK, modular site-handler architecture, 2 sites live (LinkedIn, MyCareersFuture), verified up to 1,939 jobs in a single run, deployed on Apify (latest build `0.0.13`).

## Stack

- **Runtime:** Node.js (see [Environment setup](#environment-setup) for the exact version)
- **Browser automation:** [Playwright](https://playwright.dev/) (Chromium, headless)
- **Platform SDK:** [`apify`](https://docs.apify.com/sdk/js/) v3 (`Actor.main`, `Actor.getInput`, `Actor.pushData`, `Actor.createProxyConfiguration`)
- **Hosting/scheduling/proxy/dataset export:** [Apify platform](https://apify.com)

## Project structure

```
.
├── src/
│   ├── main.js              # Entry point — orchestrates sites × keywords × pages
│   └── sites/
│       ├── index.js         # Site registry — maps id -> handler module
│       ├── linkedin.js      # LinkedIn handler
│       └── mycareersfuture.js  # MyCareersFuture handler
├── INPUT_SCHEMA.json        # Defines the Actor's input form on Apify
├── .actor/
│   ├── actor.json           # Actor Specification — name, version, schema references
│   ├── dataset_schema.json  # Dataset table/view definition (Console preview + Store)
│   └── output_schema.json   # Console "Output" tab links (dataset/run URLs)
├── Dockerfile                # Build image for `apify push`
├── .dockerignore
├── test-input.json          # Sample input for local runs
├── package.json
└── README.md                 # User-facing Store description
```

**How it fits together:** `main.js` reads `websites` from the input, looks each one up in the `src/sites` registry, and drives every registered handler through the same loop (build URL → navigate → wait for cards → extract → retry-on-failure → push to dataset). It has no site-specific logic of its own — everything site-specific lives inside that site's handler file.

## Current handlers

| File | Site ID | Notes |
|---|---|---|
| `src/sites/linkedin.js` | `linkedin` | Public job search, no login. `location` maps directly to LinkedIn's own `location` search param — works for any country LinkedIn supports (verified for Singapore and Egypt). |
| `src/sites/mycareersfuture.js` | `mycareersfuture` | Singapore's government job portal. `buildSearchUrl` has no location parameter at all — declares `fixedLocation: 'Singapore'`, which `main.js` checks against the input and logs a warning for if they don't match (see [Known limitations](#known-limitations)). |

Each handler is a plain object with this shape:

```js
module.exports = {
    id: 'siteId',                 // matches an entry in INPUT_SCHEMA.json's websites enum
    name: 'Display Name',         // used in logs and the "source" output field
    fixedLocation: 'Singapore',   // optional — declare if the site ignores the location input
    buildSearchUrl({ keyword, location, pageNum }) {
        return `https://example.com/search?q=${encodeURIComponent(keyword)}&page=${pageNum}`;
    },
    waitForSelector: '.job-card', // CSS selector main.js waits for before extracting
    async extractJobs(page) {
        // runs inside page.evaluate — return [{ title, company, location, description, postedDate, url }]
    },
};
```

## Adding a new site

1. **Create the handler** — `src/sites/<siteId>.js`, following the shape above. To find the right selectors, open the target site's search results in a real browser, inspect a job card, and note:
   - A selector that uniquely matches one job card (for `waitForSelector` and the loop inside `extractJobs`)
   - Selectors for title, company, location, posted date, and the link (`href`)
2. **Register it** in `src/sites/index.js`:
   ```js
   const newsite = require('./newsite');

   module.exports = {
       [linkedin.id]: linkedin,
       [mycareersfuture.id]: mycareersfuture,
       [newsite.id]: newsite,
   };
   ```
3. **Add it to the input form** — in `INPUT_SCHEMA.json`, add `"<siteId>"` to both `websites.items.enum` and `websites.items.enumTitles`.
4. **Test it in isolation** before running the full matrix — fastest way is a throwaway input file:
   ```bash
   echo '{"websites":["newsite"],"keywords":["Software Engineer"],"location":"Singapore","maxPages":1,"useProxy":false}' > /tmp/test-newsite.json
   npx apify run --input-file /tmp/test-newsite.json
   ```
   Check the log for `Found N jobs` with a sane count, and spot-check a few `url` values actually resolve.
5. **Run the full suite** with `test-input.json` (all sites, all default keywords) to make sure nothing else broke.

`main.js` itself never needs to change — it drives every registered handler generically. If the new site doesn't support a `location` parameter (like MyCareersFuture), add `fixedLocation: '<City/Country>'` to the handler and the existing warning logic in `main.js` covers it automatically.

**Sites to avoid with this pattern:** anything with active bot-protection (Cloudflare challenge pages, etc.) — see [Known limitations](#known-limitations).

## Input schema fields

Defined in `INPUT_SCHEMA.json`, read via `Actor.getInput()` in `main.js`:

| Field | Type | Description |
|---|---|---|
| `websites` | `array` (multi-select) | Which site handlers to run. Values must match a key in `src/sites/index.js`. |
| `keywords` | `array<string>` | Job titles/keywords to search — every keyword runs against every selected site. |
| `location` | `string` | Passed to each handler's `buildSearchUrl`. Ignored by handlers that declare `fixedLocation` (currently just `mycareersfuture`). |
| `maxPages` | `integer` | Result pages per site, per keyword — **not** a global cap. Total requests ≈ `websites.length × keywords.length × maxPages`. |
| `useProxy` | `boolean` | Routes requests through `Actor.createProxyConfiguration()`. Falls back to a direct connection with a logged warning if proxy access isn't available on the account's plan, rather than failing. |

Example (`test-input.json`):

```json
{
    "websites": ["linkedin", "mycareersfuture"],
    "keywords": ["Software Engineer", "Backend Developer", "Frontend Developer", "DevOps Engineer", "Data Scientist"],
    "location": "Singapore",
    "maxPages": 2,
    "useProxy": true
}
```

## Output format

Each dataset item (pushed via `Actor.pushData()` in `main.js`) has the shape defined in `.actor/dataset_schema.json`:

```json
{
    "title": "Senior Backend Software Engineer",
    "company": "Some Company Pte Ltd",
    "location": "Cairo, Egypt",
    "description": "No description",
    "postedDate": "1 week ago",
    "url": "https://...",
    "source": "LinkedIn",
    "keyword": "Backend Developer",
    "scrapedAt": "2026-08-15T11:33:19.884Z"
}
```

- `title`, `company`, `location`, `description`, `postedDate`, `url` come from the site handler's `extractJobs()`.
- `source`, `keyword`, `scrapedAt` are added generically by `main.js` for every job, from every site.
- `description` is almost always `"No description"` — search-result cards on both sites don't include a snippet. Getting real descriptions would mean an extra page visit per job listing (not currently implemented).

## Environment setup

- **Node.js `>=20`** — required by the installed `playwright` version (`1.62.1`); this was previously misdeclared as `>=16.0.0` in `package.json` (fixed).
- **Docker is NOT required for local development.** `npx apify run` executes `node src/main.js` directly on your machine — Docker only comes into play when you deploy (`apify push`), where Apify's remote build servers build the image using the project's `Dockerfile`. You don't need Docker installed locally at all.
- **Playwright's Chromium binary** must be downloaded once locally (separate from the npm package):
  ```bash
  npx playwright install chromium
  ```
- **Apify CLI**, for running/pushing/validating:
  ```bash
  npm install -g apify-cli
  apify login   # or set APIFY_TOKEN
  ```

## Testing approach

There's no automated test suite (`npm test` is a placeholder) — this project is tested by actually running it locally against live sites and inspecting the output.

- **`test-input.json`** is the standard fixture — all sites, all 5 default keywords, `maxPages: 2`. Run it with:
  ```bash
  npm install
  npx playwright install chromium   # first time only
  npx apify run --input-file test-input.json
  ```
- **Isolating one site or keyword** for faster iteration: write a throwaway input file with a single-item `websites`/`keywords` array (see the [Adding a new site](#adding-a-new-site) example above) instead of editing `test-input.json`.
- **What to check in the output:** job counts per site/keyword look sane (not 0, not wildly higher than the site's real result count), `url` values are real working links, `location` values match what you searched for (except sites with `fixedLocation`), and no unhandled errors in the log — only expected `❌ Error on ... (attempt N/2)` retries followed by a `🔁 Retrying` or a graceful skip.
- **Validate the Apify-specific schema files** whenever you touch `INPUT_SCHEMA.json` or the `.actor/*.json` files:
  ```bash
  npx apify validate-schema
  ```
- Local runs write to `storage/` (git-ignored) — safe to delete between runs (`rm -rf storage`) if you want a clean slate.

## Deployment

```bash
apify login          # first time only
npx apify validate-schema   # confirm input/dataset/output schemas are all valid
apify push
```

`apify push` builds the Docker image on Apify's servers (using this project's `Dockerfile`, `.actor/actor.json`, and `INPUT_SCHEMA.json`) and publishes a new build. It requires:
- `.actor/actor.json` (already present) — actor name/version and schema references
- A `Dockerfile` pinned to the **exact** Playwright version in `package-lock.json`. The current `Dockerfile` uses `apify/actor-node-playwright-chrome:22-1.62.1`, matching the installed `playwright@1.62.1` — if you bump the `playwright` dependency, update this tag to match, or the container's bundled Chromium will silently mismatch the npm package version.

**Do not add a `RUN npx playwright install` step to the Dockerfile** — the base image already ships a matching Chromium, and Apify's build sandbox blocks the outbound download that step needs, which hangs the build until it's force-aborted (this happened once — see build `0.0.6`'s aborted log if you need the history).

Check `apify actors info <actorId> --json` after a push to confirm the new build actually got tagged `latest` before assuming a push succeeded.

## Known limitations

- **JobStreet SG is not supported.** It puts a Cloudflare bot-challenge in front of every page, including the homepage. A plain headless-Playwright handler can't get past that reliably — would need dedicated anti-bot infrastructure (e.g. a CAPTCHA-solving proxy service) to attempt, which is out of scope for the current handler pattern.
- **MyCareersFuture ignores the `location` input entirely.** Its `buildSearchUrl` never uses it — the site is Singapore's own government job portal and has no other-location results to return. It's marked with `fixedLocation: 'Singapore'` in its handler, and `main.js` logs a warning at run start if the input `location` doesn't match, so this isn't a silent failure — but it's still a real gap: there's no way to get Singapore-only results filtered out of a MyCareersFuture run if you're only interested in a different country's LinkedIn results.
- **No job descriptions.** Neither site's search-result cards include a real snippet; `description` is always `"No description"`. Fixing this means visiting each job's own detail page — a meaningful runtime/complexity increase (N× more page loads) not currently justified by demand.
- **No deduplication across keywords.** If two keywords both match the same job posting, it appears twice in the dataset (once per keyword) — by design, since `keyword` records which search found it, but worth knowing if you're doing raw counts.
- **Apify Proxy is plan-gated.** `useProxy: true` silently falls back to a direct connection (with a logged warning) if the account's plan doesn't include "Proxy external access." This only surfaces when running locally via the CLI — Actor runs *on* the Apify platform have proxy access by default, so this mostly matters for local development, not production runs.
