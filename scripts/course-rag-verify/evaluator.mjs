/* global URL */
import { REQUIRED_SECTIONS } from '../../src/data/course-rag/contract.js'

export const normalize = value => String(value || '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
const comparable = value => normalize(value).replace(/Metropolitan School of Business\s*(?:&|and)\s*Management(?:\s+UK)?|The Global School of Skills\s*\(GSS\)|The Global School of Skills|\b(?:MSBM|GSS)\b/gi, 'SCHOOL').toLowerCase()
export const genericContent = value => /\d+ source-listed curriculum sections and \d+ lesson or resource entries|indicative (?:curriculum|themes)|pending source verification|information pending|have not yet been source-verified|not published/i.test(normalize(value))

export function classifyResource(resource, { baseUrl, phpPreview = false } = {}) {
  const target = new URL(baseUrl)
  let url
  try { url = new URL(resource.url, target) } catch { return 'error' }
  return phpPreview && ['127.0.0.1', 'localhost', '[::1]'].includes(target.hostname)
    && url.origin === target.origin && /^\/api\/courses(?:\/|$)/.test(url.pathname)
    && [404, 405, 501].includes(resource.status) ? 'environment-warning' : 'error'
}

export function evaluateRenderedRecord(course, observation, evidence = {}) {
  const defects = []
  const fail = (code, detail) => defects.push({ code, detail })
  const scope = course.ragProvenance?.scope || 'global'
  const approved = evidence.integrity === true && evidence.coverage?.complete === true
    && course.ragProvenance?.contentRevision === evidence.revision
    && course.ragProvenance?.evidenceDigest === evidence.digest
    && (evidence.scope || 'global') === scope
  const sections = Object.fromEntries(REQUIRED_SECTIONS.map(id => {
    const region = observation.sections?.[id]
    const absent = approved && evidence.sections?.[id]?.status === 'source_absent'
    const text = normalize(region?.text)
    return [id, { status: absent ? 'verified-source-absent' : !region?.exists ? 'missing' : genericContent(text) ? 'pending-or-generic' : text.length < 20 ? 'heading-only' : 'present', length: text.length }]
  }))
  const missing = REQUIRED_SECTIONS.filter(id => !['present', 'verified-source-absent'].includes(sections[id].status))
  if (missing.length) fail('missing-substantive-sections', missing)
  if (!approved) fail('unverified-publication', evidence.coverage?.errors || ['No independently approved exact-source publication.'])
  if (evidence.integrity) for (const id of REQUIRED_SECTIONS) {
    const regionText = comparable(observation.sections?.[id]?.text)
    const blocks = evidence.sections?.[id]?.value?.blocks || []
    const hasTypedContent = blocks.some(block => ['p', 'li', 'table', 'blockquote'].includes(block.type))
    const missingBlocks = blocks.filter(block => !['image', 'embed', 'module', 'fact'].includes(block.type) && !(block.type === 'sectionText' && hasTypedContent) && !/^h[1-6]$/.test(block.type) && comparable(block.text) && !regionText.includes(comparable(block.text)))
    if (missingBlocks.length) fail('source-blocks-not-rendered', { section: id, missing: missingBlocks.map(block => normalize(block.text).slice(0, 120)) })
    const missingFacts = blocks.filter(block => block.type === 'fact' && normalize(block.value) && !regionText.includes(comparable(block.value)))
    if (missingFacts.length) fail('source-facts-not-rendered', { section: id, fields: missingFacts.map(block => block.field) })
  }
  if (normalize(observation.title) !== normalize(course.title) || observation.pathname !== `/programmes/${course.slug}`) fail('wrong-course-identity', { expected: course.title, actual: observation.title, pathname: observation.pathname })
  const expected = (course.modules || []).map(module => Array.isArray(module) ? { title: module[0], summary: module[1], lessons: module[3] || [] } : module)
  const differences = []
  if (!course.modulesIndicative && expected.length !== observation.modules?.length) differences.push('module-count')
  if (!course.modulesIndicative) expected.forEach((module, i) => {
    const actual = observation.modules?.[i]
    if (!actual || normalize(actual.title) !== normalize(module.title)) differences.push(`module-${i + 1}-title`)
    if ((module.summary || module.description) && !normalize(actual?.text).includes(normalize(module.summary || module.description))) differences.push(`module-${i + 1}-description`)
    if ((module.lessons || []).length !== actual?.lessons?.length) differences.push(`module-${i + 1}-lesson-count`)
    ;(module.lessons || []).forEach((lesson, n) => {
      const value = typeof lesson === 'string' ? { title: lesson } : lesson
      const rendered = actual?.lessons?.[n]
      if (normalize(rendered?.title) !== normalize(value.title)) differences.push(`module-${i + 1}-lesson-${n + 1}-title`)
      if (value.description && !normalize(rendered?.text).includes(normalize(value.description))) differences.push(`module-${i + 1}-lesson-${n + 1}-description`)
    })
  })
  if (differences.length) fail('curriculum-not-rendered', differences)
  const sourceMissing = []
  if (evidence.integrity) (evidence.sections?.modules?.value?.modules || []).forEach((module, i) => {
    ;(module.lessons || []).forEach((lesson, n) => {
      if (lesson.description && !normalize(observation.modules?.[i]?.lessons?.[n]?.text).includes(normalize(lesson.description))) sourceMissing.push({ module: i + 1, lesson: n + 1, title: lesson.title })
    })
  })
  if (sourceMissing.length) fail('source-lesson-descriptions-not-rendered', sourceMissing)
  for (const viewport of ['desktop', 'mobile']) {
    if (!observation[viewport]) fail(`${viewport}-not-checked`, {})
    else {
      if (observation[viewport].overflow) fail(`${viewport}-horizontal-overflow`, observation[viewport])
      if (observation[viewport].brokenImages?.length) fail(`${viewport}-broken-images`, observation[viewport].brokenImages)
      if (observation[viewport].clippedControls?.length) fail(`${viewport}-clipped-controls`, observation[viewport].clippedControls)
    }
  }
  if (!observation.anchors?.length || observation.anchors.some(item => !item.targetExists || !item.hashMatches)) fail('broken-anchor', observation.anchors)
  if (expected.length && !course.modulesIndicative && observation.accordionCycle !== true) fail('accordion-cycle', {})
  if (!observation.checkout?.correctRoute || !observation.checkout?.courseVisible) fail('checkout-identity', observation.checkout)
  if (observation.pageErrors?.length) fail('browser-runtime-errors', observation.pageErrors)
  if (observation.resourceErrors?.length) fail('browser-resource-errors', observation.resourceErrors)
  if (observation.consoleErrors?.length) fail('browser-console-errors', observation.consoleErrors)
  if (observation.error) fail('audit-route-failed', observation.error)
  return { slug: course.slug, route: `/programmes/${course.slug}`, complete: defects.length === 0, evidenceApproved: approved, missingSections: missing, sections, defects, warnings: observation.warnings || [], observation }
}

export function summarize(results, inventoryCount) {
  const codes = [...new Set(results.flatMap(result => result.defects.map(defect => defect.code)))]
  return { inventory: inventoryCount, checked: results.length, complete: results.filter(result => result.complete).length,
    incomplete: results.filter(result => !result.complete).length,
    missingBySection: Object.fromEntries(REQUIRED_SECTIONS.map(id => [id, results.filter(result => result.missingSections.includes(id)).length])),
    defects: Object.fromEntries(codes.map(code => [code, results.filter(result => result.defects.some(defect => defect.code === code)).length])),
    warnings: results.filter(result => result.warnings.length).length,
    passed: results.length === inventoryCount && results.every(result => result.complete) }
}
