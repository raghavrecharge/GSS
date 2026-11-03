// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { REQUIRED_SECTIONS, evaluateCandidate, verifyCandidateIntegrity } from './contract.mjs'
import { extractSnapshot, assembleCandidate, assertIntegrity, reviewCandidate, retrieve } from './core.mjs'

const url = 'https://msbm.org.uk/programme/test-programme'
const fullHtml = `<h1>Test programme</h1>${REQUIRED_SECTIONS.filter((id) => id !== 'identity').map((id) => `<section data-course-section="${id}"><p>Published ${id} information.</p>${id === 'modules' ? '<article data-module><h3 data-module-title>Evidence and research</h3><p data-module-description>Evaluate reliable evidence.</p><div data-lesson><h5 data-lesson-title>Research methods</h5><p>Collect and analyse source material.</p></div></article>' : ''}</section>`).join('')}`

function candidate(html = fullHtml) {
  return assembleCandidate(extractSnapshot({ html, url, courseSlug: 'test-programme' }), { builderRunId: 'builder-one' })
}

describe('grounded course pipeline', () => {
  it('builds a cited complete section set but requires independent review before signoff', async () => {
    const result = candidate()
    expect(result.coverage.readyForReview).toBe(true)
    expect(result.coverage.complete).toBe(false)
    expect(await verifyCandidateIntegrity(result)).toBe(true)
    const reviewed = reviewCandidate(result, { actor: 'verifier-two', role: 'verifier', verdict: 'approve', candidateRevision: result.contentRevision, evidenceDigest: result.evidenceDigest })
    expect(reviewed.coverage.complete).toBe(true)
  })

  it('keeps missing source details and blocked source captures incomplete', () => {
    const partial = candidate('<h1>Test programme</h1><section id="details"><p>Summary only.</p></section>')
    expect(partial.coverage.missing).toContain('modules')
    expect(partial.coverage.complete).toBe(false)
    const blocked = assembleCandidate(extractSnapshot({ html: '<title>Just a moment</title>', url, courseSlug: 'test-programme', status: 403 }), { builderRunId: 'builder-one' })
    expect(blocked.coverage.errors.join(' ')).toContain('blocked')
  })

  it('rejects changes to rendered factual fields and to approved evidence', () => {
    const result = candidate()
    result.record.modules = []
    expect(evaluateCandidate(result).readyForReview).toBe(false)
    expect(() => assertIntegrity(result)).toThrow('changed after sealing')
  })

  it('returns only exact course, section and locale evidence', () => {
    const result = candidate()
    expect(retrieve(result, { courseSlug: 'test-programme', sectionId: 'modules', query: 'research' })[0].text).toContain('research')
    expect(retrieve(result, { courseSlug: 'another-programme', sectionId: 'modules', query: 'research' })).toEqual([])
  })

  it('preserves tables, images and module lesson descriptions in the evidence', () => {
    const result = candidate(fullHtml.replace('Published library information.', 'Published library information.<table><tr><td>Journals</td><td>31 million</td></tr></table><img src="/certificate.png" alt="Sample certificate">'))
    expect(result.sections.library.value.blocks.some((block) => block.type === 'table')).toBe(true)
    expect(result.sections.library.value.blocks.some((block) => block.type === 'image')).toBe(true)
    expect(result.record.modules[0].lessons[0].description).toContain('Collect and analyse')
  })

  it('rejects malformed imports without throwing from the completeness evaluator', () => {
    const result = candidate()
    result.evidence = [null]
    result.review.decisions = 'approve'
    expect(() => evaluateCandidate(result)).not.toThrow()
    expect(evaluateCandidate(result).state).toBe('blocked')
  })
})
