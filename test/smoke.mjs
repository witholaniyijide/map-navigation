/**
 * Headless smoke test for the Family Vacation Navigator.
 *
 * Serves the static files from a tiny built-in HTTP server and drives the page
 * with Chromium (via Playwright) to guard against regressions — most of all the
 * kind of parse/runtime error that can silently kill the whole app.
 *
 * Run locally:   npm install --no-save playwright-core && node test/smoke.mjs
 * In CI:         npm install --no-save playwright && npx playwright install --with-deps chromium && node test/smoke.mjs
 * Custom browser: CHROMIUM_PATH=/path/to/chrome node test/smoke.mjs
 */
import http from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 8123);
const BASE = `http://${HOST}:${PORT}/index.html`;

const MIME = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".mjs": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml"
};

function startServer() {
    const server = http.createServer(async (req, res) => {
        try {
            let urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
            if (urlPath === "/") urlPath = "/index.html";

            const filePath = path.join(ROOT, urlPath);
            if (!filePath.startsWith(ROOT) || !existsSync(filePath)) {
                res.writeHead(404);
                res.end("not found");
                return;
            }

            const body = await readFile(filePath);
            res.writeHead(200, {
                "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream"
            });
            res.end(body);
        } catch (error) {
            res.writeHead(500);
            res.end(String(error));
        }
    });

    return new Promise(resolve => server.listen(PORT, HOST, () => resolve(server)));
}

const results = [];
function assert(name, condition, extra = "") {
    results.push(Boolean(condition));
    console.log(`${condition ? "PASS" : "FAIL"}: ${name}${extra ? " — " + extra : ""}`);
}

const server = await startServer();

const launchOptions = {};
if (process.env.CHROMIUM_PATH) {
    launchOptions.executablePath = process.env.CHROMIUM_PATH;
}

const browser = await chromium.launch(launchOptions);
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
const page = await context.newPage();

const pageErrors = [];
page.on("pageerror", error => pageErrors.push(error.message));

try {
    await page.goto(BASE, { waitUntil: "load" });
    await page.waitForFunction(
        () => {
            const eta = document.querySelector("#eta");
            return eta && eta.textContent && eta.textContent !== "--";
        },
        { timeout: 8000 }
    );

    // The whole point of the fix: the script must parse and run.
    assert("no uncaught page errors", pageErrors.length === 0, pageErrors.join(" | "));

    const destination = (await page.textContent("#destination"))?.trim();
    assert("destination populated", Boolean(destination), destination);

    const eta = await page.textContent("#eta");
    assert("ETA computed", eta && eta !== "--", eta);

    const distance = await page.textContent("#distance");
    assert("distance computed", distance && distance !== "--", distance);

    const stops = await page.$$eval(".route-stop", els => els.length);
    assert("route strip rendered", stops >= 2, `chips=${stops}`);

    const followText = (await page.textContent("#followButton")) || "";
    assert("location button is opt-in", /use my location/i.test(followText), followText.trim());

    // Route switching.
    await page.click('.day[data-route="thursday"] .route-button');
    await page.waitForFunction(
        () => document.querySelector("#destination")?.textContent?.includes("Whimspring"),
        { timeout: 4000 }
    );
    const frameSrc = decodeURIComponent(await page.getAttribute("#mapFrame", "src"));
    assert("map iframe updated on switch", /Whispering|Badagry/i.test(frameSrc), frameSrc);

    const activeCount = await page.$$eval(".day.active", els => els.length);
    assert("exactly one active day", activeCount === 1, `active=${activeCount}`);

    // Persistence: the Thursday choice should survive a reload.
    await page.reload({ waitUntil: "load" });
    await page.waitForFunction(
        () => document.querySelector("#destination")?.textContent?.trim().length > 0,
        { timeout: 4000 }
    );
    const afterReload = (await page.textContent("#destination"))?.trim();
    assert("selection persists across reload", /Whimspring/i.test(afterReload), afterReload);

    // Note modal open/close.
    await page.click('.note-button[data-note-route="thursday"]');
    await page.waitForSelector("#routeNoteModal.is-open", { timeout: 3000 });
    const noteSteps = await page.$$eval("#noteSteps li", els => els.length);
    assert("note modal opens with steps", noteSteps > 0, `steps=${noteSteps}`);

    await page.keyboard.press("Escape");
    await page.waitForFunction(
        () => !document.querySelector("#routeNoteModal")?.classList.contains("is-open"),
        { timeout: 3000 }
    );
    assert("Escape closes modal", true);

    // Location toggle must not throw when GPS is unavailable/denied.
    await page.click("#followButton");
    await page.waitForTimeout(300);
    assert("location toggle does not crash", pageErrors.length === 0, (await page.textContent("#status"))?.trim());
} finally {
    await browser.close();
    server.close();
}

const passed = results.filter(Boolean).length;
console.log(`\n${passed}/${results.length} checks passed`);
process.exit(passed === results.length ? 0 : 1);
