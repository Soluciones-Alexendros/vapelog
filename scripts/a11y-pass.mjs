import { chromium } from "playwright";

const url = process.env.A11Y_URL ?? "http://127.0.0.1:8080/";
const browser = await chromium.launch({
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});
page.on("pageerror", (err) => errors.push(String(err)));

await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
await page.waitForTimeout(500);
const dialog = page.getByRole("dialog");
await dialog.waitFor({ timeout: 5000 });
const confirm = page.getByRole("button", { name: "Tengo 18 años o más" });
await confirm.focus();
await page.keyboard.press("Enter");
await page.waitForTimeout(400);
if (await dialog.count()) {
  const open = await dialog.isVisible().catch(() => false);
  if (open) throw new Error("la puerta de edad sigue abierta");
}
await page.getByRole("link", { name: "Dispositivos" }).first().waitFor();

await page.goto(new URL("/resistencias", url).href, { waitUntil: "domcontentloaded" });
await page.waitForTimeout(400);
const live = page.locator("[aria-live='polite']");
await live.waitFor();
const before = await live.innerText();
const radio = page.getByRole("radio").first();
await radio.focus();
await page.keyboard.press("Space");
await page.waitForTimeout(400);
const after = await live.innerText();
if (before === after) throw new Error(`el recuento no cambió: ${after}`);

const sheet = page.getByRole("link", { name: "Abrir ficha" }).first();
await sheet.click();
await page.waitForTimeout(500);
const heading = page.getByRole("heading", { level: 1 });
await heading.waitFor();
const name = (await heading.innerText()).trim();
if (!name) throw new Error("la ficha no tiene nombre accesible");
const alts = await page
  .locator("main img")
  .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("alt")));
if (alts.length === 0 || alts.some((alt) => !alt || !alt.trim())) {
  throw new Error(`foto sin texto alternativo: ${JSON.stringify(alts)}`);
}
const external = page.getByRole("link", { name: /ventana nueva/ });
if ((await external.count()) === 0) throw new Error("el enlace de fuente no anuncia ventana nueva");

const ignored = errors.filter((line) => !/favicon|Failed to load resource/i.test(line));
if (ignored.length) throw new Error(ignored.join("\n"));
console.log(JSON.stringify({ ok: true, sheet: name, count: after.trim() }));
await browser.close();
