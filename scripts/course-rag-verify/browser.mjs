/* global console, process, URL, document */
import { readFile } from 'node:fs/promises'
import { pathToFileURL } from 'node:url'
import { chromium } from 'playwright'
import { evaluateCandidate } from '../../src/data/course-rag/contract.js'
import { assertIntegrity } from '../course-rag/core.mjs'

export const SECTION_TARGETS = {
  identity: '.msbm-course-hero', programmeDetails: '#details', courseDetails: '#course-details',
  learningOutcomes: '#outcomes', accreditation: '#accreditation', modules: '#modules',
  universityProgression: '#university', entryRequirements: '#entry', workshops: '#workshop', visa: '#visa',
  tuition: '#tuition', about: '#about', library: '#library', gettingStarted: '#getting-started',
  certificate: '#certificate', testimonials: '#testimonial',
}

export const normalizeVisibleText = value => String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()

export function compareModuleProjection(actual, expected) {
  const errors = []
  if (actual.length !== expected.length) errors.push(`Module count: rendered ${actual.length}, expected ${expected.length}.`)
  expected.forEach((module, index) => {
    const shown = actual[index]
    if (!shown) return
    if (normalizeVisibleText(shown.title) !== normalizeVisibleText(module.title)) errors.push(`Module ${index + 1}: title or order differs.`)
    const expectedLessons = (module.lessons || []).map(lesson => typeof lesson === 'string' ? lesson : lesson.title)
    if (shown.lessons.length !== expectedLessons.length) errors.push(`Module ${index + 1}: lesson count differs.`)
    expectedLessons.forEach((title, lessonIndex) => {
      if (normalizeVisibleText(shown.lessons[lessonIndex]) !== normalizeVisibleText(title)) errors.push(`Module ${index + 1}, lesson ${lessonIndex + 1}: title or order differs.`)
    })
  })
  return errors
}

