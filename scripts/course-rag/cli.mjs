/* global console, process, URL, fetch, AbortSignal, setTimeout, TextDecoder */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { resolve, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import {
  normalizeSourceUrl, scopeForUrl, extractSnapshot, assembleCandidate, retrieve,
  assertIntegrity, reviewCandidate, sha256,
} from './core.mjs'
import { evaluateCandidate } from './contract.mjs'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const sleep = (ms) => new Promise((done) => setTimeout(done, ms))
const allowedOptions = new Set(['catalog', 'out', 'manifest', 'slug', 'limit', 'html', 'source', 'mode', 'browser-path', 'candidate', 'section', 'scope', 'query', 'review', 'actor'])

function optionsFor(args) {
  const result = {}
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index]
    if (!flag.startsWith('--') || !allowedOptions.has(flag.slice(2)) || args[index + 1] === undefined) throw new Error(`Unsupported or missing option: ${flag}`)
    result[flag.slice(2)] = args[index + 1]
  }
  return result
}

async function readJson(path) { return JSON.parse(await readFile(resolve(path), 'utf8')) }
async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

async function inventory(options) {
  const catalogPath = resolve(options.catalog || `${projectRoot}/dist/api/courses.seed.json`)
  const records = await readJson(catalogPath)
  if (!Array.isArray(records) || !records.length) throw new Error('Catalogue must contain a nonempty course array. Run npm run build to generate dist/api/courses.seed.json.')
  const courses = []
  const missing = []
  for (const record of records) {
    if (!record.sourceUrl) { missing.push({ courseSlug: record.slug, reason: 'No authorized source URL recorded.' }); continue }
    try {
      const sourceUrl = normalizeSourceUrl(record.sourceUrl)
      courses.push({ courseSlug: record.slug, sourceUrl, scope: scopeForUrl(sourceUrl) })
    } catch (error) { missing.push({ courseSlug: record.slug, reason: error.message }) }
  }
  const output = resolve(options.out || `${projectRoot}/artifacts/course-rag/manifest.json`)
  const manifest = { schemaVersion: 1, generatedAt: new Date().toISOString(), catalogPath, courses, missing }
  await writeJson(output, manifest)
  console.log(JSON.stringify({ stage: 'inventory', total: records.length, sourceLinked: courses.length, unresolved: missing.length, output }))
}

async function fetchPublicCourse(sourceUrl) {
  let current = normalizeSourceUrl(sourceUrl)
  for (let redirect = 0; redirect <= 4; redirect += 1) {
    const response = await fetch(current, {
      redirect: 'manual', signal: AbortSignal.timeout(45_000),
      headers: { 'User-Agent': 'GSS-Course-Evidence/1.0 (public programme completeness audit)', Accept: 'text/html' },
    })
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const next = normalizeSourceUrl(new URL(response.headers.get('location'), current).href)
      if (scopeForUrl(next) !== scopeForUrl(sourceUrl)) throw new Error('Redirect changes country scope; explicit source correction is required.')
      current = next
      continue
    }
    if (response.status !== 200) throw new Error(`Source returned HTTP ${response.status}; no bypass attempted.`)
    if (!response.headers.get('content-type')?.includes('text/html')) throw new Error('Source did not return HTML.')
    const limit = 12 * 1024 * 1024
    if (Number(response.headers.get('content-length') || 0) > limit) throw new Error('Source exceeds the capture size limit.')
    const reader = response.body.getReader()
    const chunks = []
    let bytes = 0
    while (true) {
      const part = await reader.read()
      if (part.done) break
      bytes += part.value.length
      if (bytes > limit) { await reader.cancel(); throw new Error('Source exceeds the capture size limit; extraction was not truncated.') }
      chunks.push(part.value)
    }
    const body = new Uint8Array(bytes)
    let offset = 0
    for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length }
    return { html: new TextDecoder().decode(body), finalUrl: current, status: response.status, actions: [], captureMethod: 'http' }
  }
  throw new Error('Too many source redirects.')
}

async function browserCapture(sourceUrl, options) {
  const require = createRequire(import.meta.url)
  const { chromium } = require('playwright')
  const browser = await chromium.launch({ headless: true, ...(options['browser-path'] ? { executablePath: options['browser-path'] } : {}) })
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } })
    const page = await context.newPage()
    const actions = []
    // Guard every navigation redirect before allowing network access to another origin.
    await page.route('**/*', async (route) => {
      const request = route.request()
      if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
        try { normalizeSourceUrl(request.url()) } catch { return route.abort() }
      }
      return route.continue()
    })
    const response = await page.goto(sourceUrl, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    await page.waitForTimeout(1000)
    const title = await page.title()
    if (!response?.ok() || /just a moment|access denied|verify you are human/i.test(title)) throw new Error(`Source blocked or unavailable: ${response?.status()} ${title}`)
    const controls = page.locator('#course-overview-class [data-toggle="tab"], #course-overview-class [data-bs-toggle="tab"], #modules button[data-toggle="collapse"], #modules button[data-bs-toggle="collapse"]')
    for (let index = 0; index < await controls.count(); index += 1) {
      const control = controls.nth(index)
      if (!await control.isVisible()) continue
      if (await control.getAttribute('aria-expanded') === 'true') continue
      const label = (await control.innerText()).replace(/\s+/g, ' ').trim()
      try {
        await control.click({ timeout: 2000 })
        actions.push({ action: 'expand', label })
      } catch { actions.push({ action: 'expand-unavailable', label }) }
    }
    const html = await page.content()
    return { html, finalUrl: page.url(), status: response.status(), actions, captureMethod: 'playwright' }
  } finally { await browser.close() }
}

