/* global URL */
import { createHash } from 'node:crypto'
import { JSDOM } from 'jsdom'
import {
  SCHEMA_VERSION, REQUIRED_SECTIONS, stableStringify, contentPayload, evidencePayload,
  evaluateCandidate, applyReview, projectSections,
} from './contract.mjs'

export const EXTRACTOR_VERSION = 'course-rag-1.0.0'
export const ALLOWED_HOSTS = ['msbm.org.uk', 'www.msbm.org.uk', 'globalschoolofskills.com', 'www.globalschoolofskills.com']
export const SELECTORS = {
  identity: ['h1'],
  programmeDetails: ['#details', '[data-course-section="programmeDetails"]'],
  courseDetails: ['#course-details', '[data-course-section="courseDetails"]'],
  // Source pages use both ordered and unordered lists for outcomes, and some
  // publish the outcome list directly inside the Course Details panel.
  learningOutcomes: ['#learning-outcomes', '[data-course-section="learningOutcomes"]', '#course-details ul', '#course-details ol', '#details ul', '#details ol', '#details p'],
  accreditation: ['#accreditation', '[data-course-section="accreditation"]'],
  modules: ['#modules', '[data-course-section="modules"]'],
  universityProgression: ['#university', '[data-course-section="universityProgression"]', '[href="#university"]', '[data-bs-target="#university"]'],
  entryRequirements: ['#entry', '[data-course-section="entryRequirements"]'],
  workshops: ['#workshop', '[data-course-section="workshops"]'],
  visa: ['#visa', '[data-course-section="visa"]'],
  tuition: ['#tuition-class', '#tuition', '[data-course-section="tuition"]'],
  about: ['#about-msbm-class', '#about', '[data-course-section="about"]'],
  library: ['#library-tab', '#library-class', '#library', '[data-course-section="library"]'],
  gettingStarted: ['#get-started', '#getting-started', '[data-course-section="gettingStarted"]'],
  certificate: ['#certificate-sect-tab', '#certificate-sect-class', '#certificate', '[data-course-section="certificate"]'],
  testimonials: ['#testimonial', '.review-section', '.msbm-review-container', '[data-course-section="testimonials"]'],
}

export function sha256(value) {
  return createHash('sha256').update(typeof value === 'string' ? value : stableStringify(value)).digest('hex')
}

