const { chromium } = require('playwright')
const { mkdir } = require('node:fs/promises')
const path = require('node:path')

const baseUrl = 'http://127.0.0.1:5173'
const artifacts = path.resolve('artifacts', 'gss-brand-qa')

async function inspect(page, route, name) {
  const errors = []
  const onConsole = (message) => { if (message.type() === 'error') errors.push(message.text()) }
  page.on('console', onConsole)
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(750)
  const result = await page.evaluate(() => ({
    title: document.title,
    logos: [...document.querySelectorAll('img[alt="The Global School of Skills (GSS)"]')].map((logo) => ({
      src: logo.getAttribute('src'), width: Math.round(logo.getBoundingClientRect().width), height: Math.round(logo.getBoundingClientRect().height),
    })),
    accent: getComputedStyle(document.documentElement).getPropertyValue('--ma-clr-pr-1').trim(),
    overflowX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    overflowing: [...document.querySelectorAll('body *')].map((element) => {
      const rect = element.getBoundingClientRect()
      return { tag: element.tagName, className: typeof element.className === 'string' ? element.className.slice(0, 100) : '', left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width) }
    }).filter((item) => item.right > document.documentElement.clientWidth + 2 || item.left < -2).slice(0, 12),
  }))
  await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: false })
  page.off('console', onConsole)
  return { route, ...result, consoleErrors: errors }
}

;(async () => {
  await mkdir(artifacts, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await desktop.newPage()
  const results = []

  results.push(await inspect(page, '/', 'desktop-home'))
  await page.evaluate(() => window.scrollTo(0, 900))
  await page.waitForTimeout(500)
  const sticky = await page.locator('header .gss-brand-logo.is-dark-ink').evaluate((logo) => {
    const rect = logo.getBoundingClientRect()
    return { visible: rect.width > 0 && rect.height > 0, width: Math.round(rect.width), headerClass: logo.closest('header')?.className }
  })
  await page.screenshot({ path: path.join(artifacts, 'desktop-sticky-header.png') })
  results.push({ state: 'sticky-header', ...sticky })

  results.push(await inspect(page, '/about-msbm/our-story', 'desktop-source-page'))
  results.push(await inspect(page, '/locations/dakar', 'desktop-dakar'))
  results.push(await inspect(page, '/programmes/masters-of-business-administration', 'desktop-course'))

  await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle' })
  await page.locator('footer').scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)
  results.push({ state: 'footer', logoVisible: await page.locator('footer .gss-brand-logo').isVisible() })
  await page.screenshot({ path: path.join(artifacts, 'desktop-footer.png') })

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mobilePage = await mobile.newPage()
  results.push(await inspect(mobilePage, '/', 'mobile-home'))
  await mobilePage.getByRole('button', { name: 'Open menu' }).click()
  await mobilePage.waitForTimeout(250)
  results.push({ state: 'mobile-menu', menuVisible: await mobilePage.locator('.at-offcanvas-area.active').isVisible(), logoVisible: await mobilePage.locator('.at-offcanvas-area.active .gss-brand-logo').isVisible() })
  await mobilePage.screenshot({ path: path.join(artifacts, 'mobile-menu.png') })

  await mobile.close()
  await desktop.close()
  await browser.close()

  const failures = results.filter((result) => result.overflowX || result.consoleErrors?.length || (result.logos && !result.logos.length) || result.accent && result.accent.toUpperCase() !== '#FFAD01' || result.visible === false || result.logoVisible === false || result.menuVisible === false)
  console.log(JSON.stringify({ results, failures, artifacts }, null, 2))
  if (failures.length) process.exitCode = 1
})().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
