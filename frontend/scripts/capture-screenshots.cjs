const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function waitForHttpOk(url, { timeoutMs }) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      // ignore
    }
    await sleep(500);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  const baseUrl = process.env.SCREENSHOT_BASE_URL ?? "http://localhost:3000";
  const apiBase = process.env.API_BASE_URL ?? "http://127.0.0.1:8081";

  const outDir = path.resolve(__dirname, "..", "..", "assets");
  fs.mkdirSync(outDir, { recursive: true });

  const seed = process.env.SEED_DEMO_DATA !== "false";

  console.log(`Base URL: ${baseUrl}`);
  console.log(`API URL:  ${apiBase}`);
  console.log(`Output:   ${outDir}`);

  if (seed) {
    const seedScript = path.resolve(
      __dirname,
      "..",
      "..",
      "scripts",
      "seed-demo.mjs",
    );
    console.log(`Seeding demo data via ${seedScript}`);
    execFileSync("node", [seedScript], {
      stdio: "inherit",
      env: {
        ...process.env,
        API_BASE_URL: apiBase,
      },
    });
  }

  await waitForHttpOk(`${baseUrl}/dashboard`, { timeoutMs: 60_000 });

  const { chromium } = require("@playwright/test");
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  await page.addInitScript(() => {
    try {
      window.localStorage.setItem("pds_onboarding_v1_completed", "true");
    } catch {
      // ignore
    }
  });

  async function ensureOnboardingClosed() {
    try {
      const close = page.getByRole("button", { name: "Close" });
      if (await close.isVisible({ timeout: 250 })) {
        await close.click({ timeout: 1000 });
        await sleep(250);
      }
    } catch {
      // ignore
    }
  }

  async function snap(name, route, { waitMs = 500 } = {}) {
    const url = `${baseUrl}${route}`;
    console.log(`Capturing ${name}: ${url}`);
    await page.goto(url, { waitUntil: "networkidle" });
    await ensureOnboardingClosed();
    await sleep(waitMs);
    await page.screenshot({ path: path.join(outDir, name), fullPage: true });
  }

  await snap("dashboard.png", "/dashboard");
  await snap("policy-builder.png", "/policy-builder");
  await snap("simulator.png", "/simulator");

  // Create a deterministic “results shown” simulator screenshot.
  // Uses the first demo policy + clicks the first example tx and runs the simulation.
  try {
    await page.goto(`${baseUrl}/simulator`, { waitUntil: "networkidle" });
    await ensureOnboardingClosed();
    await page
      .getByRole("button", { name: /Approved/i })
      .first()
      .click({ timeout: 2000 });
    await page
      .getByRole("button", { name: "Run Simulation" })
      .click({ timeout: 5000 });
    await page
      .getByText("Decision", { exact: false })
      .waitFor({ timeout: 10_000 });
    await sleep(500);
    await page.screenshot({
      path: path.join(outDir, "simulator-result.png"),
      fullPage: true,
    });

    // Capture the Trace tab view as well (the simulator UI is now tabbed).
    try {
      await page
        .getByRole("button", { name: "Trace" })
        .click({ timeout: 1500 });
      await sleep(300);
      await page.screenshot({
        path: path.join(outDir, "simulator-trace.png"),
        fullPage: true,
      });
    } catch {
      // ignore
    }

    // Capture the SDK tab view (API examples).
    try {
      await page.getByRole("button", { name: "SDK" }).click({ timeout: 1500 });
      await sleep(300);
      await page.screenshot({
        path: path.join(outDir, "simulator-sdk.png"),
        fullPage: true,
      });
    } catch {
      // ignore
    }
  } catch (e) {
    console.warn(
      "Could not capture simulator-result.png (non-fatal):",
      e?.message ?? e,
    );
  }

  await snap("audit.png", "/audit");

  // Audit Explorer is now tabbed; capture the Replay tab if available.
  try {
    await page.goto(`${baseUrl}/audit`, { waitUntil: "networkidle" });
    await ensureOnboardingClosed();
    await page.getByRole("button", { name: "Replay" }).click({ timeout: 1500 });
    await sleep(500);
    await page.screenshot({
      path: path.join(outDir, "audit-replay.png"),
      fullPage: true,
    });
  } catch {
    // ignore
  }

  await snap("settings.png", "/settings");

  await browser.close();

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
