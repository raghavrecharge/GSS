import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'

const root = path.resolve(import.meta.dirname, '../..')
const candidatesDir = path.join(root, 'artifacts/course-rag/candidates')
const snapshotsDir = path.join(root, 'artifacts/course-rag/snapshots')
const outputFile = path.join(root, 'artifacts/course-rag/image-inventory.json')

const ignored = /(?:logo|favicon|flag|icon|badge|google-play|app-store|whatsapp|spinner|loader|avatar-default|pixel|analytics|cloudflare)/i
const contentCue = /(?:banner|hero|programme|program|course|degree|certificate|library|testimonial|student|about|partner|university|accredit)/i

function absoluteUrl(value, base) {
  if (!value || value.startsWith('data:') || value.startsWith('blob:')) return ''
  try { return new URL(value, base).href } catch { return '' }
}

function addAsset(map, url, meta) {
  if (!url || ignored.test(url) || ignored.test(meta.className) || ignored.test(meta.alt)) return
  const key = url.replace(/[?#].*$/, '')
  const existing = map.get(key) || { url, score: 0, occurrences: [] }
  existing.score = Math.max(existing.score, meta.score)
  existing.occurrences.push(meta)
  map.set(key, existing)
}

const candidates = fs.readdirSync(candidatesDir).filter((name) => name.endsWith('.json')).sort()
const inventory = []
for (const name of candidates) {
  const candidate = JSON.parse(fs.readFileSync(path.join(candidatesDir, name), 'utf8'))
  const snapshotId = candidate.sourceSnapshotIds?.[0]
  const snapshotFile = path.join(snapshotsDir, `${snapshotId}.html`)
  if (!snapshotId || !fs.existsSync(snapshotFile)) continue
  const dom = new JSDOM(fs.readFileSync(snapshotFile, 'utf8'), { url: candidate.sourceUrl })
  const { document } = dom.window
  const assets = new Map()
  const heroElement = document.querySelector('.main-landing-page')
  const hero = absoluteUrl(heroElement?.getAttribute('style')?.match(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/i)?.[1], candidate.sourceUrl)
  const partners = [...document.querySelectorAll('img.partner-logo-max-width')].map((image) => absoluteUrl(image.getAttribute('src'), candidate.sourceUrl)).filter(Boolean)
  const certificates = [...document.querySelectorAll('img.img-certify')].map((image) => absoluteUrl(image.getAttribute('src'), candidate.sourceUrl)).filter(Boolean)
  const testimonials = [...document.querySelectorAll('.msbm-review-info img[alt="review"], img[alt="review"]')].map((image) => absoluteUrl(image.getAttribute('src'), candidate.sourceUrl)).filter(Boolean)
  if (hero) addAsset(assets, hero, { kind: 'hero', className: 'main-landing-page', alt: candidate.record?.title || '', context: 'course hero', width: 0, height: 0, score: 100 })
  partners.forEach((url) => addAsset(assets, url, { kind: 'partner', className: 'partner-logo-max-width', alt: '', context: 'academic partner', width: 0, height: 0, score: 80 }))
  certificates.forEach((url) => addAsset(assets, url, { kind: 'certificate', className: 'img-certify', alt: '', context: 'certificate', width: 0, height: 0, score: 70 }))
  testimonials.forEach((url) => addAsset(assets, url, { kind: 'testimonial', className: 'msbm-review-info', alt: 'review', context: 'testimonial', width: 0, height: 0, score: 60 }))
  for (const image of document.querySelectorAll('img')) {
    const raw = image.getAttribute('data-src') || image.getAttribute('data-lazy-src') || image.getAttribute('src')
    const url = absoluteUrl(raw, candidate.sourceUrl)
    const className = image.className || ''
    const alt = image.getAttribute('alt') || ''
    const context = [image.closest('section,article,header,main,div')?.className || '', image.parentElement?.className || ''].join(' ')
    const width = Number(image.getAttribute('width') || 0)
    const height = Number(image.getAttribute('height') || 0)
    const score = (contentCue.test(`${url} ${className} ${alt} ${context}`) ? 10 : 0) + (width >= 600 ? 4 : 0) + (height >= 300 ? 4 : 0) + (/hero|banner/i.test(context) ? 6 : 0)
    addAsset(assets, url, { kind: 'img', className, alt, context, width, height, score })
  }
  for (const element of [...document.querySelectorAll('[style]')].filter((node) => node.getAttribute('style')?.includes('url('))) {
    const style = element.getAttribute('style') || ''
    for (const match of style.matchAll(/url\(["']?([^"')]+)["']?\)/gi)) {
      const url = absoluteUrl(match[1], candidate.sourceUrl)
      const className = element.className || ''
      const context = `${element.tagName} ${className}`
      const score = (contentCue.test(`${url} ${context}`) ? 10 : 0) + (/hero|banner/i.test(context) ? 6 : 0)
      addAsset(assets, url, { kind: 'background', className, alt: '', context, width: 0, height: 0, score })
    }
  }
  const ranked = [...assets.values()].sort((a, b) => b.score - a.score || b.occurrences.length - a.occurrences.length || a.url.localeCompare(b.url))
  inventory.push({ slug: candidate.slug, sourceUrl: candidate.sourceUrl, snapshotId, hero, partners: [...new Set(partners)], certificates: [...new Set(certificates)], testimonials: [...new Set(testimonials)], assets: ranked, preferred: ranked.filter((asset) => asset.score >= 10).slice(0, 8).map((asset) => asset.url) })
  dom.window.close()
}

fs.writeFileSync(outputFile, `${JSON.stringify({ generatedAt: new Date().toISOString(), courses: inventory }, null, 2)}\n`)
const unique = new Set(inventory.flatMap((item) => item.assets.map((asset) => asset.url.replace(/[?#].*$/, ''))))
console.log(JSON.stringify({ courses: inventory.length, uniqueAssets: unique.size, coursesWithPreferredAssets: inventory.filter((item) => item.preferred.length).length, outputFile }, null, 2))
