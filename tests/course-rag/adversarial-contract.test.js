import { describe, expect, it } from 'vitest'
import { applyReview, evaluateCandidate, MAX_REPAIR_ROUNDS, REQUIRED_SECTIONS, SCHEMA_VERSION } from '../../src/data/course-rag/contract.js'

// Independent fixtures deliberately do not share extractor helpers.
function candidateFixture() {
  const sourceUrl = 'https://msbm.org.uk/programme/test-course'
  const courseSlug = 'test-course'
  const detailSections = Object.fromEntries(REQUIRED_SECTIONS.map(id => [id, { blocks: [{ type: 'p', text: `Verified text for ${id}` }], ...(id === 'modules' ? { modules: [] } : {}) }]))
  const modules = [{ title: 'Research Methods', summary: 'Research design and ethics.', lectures: 1, quizzes: 0, lessons: [{ title: 'Research design', description: 'Choose an appropriate methodology.', type: 'Lecture' }] }]
  detailSections.modules = { blocks: [{ type: 'module', text: 'Research Methods Research design and ethics. Research design Choose an appropriate methodology.', module: structuredClone(modules[0]) }], modules: structuredClone(modules) }
  return {
    schemaVersion: SCHEMA_VERSION, candidateId: 'candidate-one', courseSlug, sourceUrl, scope: 'global',
    contentRevision: 'a'.repeat(64), evidenceDigest: 'b'.repeat(64),
    snapshots: [{ id: 'snapshot-one', url: sourceUrl, finalUrl: sourceUrl, retrievedAt: '2026-11-01T12:00:00Z', status: 200, contentHash: 'c'.repeat(64), extractorVersion: 'test-1', scope: 'global', blocked: false, truncated: false, performedActions: [] }],
    evidence: REQUIRED_SECTIONS.map(sectionId => ({ id: `evidence-${sectionId}`, snapshotId: 'snapshot-one', courseSlug, sectionId, scope: 'global', text: `Verified text for ${sectionId}`, items: structuredClone(detailSections[sectionId].blocks), contentHash: 'd'.repeat(64), ordinal: 0, kind: 'text', selector: `#${sectionId}` })),
    sections: Object.fromEntries(REQUIRED_SECTIONS.map(id => [id, { status: 'observed', value: structuredClone(detailSections[id]), evidenceIds: [`evidence-${id}`], sourceItems: 1, totalExtractedItems: 1, omissions: [] }])),
    record: {
      slug: courseSlug, title: 'Verified text for identity', detailSections,
      longDescription: 'Verified text for programmeDetails', courseDetails: 'Verified text for courseDetails',
      outcomes: [], accreditation: 'Verified text for accreditation', modules: structuredClone(modules),
      progression: 'Verified text for universityProgression', entry: ['Verified text for entryRequirements'],
      workshops: 'Verified text for workshops', visa: 'Verified text for visa', library: 'Verified text for library',
    },
    conflicts: [], unresolvedConflicts: [],
    review: { state: 'draft', builderRunId: 'builder-one', verifierRunId: null, rounds: 0, decisions: [] },
  }
}

const approval = candidate => ({ role: 'verifier', verdict: 'approve', actor: 'verifier-two', candidateRevision: candidate.contentRevision, evidenceDigest: candidate.evidenceDigest, reasons: [] })

function candidateWithInspectedAbsence() {
  const candidate = candidateFixture()
  candidate.sections.universityProgression = {
    status: 'source_absent', value: { blocks: [] }, evidenceIds: [], sourceItems: 0, totalExtractedItems: 0,
    omissions: [], reason: 'The inspected progression section contains a heading with no published body.',
    checkedSelectors: ['#university'],
  }
  candidate.record.detailSections.universityProgression = { blocks: [] }
  candidate.record.progression = ''
  candidate.evidence = candidate.evidence.filter(item => item.sectionId !== 'universityProgression')
  return candidate
}

