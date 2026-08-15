module.exports = {
    id: 'mycareersfuture',
    name: 'MyCareersFuture',

    // This site has no location parameter in its search — it's Singapore's own government
    // job portal, so it always returns Singapore listings regardless of the "location" input.
    fixedLocation: 'Singapore',

    buildSearchUrl({ keyword, pageNum }) {
        return `https://www.mycareersfuture.gov.sg/search?search=${encodeURIComponent(
            keyword
        )}&sortBy=new_posting_date&page=${pageNum}`;
    },

    waitForSelector: 'div[id^="job-card"]',

    async extractJobs(page) {
        return page.evaluate(() => {
            const jobs = [];
            const jobCards = document.querySelectorAll('div[id^="job-card"]');

            jobCards.forEach((card) => {
                try {
                    const titleElem = card.querySelector('[data-testid="job-card__job-title"]');
                    const linkElem = card.querySelector('a[data-testid="job-card-link"]');
                    const companyElem = card.querySelector('[data-testid="company-hire-info"]');
                    const locationElem = card.querySelector('[data-testid="job-card__location"]');
                    const dateElem = card.querySelector('[data-testid="job-date-info"]');

                    const title = titleElem?.textContent?.trim();
                    const company = companyElem?.textContent?.trim();
                    const location = locationElem?.textContent?.trim();
                    const url = linkElem?.href;
                    const postedDate = dateElem?.textContent?.trim();

                    if (title && url) {
                        jobs.push({
                            title,
                            company: company || 'Not listed',
                            location: location || 'Not listed',
                            description: 'No description',
                            postedDate: postedDate || 'Date unknown',
                            url,
                        });
                    }
                } catch (err) {
                    // Continue to next job
                }
            });

            return jobs;
        });
    },
};
