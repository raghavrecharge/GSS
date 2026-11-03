import { readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { projectSections } from '../../src/data/course-rag/contract.js'
import { sealCandidate } from './core.mjs'

const [candidatePath, sectionId, reviewer, ...reasonParts] = process.argv.slice(2)
const reason = reasonParts.join(' ').trim()
if (!candidatePath || !sectionId || !reviewer || !reason) {
  throw new Error('Usage: node mark-reviewed-source-absence.mjs candidate.json sectionId reviewer "review reason"')
}

const target = path.resolve(candidatePath)
const candidate = JSON.parse(await readFile(target, 'utf8'))
const section = candidate.sections?.[sectionId]
if (section?.status !== 'missing') throw new Error(`${sectionId} must be missing before reviewed absence can be recorded.`)
if (!candidate.snapshots?.some((snapshot) => snapshot.url === candidate.sourceUrl && snapshot.status === 200 && !snapshot.blocked && !snapshot.truncated)) {
  throw new Error('No successful exact-source snapshot supports this absence review.')
}
if (!section.checkedSelectors?.length) throw new Error(`${sectionId} has no recorded inspected selectors.`)

section.status = 'source_absent'
section.reason = reason
section.value = { ...section.value, blocks: [] }
section.evidenceIds = []
section.sourceItems = 0
section.totalExtractedItems = 0
section.omissions = []
section.absenceReview = { reviewer, reviewedAt: new Date().toISOString(), method: 'complete-source-snapshot-inspection' }
candidate.record.detailSections[sectionId] = section.value
Object.assign(candidate.record, projectSections(candidate.sections))
candidate.review = {
  state: 'draft',
  builderRunId: candidate.review?.builderRunId || 'unknown-builder',
  verifierRunId: null,
  rounds: candidate.review?.rounds || 0,
  decisions: [],
}

const sealed = sealCandidate(candidate)
const temporary = `${target}.tmp`
await writeFile(temporary, `${JSON.stringify(sealed, null, 2)}\n`, 'utf8')
await rename(temporary, target)
console.log(JSON.stringify({ candidate: target, sectionId, reviewer, coverage: sealed.coverage, contentRevision: sealed.contentRevision, evidenceDigest: sealed.evidenceDigest }, null, 2))
