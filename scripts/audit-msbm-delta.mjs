import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const ALLOWED_HOST = 'msbm.org.uk'
const INDEX_URL = 'https://msbm.org.uk/programmes'
const MAX_BYTES = 8 * 1024 * 1024
const TIMEOUT_MS = 20_000
const outputPath = resolve('artifacts/migration/msbm-delta-report.json')

function assertAllowedUrl(value) {
  const url = new URL(value)
  if (url.protocol !== 'https:' || url.hostname !== ALLOWED_HOST) throw new Error(`Blocked URL: ${url.href}`)
  return url
}

async function fetchPublicHtml(value, redirectCount = 0) {
  const url = assertAllowedUrl(value)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(url, {
      headers: { 'user-agent': 'GSS-Migration-Audit/1.0 (+public catalogue review)' },
      redirect: 'manual',
      signal: controller.signal,
    })
    if (response.status >= 300 && response.status < 400) {
      if (redirectCount >= 2) throw new Error('Too many redirects')
      const location = response.headers.get('location')
      if (!location) throw new Error(`Redirect ${response.status} has no location`)
      return fetchPublicHtml(new URL(location, url).href, redirectCount + 1)
    }
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const declaredLength = Number(response.headers.get('content-length') || 0)
    if (declaredLength > MAX_BYTES) throw new Error(`Response exceeds ${MAX_BYTES} bytes`)
    const html = await response.text()
    if (Buffer.byteLength(html) > MAX_BYTES) throw new Error(`Response exceeds ${MAX_BYTES} bytes`)
    return { html, finalUrl: url.href, status: response.status }
  } finally {
    clearTimeout(timer)
  }
}

function normalizeProgrammeUrl(href, baseUrl) {
  try {
    const url = new URL(href, baseUrl)
    if (url.protocol !== 'https:' || url.hostname !== ALLOWED_HOST) return null
    if (!/\/(?:[^/]+\/)?programme\//i.test(url.pathname)) return null
    url.search = ''
    url.hash = ''
    return url.href.replace(/\/$/, '')
  } catch {
    return null
  }
}

function discoverProgrammeUrls(html, baseUrl) {
  const urls = new Set()
  for (const match of html.matchAll(/\bhref\s*=\s*["']([^"']+)["']/gi)) {
    const normalized = normalizeProgrammeUrl(match[1], baseUrl)
    if (normalized) urls.add(normalized)
  }
  return [...urls].sort()
}

const catalog = JSON.parse(await readFile(resolve('src/data/msbmVerifiedCatalog.json'), 'utf8'))
const knownUrls = [...new Set(catalog.map((course) => course.sourceUrl).filter(Boolean).map((url) => url.replace(/\/$/, '')))].sort()
const report = {
  generatedAt: new Date().toISOString(),
  policy: {
    source: 'public pages only',
    allowedHost: ALLOWED_HOST,
    autoPublish: false,
    note: 'This report is review-only. It never changes catalogue records.',
  },
  source: { indexUrl: INDEX_URL, knownProgrammeUrls: knownUrls.length },
  result: { status: 'unavailable', discoveredProgrammeUrls: 0, newUrls: [], missingFromIndex: [], unchangedUrls: [] },
}

try {
  const fetched = await fetchPublicHtml(INDEX_URL)
  const discovered = discoverProgrammeUrls(fetched.html, fetched.finalUrl)
  const known = new Set(knownUrls)
  const live = new Set(discovered)
  report.result = {
    status: 'completed',
    httpStatus: fetched.status,
    discoveredProgrammeUrls: discovered.length,
    newUrls: discovered.filter((url) => !known.has(url)),
    missingFromIndex: knownUrls.filter((url) => !live.has(url)),
    unchangedUrls: discovered.filter((url) => known.has(url)),
  }
} catch (error) {
  report.result.error = error instanceof Error ? error.message : String(error)
}

await mkdir(resolve('artifacts/migration'), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`)
console.log(`MSBM delta audit: ${report.result.status}`)
console.log(`Report: ${outputPath}`)
if (report.result.status !== 'completed') process.exitCode = 2
