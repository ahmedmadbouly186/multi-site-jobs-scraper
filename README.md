# 🔍 Multi-Site Jobs Scraper

**Search LinkedIn and MyCareersFuture at once, for any location LinkedIn supports. Get every result in one clean list — no tab-switching, no copy-pasting.**

If you've ever spent an evening with six browser tabs open, re-typing the same job title into every job board, this Actor does that work for you. Tell it what roles you're hunting for and where, hit run, and come back to a single spreadsheet-ready list of every matching listing — company, location, posting date, and a direct apply link — pulled from multiple sites at once.

In one recent run, it collected **1,939 fresh job listings** across just a handful of search terms — the kind of coverage that would take hours to gather by hand. It's not limited to one country either — we've run it end-to-end for both Singapore and Egypt with clean results for each.

---
## 🚀 Quick Start

**Try it on Apify Marketplace:** 
[⭐ Multi-Site Jobs Scraper on Apify](https://apify.com/ahmedmadbouly186/multi-web-sites-jobs-scraper)

Free to try - completely unlimited right now!
---

## ✨ Why use this instead of searching manually?

- **One list, not five tabs.** LinkedIn and MyCareersFuture results land in the same table, same columns, ready to sort and filter.
- **No code, no setup.** Type your job titles and location into a simple form. That's the whole interface.
- **Built to grow.** New job sites get added to the list over time — when they are, you just tick a new checkbox. Nothing else about how you use it changes.
- **Doesn't choke on a bad connection.** If a page fails to load, it's retried automatically before moving on — one flaky request won't ruin your whole search.
- **Set it and forget it.** Because this runs on the Apify platform, you can schedule it to run daily or weekly and have fresh listings waiting for you every morning.

---

## 📦 What you get

Every run produces a dataset — think of it as an auto-generated spreadsheet — with one row per job listing:

| Field | What it is |
|---|---|
| `title` | The job title |
| `company` | Hiring company |
| `location` | Where the job is based |
| `postedDate` | When it was posted (e.g. "3 days ago") |
| `url` | Direct link to apply |
| `source` | Which site it came from (LinkedIn, MyCareersFuture, …) |
| `keyword` | Which of your search terms found it |
| `scrapedAt` | Timestamp of when it was collected |

You can download your results as **Excel, CSV, JSON, or HTML** directly from Apify, or pull them into a Google Sheet automatically — no extra tools needed.

---

## 👥 Who this is for

- **Job seekers** who want to check every major board for new postings in one sweep, instead of five separate searches every day.
- **Recruiters & talent sourcers** building a live view of who's hiring for a given role, without manually tracking multiple sites.
- **Staffing agencies** that need to monitor the market across roles and clients at scale, on a recurring schedule.
- **Market researchers & data teams** tracking hiring trends — job titles in demand, which companies are actively hiring, how listings shift week to week.

**Example:** A recruiter tracking "Backend Developer," "DevOps Engineer," and "Data Scientist" roles across their target market sets this to run every Monday morning. By the time they're at their desk, a fresh, deduplicated list of the week's new openings is already sitting in their dataset — no manual searching required.

---

## 💰 Pricing

This Actor runs on the [Apify platform](https://apify.com), which handles hosting, scheduling, and billing — you only pay for what you actually run.

**Free — $0/month**
- 1 run per month
- LinkedIn only
- CSV output only
- Perfect for trying it out

**Pro — $19.99/month**
- Unlimited runs
- Both sites (LinkedIn + MyCareersFuture)
- CSV + JSON output
- Email support
- For freelancers & small teams

**Enterprise — $99.99/month**
- Unlimited everything
- All supported sites (current + future)
- Custom configurations
- API access
- Priority support
- For companies & data teams

> Apify's own [platform plans](https://apify.com/pricing) (including a free tier with monthly credits) apply on top of any Actor-specific pricing.

---

## 🚀 How to use it (step-by-step, no coding required)

1. **Open this Actor** on the Apify Store and click **Try for free** (or **Run**, if you already have an Apify account — [sign-up is free](https://console.apify.com/sign-up)).
2. **Fill in the input form:**
   - **Websites** — tick the job sites you want to search (LinkedIn, MyCareersFuture, or both).
   - **Job Title/Keywords** — type in the roles you're searching for, e.g. `Software Engineer`, `Product Manager`. Add as many as you like.
   - **Location** — e.g. `Singapore`, `Egypt`, `Remote`.
   - **Number of Pages** — how many pages of results to pull per site, per keyword (more pages = more results, more runtime).
3. **Click Start.** You'll see live logs as it works through each site and search term.
4. **Grab your results.** When it finishes, open the **Dataset** tab, and export as Excel/CSV/JSON — or connect it directly to Google Sheets or Zapier via Apify's built-in integrations.
5. *(Optional)* **Schedule it.** Click **Schedule** in the Apify Console to have this run automatically every day, week, or however often you need fresh results.

That's it — no browser extensions, no manual searching, no code.

---

## ❓ FAQ

**Do I need to know how to code?**
No. Everything is controlled through the input form — pick your sites, type your keywords, click run.

**Which job sites are supported right now?**
LinkedIn and MyCareersFuture (Singapore's official government job portal). More sites are added over time.

**Why isn't JobStreet supported?**
JobStreet actively blocks automated browsers with a challenge screen on every page. Rather than fight that with fragile workarounds, it's been left out for now — reliable results on the supported sites beat unreliable results everywhere.

**Will this get my account banned from LinkedIn or other sites?**
This Actor only reads public search-result pages — it doesn't log into any account, so there's no account of yours at risk. It also adds delays between requests to stay respectful of each site's traffic. That said, always review each site's Terms of Service for your use case.

**How many results will I get?**
It depends on your keywords, location, and how many pages you request — more keywords and more pages mean more results, but also a longer run. A handful of keywords across both sites typically returns hundreds to low thousands of listings.

**Does this only work for Singapore?**
No — LinkedIn's search will follow whatever location you type in, so you can search any country or city LinkedIn itself supports (we've verified this end-to-end for both Singapore and Egypt). The one exception is MyCareersFuture: it has no location filter of its own, so it always returns Singapore listings no matter what location you enter — if you select it while searching elsewhere, you'll still get valid Singapore results from that site (clearly logged as such in the run), alongside correctly-targeted results from LinkedIn.

**Do I get real job descriptions, or just titles?**
Search-result pages mostly show title, company, location, and posting date — not the full job description. You'll get a direct link to the original listing for the full write-up.

**Can I request a new job site be added?**
Yes — reach out through the contact info below with the site you'd like to see supported.

---

## 🆘 Support

Running into an issue, or have a feature request?

- Open an issue via the **Issues** tab on this Actor's Apify Store page, or
- Reach out through Apify's [Actor support](https://apify.com) contact options on the listing page.

Please include your input settings and, if possible, a link to the run that had trouble — it makes tracking down the issue much faster.
