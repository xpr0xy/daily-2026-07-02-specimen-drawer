import { chromium } from 'playwright';
import fs from 'node:fs';

const url = process.env.QA_URL || 'http://127.0.0.1:5173';
const browser = await chromium.launch({ headless: true });
const errors = [];
async function checkPage(page, label) {
  page.on('console', msg => { if (['error'].includes(msg.type())) errors.push(`${label} console ${msg.type()}: ${msg.text()}`); });
  page.on('pageerror', err => errors.push(`${label} pageerror: ${err.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3800);
}

const desktop = await browser.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 1 });
await checkPage(desktop, 'desktop');
await desktop.keyboard.press('Tab');
await desktop.keyboard.press('Tab');
await desktop.keyboard.press('Enter');
fs.mkdirSync('captures', { recursive: true });
await desktop.screenshot({ path: 'captures/hero.png', fullPage: false });
const shot = fs.statSync('captures/hero.png');
if (shot.size < 10000) errors.push('hero screenshot too small');

const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true });
await checkPage(mobile, 'mobile');
const mobileReport = await mobile.evaluate(() => {
  const vw = window.innerWidth;
  const scrollWidth = document.documentElement.scrollWidth;
  const controls = [...document.querySelectorAll('button,input')].map(el => {
    const r = el.getBoundingClientRect();
    return { text: el.textContent || el.getAttribute('aria-label') || el.tagName, w: r.width, h: r.height };
  }).filter(x => x.w < 44 || x.h < 44);
  const clipped = [...document.querySelectorAll('h1,h2,p,b,span,small,strong,time,em,footer,label,button')].filter(el => {
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') return false;
    if (el.closest('.event') && el.tagName === 'SPAN') return false;
    return el.scrollWidth > el.clientWidth + 2 || el.scrollHeight > el.clientHeight + 3;
  }).slice(0, 10).map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0,80), sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight }));
  return { vw, scrollWidth, controls, clipped };
});
if (mobileReport.scrollWidth > mobileReport.vw + 1) errors.push(`mobile horizontal scroll ${mobileReport.scrollWidth} > ${mobileReport.vw}`);
if (mobileReport.controls.length) errors.push(`small touch targets ${JSON.stringify(mobileReport.controls)}`);
if (mobileReport.clipped.length) errors.push(`text cutoff ${JSON.stringify(mobileReport.clipped)}`);

await browser.close();
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, screenshot: 'captures/hero.png', mobile: mobileReport }, null, 2));
