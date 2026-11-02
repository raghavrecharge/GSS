import { createRequire } from 'node:module'
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const require = createRequire(import.meta.url)
const { chromium } = require('playwright')
const baseUrl = 'http://app.local'
const outputDir = path.resolve('artifacts/qa')
const distDir = path.resolve('dist')
const contentRecords = JSON.parse(await readFile(path.resolve('src/data/msbmContentPages.json'), 'utf8'))
const regionRecords = JSON.parse(await readFile(path.resolve('src/data/msbmRegions.json'), 'utf8'))
await mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})

const failures = []
const results = {}

async function installStaticApp(context) {
  await context.route('http://app.local/**', async (route) => {
    const url = new URL(route.request().url())
    const requested = decodeURIComponent(url.pathname).replace(/^\/+/, '')
    const hasExtension = path.extname(requested)
    const relativeFile = !requested || !hasExtension ? 'index.html' : requested
    const filePath = path.resolve(distDir, relativeFile)
    if (!filePath.startsWith(distDir)) return route.fulfill({ status: 403, body: 'Forbidden' })
    try {
      const body = await readFile(filePath)
      const extension = path.extname(filePath)
      const contentType = {
        '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
        '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
        '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.ico': 'image/x-icon',
      }[extension] || 'application/octet-stream'
      await route.fulfill({ status: 200, contentType, body })
    } catch {
      await route.fulfill({ status: 404, body: 'Not found' })
    }
  })
}

async function openPage(context, routePath, name) {
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.status() >= 400) pageErrors.push(`${response.status()} ${response.url()}`)
  })
  await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(outputDir, `${name}.png`), fullPage: false })
  const metrics = await page.evaluate(() => ({
    title: document.title,
    heading: document.querySelector('h1, h2')?.textContent?.trim() || '',
    images: document.images.length,
    brokenImages: [...document.images].filter((image) => !image.complete || !image.naturalWidth).length,
    canScrollX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  results[name] = { ...metrics, pageErrors }
  if (metrics.brokenImages) failures.push(`${name}: ${metrics.brokenImages} broken images`)
  if (metrics.canScrollX) failures.push(`${name}: horizontal overflow (${metrics.scrollWidth}/${metrics.width})`)
  if (pageErrors.length) failures.push(`${name}: ${pageErrors.join(', ')}`)
  return page
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } })
await installStaticApp(desktop)
const home = await openPage(desktop, '/', 'home-desktop')
if (!(await home.locator('.react-header').isVisible())) failures.push('home: React header is not visible')
if (!(await home.locator('.react-footer').count())) failures.push('home: React footer is missing')
await home.getByRole('button', { name: 'Search' }).click()
if (!(await home.locator('.react-search').isVisible())) failures.push('home: search overlay did not open')
await home.keyboard.press('Escape')
if (await home.locator('.react-search').count()) failures.push('home: search overlay did not close')
await home.locator('.react-nav__item > a', { hasText: 'Courses' }).click()
await home.waitForURL('**/courses')
results.courseNavigation = { url: home.url(), heading: await home.locator('h1, h2').first().innerText() }
const publicCourseCards = await home.locator('.tp-course-item').count()
if (publicCourseCards < 69) failures.push(`courses: expected shared catalogue cards, found ${publicCourseCards}`)
await home.locator('.tp-course-title a').first().click()
await home.waitForURL('**/courses/*')
await home.locator('.tp-course-details-title').waitFor({ state: 'visible' })
await home.waitForTimeout(500)
const detailBrokenImages = await home.evaluate(() => [...document.images].filter((image) => !image.complete || !image.naturalWidth).length)
results.publicCourseDetails = { url: home.url(), title: await home.locator('.tp-course-details-title').innerText(), brokenImages: detailBrokenImages }
if (detailBrokenImages) failures.push(`course details: ${detailBrokenImages} broken images`)
await home.close()

const institutional = await openPage(desktop, '/about-msbm', 'institutional-content-desktop')
if (!(await institutional.locator('.tp-about-3-content p').count())) failures.push('institutional: imported content blocks are missing')
await institutional.close()

const contentAudit = await desktop.newPage()
let verifiedContentRoutes = 0
for (const record of contentRecords) {
  await contentAudit.goto(`${baseUrl}${record.path}`, { waitUntil: 'domcontentloaded' })
  await contentAudit.locator('.tp-about-3-content').waitFor({ state: 'visible' })
  const heading = (await contentAudit.locator('.tp-breadcrumb-title').innerText()).trim()
  const blocks = await contentAudit.locator('.tp-about-3-content > *').count()
  const expectedTableRows = (record.blocks || []).filter((block) => block.type === 'table').reduce((total, block) => total + (block.rows?.length || 0), 0)
  const renderedTableRows = await contentAudit.locator('.tp-about-3-content table tr').count()
  if (heading !== record.title || !blocks) failures.push(`institutional route ${record.path}: content binding mismatch`)
  else if (renderedTableRows !== expectedTableRows) failures.push(`institutional route ${record.path}: expected ${expectedTableRows} table rows, found ${renderedTableRows}`)
  else verifiedContentRoutes += 1
}
results.institutionalRouteAudit = { expected: contentRecords.length, verified: verifiedContentRoutes }
await contentAudit.close()

const countriesPage = await openPage(desktop, '/countries', 'countries-desktop')
const countryCards = await countriesPage.locator('.tp-course-item').count()
if (countryCards !== 249) failures.push(`countries: expected 249 entries, found ${countryCards}`)
await countriesPage.close()