export function normalizeText(value = '') {
  return String(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

export function normalizeSourceUrl(input) {
  const url = new URL(input)
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !ALLOWED_HOSTS.includes(url.hostname)) throw new Error('Source URL must use an approved public HTTPS course host.')
  if (!/^\/(?:[a-z0-9-]+\/)?programme\/[a-z0-9-]+\/?$/.test(url.pathname)) throw new Error('Only public programme URLs can be retrieved.')
  url.search = ''
  url.hash = ''
  url.pathname = url.pathname.replace(/\/$/, '')
  return url.href
}

export function scopeForUrl(url) {
  const segments = new URL(url).pathname.split('/').filter(Boolean)
  return segments[0] === 'programme' ? 'global' : segments[0]
}

function selectorFor(element) {
  if (element.id) return `[id=${JSON.stringify(element.id)}]`
  const path = []
  for (let node = element; node?.parentElement && path.length < 7; node = node.parentElement) {
    const index = [...node.parentElement.children].indexOf(node) + 1
    path.unshift(`${node.tagName.toLowerCase()}:nth-child(${index})`)
    if (node.parentElement.id) { path.unshift(`[id=${JSON.stringify(node.parentElement.id)}]`); break }
  }
  return path.join(' > ')
}

function safeMediaUrl(input, base) {
  try {
    const url = new URL(input, base)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
    url.search = ''
    url.hash = ''
    return url.href
  } catch { return null }
}

function extractBlocks(root, sourceUrl) {
  const blocks = []
  const seen = new Set()
  const add = (value) => {
    const key = stableStringify(value)
    if (!seen.has(key)) { seen.add(key); blocks.push(value) }
  }
  for (const node of root.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,table,blockquote,img,iframe,video,source')) {
    if (node.closest('script,style,noscript,form,nav,footer,header')) continue
    const type = node.tagName.toLowerCase()
    if (['img', 'iframe', 'video', 'source'].includes(type)) {
      const src = safeMediaUrl(node.getAttribute('src') || node.getAttribute('data-src') || '', sourceUrl)
      if (src) add({ type: type === 'img' ? 'image' : 'embed', src, text: normalizeText(node.getAttribute('alt') || node.getAttribute('title') || '') })
      continue
    }
    if (node.closest('table') && type !== 'table') continue
    if (node.closest('li') && type !== 'li') continue
    if (type === 'li' && node.querySelector('li')) continue
    if (node.closest('blockquote') && type !== 'blockquote') continue
    const text = normalizeText(node.textContent)
    if (!text || /^(loading\.\.\.|enrol now|request(?: a| for)? follow.?up|learn more)$/i.test(text)) continue
    if (type === 'table') {
      add({ type, text, rows: [...node.querySelectorAll('tr')].map((row) => [...row.querySelectorAll('th,td')].map((cell) => normalizeText(cell.textContent))) })
    } else add({ type, text })
  }
  // Plain text in wrapper divs is often used for certificate, visa and progression bodies.
  const represented = blocks.filter((block) => !['image', 'embed'].includes(block.type)).map((block) => block.text).join(' ')
  const text = normalizeText(root.textContent)
  if (text && (!blocks.length || text.length > represented.length + 40)) add({ type: 'sectionText', text })
  if (!blocks.length && text) add({ type: 'p', text })
  return blocks
}

function findRoots(document, sectionId) {
  for (const selector of SELECTORS[sectionId]) {
    let nodes = [...document.querySelectorAll(selector)]
    if (sectionId === 'learningOutcomes' && (selector.startsWith('#course-details ') || selector.startsWith('#details '))) {
      const containerId = selector.startsWith('#course-details ') ? '#course-details' : '#details'
      const detailsText = normalizeText(document.querySelector(containerId)?.textContent)
      const outcomeCue = /(?:upon (?:the )?(?:successful )?complet(?:ing|ion)|after (?:the )?(?:successful )?complet(?:ing|ion)|learning outcomes?|students (?:should|will) be able|learners (?:should|will) be able|graduates (?:should|will) be able|will allow students to)/i
      const cueMatch = outcomeCue.exec(detailsText)
      const explicitlyLabelsOutcomes = Boolean(cueMatch)
      if (!explicitlyLabelsOutcomes) nodes = []
      else if (selector.endsWith(' p')) nodes = nodes.filter((node) => outcomeCue.test(normalizeText(node.textContent)))
      else nodes = nodes.filter((node) => detailsText.indexOf(normalizeText(node.textContent)) > cueMatch.index)
    }
    if (nodes.some((node) => normalizeText(node.textContent) || node.querySelector('img,iframe'))) return { nodes, selector }
  }
  if (sectionId === 'testimonials') {
    const cards = [...document.querySelectorAll('.msbm-review-card')]
    if (cards.length) return { nodes: cards, selector: '.msbm-review-card' }
  }
  return { nodes: [], selector: SELECTORS[sectionId].join(', ') }
}

function extractFacts(document) {
  const facts = []
  const labels = { duration: 'duration', pedagogy: 'mode', payments: 'paymentMonths', 'total tuition': 'fee', 'administrative fees': 'administrativeFee' }
  for (const heading of document.querySelectorAll('h6')) {
    const field = labels[normalizeText(heading.textContent).toLowerCase()]
    const value = normalizeText(heading.parentElement.querySelector('h4')?.textContent)
    if (field && value && !facts.some((fact) => fact.field === field)) facts.push({ type: 'fact', field, value, text: normalizeText(heading.parentElement.textContent) })
  }
  const partner = [...document.querySelectorAll('h5')].find((node) => /^in partnership with /i.test(normalizeText(node.textContent)))
  if (partner) facts.push({ type: 'fact', field: 'university', value: normalizeText(partner.textContent).replace(/^in partnership with /i, ''), text: normalizeText(partner.textContent) })
  const monthly = [...document.querySelectorAll('h3')].find((node) => /(?:\/month|per month)/i.test(node.textContent))
  if (monthly) facts.push({ type: 'fact', field: 'monthly', value: normalizeText(monthly.textContent), text: normalizeText(monthly.textContent) })
  return facts
}

function extractModules(roots) {
  const modules = []
  for (const root of roots) for (const card of root.querySelectorAll('.module-content-accordion-card, [data-module]')) {
    const title = normalizeText(card.querySelector('.accordion-module-title,[data-module-title],summary')?.textContent)
    if (!title) continue
    const explicitSummary = card.querySelector('.module-description,[data-module-description]')
    const summary = explicitSummary ? normalizeText(explicitSummary.textContent) : [...card.querySelectorAll('.card-body p')].filter((node) => !node.closest('li,.list-group-item,[data-lesson]')).map((node) => normalizeText(node.textContent)).filter(Boolean).filter((text, index, all) => all.indexOf(text) === index).join('\n\n')
    const lessons = [...card.querySelectorAll('.list-group-item,[data-lesson]')].map((item) => ({
      title: normalizeText(item.querySelector('h5,[data-lesson-title]')?.textContent || item.textContent),
      description: normalizeText(item.querySelector('p')?.textContent),
      type: item.querySelector('.fa-download') ? 'Download' : item.querySelector('.fa-play') ? 'Video' : item.querySelector('.fa-cubes') || /quiz/i.test(item.textContent) ? 'Quiz' : 'Lecture',
    })).filter((lesson) => lesson.title)
    const counts = normalizeText(card.querySelector('.card-header,summary')?.textContent)
    modules.push({ title, summary, lectures: Number(counts.match(/(\d+)\s*Lectures?/i)?.[1] || 0), quizzes: Number(counts.match(/(\d+)\s*Quiz/i)?.[1] || 0), lessons })
  }
  return modules
}

function chunksFor(snapshot, sectionId, blocks, selector) {
  const groups = []
  let pending = []
  let size = 0
  for (const block of blocks) {
    const length = (block.text || block.src || '').length
    if (pending.length && size + length > 2500) { groups.push(pending); pending = []; size = 0 }
    pending.push(block)
    size += length
  }
  if (pending.length) groups.push(pending)
  return groups.map((items, ordinal) => {
    const text = items.map((item) => item.text || item.src).join('\n')
    return {
      id: `chunk-${sha256({ snapshot: snapshot.id, sectionId, ordinal, items }).slice(0, 24)}`,
      snapshotId: snapshot.id, courseSlug: snapshot.courseSlug, sectionId, ordinal, selector,
      heading: sectionId, text, items, contentHash: sha256(items),
      kind: ['about', 'library', 'gettingStarted', 'certificate'].includes(sectionId) ? 'shared' : sectionId === 'testimonials' ? 'testimonial' : 'programme',
      scope: snapshot.scope,
    }
  })
}

export function extractSnapshot({ html, url, courseSlug, status = 200, retrievedAt = new Date().toISOString(), finalUrl = url, actions = [], captureMethod = 'snapshot' }) {
  const sourceUrl = normalizeSourceUrl(url)
  if (normalizeSourceUrl(finalUrl) !== sourceUrl) throw new Error('Redirected source changed course or country scope.')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(courseSlug || '')) throw new Error('A valid courseSlug is required.')
  const dom = new JSDOM(html, { url: sourceUrl })
  const document = dom.window.document
  const title = normalizeText(document.title)
  const bodyText = normalizeText(document.body?.textContent)
  const blocked = [401, 403, 429].includes(status) || /just a moment|access denied|verify you are human|captcha challenge/i.test(title)
  document.querySelectorAll('script,style,noscript,form,input,textarea,select,nav,footer,header').forEach((node) => node.remove())
  for (const node of document.querySelectorAll('*')) {
    for (const attribute of [...node.attributes]) {
      if (/^on/i.test(attribute.name) || attribute.name === 'srcdoc' || /^(?:javascript|data):/i.test(attribute.value)) node.removeAttribute(attribute.name)
    }
    if (node.tagName === 'IFRAME') node.setAttribute('sandbox', '')
  }
  const sanitizedHtml = document.documentElement.outerHTML
  const contentHash = sha256(sanitizedHtml)
  const snapshot = {
    id: `snapshot-${contentHash}`, courseSlug, url: sourceUrl, finalUrl: sourceUrl,
    retrievedAt, status, title, scope: scopeForUrl(sourceUrl), contentHash,
    extractorVersion: EXTRACTOR_VERSION, actions, captureMethod, blocked,
    truncated: false, textCharacters: bodyText.length,
  }
  const sections = {}
  const evidence = []
  const facts = extractFacts(document)
  for (const sectionId of REQUIRED_SECTIONS) {
    const { nodes, selector } = findRoots(document, sectionId)
    const blocks = []
    const seen = new Set()
    for (const node of nodes) {
      const extracted = sectionId === 'identity'
        ? [{ type: 'h1', text: normalizeText(node.textContent) }].filter((block) => block.text)
        : extractBlocks(node, sourceUrl)
      for (const block of extracted) {
        const key = stableStringify(block)
        if (!seen.has(key)) { blocks.push(block); seen.add(key) }
      }
    }
    const modules = sectionId === 'modules' ? extractModules(nodes) : null
    if (sectionId === 'identity') blocks.push(...facts.filter((fact) => ['duration', 'mode', 'university'].includes(fact.field)))
    if (sectionId === 'tuition') blocks.push(...facts.filter((fact) => ['fee', 'monthly', 'paymentMonths', 'administrativeFee'].includes(fact.field)))
    if (modules) for (const module of modules) blocks.push({ type: 'module', text: [module.title, module.summary, ...module.lessons.map((lesson) => `${lesson.title} ${lesson.description}`)].filter(Boolean).join('\n'), module })
    const controlOnlyProgression = sectionId === 'universityProgression' && ['[href="#university"]', '[data-bs-target="#university"]'].includes(selector)
    const substantive = controlOnlyProgression ? false : sectionId === 'identity' ? blocks.some((block) => block.type === 'h1') : blocks.some((block) => !/^h[1-6]$/.test(block.type))
    const retainedBlocks = substantive ? blocks : []
    const chunks = chunksFor(snapshot, sectionId, retainedBlocks, nodes[0] ? selectorFor(nodes[0]) : selector)
    evidence.push(...chunks)
    sections[sectionId] = {
      status: blocked ? 'blocked' : substantive ? 'observed' : nodes.length ? 'source_absent' : 'missing',
      value: { blocks: retainedBlocks, ...(modules ? { modules } : {}) },
      evidenceIds: chunks.map((chunk) => chunk.id), sourceItems: retainedBlocks.length,
      totalExtractedItems: retainedBlocks.length, omissions: [], checkedSelectors: SELECTORS[sectionId],
      ...(substantive ? {} : { reason: nodes.length ? 'The inspected source section contains only a heading and no published details.' : 'Expected section was not located in this capture; independent source inspection is required.' }),
    }
  }
  dom.window.close()
  return { snapshot, sections, evidence, sanitizedHtml }
}

