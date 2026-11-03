/* global console, process */
import { chromium } from 'playwright'

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173'
const executablePath = process.env.PLAYWRIGHT_CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const browser = await chromium.launch({ headless: true, executablePath })
const failures = []
const checks = []
const record = (name, pass, detail = {}) => {
  checks.push({ name, pass, ...detail })
  if (!pass) failures.push(name)
}

try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  await page.goto(`${baseUrl}/programmes/executive-master-of-business-administration-4`, { waitUntil: 'networkidle' })
  record('course route', (await page.locator('h1').first().innerText()) === 'Executive Master Of Business Administration')
  record('honest completeness label', (await page.locator('.msbm-source-status strong').innerText()).includes('completeness pending'))
  record('desktop fit', await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
  const firstModule = page.locator('.msbm-module-list details').first()
  const initiallyOpen = await firstModule.getAttribute('open') !== null
  await firstModule.locator('summary').click()
  const closed = await firstModule.getAttribute('open') === null
  await firstModule.locator('summary').click()
  record('module accordion cycle', initiallyOpen && closed && await firstModule.getAttribute('open') !== null)

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
  const mobilePage = await mobile.newPage()
  await mobilePage.goto(`${baseUrl}/programmes/executive-master-of-business-administration-4`, { waitUntil: 'networkidle' })
  record('mobile fit', await mobilePage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth))
  await mobile.close()

  await page.route('**/api/auth/session', route => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ authenticated: true, user: { id: 1, email: 'qa@example.test', role: 'administrator' }, csrfToken: 'qa-token' }),
  }))
  await page.goto(`${baseUrl}/admin/cms/course-review`, { waitUntil: 'networkidle' })
  record('CMS evidence route', await page.getByRole('heading', { name: /course evidence review/i }).first().isVisible())
  record('CMS candidate import control', await page.locator('textarea').count() > 0 || await page.locator('input[type=file]').count() > 0)
  await page.goto(`${baseUrl}/admin/crm/programmes`, { waitUntil: 'networkidle' })
  record('CRM programme relations route', await page.getByRole('heading', { name: /programme relationships/i }).first().isVisible())
  record('CRM catalogue links', await page.locator('a[href^="/programmes/"]').count() > 0)
} catch (error) {
  failures.push('runtime')
  checks.push({ name: 'runtime', pass: false, error: error.message })
} finally {
  await browser.close()
}

console.log(JSON.stringify({ baseUrl, checks, passed: failures.length === 0, failures }, null, 2))
if (failures.length) process.exitCode = 1