describe('independent RAG gate adversarial cases', () => {
  it('requires independent approval on the normal path', () => {
    const candidate = candidateFixture()
    expect(evaluateCandidate(candidate).readyForReview).toBe(true)
    expect(evaluateCandidate(candidate).complete).toBe(false)
    expect(applyReview(candidate, approval(candidate)).coverage.complete).toBe(true)
  })

  it('never accepts a dangling citation', () => {
    const candidate = candidateFixture()
    candidate.sections.tuition.evidenceIds = ['does-not-exist']
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('never accepts evidence copied from another course', () => {
    const candidate = candidateFixture()
    candidate.evidence.find(item => item.sectionId === 'tuition').courseSlug = 'another-course'
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('never accepts global evidence as local tuition evidence', () => {
    const candidate = candidateFixture()
    candidate.scope = 'sierra-leone'
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('fails closed for malformed arrays instead of throwing', () => {
    const candidate = candidateFixture()
    candidate.evidence = {}
    expect(() => evaluateCandidate(candidate)).not.toThrow()
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects an observed section with empty content despite a valid citation', () => {
    const candidate = candidateFixture()
    candidate.sections.library.value.blocks = []
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects a nonempty block array whose source text is entirely blank', () => {
    const candidate = candidateFixture()
    const empty = [{ type: 'p', text: '   ' }]
    candidate.sections.library.value.blocks = structuredClone(empty)
    candidate.record.detailSections.library.blocks = structuredClone(empty)
    candidate.record.library = '   '
    candidate.evidence.find(item => item.sectionId === 'library').items = structuredClone(empty)
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects a source block kind the renderer cannot represent', () => {
    const candidate = candidateFixture()
    const unsupported = [{ type: 'executable-widget', text: 'Unknown content' }]
    candidate.sections.library.value.blocks = structuredClone(unsupported)
    candidate.record.detailSections.library.blocks = structuredClone(unsupported)
    candidate.record.library = ''
    candidate.evidence.find(item => item.sectionId === 'library').items = structuredClone(unsupported)
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects caller-provided count claims that disagree with retained items', () => {
    const candidate = candidateFixture()
    candidate.sections.modules.sourceItems = 124
    candidate.sections.modules.totalExtractedItems = 124
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects omitted content even if the extraction claims matching counts', () => {
    const candidate = candidateFixture()
    candidate.sections.modules.omissions = ['Last thesis resource is missing']
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it.each(['blocked', 'truncated'])('rejects a %s source capture', key => {
    const candidate = candidateFixture()
    candidate.snapshots[0][key] = true
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('keeps source absence distinct from observed content', () => {
    const candidate = candidateWithInspectedAbsence()
    const report = evaluateCandidate(candidate)
    expect(report.observed).toBe(REQUIRED_SECTIONS.length - 1)
    expect(report.sourceAbsent).toContain('universityProgression')
    expect(report.complete).toBe(false)
    expect(report.readyForReview).toBe(true)
  })

  it('requires an explicit inspection reason before accepting source absence', () => {
    const candidate = candidateWithInspectedAbsence()
    candidate.sections.universityProgression.reason = ''
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('requires recorded section inspection selectors for source absence', () => {
    const candidate = candidateWithInspectedAbsence()
    candidate.sections.universityProgression.checkedSelectors = []
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects source absence inferred from a failed capture', () => {
    const candidate = candidateWithInspectedAbsence()
    candidate.snapshots[0].status = 403
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects source absence backed by a snapshot from another country', () => {
    const candidate = candidateWithInspectedAbsence()
    candidate.snapshots[0].scope = 'sierra-leone'
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects source absence that simultaneously claims observed items', () => {
    const candidate = candidateWithInspectedAbsence()
    candidate.sections.universityProgression.sourceItems = 1
    candidate.sections.universityProgression.totalExtractedItems = 1
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects source absence that cites content as though it had been observed', () => {
    const candidate = candidateWithInspectedAbsence()
    candidate.sections.universityProgression.evidenceIds = ['evidence-identity']
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects self review and stale review identities', () => {
    const candidate = candidateFixture()
    expect(() => applyReview(candidate, { ...approval(candidate), actor: 'builder-one' })).toThrow()
    expect(() => applyReview(candidate, { ...approval(candidate), candidateRevision: 'old-revision' })).toThrow()
  })

  it('invalidates approval if content is changed without changing declared hashes', () => {
    let candidate = candidateFixture()
    candidate = applyReview(candidate, approval(candidate))
    const changed = [{ type: 'paragraph', text: 'A different fee' }]
    candidate.sections.tuition.value.blocks = changed
    candidate.record.detailSections.tuition.blocks = changed
    candidate.evidence.find(item => item.sectionId === 'tuition').items = changed
    expect(evaluateCandidate(candidate).complete).toBe(false)
  })

  it('blocks unresolved source conflicts', () => {
    const candidate = candidateFixture()
    candidate.conflicts = [{ field: 'tuition', resolved: false, values: ['GBP 2700', 'GBP 3150'] }]
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('requires actionable reasons when a challenger rejects', () => {
    const candidate = candidateFixture()
    expect(() => applyReview(candidate, { ...approval(candidate), role: 'challenger', verdict: 'reject' })).toThrow()
  })

  it('rejects citation snapshots from an unrelated course URL', () => {
    const candidate = candidateFixture()
    candidate.snapshots[0].url = 'https://msbm.org.uk/programme/another-course'
    candidate.snapshots[0].finalUrl = candidate.snapshots[0].url
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('limits repeated repair cycles', () => {
    const candidate = candidateFixture()
    candidate.review.rounds = MAX_REPAIR_ROUNDS
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })

  it('rejects a normalized record that differs from reviewed source blocks', () => {
    const candidate = candidateFixture()
    candidate.record.detailSections.tuition.blocks = [{ type: 'paragraph', text: 'Unverified fee' }]
    expect(evaluateCandidate(candidate).readyForReview).toBe(false)
  })
})
