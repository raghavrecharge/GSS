/* global URL, process, console */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const execFileAsync = promisify(execFile)
const origin = 'https://msbm.org.uk'
const outputPath = new URL('../src/data/msbmContentPages.json', import.meta.url)
const allowedRoots = new Set([
  'about-msbm', 'business-solutions', 'campus-programmes', 'certificates', 'contact-us',
  'learning-with-msbm', 'schools-colleges-solution', 'subscriptions', 'terms', 'trainings',
  'become-institution', 'reviews', 'graduation-ceremony', 'meds', 'portal-features',
  'charity', 'faq', 'partners',
])
const exactPaths = new Set(['/'])
const queue = ['/']
const visited = new Set()
const pages = []

function normalizePath(value) {
  try {
    const url = new URL(value, origin)
    if (url.origin !== origin || url.search) return null
    const path = url.pathname.replace(/\/+$/, '') || '/'
    const root = path.split('/').filter(Boolean)[0]
    return exactPaths.has(path) || allowedRoots.has(root) ? path : null
  } catch {
    return null
  }
}

async function fetchHtml(path) {
  const { stdout } = await execFileAsync('curl.exe', ['-L', '--fail', '--silent', '--show-error', `${origin}${path}`], {
    encoding: 'utf8', maxBuffer: 20 * 1024 * 1024,
  })
  return stdout
}

function cleanText(value) {
  return value.replace(/\s+/g, ' ').trim()
}

function extractBlocks(document) {
  const root = document.querySelector('.terms-content')
    || document.querySelector('.about-msbm')
    || document.querySelector('.main-content')
    || document.querySelector('main')
  if (!root) return []
  const excluded = '.breadcrumb, .breadcrumbs, .special-offer, .course-card, .programme-card, footer, header, nav, form, script, style, noscript'
  root.querySelectorAll(excluded).forEach((node) => node.remove())
  const blocks = []
  for (const element of root.querySelectorAll('h1,h2,h3,h4,p,ul,ol,table,blockquote')) {
    if (element.closest('ul,ol,table') && !['UL', 'OL', 'TABLE'].includes(element.tagName)) continue
    const text = cleanText(element.textContent || '')
    if (!text || text === 'Loading...' || text.length < 2) continue
    if (/^(Special Offer|500\+ Trusted Partners|Download our App)$/i.test(text)) continue
    if (['UL', 'OL'].includes(element.tagName)) {
      const items = [...element.children].filter((item) => item.tagName === 'LI').map((item) => cleanText(item.textContent || '')).filter(Boolean)
      if (items.length) blocks.push({ type: element.tagName.toLowerCase(), items })
      continue
    }
    if (element.tagName === 'TABLE') {
      const rows = [...element.querySelectorAll('tr')].map((row) => [...row.querySelectorAll('th,td')].map((cell) => cleanText(cell.textContent || ''))).filter((row) => row.some(Boolean))
      if (rows.length) blocks.push({ type: 'table', rows })
      continue
    }
    blocks.push({ type: element.tagName.toLowerCase(), text })
  }
  return blocks.slice(0, 500)
}

while (queue.length) {
  const path = queue.shift()
  if (!path || visited.has(path) || visited.size >= 120) continue
  visited.add(path)
  try {
    const html = await fetchHtml(path)
    const document = new JSDOM(html, { url: `${origin}${path}` }).window.document
    for (const anchor of document.querySelectorAll('a[href]')) {
      const nextPath = normalizePath(anchor.getAttribute('href'))
      if (nextPath && !visited.has(nextPath) && !queue.includes(nextPath)) queue.push(nextPath)
    }
    if (path === '/') continue
    const blocks = extractBlocks(document)
    if (!blocks.length) continue
    const sectionHeading = blocks.find((block) => /^h[1-4]$/.test(block.type))?.text
    const isNestedPage = path.split('/').filter(Boolean).length > 1
    const sourceTitle = cleanText((isNestedPage && sectionHeading) || document.querySelector('h1')?.textContent || document.querySelector('h2')?.textContent || document.title.split('|')[0])
    pages.push({
      path,
      title: sourceTitle || path.split('/').pop().replaceAll('-', ' '),
      description: document.querySelector('meta[name="description"]')?.content?.trim() || '',
      sourceUrl: `${origin}${path}`,
      blocks,
    })
    process.stdout.write(`captured ${path} (${blocks.length} blocks)\n`)
  } catch (error) {
    process.stderr.write(`skipped ${path}: ${error.message}\n`)
  }
}

pages.sort((a, b) => a.path.localeCompare(b.path))
await writeFile(outputPath, `${JSON.stringify(pages, null, 2)}\n`)
console.log(JSON.stringify({ pages: pages.length, discovered: visited.size, output: outputPath.pathname }, null, 2))
