import { readFile, writeFile, rename } from 'node:fs/promises'
import path from 'node:path'
import { projectSections } from '../../src/data/course-rag/contract.js'
import { sealCandidate } from './core.mjs'

const [candidatePath, sectionId] = process.argv.slice(2)
if (!candidatePath || !sectionId) throw new Error('Usage: node repair-source-absence.mjs candidate.json sectionId')
const target = path.resolve(candidatePath)
const candidate = JSON.parse(await readFile(target, 'utf8'))
const section = candidate.sections?.[sectionId]
if (section?.status !== 'source_absent') throw new Error(`${sectionId} is not marked source_absent.`)
if (!section.reason?.trim() || !section.checkedSelectors?.length) throw new Error(`${sectionId} lacks an absence reason or inspected selectors.`)
if (!candidate.snapshots?.some((snapshot) => snapshot.url === candidate.sourceUrl && snapshot.status === 200 && !snapshot.blocked && !snapshot.truncated)) throw new Error('No successful exact-source snapshot supports this repair.')

section.value = { ...section.value, blocks: [] }
section.evidenceIds = []
section.sourceItems = 0
section.totalExtractedItems = 0
section.omissions = []
candidate.record.detailSections[sectionId] = section.value
Object.assign(candidate.record, projectSections(candidate.sections))
candidate.review = { state: 'draft', builderRunId: candidate.review?.builderRunId || 'unknown-builder', verifierRunId: null, rounds: candidate.review?.rounds || 0, decisions: [] }
const sealed = sealCandidate(candidate)
const temporary = `${target}.tmp`
await writeFile(temporary, `${JSON.stringify(sealed, null, 2)}\n`, 'utf8')
await rename(temporary, target)
console.log(JSON.stringify({ candidate: target, sectionId, coverage: sealed.coverage, contentRevision: sealed.contentRevision, evidenceDigest: sealed.evidenceDigest }, null, 2))
