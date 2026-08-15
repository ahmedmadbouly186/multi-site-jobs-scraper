module.exports = {
    id: 'linkedin',
    name: 'LinkedIn',

    buildSearchUrl({ keyword, location, pageNum }) {
        return `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(
            keyword
        )}&location=${encodeURIComponent(location)}&start=${pageNum * 25}`;
    },

    waitForSelector: 'div.base-card',

    async extractJobs(page) {
        return page.evaluate(() => {
            const jobs = [];
            const jobCards = document.querySelectorAll('div.base-card');

            jobCards.forEach((card) => {
                try {
                    const titleElem = card.querySelector('.base-search-card__title');
                    const linkElem = card.querySelector('a.base-card__full-link');
                    const companyElem = card.querySelector('.base-search-card__subtitle');
                    const locationElem = card.querySelector('.job-search-card__location');
                    const dateElem = card.querySelector('.job-search-card__listdate');
                    const descriptionElem = card.querySelector('.base-search-card__snippet');

                    const title = titleElem?.textContent?.trim();
                    const company = companyElem?.textContent?.trim();
                    const location = locationElem?.textContent?.trim();
                    const url = linkElem?.href;
                    const postedDate = dateElem?.textContent?.trim();
                    const description = descriptionElem?.textContent?.trim();

                    if (title && url) {
                        jobs.push({
                            title,
                            company: company || 'Not listed',
                            location: location || 'Not listed',
                            description: description || 'No description',
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
