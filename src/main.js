const { Actor } = require('apify');
const { chromium } = require('playwright');
const sites = require('./sites');

Actor.main(async () => {
    // ============================================
    // STEP 1: GET INPUT FROM APIFY UI
    // ============================================
    const input = await Actor.getInput();
    console.log('🔍 Input received:', JSON.stringify(input, null, 2));

    const {
        websites = Object.keys(sites),
        keywords = ['Software Engineer'],
        location = 'Singapore',
        maxPages = 3,
        useProxy = true,
    } = input;

    const activeSites = websites
        .map((id) => {
            const site = sites[id];
            if (!site) {
                console.warn(`⚠️  Unknown website "${id}" — no handler registered in src/sites, skipping.`);
            }
            return site;
        })
        .filter(Boolean);

    if (activeSites.length === 0) {
        throw new Error('No valid websites selected. Check the "websites" input against src/sites/index.js.');
    }

    for (const site of activeSites) {
        if (site.fixedLocation && location.trim().toLowerCase() !== site.fixedLocation.toLowerCase()) {
            console.warn(
                `⚠️  ${site.name} has no location filter and always returns ${site.fixedLocation} listings — your "location" input ("${location}") will be ignored for this site.`
            );
        }
    }

    const allJobs = [];
    let totalJobsFound = 0;

    // ============================================
    // STEP 2: LAUNCH BROWSER WITH PROXY
    // ============================================
    console.log('🚀 Launching Playwright (Chromium) with Apify proxy...');

    const launchOptions = {
        headless: true,
    };

    // Add proxy if needed and available on this account's plan
    if (useProxy) {
        const proxyConfiguration = await Actor.createProxyConfiguration();
        if (proxyConfiguration) {
            // Playwright needs proxy credentials as separate fields — passing a URL with
            // embedded user:pass@ as `server` makes Chromium's --proxy-server flag fail silently,
            // which manifests as every page.goto() hanging until it times out.
            const proxyInfo = await proxyConfiguration.newProxyInfo();
            launchOptions.proxy = {
                server: `http://${proxyInfo.hostname}:${proxyInfo.port}`,
                username: proxyInfo.username,
                password: proxyInfo.password,
            };
        } else {
            console.warn('⚠️  Apify Proxy is not available on this account; continuing without a proxy.');
        }
    }

    // Launch browser (plain Playwright, since Apify SDK v3 no longer bundles a launcher)
    const browser = await chromium.launch(launchOptions);

    try {
        const context = await browser.newContext({
            userAgent:
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        });
        const page = await context.newPage();

        // ============================================
        // STEP 3: LOOP THROUGH SITES x KEYWORDS x PAGES
        // ============================================
        console.log(
            `\n📄 Scraping ${activeSites.length} site(s) x ${keywords.length} keyword(s) x ${maxPages} page(s)...`
        );

        for (const site of activeSites) {
            for (const keyword of keywords) {
                for (let pageNum = 0; pageNum < maxPages; pageNum++) {
                    const maxAttempts = 2; // 1 retry on top of the initial attempt
                    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
                        try {
                            const searchUrl = site.buildSearchUrl({ keyword, location, pageNum });
                            const retrySuffix = attempt > 1 ? ` (retry ${attempt - 1}/${maxAttempts - 1})` : '';

                            console.log(
                                `\n[${site.name} | "${keyword}" | page ${pageNum + 1}/${maxPages}]${retrySuffix} Navigating to: ${searchUrl}`
                            );

                            await page.goto(searchUrl, {
                                waitUntil: 'domcontentloaded',
                                timeout: 30000,
                            });

                            console.log('📡 Page loaded');

                            // Wait for job cards to appear
                            try {
                                await page.waitForSelector(site.waitForSelector, { timeout: 10000 });
                                console.log('✅ Job cards loaded');
                            } catch (e) {
                                console.warn('⚠️  No job cards found, continuing...');
                            }

                            // Scroll to trigger lazy-loading
                            await page.evaluate(() => {
                                window.scrollBy(0, window.innerHeight);
                            });
                            await page.waitForTimeout(1500);

                            // ============================================
                            // STEP 3A: EXTRACT JOBS FROM THIS PAGE
                            // ============================================
                            const pageJobs = (await site.extractJobs(page)).map((job) => ({
                                ...job,
                                source: site.name,
                                keyword,
                                scrapedAt: new Date().toISOString(),
                            }));

                            console.log(`📊 Found ${pageJobs.length} jobs`);
                            allJobs.push(...pageJobs);
                            totalJobsFound += pageJobs.length;
                            break; // success — no need to retry this page

                        } catch (pageError) {
                            const hasAttemptsLeft = attempt < maxAttempts;
                            console.error(
                                `❌ Error on ${site.name} | "${keyword}" | page ${pageNum + 1} (attempt ${attempt}/${maxAttempts}):`,
                                pageError.message
                            );
                            if (hasAttemptsLeft) {
                                console.log('🔁 Retrying after a short delay...');
                                await page.waitForTimeout(2000);
                            }
                        }
                    }

                    // ============================================
                    // STEP 3B: RATE LIMIT (BE RESPECTFUL)
                    // ============================================
                    const delayMs = 3000 + Math.random() * 3000;
                    console.log(`⏳ Waiting ${Math.round(delayMs)}ms before next request...`);
                    await page.waitForTimeout(delayMs);
                }
            }
        }

        // ============================================
        // STEP 4: PUSH RESULTS TO APIFY DATASET
        // ============================================
        console.log(`\n✅ Scraping complete!`);
        console.log(`📈 Total jobs found: ${totalJobsFound}`);
        console.log(`📤 Pushing ${allJobs.length} jobs to Apify dataset...`);

        if (allJobs.length > 0) {
            await Actor.pushData(allJobs);
            console.log('✅ Data pushed successfully');
        } else {
            console.warn('⚠️  No jobs found. Check selectors or network.');
        }

    } catch (err) {
        console.error('💥 Fatal error:', err.message);
        throw err;
    } finally {
        await browser.close();
    }

    console.log(`\n🎉 DONE!`);
    console.log(`Total: ${totalJobsFound} jobs from ${activeSites.length} site(s), ${keywords.length} keyword(s)`);
    console.log('Results are stored in Apify dataset');
});
