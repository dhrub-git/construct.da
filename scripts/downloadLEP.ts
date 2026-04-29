import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { Browser, Page } from "puppeteer";
import fs from "fs/promises";
import path from "path";
import ora, { Ora } from "ora";
import cliProgress from "cli-progress";
import { Coverage, RuleFiles } from "@data/fileData";

const BASE_URL =
    "https://www.planningportal.nsw.gov.au/publications/environmental-planning-instruments";
const DOWNLOAD_DIR = path.join(process.cwd(), "download", "NSW");

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function ensureDir() {
    await fs.mkdir(DOWNLOAD_DIR, { recursive: true });
}

function sanitizeFileName(name: string) {
    return name
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function logSuccess(msg: string) {
    process.stdout.write(`\n✅ ${msg}\n`);
}

function logWarn(msg: string) {
    process.stdout.write(`\n⚠️ ${msg}\n`);
}

async function safeText(page: Page, selector: string) {
    try {
        await page.waitForSelector(selector, { timeout: 3000 });
        return await page.$eval(selector, (el) => el.textContent?.trim() || "");
    } catch {
        return "";
    }
}

async function applyFilters(page: Page, spinner: Ora) {
    spinner.text = "Opening filtered NSW Planning Portal...";
    const filteredUrl =
        `${BASE_URL}?title=&field_local_government_area_value=All` +
        `&field_epi_type_value=LEP&field_epi_status_value=In+Force`;
    await page.goto(filteredUrl, { waitUntil: "networkidle2", timeout: 60000 });
    await page.waitForSelector("a.icon--arrow-right", { timeout: 15000 });
    await page.waitForNetworkIdle({ idleTime: 1000 });
    spinner.text = "Filters loaded successfully";
}

async function getAllCardLinks(page: Page, spinner: Ora): Promise<string[]> {
    const links = new Set<string>();
    let totalResults = 0;

    try {
        const metaText = await page.$eval(
            ".form__item--meta",
            (el) => el.textContent || ""
        );
        const match = metaText.match(/of\s+(\d+)\s+results/i);
        if (match) totalResults = Number(match[1]);
    } catch { }

    const totalPages = totalResults > 0 ? Math.ceil(totalResults / 12) : 1;

    for (let pageNo = 0; pageNo < totalPages; pageNo++) {
        spinner.text = `Collecting cards page ${pageNo + 1} / ${totalPages}`;
        const paginatedUrl =
            `${BASE_URL}?title=&field_local_government_area_value=All` +
            `&field_epi_type_value=LEP&field_epi_status_value=In%20Force` +
            `&page=${pageNo}`;
        await page.goto(paginatedUrl, { waitUntil: "networkidle2", timeout: 60000 });
        await page.waitForSelector("a.icon--arrow-right", { timeout: 15000 });
        const pageLinks = await page.$$eval("a.icon--arrow-right", (els) =>
            els.map((el) => (el as HTMLAnchorElement).href).filter(Boolean)
        );
        for (const link of pageLinks) links.add(link);
        spinner.text = `Collected ${links.size} records...`;
        await delay(500);
    }

    return [...links];
}

async function extractCouncilName(page: Page, fallbackName: string) {
    const pageText = await page.content();
    const patterns = [
        /([A-Za-z\s]+?)\s+Council/i,
        /([A-Za-z\s]+?)\s+City Council/i,
        /([A-Za-z\s]+?)\s+Shire Council/i,
        /([A-Za-z\s]+?)\s+Regional Council/i,
    ];
    for (const p of patterns) {
        const match = pageText.match(p);
        if (match?.[0]) return match[0].replace(/\s+/g, " ").trim();
    }
    return fallbackName
        .replace(/Local Environmental Plan.*$/i, "")
        .replace(/\d{4}/g, "")
        .trim();
}

async function getLegislationUrl(page: Page): Promise<string | null> {
    return await page.evaluate(() => {
        const detailBlocks = Array.from(
            document.querySelectorAll(".project__details")
        );
        for (const block of detailBlocks) {
            const rows = Array.from(
                block.querySelectorAll(".row, .row--small, div")
            );
            for (const row of rows) {
                const text = (row.textContent || "").trim();
                if (text.toLowerCase().includes("legislation link")) {
                    const anchor = row.querySelector("a[href]") as HTMLAnchorElement | null;
                    if (anchor?.href) return anchor.href;
                }
            }
        }
        const allRows = Array.from(document.querySelectorAll("div, tr, li"));
        for (const row of allRows) {
            const text = (row.textContent || "").trim();
            if (text.toLowerCase().includes("legislation link")) {
                const anchor = row.querySelector("a[href]") as HTMLAnchorElement | null;
                if (anchor?.href) return anchor.href;
            }
        }
        const links = Array.from(
            document.querySelectorAll(".project__details a[href]")
        ) as HTMLAnchorElement[];
        const found = links.find((a) =>
            (a.textContent || "").trim().toLowerCase().includes("view")
        );
        return found?.href || null;
    });
}

async function extractPdfUrl(page: Page): Promise<string | null> {
    await page.waitForNetworkIdle({ idleTime: 1000 });
    return await page.evaluate(() => {
        const links = Array.from(
            document.querySelectorAll("a")
        ) as HTMLAnchorElement[];
        for (const a of links) {
            const href = a.href || "";
            if (
                href.toLowerCase().includes(".pdf") ||
                href.toLowerCase().includes("/pdf")
            ) {
                return href;
            }
        }
        const icon = document.querySelector(".fa-file-pdf-o");
        if (icon) {
            const parent = icon.closest("a") as HTMLAnchorElement;
            return parent?.href || null;
        }
        return null;
    });
}

// ─── Core download function ───────────────────────────────────────────────────

async function downloadPdf(
    browser: Browser,
    pdfUrl: string,
    referrer: string,
    fileName: string
): Promise<string> {
    const safeName = sanitizeFileName(fileName);
    const finalPath = path.join(DOWNLOAD_DIR, safeName + ".pdf");

    try {
        await fs.access(finalPath);
        console.log(`⏭️ Already exists: ${safeName}`);
        return finalPath;
    } catch { }

    console.log(`\n📥 Downloading: ${safeName}`);
    console.log(`🔗 URL: ${pdfUrl}`);

    const page = await browser.newPage();

    try {
        // First visit the referrer page so all cookies/session are active
        await page.goto(referrer, {
            waitUntil: "networkidle2",
            timeout: 60000,
        });

        console.log(`📡 Fetching PDF via in-browser fetch...`);

        // Run fetch INSIDE the browser — inherits all CF cookies automatically
        const result = await page.evaluate(async (url: string) => {
            try {
                const res = await fetch(url, {
                    credentials: "include",
                    headers: {
                        "Accept": "application/pdf,*/*",
                        "Referer": window.location.href,
                    },
                });

                if (!res.ok) {
                    return { error: `HTTP ${res.status}` };
                }

                const contentType = res.headers.get("content-type") ?? "";

                // Read as ArrayBuffer and convert to base64 in-browser
                const buffer = await res.arrayBuffer();
                const bytes = new Uint8Array(buffer);

                // Convert to base64 in chunks to avoid stack overflow on large files
                const chunkSize = 8192;
                let binary = "";
                for (let i = 0; i < bytes.length; i += chunkSize) {
                    binary += String.fromCharCode(
                        ...bytes.subarray(i, i + chunkSize)
                    );
                }

                return {
                    base64: btoa(binary),
                    size: bytes.length,
                    contentType,
                };
            } catch (err) {
                return { error: err instanceof Error ? err.message : String(err) };
            }
        }, pdfUrl);

        if ("error" in result) {
            throw new Error(`In-browser fetch failed: ${result.error}`);
        }

        console.log(`📦 Received ${result.size} bytes (${result.contentType})`);

        if (result.size < 1000) {
            throw new Error(`Too small to be a real PDF: ${result.size} bytes`);
        }

        const buffer = Buffer.from(result.base64, "base64");

        // Verify it's actually a PDF
        if (buffer.slice(0, 4).toString() !== "%PDF") {
            const preview = buffer.slice(0, 100).toString().replace(/\n/g, " ");
            throw new Error(`Not a PDF — starts with: ${preview}`);
        }

        await fs.writeFile(finalPath, buffer);
        console.log(`✅ Saved: ${finalPath}`);
        return finalPath;
    } finally {
        await page.close();
    }
}
// ─── Main scraper ─────────────────────────────────────────────────────────────

export async function scrapeNSWLEPs(): Promise<RuleFiles[]> {
    await ensureDir();

    const spinner = ora("Launching browser...").start();

    puppeteer.use(StealthPlugin());

    const browser = await puppeteer.launch({
        headless: false, // headless:true can block downloads on some Chrome versions
        protocolTimeout: 120000,
        args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-features=site-per-process",
        ],
    });

    const results: RuleFiles[] = [];

    try {
        const page = await browser.newPage();
        await applyFilters(page, spinner);
        const cardLinks = await getAllCardLinks(page, spinner);
        spinner.succeed(`Found ${cardLinks.length} LEP records`);
        await page.close();

        const progress = new cliProgress.SingleBar(
            {
                format: "Progress |{bar}| {percentage}% || {value}/{total} || {name}",
            },
            cliProgress.Presets.shades_classic
        );
        progress.start(cardLinks.length, 0, { name: "Starting..." });

        const WORKERS = 4;
        let completed = 0;
        let pointer = 0;

        async function worker(workerId: number) {
            while (true) {
                const index = pointer++;
                if (index >= cardLinks.length) return;

                const cardUrl = cardLinks[index];
                let detailPage: Page | null = null;
                let lawPage: Page | null = null;

                try {
                    progress.update(completed, {
                        name: `W${workerId} ${index + 1}/${cardLinks.length}`,
                    });

                    detailPage = await browser.newPage();
                    await detailPage.goto(cardUrl, {
                        waitUntil: "networkidle2",
                        timeout: 60000,
                    });

                    const ruleName =
                        (await safeText(detailPage, "h1")) || path.basename(cardUrl);
                    const councilName = await extractCouncilName(detailPage, ruleName);
                    const legislationUrl = await getLegislationUrl(detailPage);

                    if (!legislationUrl) {
                        logWarn(`No legislation link: ${ruleName}`);
                        continue;
                    }

                    lawPage = await browser.newPage();
                    await lawPage.goto(legislationUrl, {
                        waitUntil: "networkidle2",
                        timeout: 60000,
                    });

                    const pdfUrl = (await extractPdfUrl(lawPage)) || "";

                    if (!pdfUrl) {
                        logWarn(`No PDF: ${ruleName}`);
                        continue;
                    }

                    await lawPage.close();
                    lawPage = null;
                    await detailPage.close();
                    detailPage = null;

                    const filePath = await downloadPdf(
                        browser,
                        pdfUrl,
                        legislationUrl,
                        ruleName
                    );

                    results.push({
                        name: ruleName,
                        filePath,
                        coverage: Coverage.COUNCIL,
                        metadata: {
                            extension: "pdf",
                            state: "NSW",
                            country: "Australia",
                            council: councilName,
                            sourcePage: cardUrl,
                            legislationUrl,
                            pdfUrl,
                            type: "LEP",
                            status: "In Force",
                        },
                    });

                    logSuccess(`[W${workerId}] Downloaded ${ruleName}`);
                } catch (err) {
                    console.error(`\nWorker ${workerId} Error:`, err);
                    logWarn(`Failed: ${cardUrl}`);
                } finally {
                    if (detailPage && !detailPage.isClosed()) await detailPage.close();
                    if (lawPage && !lawPage.isClosed()) await lawPage.close();
                    completed++;
                    progress.update(completed, {
                        name: `Done ${completed}/${cardLinks.length}`,
                    });
                    await delay(300);
                }
            }
        }

        await Promise.all(
            Array.from({ length: WORKERS }, (_, i) => worker(i + 1))
        );

        progress.stop();
    } finally {
        await browser.close();
    }

    ora().succeed(`Completed scraping. Total files: ${results.length}`);
    return results;
}