export function assembleCandidate(capture, { builderRunId, baseRecord = {} } = {}) {
  if (!builderRunId) throw new Error('builderRunId is required for independent review.')
  const { snapshot, sections, evidence } = capture
  const record = {
    slug: snapshot.courseSlug, sourceUrl: snapshot.url, ...projectSections(sections),
    detailSections: Object.fromEntries(REQUIRED_SECTIONS.map((id) => [id, sections[id].value])),
  }
  // Existing editorial styling and commercial fields remain separate from retrieved evidence.
  for (const key of ['image', 'universitySlug', 'categorySlug']) {
    if (baseRecord[key] !== undefined) record[key] = baseRecord[key]
  }
  const candidate = {
    schemaVersion: SCHEMA_VERSION, candidateId: `candidate-${snapshot.courseSlug}-${snapshot.contentHash.slice(0, 12)}`,
    courseSlug: snapshot.courseSlug, slug: snapshot.courseSlug, sourceUrl: snapshot.url, scope: snapshot.scope,
    record, sections, sourceSnapshotIds: [snapshot.id], snapshots: [snapshot], evidence,
    conflicts: [], unresolvedConflicts: [],
    review: { state: 'draft', builderRunId, verifierRunId: null, rounds: 0, decisions: [] },
  }
  return sealCandidate(candidate)
}

