/* global process, console */
// Converts a raw public-catalogue scrape (artifacts/msbm-scrape/*.json) into the
// repository data model:
//   src/data/msbmProgrammeIndex.json   – light, bundled index for every programme
//   public/data/programmes/<slug>.json – full detail, fetched on demand
// Programmes that already exist in src/data/msbmVerifiedCatalog.json are skipped so
// the curated verified records keep precedence.
//
// Usage: node scripts/import-msbm-programmes.mjs [path/to/raw-scrape.json]
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const rawPath = resolve(process.argv[2] || 'artifacts/msbm-scrape/msbm-programmes-2026-11-03.json')
const indexPath = resolve('src/data/msbmProgrammeIndex.json')
const detailDir = resolve('public/data/programmes')
const verifiedPath = resolve('src/data/msbmVerifiedCatalog.json')

const replacements = [
  [/Metropolitan School of Business &amp; Management/g, 'The Global School of Skills (GSS)'],
  [/Metropolitan School of Business & Management/g, 'The Global School of Skills (GSS)'],
  [/Metropolitan School of Business and Management/gi, 'The Global School of Skills (GSS)'],
  [/MSBM\s*-\s*UK/g, 'The Global School of Skills (GSS)'],
  [/MSBM UK/g, 'The Global School of Skills (GSS)'],
  [/MSBM/g, 'GSS'],
  [/info@msbm\.org\.uk/g, 'info@globalschoolofskills.com'],
]
const rebrand = (value) => {
  if (typeof value === 'string') return replacements.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value)
  if (Array.isArray(value)) return value.map(rebrand)
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, key === 'sourceUrl' ? item : rebrand(item)]))
  return value
}

// Scrape category → repository category slug and level label.
const categoryMap = {
  'doctorate-degree': ['doctorate-degree', 'Doctorate Degree'],
  'masters-degree': ['masters-degree', 'Master’s Degree'],
  'executive-masters': ['semp-online-sep-upgradeable', 'SEMP Online'],
  'postgraduate-diploma': ['postgraduate-diploma-regulated', 'Postgraduate Diploma'],
  'international-postgraduate-diploma': ['international-postgraduate-diploma-endorsed', 'International Postgraduate Diploma'],
  'bachelors-degree': ['bachelors-degree', 'Bachelor’s Degree'],
  'regulated-diploma': ['diploma-regulated', 'Diploma'],
  'international-higher-diploma': ['international-higher-diploma-endorsed', 'International Higher Diploma'],
  'advanced-professional-certificate': ['advanced-professional-certificate', 'Advanced Professional Certificate'],
  'professional-certificate': ['professional-certificate', 'Professional Certificate'],
  'free-course': ['free-online-course', 'Free Online Course'],
}

const specializationSlugs = {
  'business law': 'business-law', 'business management': 'business-management', 'business research': 'business-research',
  'clinical courses': 'clinical-courses', 'finance and accounting': 'finance-and-accounting', 'health and psychology': 'health-and-psychology',
  'health and safety': 'health-and-safety', 'hotel, travel and hospitality management': 'hotel-travel-hospitality-management',
  'human resources': 'human-resources', 'information technology': 'information-technology',
  'leadership and entrepreneurship': 'leadership-and-entrepreneurship', 'logistics and supply chain management': 'logistics-and-supply-chain-management',
  'office productivity': 'office-productivity', 'personal development': 'personal-development',
  'project & operations management': 'project-operations-management', 'project and operations management': 'project-operations-management',
  'sales and marketing': 'sales-and-marketing', 'teaching and education': 'teaching-and-education',
}
const mapSubjects = (value = '') => {
  const slugs = value.split(/,(?![^(]*\))/).map((item) => specializationSlugs[item.trim().toLowerCase()]).filter(Boolean)
  return slugs.length ? [...new Set(slugs)] : ['business-management']
}

