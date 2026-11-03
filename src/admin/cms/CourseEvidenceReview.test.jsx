import { createHash, webcrypto } from 'node:crypto'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { applyReview, contentPayload, evidencePayload, projectSections, REQUIRED_SECTIONS, stableStringify } from '../../data/course-rag/contract.js'
import CourseEvidenceReview from './CourseEvidenceReview.jsx'

afterEach(() => { cleanup(); vi.unstubAllGlobals() })

function fixture({ incomplete = false } = {}) {
  const candidate = { schemaVersion: 1, candidateId: 'candidate-1', courseSlug: 'test-course', sourceUrl: 'https://msbm.org.uk/programme/test-course', scope: 'global', record: { slug: 'test-course', title: 'Verified programme', description: 'Course introduction', detailSections: {} }, sections: {}, evidence: [], snapshots: [{ id: 'snapshot-1', url: 'https://msbm.org.uk/programme/test-course', scope: 'global', status: 200, contentHash: 'a'.repeat(64), retrievedAt: '2026-11-01T12:00:00Z' }], conflicts: [], unresolvedConflicts: [], review: { builderRunId: 'builder-1', decisions: [], rounds: 0 } }
  for (const id of REQUIRED_SECTIONS) {
    const module = { title: 'Research methods', summary: 'Apply research techniques and evaluate findings.', lectures: 1, quizzes: 0, lessons: [{ title: 'Research ethics', description: 'Evaluate consent and research integrity.', type: 'Lecture' }] }
    const blocks = id === 'modules' ? [{ type: 'module', text: 'Research methods: apply research techniques and evaluate findings.', module }] : [{ type: 'p', text: id === 'identity' ? 'Verified programme' : `Source information and full descriptive content for ${id}.` }]
    const value = { blocks, ...(id === 'modules' ? { modules: [module] } : {}) }
    candidate.record.detailSections[id] = value
    candidate.sections[id] = { status: incomplete && id === 'library' ? 'missing' : 'observed', value, evidenceIds: [`chunk-${id}`], sourceItems: 1, totalExtractedItems: 1, omissions: [] }
    candidate.evidence.push({ id: `chunk-${id}`, courseSlug: 'test-course', sectionId: id, snapshotId: 'snapshot-1', text: `Evidence for ${id}`, items: blocks })
  }
  Object.assign(candidate.record, projectSections(candidate.sections))
  candidate.contentRevision = createHash('sha256').update(stableStringify(contentPayload(candidate))).digest('hex')
  candidate.evidenceDigest = createHash('sha256').update(stableStringify(evidencePayload(candidate))).digest('hex')
  return incomplete ? candidate : applyReview(candidate, { actor: 'verifier-2', role: 'verifier', verdict: 'approve', candidateRevision: candidate.contentRevision, evidenceDigest: candidate.evidenceDigest, reasons: [] })
}

async function inspect(candidate) {
  vi.stubGlobal('crypto', webcrypto)
  fireEvent.change(screen.getByLabelText('Pipeline candidate JSON'), { target: { value: JSON.stringify(candidate) } })
  fireEvent.click(screen.getByRole('button', { name: 'Inspect candidate' }))
  await screen.findByRole('heading', { name: 'Verified programme' })
}

describe('CMS course evidence review', () => {
  it('stages a verified candidate only after editorial approval', async () => {
    const stage = vi.fn()
    render(<CourseEvidenceReview onStage={stage} />)
    await inspect(fixture())
    expect(screen.getByRole('button', { name: 'Stage CMS draft' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Approve verified candidate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Stage CMS draft' }))
    expect(stage).toHaveBeenCalledWith(expect.objectContaining({ slug: 'test-course', kind: 'programme', ragReview: expect.objectContaining({ candidateId: 'candidate-1' }) }))
    expect(screen.getByRole('status')).toHaveTextContent('It has not been published')
  })

  it('blocks incomplete source data and requires a reason to request revision', async () => {
    render(<CourseEvidenceReview onStage={vi.fn()} />)
    await inspect(fixture({ incomplete: true }))
    expect(screen.getByRole('button', { name: 'Approve verified candidate' })).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Request revision' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Describe the missing detail')
    fireEvent.change(screen.getByLabelText('Editorial review notes'), { target: { value: 'Library source section missing.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Request revision' }))
    expect(screen.getByRole('status')).toHaveTextContent('returned for revision')
  })

  it('rejects tampered candidate payloads before review controls appear', async () => {
    vi.stubGlobal('crypto', webcrypto)
    render(<CourseEvidenceReview onStage={vi.fn()} />)
    const candidate = fixture(); candidate.record.title = 'Tampered'
    fireEvent.change(screen.getByLabelText('Pipeline candidate JSON'), { target: { value: JSON.stringify(candidate) } })
    fireEvent.click(screen.getByRole('button', { name: 'Inspect candidate' }))
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('digest does not match'))
    expect(screen.queryByRole('button', { name: 'Stage CMS draft' })).not.toBeInTheDocument()
  })
})