export function sealCandidate(candidate) {
  candidate.contentRevision = sha256(contentPayload(candidate))
  candidate.evidenceDigest = sha256(evidencePayload(candidate))
  candidate.coverage = evaluateCandidate(candidate)
  candidate.review.state = candidate.coverage.state
  return candidate
}

export function assertIntegrity(candidate) {
  if (sha256(contentPayload(candidate)) !== candidate.contentRevision || sha256(evidencePayload(candidate)) !== candidate.evidenceDigest) throw new Error('Candidate content or evidence was changed after sealing.')
  for (const chunk of candidate.evidence || []) if (sha256(chunk.items) !== chunk.contentHash) throw new Error(`Evidence chunk digest failed: ${chunk.id}`)
  return true
}

export function reviewCandidate(candidate, decision) {
  assertIntegrity(candidate)
  return applyReview(candidate, decision)
}

export function retrieve(candidate, { courseSlug, sectionId, scope = 'global', query = '', limit = 8 }) {
  assertIntegrity(candidate)
  if (!courseSlug || !REQUIRED_SECTIONS.includes(sectionId)) throw new Error('Retrieval requires exact course and section scope.')
  if (courseSlug !== candidate.courseSlug || scope !== candidate.scope) return []
  const terms = [...new Set(normalizeText(query).toLowerCase().match(/[a-z0-9]{2,}/g) || [])]
  const chunks = candidate.evidence.filter((chunk) => chunk.courseSlug === courseSlug && chunk.sectionId === sectionId && chunk.scope === scope)
  return chunks.map((chunk) => {
    const lower = chunk.text.toLowerCase()
    const score = terms.reduce((total, term) => total + (lower.includes(term) ? 1 : 0), 0)
    return { ...chunk, score, citation: `${candidate.sourceUrl}#${chunk.selector}` }
  }).sort((a, b) => b.score - a.score || a.ordinal - b.ordinal).slice(0, Math.max(1, Math.min(Number(limit) || 8, 100)))
}