const regionalGroup = regionRecords.find((group) => group.locations?.length)
if (regionalGroup) {
  const countryDirectory = await openPage(desktop, `/countries/${regionalGroup.countrySlug}`, 'country-directory-desktop')
  const locationCards = await countryDirectory.locator('.tp-course-item').count()
  if (locationCards !== regionalGroup.locations.length) failures.push(`country directory: expected ${regionalGroup.locations.length} locations, found ${locationCards}`)
  await countryDirectory.close()
  const localized = await openPage(desktop, `/locations/${regionalGroup.locations[0].slug}/courses/dba-phd-in-business-administration`, 'localized-course-desktop')
  if (!(await localized.locator('.tp-course-details-title').count())) failures.push('localized course: detail binding is missing')
  await localized.close()
}

const persistedCourseTitle = 'Masters of Business Administration'
const cart = await openPage(desktop, '/cart?course=masters-of-business-administration', 'application-cart-desktop')
if (!(await cart.locator('.tp-cart-title', { hasText: persistedCourseTitle }).count())) failures.push('cart: selected programme was not bound')
await cart.goto(`${baseUrl}/checkout`, { waitUntil: 'networkidle' })
const checkout = cart
if (!(await checkout.locator('[data-application-form]').count())) failures.push('checkout: application form binding is missing')
if (!(await checkout.locator('[data-submit-application]').count())) failures.push('checkout: application submit action is missing')
if (!(await checkout.locator('.tp-order-info-list-desc', { hasText: persistedCourseTitle }).count())) failures.push('checkout: selected programme did not persist from the cart')
await checkout.close()

const dashboard = await openPage(desktop, '/dashboard', 'dashboard-desktop')
if (!(await dashboard.locator('.app-sidebar').isVisible())) failures.push('dashboard: sidebar is not visible')
if (!(await dashboard.locator('.app-content-wrapper').count())) failures.push('dashboard: content wrapper is missing')
const courseGridLink = dashboard.locator('a[href="/dashboard/lms-course-grid"]').first()
const courseGroup = courseGridLink.locator('xpath=ancestor::li[contains(@class,"has-dropdown")][1]')
if (await courseGroup.count()) await courseGroup.locator(':scope > .menu-link').click()
await courseGridLink.click()
await dashboard.waitForURL('**/dashboard/lms-course-grid')
await dashboard.locator('.app-content-wrapper').waitFor({ state: 'visible' })
await dashboard.waitForTimeout(750)
const dashboardCards = await dashboard.locator('.tp-course-item').count()
results.dashboardNavigation = { url: dashboard.url(), cards: dashboardCards }
if (dashboardCards < 69) failures.push(`dashboard: expected shared catalogue cards, found ${dashboardCards}`)
await dashboard.locator('.tp-course-title a').first().click()
await dashboard.waitForURL('**/dashboard/lms-course-details?course=*')
try {
  await dashboard.locator('#about').waitFor({ state: 'visible', timeout: 5000 })
} catch {
  failures.push('dashboard: dynamic course detail did not load')
}
await dashboard.screenshot({ path: path.join(outputDir, 'course-grid-desktop.png'), fullPage: false })
await dashboard.close()

const adminLogin = await openPage(desktop, '/dashboard/login', 'dashboard-login-desktop')
if (!(await adminLogin.locator('[data-admin-login]').count())) failures.push('dashboard: administrator login binding is missing')
await adminLogin.close()

const adminSetup = await openPage(desktop, `/dashboard/login?setup=${'a'.repeat(64)}`, 'dashboard-setup-desktop')
if (!(await adminSetup.locator('[data-admin-setup]').count())) failures.push('dashboard: administrator setup binding is missing')
await adminSetup.close()

const courseEditor = await openPage(desktop, '/dashboard/lms-course-add', 'dashboard-course-editor-desktop')
if (!(await courseEditor.locator('[data-course-save]').count())) failures.push('dashboard: protected course editor actions are missing')
await courseEditor.close()

const applications = await openPage(desktop, '/dashboard/applications', 'dashboard-applications-desktop')
if (!(await applications.getByText('Programme Applications').count())) failures.push('dashboard: applications administration route is missing')
await applications.close()

const unknownCourse = await openPage(desktop, '/courses/not-a-real-programme', 'unknown-course-desktop')
if (!/404|not found|nothing here/i.test(await unknownCourse.locator('h1, h2').first().innerText())) failures.push('routes: unknown course did not render the 404 page')
await unknownCourse.close()

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true })
await installStaticApp(mobile)
const mobileHome = await openPage(mobile, '/', 'home-mobile')
await mobileHome.getByRole('button', { name: 'Open navigation menu' }).click()
if (!(await mobileHome.locator('.mobile-drawer.is-open').isVisible())) failures.push('mobile: navigation drawer did not open')
await mobileHome.waitForTimeout(400)
await mobileHome.screenshot({ path: path.join(outputDir, 'mobile-menu.png'), fullPage: false })
await mobileHome.getByRole('button', { name: 'Toggle Pages submenu' }).click()
await mobileHome.getByRole('link', { name: 'About', exact: true }).last().click()
await mobileHome.waitForURL('**/about')
results.mobileNavigation = { url: mobileHome.url() }

await mobileHome.close()
await mobile.close()
await desktop.close()
await browser.close()

console.log(JSON.stringify({ ok: failures.length === 0, failures, results }, null, 2))
if (failures.length) process.exitCode = 1
