import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = 'C:/My Web Sites/Anima/html.agratri.com/marrky'
const outputRoot = path.join(projectRoot, 'src/content/generated')

const pages = {
  home: 'index-2.html',
  homeDark: 'index-dark.html',
  homeSeo: 'index-3.html',
  about: 'about-us.html',
  team: 'team.html',
  pricing: 'pricing.html',
  services: 'services.html',
  serviceDetails: 'services-details.html',
  caseStudies: 'case-study.html',
  caseStudyDetails: 'case-study-details.html',
  blog: 'blog.html',
  blogDetails: 'blog-details.html',
  contact: 'contact-us.html',
  notFound: '404.html',
}

const legacyRoutes = {
  'index.html': '/',
  'index-2.html': '/',
  'index-dark.html': '/home-dark',
  'index-3.html': '/home-seo',
  'about-us.html': '/about',
  'team.html': '/team',
  'pricing.html': '/pricing',
  'services.html': '/services',
  'services-details.html': '/services/seo-organic-growth',
  'case-study.html': '/case-studies',
  'case-study-details.html': '/case-studies/fundwise',
  'blog.html': '/blog',
  'blog-details.html': '/blog/the-state-of-search-in-2026',
  'contact-us.html': '/contact',
  '404.html': '/404',
}

function extract(raw, startMarker, endMarkers) {
  const start = raw.indexOf(startMarker)
  if (start < 0) throw new Error(`Missing marker: ${startMarker}`)
  const contentStart = start + startMarker.length
  const end = endMarkers
    .map((marker) => raw.indexOf(marker, contentStart))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0]
  if (end === undefined) throw new Error(`Missing end marker after ${startMarker}`)
  return raw.slice(contentStart, end)
}

function cleanMarkup(markup) {
  let cleaned = markup
    .replace(/<!--[^]*?-->/g, '')
    .replace(/\sselected(?:="selected")?/gi, '')
    .replace(/\sdata-cf(?:async|email|beacon)=(?:"[^"]*"|'[^']*')/gi, '')
    .replace(/<span class="__cf_email__"[^>]*>[^<]*<\/span>/gi, 'hello@marrky.com')
    .replace(/https:\/\/html\.agratri\.com\/cdn-cgi\/l\/email-protection#[^"']+/gi, 'mailto:hello@marrky.com')
    .replace(/(?<=\b(?:src|href)=")assets\//gi, '/assets/')

  for (const [file, route] of Object.entries(legacyRoutes)) {
    cleaned = cleaned.replace(new RegExp(`href="${file.replace('.', '\\.')}(#[^"]*)?"`, 'gi'), (_, hash = '') => `href="${route}${hash}"`)
  }
  return cleaned.trim()
}

fs.mkdirSync(outputRoot, { recursive: true })

const generated = []
for (const [name, filename] of Object.entries(pages)) {
  const raw = fs.readFileSync(path.join(sourceRoot, filename), 'utf8')
  const title = raw.match(/<title>(.*?)<\/title>/i)?.[1] ?? 'Marrky'
  const description = raw.match(/<meta name="description" content="([^"]*)"/i)?.[1] ?? ''
  const bodyClass = raw.match(/<body class="([^"]*)"/i)?.[1] ?? ''
  const wrapperClass = raw.match(/<body[^>]*>\s*<div class="([^"]*-wrapper[^"]*)"/i)?.[1] ?? ''
  const body = cleanMarkup(extract(raw, '<!-- header-end -->', ['<!-- footer-start -->', '<!-- offcanvas-start -->']))
  const moduleText = `// Generated from ${filename}. Do not edit manually.\nexport const page = ${JSON.stringify({ title, description, bodyClass, wrapperClass, body }, null, 2)}\n`
  fs.writeFileSync(path.join(outputRoot, `${name}.js`), moduleText)
  generated.push(`${name}.js`)
}

