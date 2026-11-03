/* global console, process, document, URL, innerWidth, getComputedStyle, requestAnimationFrame */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { evaluateCandidate, verifyCandidateIntegrity } from '../../src/data/course-rag/contract.js'
import { SECTION_TARGETS } from './browser.mjs'
import { classifyResource, evaluateRenderedRecord, summarize, normalize } from './evaluator.mjs'

const args = process.argv.slice(2)
const option = (name, fallback) => args.includes(name) ? args[args.indexOf(name) + 1] : fallback
const root = process.cwd()
const baseUrl = option('--base-url', 'http://127.0.0.1:4173')
const seed = option('--catalogue', 'dist/api/courses.seed.json')
const out = path.resolve(option('--out', 'artifacts/course-acceptance'))
const candidateDir = path.resolve(option('--candidates', 'artifacts/course-rag/candidates'))
const phpPreview = args.includes('--php-preview')
const allCourses = JSON.parse(await readFile(path.resolve(seed), 'utf8'))
const slugs = option('--slugs', '').split(',').filter(Boolean)
const courses = slugs.length ? allCourses.filter(course => slugs.includes(course.slug)) : allCourses
if (!courses.length || slugs.some(slug => !courses.some(course => course.slug === slug))) throw new Error('Empty catalogue or unknown requested slug.')
await mkdir(path.join(out, 'screenshots'), { recursive: true })
const candidates = new Map()
for (const directory of [path.resolve(root, 'src/data/course-rag/publishedCourses.json.history'), candidateDir]) {
  for (const name of await readdir(directory).catch(() => [])) {
    if (!name.endsWith('.json') || directory.endsWith('.history') && !name.endsWith('.candidate.json')) continue
    const candidate = JSON.parse(await readFile(path.join(directory, name), 'utf8'))
    candidates.set(`${candidate.courseSlug}:${candidate.contentRevision}`, candidate)
    candidates.set(candidate.courseSlug, candidate)
  }
}
await writeFile(path.join(out, 'QA-INVENTORY.md'), `# Course acceptance coverage\n\nInventory: ${courses.length} routes from ${seed}.\n\nEach route: exact identity, 16 substantive evidence sections, publication revision/digest, module and lesson order/descriptions, anchors, accordion close/open, checkout identity, desktop 1440×900 and mobile 390×844 fit, images, runtime/console/resource errors.\n\nFailure cases: unknown slug after a valid course; direct #modules load followed by refresh.\n\n${phpPreview ? 'Local PHP course API absence is an environment warning; this run verifies fallback data only.' : 'API/resource errors are product failures.'}\n\nScreenshots are retained for every route. Automated layout measurements require human screenshot review before visual signoff.\n`)
const browser = await chromium.launch({ headless: true, executablePath: option('--browser-path', process.env.PLAYWRIGHT_EXECUTABLE_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe') })
const results = []
let next = 0

async function metrics(page) {
  return page.evaluate(() => {
    const visible = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden' }
    const outside = el => {
      const rect = el.getBoundingClientRect()
      if (rect.left >= -1 && rect.right <= innerWidth + 1) return false
      let parent = el.parentElement
      while (parent) { if (/auto|scroll/.test(getComputedStyle(parent).overflowX) && parent.scrollWidth > parent.clientWidth) return false; parent = parent.parentElement }
      return true
    }
    return { width: innerWidth, overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      clippedControls: [...document.querySelectorAll('.msbm-course-hero a,.msbm-course-nav a,#modules summary')].filter(visible).filter(outside).map(el => el.textContent),
      brokenImages: [...document.images].filter(image => image.complete && !image.naturalWidth).map(image => image.currentSrc || image.src) }
  })
}

async function settledScreenshot(page, target) {
  // Hash navigation currently schedules a new preloader on the next render.
  // Wait for React's paint/effect cycle before waiting for that overlay to leave.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await page.locator('.ma-preloader-1').waitFor({ state: 'hidden' })
  await page.screenshot({ path: target, type: 'jpeg', quality: 60, scale: 'css' })
}

async function worker() {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, serviceWorkers: 'block' })
  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, serviceWorkers: 'block' })
  const page = await desktop.newPage(), mobilePage = await mobile.newPage()
  page.setDefaultTimeout(8000); mobilePage.setDefaultTimeout(8000)
  let pageErrors = [], consoles = [], resources = []
  for (const surface of [page, mobilePage]) {
    surface.on('pageerror', error => pageErrors.push(error.message))
    surface.on('console', message => { if (message.type() === 'error') consoles.push({ text: message.text(), url: message.location().url }) })
    surface.on('response', response => { if (response.status() >= 400) resources.push({ url: response.url(), status: response.status() }) })
  }
  while (next < courses.length) {
    const course = courses[next++]
    pageErrors = []; consoles = []; resources = []
    const observed = { anchors: [], warnings: [], sections: {}, modules: [], screenshots: [] }
    let evidence = {}
    try {
      const url = new URL(`/programmes/${course.slug}`, baseUrl).href
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      if (!response?.ok()) throw new Error(`Course route HTTP ${response?.status()}`)
      await page.locator('.msbm-course-hero h1').waitFor()
      await page.locator('.ma-preloader-1').waitFor({ state: 'hidden' })
      observed.title = await page.locator('.msbm-course-hero h1').innerText()
      observed.pathname = new URL(page.url()).pathname
      observed.desktop = await metrics(page)
      for (const [id, selector] of Object.entries(SECTION_TARGETS)) {
        const region = page.locator(selector).first()
        observed.sections[id] = { exists: await region.count() > 0, text: await region.count() ? await region.innerText() : '' }
        if (id !== 'identity' && await region.count()) {
          const body = await region.evaluate(element => { const copy = element.cloneNode(true); copy.querySelectorAll('h1,h2,h3,h4,h5,h6,aside,nav').forEach(node => node.remove()); return copy.textContent || '' })
          if (!normalize(body)) observed.sections[id].text = ''
        }
      }
      const modules = page.locator('#modules details')
      for (let i = 0; i < await modules.count(); i++) if (await modules.nth(i).getAttribute('open') === null) await modules.nth(i).locator('summary').click()
      observed.modules = await modules.evaluateAll(items => items.map(item => ({ title: item.querySelector('summary strong')?.textContent || '', text: item.innerText, lessons: [...item.querySelectorAll(':scope > ul > li')].map(lesson => ({ title: lesson.querySelector('strong')?.textContent || '', text: lesson.innerText })) })))
      if (await page.locator('#modules').count()) observed.sections.modules.text = await page.locator('#modules').innerText()
      if (await modules.count()) {
        await modules.first().locator('summary').click()
        const closed = await modules.first().getAttribute('open') === null
        await modules.first().locator('summary').click()
        observed.accordionCycle = closed && await modules.first().getAttribute('open') !== null
      }
      const hrefs = await page.locator('.msbm-course-nav a,aside[aria-label="Course overview sections"] a').evaluateAll(items => [...new Set(items.map(item => item.getAttribute('href')).filter(href => /^#[a-z-]+$/.test(href || '')))])
      for (const href of hrefs) {
        await page.locator(`.msbm-course-nav a[href="${href}"],aside[aria-label="Course overview sections"] a[href="${href}"]`).first().click()
        observed.anchors.push({ href, targetExists: await page.locator(href).count() > 0, hashMatches: new URL(page.url()).hash === href })
      }
      await page.locator('.msbm-course-hero').scrollIntoViewIfNeeded()
      const screenshot = `screenshots/${course.slug}-desktop.jpg`
      await settledScreenshot(page, path.join(out, screenshot)); observed.screenshots.push(screenshot)
      await page.locator('.msbm-course-hero__actions a').filter({ hasText: 'Buy now' }).first().click()
      await page.waitForURL(`**/checkout/${course.slug}*`)
      observed.checkout = { correctRoute: new URL(page.url()).pathname === `/checkout/${course.slug}`, courseVisible: normalize(await page.locator('body').innerText()).includes(normalize(course.title)) }
      await mobilePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
      await mobilePage.locator('.msbm-course-hero h1').waitFor(); await mobilePage.locator('.ma-preloader-1').waitFor({ state: 'hidden' })
      observed.mobile = await metrics(mobilePage)
      const mobileScreenshot = `screenshots/${course.slug}-mobile.jpg`
      await settledScreenshot(mobilePage, path.join(out, mobileScreenshot)); observed.screenshots.push(mobileScreenshot)
      const candidate = candidates.get(`${course.slug}:${course.ragProvenance?.contentRevision}`) || candidates.get(course.slug)
      if (candidate) evidence = { integrity: await verifyCandidateIntegrity(candidate), coverage: evaluateCandidate(candidate), revision: candidate.contentRevision, digest: candidate.evidenceDigest, scope: candidate.scope, sections: candidate.sections }
    } catch (error) { observed.error = error.message }
    observed.pageErrors = [...new Set(pageErrors)]
    observed.resourceErrors = resources.filter(resource => classifyResource(resource, { baseUrl, phpPreview }) === 'error')
    const warnings = resources.filter(resource => classifyResource(resource, { baseUrl, phpPreview }) === 'environment-warning')
    observed.warnings.push(...warnings.map(resource => ({ code: 'local-php-course-api-unavailable', ...resource })))
    observed.consoleErrors = consoles.filter(message => !warnings.some(resource => message.url === resource.url || message.text.includes(resource.url))).map(message => message.text)
    results.push(evaluateRenderedRecord(course, observed, evidence))
    console.log(JSON.stringify({ checked: results.length, total: courses.length, slug: course.slug, defects: results.at(-1).defects.length }))
    await writeFile(path.join(out, 'progress.json'), JSON.stringify({ checked: results.length, total: courses.length, results }, null, 2))
  }
  await desktop.close(); await mobile.close()
}

try {
  await Promise.all(Array.from({ length: Math.min(4, courses.length) }, worker))
  results.sort((a, b) => courses.findIndex(course => course.slug === a.slug) - courses.findIndex(course => course.slug === b.slug))
  const exploratoryContext = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const exploratoryPage = await exploratoryContext.newPage()
  await exploratoryPage.goto(new URL(`/programmes/${courses[0].slug}#modules`, baseUrl).href, { waitUntil: 'domcontentloaded' })
  await exploratoryPage.locator('.msbm-course-hero h1').waitFor()
  const exploratory = { directHashIdentity: normalize(await exploratoryPage.locator('.msbm-course-hero h1').innerText()) === normalize(courses[0].title) }
  await exploratoryPage.reload({ waitUntil: 'domcontentloaded' }); await exploratoryPage.locator('.msbm-course-hero h1').waitFor()
  exploratory.refreshIdentity = normalize(await exploratoryPage.locator('.msbm-course-hero h1').innerText()) === normalize(courses[0].title)
  await exploratoryPage.goto(new URL('/programmes/nonexistent-acceptance-course', baseUrl).href, { waitUntil: 'networkidle' })
  exploratory.missingCourseDoesNotRetainPrevious = await exploratoryPage.locator('.msbm-course-hero h1').count() === 0
  await exploratoryContext.close()
  const totals = summarize(results, courses.length)
  if (Object.values(exploratory).some(value => !value)) totals.passed = false
  const baselinePath = option('--baseline', 'artifacts/course-detail-audit/results.json')
  let baseline
  try { const previous = JSON.parse(await readFile(path.resolve(baselinePath), 'utf8')); baseline = { path: baselinePath, generatedAt: previous.generatedAt, totals: previous.totals } } catch { baseline = null }
  const report = { generatedAt: new Date().toISOString(), baseUrl, catalogue: seed, phpPreview, partialInventory: slugs.length > 0, totals, baseline, exploratory, results }
  await writeFile(path.join(out, 'results.json'), JSON.stringify(report, null, 2))
  await writeFile(path.join(out, 'REPORT.md'), [`# Course acceptance gate\n`, `${totals.checked}/${totals.inventory} routes checked; ${totals.complete} complete; ${totals.incomplete} incomplete. Gate: ${totals.passed ? 'PASS' : 'FAIL'}.`, baseline ? `\nPrevious audit: ${baseline.totals?.checked} checked, ${baseline.totals?.complete} complete. This stricter evaluator also detects generated course-details replacements; section totals may differ because the methodology changed.` : '', `\nTarget: ${baseUrl}. ${phpPreview ? 'PHP API unavailable warnings do not prove production API correctness.' : 'API errors are failures.'}`, '\n| Section | Missing / generic |', '| --- | --- |', ...Object.entries(totals.missingBySection).map(([id, count]) => `| ${id} | ${count} |`), '\n| Course | Complete | Missing / generic sections | Defects |', '| --- | --- | --- | --- |', ...results.map(result => `| ${result.slug} | ${result.complete} | ${result.missingSections.join(', ')} | ${result.defects.map(defect => defect.code).join(', ')} |`), '\nAutomated measurements and retained screenshots require separate human visual review. Upstream sources are not re-fetched by this gate. Exact source evidence and independent approval are required for completeness.'].join('\n'))
  console.log(JSON.stringify(totals, null, 2))
  process.exitCode = totals.passed ? 0 : 1
} finally { await browser.close() }