async function run(options) {
  const output = resolve(options.out || `${projectRoot}/artifacts/course-rag`)
  let courses
  if (options.source) {
    if (!options.slug) throw new Error('--source requires --slug to avoid title-based course matching.')
    courses = [{ courseSlug: options.slug, sourceUrl: normalizeSourceUrl(options.source) }]
  } else {
    const manifest = await readJson(options.manifest || `${output}/manifest.json`)
    courses = manifest.courses
  }
  if (!Array.isArray(courses)) throw new Error('Manifest courses must be an array.')
  if (options.slug) courses = courses.filter((course) => course.courseSlug === options.slug)
  if (options.limit) courses = courses.slice(0, Math.max(1, Number(options.limit)))
  if (options.html && courses.length !== 1) throw new Error('--html requires exactly one selected source.')
  const builderRunId = options.actor || `builder-${Date.now()}`
  const report = { schemaVersion: 1, builderRunId, startedAt: new Date().toISOString(), candidates: [], failures: [] }
  for (const course of courses) {
    try {
      const captureInput = options.html
        ? { html: await readFile(resolve(options.html), 'utf8'), captureMethod: 'supplied-snapshot' }
        : options.mode === 'browser' ? await browserCapture(course.sourceUrl, options) : await fetchPublicCourse(course.sourceUrl)
      const capture = extractSnapshot({ ...captureInput, url: course.sourceUrl, courseSlug: course.courseSlug })
      const candidate = assembleCandidate(capture, { builderRunId })
      const candidatePath = `${output}/candidates/${course.courseSlug}.json`
      await writeJson(candidatePath, candidate)
      await mkdir(`${output}/snapshots`, { recursive: true })
      await writeFile(`${output}/snapshots/${capture.snapshot.id}.html`, capture.sanitizedHtml)
      await writeJson(`${output}/snapshots/${capture.snapshot.id}.json`, capture.snapshot)
      report.candidates.push({ courseSlug: course.courseSlug, candidatePath, ...candidate.coverage })
      console.log(JSON.stringify({ stage: 'candidate', courseSlug: course.courseSlug, coverage: candidate.coverage.percent, missing: candidate.coverage.missing, complete: false }))
    } catch (error) {
      report.failures.push({ courseSlug: course.courseSlug, sourceUrl: course.sourceUrl, reason: error.message })
      console.error(JSON.stringify({ stage: 'capture-failed', courseSlug: course.courseSlug, reason: error.message }))
      if (/HTTP (401|403|429)|Source blocked/.test(error.message)) { report.stoppedForAccessControl = true; break }
    }
    if (!options.html) await sleep(1500)
  }
  report.finishedAt = new Date().toISOString()
  await writeJson(`${output}/report.json`, report)
  if (report.failures.length) process.exitCode = 1
}

async function main() {
  const [command, ...args] = process.argv.slice(2)
  const options = optionsFor(args)
  if (command === 'inventory') return inventory(options)
  if (command === 'run') return run(options)
  if (command === 'query') {
    const candidate = await readJson(options.candidate)
    console.log(JSON.stringify(retrieve(candidate, { courseSlug: options.slug || candidate.courseSlug, sectionId: options.section, scope: options.scope || candidate.scope, query: options.query }), null, 2))
    return
  }
  if (command === 'gate') {
    const candidate = await readJson(options.candidate)
    assertIntegrity(candidate)
    const coverage = evaluateCandidate(candidate)
    console.log(JSON.stringify(coverage, null, 2))
    if (!coverage.complete) process.exitCode = 1
    return
  }
  if (command === 'review') {
    const candidate = await readJson(options.candidate)
    const decision = await readJson(options.review)
    const reviewed = reviewCandidate(candidate, decision)
    await writeJson(resolve(options.out || options.candidate), reviewed)
    console.log(JSON.stringify({ candidateId: reviewed.candidateId, review: reviewed.review.state, complete: reviewed.coverage.complete }))
    return
  }
  if (command === 'digest') {
    console.log(sha256(await readJson(options.candidate)))
    return
  }
  throw new Error(`Usage: node ${basename(fileURLToPath(import.meta.url))} inventory|run|query|review|gate [--option value]. See scripts/course-rag/README.md.`)
}

main().catch((error) => { console.error(error.message); process.exitCode = 1 })