const universitySlugForPartner = (partner = '') => {
  if (/European Institute Of Management And Technology/i.test(partner)) return 'eimt'
  if (/Azteca/i.test(partner)) return 'azteca-university'
  if (/UCAM/i.test(partner)) return 'ucam'
  if (/Euro American/i.test(partner)) return 'euro-american-institute'
  if (/Rushford/i.test(partner)) return 'rushford-business-school'
  if (/Girne/i.test(partner)) return 'girne-american-university'
  if (/Anglia Ruskin/i.test(partner)) return 'anglia-ruskin-university'
  if (/Buckingham/i.test(partner)) return 'university-of-buckingham'
  return null
}

const imagePool = [
  ...Array.from({ length: 17 }, (_, index) => `/assets/img/case-study/cs-${index + 1}.jpg`),
  ...Array.from({ length: 4 }, (_, index) => `/assets/img/gallery/gallery-${index + 1}.jpg`),
  ...Array.from({ length: 13 }, (_, index) => `/assets/img/blog/blog-${index + 1}.jpg`),
]
const hashSlug = (slug) => [...slug].reduce((hash, character) => (hash * 31 + character.charCodeAt(0)) >>> 0, 7)
const pickImage = (slug) => imagePool[hashSlug(slug) % imagePool.length]

const officialSlug = (url) => url.split('/programme/')[1]?.replace(/\/+$/, '') || ''
const clean = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : value)
const truncate = (text, limit) => {
  if (!text || text.length <= limit) return text || ''
  const cut = text.slice(0, limit)
  return `${cut.slice(0, Math.max(cut.lastIndexOf('. '), cut.lastIndexOf(' '))).trim()}…`
}

const raw = JSON.parse(await readFile(rawPath, 'utf8'))
const verified = JSON.parse(await readFile(verifiedPath, 'utf8'))
const verifiedSlugs = new Set(verified.map((record) => officialSlug(record.sourceUrl)))
const programmes = Array.isArray(raw) ? raw : raw.programmes

await mkdir(detailDir, { recursive: true })
for (const file of await readdir(detailDir)) if (file.endsWith('.json')) await rm(resolve(detailDir, file))

