import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '../..')
const inventory = JSON.parse(await fs.readFile(path.join(root, 'artifacts/course-rag/image-inventory.json'), 'utf8'))
const candidatesDir = path.join(root, 'artifacts/course-rag/candidates')
const outputDir = path.join(root, 'public/assets/img/msbm-source')
const mappingFile = path.join(root, 'src/data/course-rag/sourceImages.json')
const courseMappingFile = path.join(root, 'src/data/course-rag/sourceCourseImages.json')
const allowedHosts = new Set(['msbm.org.uk', 'portal.msbm.org.uk'])

await fs.mkdir(outputDir, { recursive: true })

const candidateImageUrls = []
for (const name of (await fs.readdir(candidatesDir)).filter((value) => value.endsWith('.json'))) {
  const candidate = JSON.parse(await fs.readFile(path.join(candidatesDir, name), 'utf8'))
  for (const section of Object.values(candidate.sections || {})) {
    for (const block of section?.value?.blocks || []) if (block.type === 'image' && block.src) candidateImageUrls.push(block.src)
  }
}

const urls = [...new Set([...inventory.courses.flatMap((course) => course.assets.map((asset) => asset.url)), ...candidateImageUrls])]
  .filter((value) => {
    try { return allowedHosts.has(new URL(value).hostname) } catch { return false }
  })

const extensionFor = (url, contentType) => {
  const ext = path.extname(new URL(url).pathname).toLowerCase()
  if (/^\.(?:png|jpe?g|webp|gif|svg|jfif)$/.test(ext)) return ext === '.jpeg' ? '.jpg' : ext
  const known = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp', 'image/gif': '.gif', 'image/svg+xml': '.svg' }
  return known[contentType?.split(';')[0]?.toLowerCase()] || '.img'
}

const mapping = {}
const failures = []
let cursor = 0

async function worker() {
  while (cursor < urls.length) {
    const url = urls[cursor++]
    try {
      const response = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141 Safari/537.36', referer: 'https://msbm.org.uk/' } })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      const bytes = Buffer.from(await response.arrayBuffer())
      if (!bytes.length) throw new Error('empty response')
      const digest = crypto.createHash('sha256').update(url).digest('hex').slice(0, 16)
      const filename = `${digest}${extensionFor(url, response.headers.get('content-type'))}`
      await fs.writeFile(path.join(outputDir, filename), bytes)
      mapping[url] = `/assets/img/msbm-source/${filename}`
    } catch (error) {
      failures.push({ url, error: error.message })
    }
  }
}

await Promise.all(Array.from({ length: Math.min(4, urls.length) }, () => worker()))
await fs.writeFile(mappingFile, `${JSON.stringify(Object.fromEntries(Object.entries(mapping).sort()), null, 2)}\n`)
const courseMapping = Object.fromEntries(inventory.courses.map((course) => [course.slug, {
  hero: mapping[course.hero] || '',
  partners: (course.partners || []).map((url) => mapping[url]).filter(Boolean),
  certificates: (course.certificates || []).map((url) => mapping[url]).filter(Boolean),
  testimonials: (course.testimonials || []).map((url) => mapping[url]).filter(Boolean),
}]))
await fs.writeFile(courseMappingFile, `${JSON.stringify(courseMapping, null, 2)}\n`)
console.log(JSON.stringify({ requested: urls.length, downloaded: Object.keys(mapping).length, failed: failures.length, failures, mappingFile, courseMappingFile }, null, 2))
if (failures.length) process.exitCode = 1
