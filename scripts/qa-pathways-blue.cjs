const { chromium } = require('playwright')
const fs = require('fs')
const path = require('path')

const outputDir = path.join(__dirname, '..', 'artifacts', 'pathways-blue-qa')
fs.mkdirSync(outputDir, { recursive: true })

async function inspectPage(page, name) {
  const errors = []
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })

  const section = page.locator('.gss-pathways')
  await section.scrollIntoViewIfNeeded()
  await section.screenshot({ path: path.join(outputDir, `${name}-pathways.png`) })

  const metrics = await page.evaluate(() => ({
    viewport: [window.innerWidth, window.innerHeight],
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    pathwayCards: document.querySelectorAll('.gss-pathway-card').length,
    oldMarqueePresent: Boolean(document.querySelector('.ma-partner-1-area')),
    headerBackground: getComputedStyle(document.querySelector('.ma-header-1-area')).backgroundColor,
    footerBackground: getComputedStyle(document.querySelector('.msbm-footer')).backgroundColor,
  }))

  const firstCard = page.locator('.gss-pathway-card').first()
  const destination = await firstCard.getAttribute('href')
  await firstCard.click()
  await page.waitForLoadState('networkidle')
  const navigationWorked = page.url().includes('/categories/masters-degree')
  return { name, errors, destination, navigationWorked, ...metrics }
}

(async () => {
  const browser = await chromium.launch({ headless: true })
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const mobile = await browser.newPage({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true })
  const results = [await inspectPage(desktop, 'desktop'), await inspectPage(mobile, 'mobile')]

  await desktop.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await desktop.waitForTimeout(1600)
  await desktop.screenshot({ path: path.join(outputDir, 'desktop-header.png') })
  await desktop.screenshot({ path: path.join(outputDir, 'desktop-home-full.png'), fullPage: true })
  await desktop.locator('.msbm-footer').scrollIntoViewIfNeeded()
  await desktop.locator('.msbm-footer').screenshot({ path: path.join(outputDir, 'desktop-footer.png') })
  await mobile.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
  await mobile.screenshot({ path: path.join(outputDir, 'mobile-home-full.png'), fullPage: true })

  await browser.close()
  console.log(JSON.stringify(results, null, 2))
  if (results.some((result) => result.errors.length || result.horizontalOverflow || result.pathwayCards !== 6 || result.oldMarqueePresent || !result.navigationWorked || result.headerBackground !== 'rgb(21, 81, 157)' || result.footerBackground !== 'rgb(21, 81, 157)')) process.exitCode = 1
})()