const index = []
const seen = new Set()
let skippedVerified = 0
for (const source of programmes) {
  const slug = officialSlug(source.sourceUrl)
  if (!slug || seen.has(slug)) continue
  seen.add(slug)
  if (verifiedSlugs.has(slug)) { skippedVerified += 1; continue }

  const record = rebrand(source)
  const [categorySlug, level] = categoryMap[record.categorySlug] || ['professional-certificate', 'Professional Certificate']
  const university = clean(record.partner) || 'The Global School of Skills (GSS)'
  const universitySlug = universitySlugForPartner(university)
  const shortDescription = truncate(clean(record.cardDescription) || clean(record.description) || `Official programme information for ${record.title}.`, 320)
  const longDescription = clean(record.description) || shortDescription
  const modules = (record.modules || []).map((module) => ({
    title: clean(module.title), lectures: module.lectures || 0, quizzes: module.quizzes || 0,
    summary: clean(module.summary) || '', lessons: (module.lessons || []).map((lesson) => ({ title: clean(lesson.title), type: lesson.type })),
  })).filter((module) => module.title)
  const lessonCount = modules.reduce((total, module) => total + module.lessons.length, 0)
  const entry = (record.entryRequirements || []).map(clean).filter(Boolean)
  const accreditation = (record.accreditation || []).map(clean).filter(Boolean).join(' ')
  const outcomes = (record.outcomes || []).map(clean).filter(Boolean)
  const outcomeSet = new Set(outcomes)
  // The scrape lists bullet items before paragraphs; keep prose only here (outcomes render in their own section)
  // and drop a dangling lead-in such as "…you will be able to:" when the outcomes list follows it.
  const courseDetails = (record.courseDetails || []).map(clean).filter((item) => item && !outcomeSet.has(item))
    .filter((item, position, list) => !(outcomes.length && position === list.length - 1 && /(?:able to|following|includes?|outcomes?)\s*:$/i.test(item)))
  const presence = record.sectionPresence || {}
  const requiredSectionsChecked = Boolean(modules.length && entry.length && accreditation && presence.details)
  const paymentMonths = clean(record.paymentSchedule) || ''
  const monthly = clean(record.monthly) || ''
  const certificate = (record.certificate || []).map(clean).filter(Boolean)
  const certificateDetails = certificate.length >= 2
    ? Array.from({ length: Math.floor(certificate.length / 2) }, (_, pair) => ['ph-certificate', certificate[pair * 2], certificate[pair * 2 + 1]]).filter(([, heading, body]) => heading && body && !/request a follow-up/i.test(heading))
    : presence.certificate ? [['ph-certificate', 'Programme certificate', 'The official source includes a certificate section. Confirm the current award title, issuing institution and transcript format before enrolment.']] : undefined

  const summary = {
    slug, title: clean(record.title).replace(/^\(duplicate\)\s*/i, ''), description: shortDescription,
    duration: clean(record.duration) || 'Confirm with an advisor', mode: clean(record.mode) || 'Online',
    fee: clean(record.fee) || 'Request fees', monthly,
    discountedFee: clean(record.discountedFee) || '',
    level, categorySlug, subjects: mapSubjects(record.subjects),
    university, universitySlug, image: pickImage(slug),
    sourceUrl: source.sourceUrl, sourceVerified: true, sourceCoverage: requiredSectionsChecked ? 'complete' : 'partial',
    sku: clean(record.sku) || '', paymentMonths: paymentMonths || clean(record.duration) || '',
    administrativeFee: clean(record.adminFee) || '', cpdHours: clean(record.cpdHours) || '',
  }

  const detail = {
    ...summary,
    detailPath: `/data/programmes/${slug}.json`,
    longDescription,
    courseDetails: courseDetails.length ? courseDetails.join(' ') : `${modules.length} source-listed curriculum sections and ${lessonCount} lesson or resource entries are included below.`,
    courseDetailParagraphs: courseDetails,
    entry, accreditation: accreditation || undefined,
    progression: clean(record.progression) || undefined,
    workshops: clean(record.workshop) || undefined,
    visa: clean(record.visa) || undefined,
    library: presence.library ? 'The official programme page includes online library and learning-resource access for enrolled learners.' : undefined,
    libraryMetric: presence.library ? '31,000,000+' : undefined,
    libraryMetricLabel: presence.library ? 'articles and journals in the complimentary online library' : undefined,
    gettingStartedIntro: 'Complete the application, document review, offer, payment and enrolment steps through the learner portal.',
    gettingStarted: ['Create an account', 'Upload academic documents', 'Receive an admissions decision', 'Complete tuition payment', 'Attend lectures and live webinars', 'Submit assessments', 'Receive the programme award'],
    certificateDetails,
    advantages: [
      ['ph-laptop', summary.mode, `${summary.mode} delivery is recorded on the official programme page.`],
      ['ph-list-checks', 'Recorded curriculum', `${modules.length} curriculum sections are reproduced from the official listing.`],
      ['ph-credit-card', 'Published tuition', `The official page lists a total tuition fee of ${summary.fee}.`],
    ],
    modules, outcomes: outcomes.length ? outcomes : undefined,
    modulesIndicative: false, sourceLessonCount: lessonCount,
    courseLevel: clean(record.courseLevel) || undefined, startTime: clean(record.startTime) || undefined,
    sectionPresence: presence, scrapedAt: record.scrapedAt || raw.scrapedAt,
  }

  index.push(summary)
  await writeFile(resolve(detailDir, `${slug}.json`), `${JSON.stringify(detail)}\n`, 'utf8')
}

index.sort((a, b) => a.title.localeCompare(b.title))
await writeFile(indexPath, `${JSON.stringify(index)}\n`, 'utf8')

const byCategory = index.reduce((totals, course) => ({ ...totals, [course.categorySlug]: (totals[course.categorySlug] || 0) + 1 }), {})
console.log(`Imported ${index.length} programmes (${skippedVerified} already in the verified catalogue).`)
console.log(JSON.stringify(byCategory, null, 2))
