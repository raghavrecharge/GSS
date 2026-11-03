// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { assembleCandidate, extractSnapshot, reviewCandidate, sealCandidate } from './core.mjs'
import { REQUIRED_SECTIONS } from './contract.mjs'
import { planPublication, publicationRecord, projectRoot, publishCandidateFile } from './publish.mjs'
import { applyPublishedRecord, publishedRecordFor } from '../../src/data/course-rag/publication.js'

function fixture({ count = 98, absence = true, url = 'https://msbm.org.uk/programme/executive-mba' } = {}) {
  const html = `<h1>Executive MBA</h1>${REQUIRED_SECTIONS.filter(id => id !== 'identity').map(id => `<section data-course-section="${id}">${id === 'universityProgression' && absence ? '<h2>University progression</h2>' : `<p>Published ${id} information.</p>${id === 'modules' ? `<article data-module><h3 data-module-title>Strategic management</h3><p data-module-description>Source-listed module summary.</p>${Array.from({ length: count }, (_, index) => `<div data-lesson><h5 data-lesson-title>Lesson ${index + 1}</h5><p>Published description ${index + 1}.</p></div>`).join('')}</article>` : ''}`}</section>`).join('')}`
  return assembleCandidate(extractSnapshot({ html, url, courseSlug: 'executive-mba', retrievedAt: '2026-11-01T12:00:00Z' }), { builderRunId: 'builder' })
}

function approve(candidate) {
  return reviewCandidate(candidate, { actor: 'independent-verifier', role: 'verifier', verdict: 'approve', candidateRevision: candidate.contentRevision, evidenceDigest: candidate.evidenceDigest })
}

describe('reviewed course publication', () => {
  it('preserves all 98 lesson descriptions, summaries, and rich sections through publication and JSON seed serialization', () => {
    const candidate = approve(fixture())
    const record = publicationRecord(candidate)
    const projected = applyPublishedRecord({ slug: 'executive-mba', image: '/hero.jpg', certificateDetails: [['legacy', 'Uncited award', 'Old text']] }, record)
    const exported = JSON.parse(JSON.stringify(projected))
    expect(exported.modules[0].lessons).toHaveLength(98)
    expect(exported.modules[0].lessons.every((lesson, index) => lesson.description === `Published description ${index + 1}.`)).toBe(true)
    expect(exported.modules[0].summary).toBe('Source-listed module summary.')
    expect(exported.detailSections).toEqual(candidate.record.detailSections)
    expect(exported.certificateDetails).toBeUndefined()
    expect(exported.image).toBe('/hero.jpg')
    expect(exported.seedRevision).toBe(`rag:${candidate.contentRevision}`)
    expect(exported.ragProvenance.sections.universityProgression.status).toBe('source_absent')
    expect(exported.ragProvenance.sections.universityProgression.checkedSelectors.length).toBeGreaterThan(0)
  })

  it('refuses unapproved, tampered, and incompletely evidenced source_absent candidates', () => {
    expect(() => publicationRecord(fixture())).toThrow('independent review')
    const changed = approve(fixture())
    changed.record.modules[0].lessons.pop()
    expect(() => publicationRecord(changed)).toThrow('changed after sealing')
    const absence = fixture()
    delete absence.sections.universityProgression.checkedSelectors
    sealCandidate(absence)
    expect(() => publicationRecord(absence)).toThrow('independent review')
  })

  it('replays idempotently and requires the current revision before replacing published content', () => {
    const candidate = approve(fixture())
    const first = planPublication([], candidate)
    expect(planPublication(first.records, candidate).changed).toBe(false)
    const next = approve(fixture({ count: 97 }))
    expect(() => planPublication(first.records, next)).toThrow('expected revision')
    const update = planPublication(first.records, next, { expectedRevision: candidate.contentRevision })
    expect(update.records).toHaveLength(1)
    expect(update.records[0].modules[0].lessons).toHaveLength(97)
    expect(publishedRecordFor(update.records, 'executive-mba', 'sierra-leone')).toBeUndefined()
  })

  it('atomically retains rollback evidence and leaves output unchanged on failed publication', async () => {
    const directory = await mkdtemp(join(projectRoot, 'artifacts-publication-test-'))
    const outputPath = join(directory, 'published.json')
    const candidatePath = join(directory, 'candidate.json')
    const candidate = approve(fixture())
    try {
      await writeFile(outputPath, '[]\n')
      await writeFile(candidatePath, JSON.stringify(candidate))
      const result = await publishCandidateFile({ candidatePath, outputPath })
      expect(result.changed).toBe(true)
      const before = await readFile(outputPath, 'utf8')
      expect((await publishCandidateFile({ candidatePath, outputPath })).changed).toBe(false)
      const incomplete = fixture({ count: 97 })
      await writeFile(candidatePath, JSON.stringify(incomplete))
      await expect(publishCandidateFile({ candidatePath, outputPath })).rejects.toThrow('independent review')
      expect(await readFile(outputPath, 'utf8')).toBe(before)
      const archived = JSON.parse(await readFile(join(result.rollbackDirectory, `${candidate.contentRevision}-${candidate.evidenceDigest}.candidate.json`), 'utf8'))
      expect(archived.record.modules[0].lessons).toHaveLength(98)
    } finally { await rm(directory, { recursive: true, force: true }) }
  })

  it('publishes country-specific evidence beside the global record without substituting its scope', () => {
    const global = planPublication([], approve(fixture()))
    const local = approve(fixture({ url: 'https://msbm.org.uk/sierra-leone/programme/executive-mba' }))
    const combined = planPublication(global.records, local)
    expect(combined.records).toHaveLength(2)
    expect(publishedRecordFor(combined.records, 'executive-mba').sourceScope).toBe('global')
    expect(publishedRecordFor(combined.records, 'executive-mba', 'sierra-leone').sourceUrl).toContain('/sierra-leone/')
  })
})
