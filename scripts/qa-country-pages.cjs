const { chromium } = require('C:/Users/ragha/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright')
const path = require('node:path')

const baseUrl = 'http://127.0.0.1:5173'
const artifacts = path.resolve(__dirname, '..', 'artifacts')

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function pageMetrics(page) {
  return page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    hasHorizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  }))
}

async function waitForTheme(page) {
  await page.locator('.ma-preloader-1').waitFor({ state: 'hidden', timeout: 10000 })
  await page.waitForTimeout(250)
}

async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
  const errors = []
  const desktop = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const page = await desktop.newPage()
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  page.on('pageerror', (error) => errors.push(error.message))

  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' })
  await waitForTheme(page)
  await page.getByRole('button', { name: /Country/i }).click()
  const headerCountrySearch = page.locator('#country-switch-search-desktop')
  await headerCountrySearch.fill('Portugal')
  assert(await page.locator('#country-switcher-desktop a', { hasText: 'Portugal' }).count() === 1, 'Header country switch did not filter Portugal')
  await page.screenshot({ path: path.join(artifacts, 'msbm-country-switcher.png'), type: 'png' })
  await page.locator('#country-switcher-desktop a', { hasText: 'Portugal' }).click()
  await page.waitForURL('**/countries/portugal')
  await waitForTheme(page)
  assert(await page.getByRole('button', { name: /Portugal/i }).isVisible(), 'Header did not retain the selected country')

  await page.goto(`${baseUrl}/countries`, { waitUntil: 'domcontentloaded' })
  await waitForTheme(page)
  await page.waitForSelector('input[aria-label="Find your country"], input#country-search')
  assert(await page.locator('.msbm-country-grid .msbm-directory-card').count() === 249, 'Country directory did not render all 249 destinations')
  assert(!(await pageMetrics(page)).hasHorizontalOverflow, 'Desktop country directory has horizontal overflow')
  await page.getByRole('searchbox', { name: 'Find your country' }).fill('Sierra Leone')
  await page.waitForFunction(() => document.querySelectorAll('.msbm-country-grid .msbm-directory-card').length === 1)
  assert(await page.getByRole('heading', { name: 'Sierra Leone' }).isVisible(), 'Country search did not reveal Sierra Leone')
  await page.screenshot({ path: path.join(artifacts, 'msbm-country-directory.png'), type: 'png' })
  await page.locator('.msbm-country-grid').scrollIntoViewIfNeeded()
  await page.screenshot({ path: path.join(artifacts, 'msbm-country-search-result.png'), type: 'png' })
  await page.getByRole('heading', { name: 'Sierra Leone' }).click()
  await page.waitForURL('**/countries/sierra-leone')
  await page.waitForFunction(() => document.querySelectorAll('.msbm-course-card').length === 69)
  assert(await page.locator('.msbm-course-card').count() === 69, 'Sierra Leone did not render 69 source-backed degree cards')
  assert(await page.getByText('SLL 102,777,575').count() > 0, 'Verified Sierra Leone local fee is missing')

  await page.goto(`${baseUrl}/countries/portugal`, { waitUntil: 'domcontentloaded' })
  await waitForTheme(page)
  await page.waitForFunction(() => document.querySelectorAll('.msbm-course-card').length === 69)
  assert(await page.locator('.msbm-course-card').count() === 69, 'Portugal did not render 69 source-backed degree cards')
  assert(await page.getByText('Confirm local fee').count() > 0, 'Portugal did not label unverified local fees')
  assert(!(await pageMetrics(page)).hasHorizontalOverflow, 'Desktop Portugal page has horizontal overflow')
  await page.screenshot({ path: path.join(artifacts, 'msbm-portugal-programmes.png'), type: 'png' })
  await page.locator('.msbm-course-grid').scrollIntoViewIfNeeded()
  await page.waitForTimeout(1200)
  await page.screenshot({ path: path.join(artifacts, 'msbm-portugal-programme-cards.png'), type: 'png' })

  await page.goto(`${baseUrl}/countries/portugal/programmes/masters-of-business-administration`, { waitUntil: 'domcontentloaded' })
  await waitForTheme(page)
  assert(await page.getByText('Country destination: Portugal').isVisible(), 'Portugal context is missing from the programme detail')
  assert(await page.getByText('Confirm local fee').count() > 0, 'Portugal programme detail inferred a local fee')
  assert(await page.locator('#modules .msbm-module-list details').count() === 15, 'MBA detail did not preserve all 15 curriculum sections')

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mobilePage = await mobile.newPage()
  mobilePage.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) })
  mobilePage.on('pageerror', (error) => errors.push(error.message))
  await mobilePage.goto(`${baseUrl}/countries`, { waitUntil: 'domcontentloaded' })
  await waitForTheme(mobilePage)
  await mobilePage.getByRole('button', { name: 'Open menu' }).click()
  await mobilePage.locator('.msbm-country-switcher.is-mobile .msbm-country-switcher__toggle').click()
  assert(await mobilePage.locator('#country-switch-search-mobile').isVisible(), 'Mobile menu country switch is missing')
  await mobilePage.screenshot({ path: path.join(artifacts, 'msbm-country-switcher-mobile.png'), type: 'png' })
  await mobilePage.getByRole('button', { name: 'Close menu' }).click()
  assert(!(await pageMetrics(mobilePage)).hasHorizontalOverflow, 'Mobile country directory has horizontal overflow')
  await mobilePage.getByRole('searchbox', { name: 'Find your country' }).fill('Portugal')
  await mobilePage.waitForFunction(() => document.querySelectorAll('.msbm-country-grid .msbm-directory-card').length === 1)
  assert(await mobilePage.getByRole('heading', { name: 'Portugal' }).isVisible(), 'Mobile country search did not render Portugal')
  await mobilePage.screenshot({ path: path.join(artifacts, 'msbm-country-directory-mobile.png'), type: 'png' })
  await mobilePage.locator('.msbm-country-grid').scrollIntoViewIfNeeded()
  await mobilePage.screenshot({ path: path.join(artifacts, 'msbm-country-search-result-mobile.png'), type: 'png' })
  await mobilePage.getByRole('heading', { name: 'Portugal' }).click()
  await mobilePage.waitForURL('**/countries/portugal')
  await mobilePage.waitForFunction(() => document.querySelectorAll('.msbm-course-card').length === 69)
  assert(await mobilePage.locator('.msbm-course-card').count() === 69, 'Mobile Portugal page did not render the catalogue')
  assert(!(await pageMetrics(mobilePage)).hasHorizontalOverflow, 'Mobile Portugal page has horizontal overflow')

  assert(errors.length === 0, `Browser console errors: ${errors.join(' | ')}`)
  await mobile.close()
  await desktop.close()
  await browser.close()
  console.log(JSON.stringify({ countries: 249, programmesPerCountry: 69, desktop: 'passed', mobile: 'passed', consoleErrors: 0 }, null, 2))
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
