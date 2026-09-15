import { chromium } from "playwright";

const out = "/opt/cursor/artifacts";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") console.log("CONSOLE_ERROR", msg.text());
});
page.on("pageerror", (err) => console.log("PAGE_ERROR", err.message));

const results = [];

await page.goto("http://localhost:3001/", { waitUntil: "networkidle" });
await page.screenshot({ path: `${out}/trato-01-landing.png` });
results.push("landing:ok");

await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "pasajero@trato.app");
await page.fill('input[type="password"]', "trato1234");
await page.screenshot({ path: `${out}/trato-02-login.png` });
await page.click('button[type="submit"]');
try {
  await page.waitForURL("**/passenger", { timeout: 15000 });
  results.push("login-passenger:ok");
} catch {
  const body = (await page.locator("body").innerText()).slice(0, 300);
  results.push(`login-passenger:FAIL url=${page.url()} body=${body}`);
}

await page.waitForTimeout(3000);
await page.screenshot({ path: `${out}/trato-03-passenger-map.png` });

const chips = page.locator("button", {
  hasText: /Larcomar|Parque Kennedy|Óvalo|Kennedy|Larco|Miraflores|Barranco/i,
});
const chipCount = await chips.count();
results.push(`chips:${chipCount}`);
if (chipCount > 0) {
  await chips.nth(0).click();
  await page.waitForTimeout(300);
  if (chipCount > 1) await chips.nth(1).click();
}

const map = page.locator(".leaflet-container");
results.push(`leaflet:${await map.count()}`);
results.push(`tiles:${await page.locator(".leaflet-tile-loaded").count()}`);

const verBanda = page.getByRole("button", { name: /Ver banda justa|banda justa/i });
if (await verBanda.count()) {
  if (await verBanda.isDisabled()) {
    const box = await map.boundingBox();
    if (box) {
      await page.mouse.click(box.x + box.width * 0.65, box.y + box.height * 0.3);
      await page.waitForTimeout(500);
    }
  }
  if (!(await verBanda.isDisabled())) {
    await verBanda.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${out}/trato-04-fare-band.png` });
    results.push("fare-band:ok");
  } else {
    await page.screenshot({ path: `${out}/trato-04-passenger-stuck.png` });
    results.push("fare-band:FAIL");
  }
} else {
  results.push("fare-band:missing-button");
}

await page.goto("http://localhost:3001/login", { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "conductor@trato.app");
await page.fill('input[type="password"]', "trato1234");
await page.click('button[type="submit"]');
try {
  await page.waitForURL("**/driver", { timeout: 15000 });
  results.push("login-driver:ok");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/trato-06-driver.png` });
} catch {
  results.push(`login-driver:FAIL url=${page.url()}`);
  await page.screenshot({ path: `${out}/trato-06-driver-fail.png` });
}

console.log(JSON.stringify(results, null, 2));
await browser.close();