export async function verifyRenderedCourse(candidate, baseUrl, { executablePath, headless = true } = {}) {
  const report = { schemaVersion: 1, verifierRunId: `browser-verifier-${Date.now()}`, candidateId: candidate?.candidateId, courseSlug: candidate?.courseSlug, sourceUrl: candidate?.sourceUrl, scope: candidate?.scope, contentRevision: candidate?.contentRevision, evidenceDigest: candidate?.evidenceDigest, checks: [], errors: [], passed: false }
  const record = (name, passed, detail = {}) => { report.checks.push({ name, passed, ...detail }); if (!passed) report.errors.push({ name, ...detail }) }
  let browser
  try {
    assertIntegrity(candidate)
    const coverage = evaluateCandidate(candidate)
    record('candidate_ready', coverage.readyForReview, { errors: coverage.errors, missing: coverage.missing })
    if (!coverage.readyForReview) return report
    const origin = new URL(baseUrl)
    if (origin.username || origin.password || !['http:', 'https:'].includes(origin.protocol)) throw new Error('A plain HTTP(S) target URL is required.')
    browser = await chromium.launch({ headless, ...(executablePath ? { executablePath } : {}) })
    for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, isMobile: viewport.width < 500, hasTouch: viewport.width < 500, serviceWorkers: 'block' })
      const page = await context.newPage()
      const runtimeErrors = []
      page.on('pageerror', error => runtimeErrors.push(error.message))
      try {
        const response = await page.goto(new URL(`/programmes/${candidate.courseSlug}`, origin).href, { waitUntil: 'networkidle', timeout: 60_000 })
        record(`http_${viewport.width}`, Boolean(response?.ok()), { status: response?.status() })
        await page.locator('.msbm-course-hero h1').waitFor({ timeout: 15_000 })
        record(`identity_${viewport.width}`, normalizeVisibleText(await page.locator('.msbm-course-hero h1').innerText()) === normalizeVisibleText(candidate.record.title))
        for (const [sectionId, selector] of Object.entries(SECTION_TARGETS)) {
          const section = candidate.sections[sectionId]
          if (section?.status !== 'observed') continue
          const region = page.locator(selector).first()
          const exists = await region.count() > 0
          record(`section_${sectionId}_${viewport.width}`, exists)
          if (!exists) continue
          // Expand via real controls so assertions observe the state learners use.
          const accordions = region.locator('details')
          for (let index = 0; index < await accordions.count(); index += 1) {
            const item = accordions.nth(index)
            if (!await item.getAttribute('open').then(value => value !== null)) await item.locator('summary').click()
          }
          const shown = normalizeVisibleText(await region.innerText())
          const missing = (section.value?.blocks || []).flatMap((block, index) => {
            if (block.type === 'image' || block.type === 'embed') return []
            const text = normalizeVisibleText(block.text)
            return text && !shown.includes(text) ? [{ index, text: text.slice(0, 120) }] : []
          })
          record(`section_text_${sectionId}_${viewport.width}`, missing.length === 0, { missing })
          const media = await region.locator('img,iframe,video,source').evaluateAll(items => items.map(item => ({ src: item.getAttribute('src') || '', alt: item.getAttribute('alt') || item.getAttribute('title') || '' })))
          for (const [index, block] of (section.value?.blocks || []).entries()) {
            if (block.type !== 'image' && block.type !== 'embed') continue
            const match = media.find(item => {
              try { return new URL(item.src, page.url()).href === new URL(block.src).href } catch { return false }
            })
            record(`media_${sectionId}_${index}_${viewport.width}`, Boolean(match) && (!block.text || normalizeVisibleText(match.alt) === normalizeVisibleText(block.text)), { expected: block.src })
          }
          for (const block of section.value?.blocks || []) {
            if (block.type !== 'table') continue
            for (const [rowIndex, cells] of (block.rows || []).entries()) {
              const missingCells = cells.filter(cell => !shown.includes(normalizeVisibleText(cell)))
              record(`table_${sectionId}_${rowIndex}_${viewport.width}`, missingCells.length === 0, { missingCells })
            }
          }
        }
        const actualModules = await page.locator('#modules details').evaluateAll(items => items.map(item => ({ title: item.querySelector('summary strong')?.textContent || '', lessons: [...item.querySelectorAll('li > strong')].map(lesson => lesson.textContent || '') })))
        const moduleErrors = compareModuleProjection(actualModules, candidate.sections.modules.value.modules || candidate.record.modules || [])
        record(`module_order_${viewport.width}`, moduleErrors.length === 0, { errors: moduleErrors })
        const firstModule = page.locator('#modules details').first()
        if (await firstModule.count()) {
          if (!await firstModule.getAttribute('open').then(value => value !== null)) await firstModule.locator('summary').click()
          await firstModule.locator('summary').click()
          const closed = await firstModule.getAttribute('open') === null
          await firstModule.locator('summary').click()
          record(`accordion_cycle_${viewport.width}`, closed && await firstModule.getAttribute('open') !== null)
        }
        for (const id of ['tuition', 'about', 'library', 'getting-started', 'certificate', 'testimonial']) {
          const anchor = page.locator(`a[href="#${id}"]`).first()
          if (await anchor.count()) {
            await anchor.click()
            record(`anchor_${id}_${viewport.width}`, new URL(page.url()).hash === `#${id}` && await page.locator(`#${id}`).count() > 0)
          }
        }
        const fit = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }))
        record(`viewport_${viewport.width}`, fit.scrollWidth <= fit.width, fit)
        record(`runtime_${viewport.width}`, runtimeErrors.length === 0, { errors: runtimeErrors })
        const apiResponse = await context.request.get(new URL(`/api/courses/${candidate.courseSlug}`, origin).href)
        let apiRecord
        try { apiRecord = (await apiResponse.json()).data } catch { apiRecord = null }
        const revision = apiRecord?.contentRevision || apiRecord?.ragProvenance?.contentRevision || apiRecord?.provenance?.contentRevision
        record(`api_revision_${viewport.width}`, apiResponse.ok() && revision === candidate.contentRevision, { status: apiResponse.status(), expected: candidate.contentRevision, actual: revision || null })
      } catch (error) {
        record(`browser_${viewport.width}`, false, { error: error.message })
      } finally { await context.close() }
    }
    report.passed = report.errors.length === 0
    return report
  } catch (error) {
    report.errors.push({ name: 'verification_error', error: error.message })
    return report
  } finally { await browser?.close() }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const [candidatePath, baseUrl] = process.argv.slice(2)
    if (!candidatePath || !baseUrl) throw new Error('Usage: node scripts/course-rag-verify/browser.mjs <candidate.json> <base-url>')
    const candidate = JSON.parse(await readFile(candidatePath, 'utf8'))
    const report = await verifyRenderedCourse(candidate, baseUrl, { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH })
    console.log(JSON.stringify(report, null, 2))
    process.exitCode = report.passed ? 0 : 1
  } catch (error) {
    console.log(JSON.stringify({ passed: false, errors: [{ name: 'input', error: error.message }] }))
    process.exitCode = 1
  }
}
