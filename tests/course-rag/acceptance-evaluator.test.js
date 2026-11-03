import { describe, it, expect } from 'vitest'
import { classifyResource, evaluateRenderedRecord, genericContent, summarize } from '../../scripts/course-rag-verify/evaluator.mjs'
import { REQUIRED_SECTIONS } from '../../src/data/course-rag/contract.js'

const course = { slug: 'example', title: 'Example Course', modules: [{ title: 'Module', summary: 'A complete module description.', lessons: [{ title: 'Lesson', description: 'A complete lesson description.' }] }], ragProvenance: { contentRevision: 'revision', evidenceDigest: 'digest', scope: 'global' } }
const evidence = { integrity: true, coverage: { complete: true }, revision: 'revision', digest: 'digest', sections: {} }
const observed = () => ({ title: 'Example Course', pathname: '/programmes/example', sections: Object.fromEntries(REQUIRED_SECTIONS.map(id => [id, { exists: true, text: 'Substantive observed course content for this section.' }])), modules: [{ title: 'Module', text: 'A complete module description.', lessons: [{ title: 'Lesson', text: 'A complete lesson description.' }] }], desktop: { overflow: false }, mobile: { overflow: false }, anchors: [{ targetExists: true, hashMatches: true }], accordionCycle: true, checkout: { correctRoute: true, courseVisible: true } })

describe('course acceptance evaluator', () => {
  it('accepts a complete independently verified matching publication', () => {
    expect(evaluateRenderedRecord(course, observed(), evidence).complete).toBe(true)
  })
  it('rejects a populated page with no independently verified publication', () => {
    expect(evaluateRenderedRecord(course, observed()).defects.some(item => item.code === 'unverified-publication')).toBe(true)
  })
  it('rejects a missing lesson description even when all section headings exist', () => {
    const input = observed(); input.modules[0].lessons[0].text = 'Lesson'
    expect(evaluateRenderedRecord(course, input, evidence).defects.find(item => item.code === 'curriculum-not-rendered').detail).toContain('module-1-lesson-1-description')
  })
  it('rejects generated counts as course details and detects route identity drift', () => {
    const input = observed(); input.sections.courseDetails.text = '9 source-listed curriculum sections and 59 lesson or resource entries are included below.'; input.pathname = '/programmes/wrong'
    const result = evaluateRenderedRecord(course, input, evidence)
    expect(result.missingSections).toContain('courseDetails')
    expect(result.defects.some(item => item.code === 'wrong-course-identity')).toBe(true)
    expect(genericContent('Official information pending source verification')).toBe(true)
  })
  it('never downgrades live or unrelated API errors to local PHP warnings', () => {
    const resource = { url: 'http://127.0.0.1:4173/api/courses/example', status: 404 }
    expect(classifyResource(resource, { baseUrl: 'http://127.0.0.1:4173', phpPreview: true })).toBe('environment-warning')
    expect(classifyResource(resource, { baseUrl: 'http://127.0.0.1:4173' })).toBe('error')
    expect(classifyResource({ ...resource, url: 'https://gss.geic.in/api/courses/example' }, { baseUrl: 'https://gss.geic.in', phpPreview: true })).toBe('error')
    expect(classifyResource({ ...resource, url: 'http://127.0.0.1:4173/assets/missing.jpg' }, { baseUrl: 'http://127.0.0.1:4173', phpPreview: true })).toBe('error')
  })
  it('requires a complete inventory and rejects country/revision drift', () => {
    expect(summarize([evaluateRenderedRecord(course, observed(), evidence)], 82).passed).toBe(false)
    expect(evaluateRenderedRecord(course, observed(), { ...evidence, scope: 'sierra-leone' }).complete).toBe(false)
    expect(evaluateRenderedRecord(course, observed(), { ...evidence, revision: 'stale' }).complete).toBe(false)
  })
  it('allows the explicitly requested brand substitution while checking source facts', () => {
    const input = observed(); input.sections.library.text = 'GSS offers access to the learning resource collection.'
    const source = { ...evidence, sections: { library: { value: { blocks: [{ type: 'p', text: 'MSBM offers access to the learning resource collection.' }] } } } }
    expect(evaluateRenderedRecord(course, input, source).complete).toBe(true)
    input.sections.library.text = 'GSS offers something else entirely.'
    expect(evaluateRenderedRecord(course, input, source).defects.some(item => item.code === 'source-blocks-not-rendered')).toBe(true)
  })
  it('rejects a missing administrative fee even when a different tuition amount is visible', () => {
    const source = { ...evidence, sections: { tuition: { value: { blocks: [{ type: 'fact', field: 'administrativeFee', value: '£ 2,000', text: 'Administrative fee £ 2,000' }] } } } }
    const input = observed(); input.sections.tuition.text = 'The total tuition for this programme is £ 3,600.'
    expect(evaluateRenderedRecord(course, input, source).defects.find(item => item.code === 'source-facts-not-rendered').detail.fields).toEqual(['administrativeFee'])
  })
})
