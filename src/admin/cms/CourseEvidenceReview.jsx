import { useState } from 'react'
import { evaluateCandidate, REQUIRED_SECTIONS, validateCandidate, verifyCandidateIntegrity } from '../../data/course-rag/contract.js'
import { toProgrammeDraft } from './cmsData.js'

const safeSource = value => {
  try { const url = new URL(value); return url.protocol === 'https:' && ['msbm.org.uk', 'www.msbm.org.uk', 'globalschoolofskills.com', 'www.globalschoolofskills.com'].includes(url.hostname) ? url.href : null } catch { return null }
}

export default function CourseEvidenceReview({ onStage }) {
  const [input, setInput] = useState('')
  const [candidate, setCandidate] = useState(null)
  const [error, setError] = useState('')
  const [decision, setDecision] = useState('Awaiting editorial review')
  const [reason, setReason] = useState('')
  const [notice, setNotice] = useState('')
  const evaluation = candidate ? evaluateCandidate(candidate) : null

  async function load(event) {
    event.preventDefault()
    setError(''); setNotice('')
    try {
      if (input.length > 5_000_000) throw new Error('Candidate JSON must be smaller than 5 MB.')
      const next = JSON.parse(input)
      const errors = validateCandidate(next)
      if (errors.length) throw new Error(errors.join(' '))
      if (!safeSource(next.sourceUrl)) throw new Error('Use an approved public course-source URL.')
      if (next.record.slug && next.record.slug !== next.courseSlug) throw new Error('Candidate and record catalogue IDs differ.')
      if (!await verifyCandidateIntegrity(next)) throw new Error('Candidate content or evidence digest does not match. Re-run the pipeline before review.')
      setCandidate(next); setDecision('Awaiting editorial review'); setReason('')
    } catch (issue) { setError(issue.message); setCandidate(null) }
  }

  function reject() {
    if (!reason.trim()) { setError('Describe the missing detail or source conflict before rejecting.'); return }
    setDecision('Revision requested'); setError(''); setNotice('Candidate returned for revision. Export this review for the builder agent.')
  }

  function stage() {
    if (!evaluation?.complete || decision !== 'Approved for staging') return
    onStage(toProgrammeDraft({ ...candidate.record, slug: candidate.courseSlug, ragReview: { candidateId: candidate.candidateId, contentRevision: candidate.contentRevision, evidenceDigest: candidate.evidenceDigest, decision, reason } }))
    setNotice('Candidate staged as a CMS draft. It has not been published to the website.')
  }

  function download() {
    if (!candidate) return
    const blob = new Blob([JSON.stringify({ ...candidate, editorialReview: { decision, reason, reviewedAt: new Date().toISOString() } }, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a'); link.href = url; link.download = `${candidate.courseSlug}-review.json`; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  return <section className="cms-panel" aria-labelledby="cms-course-review"><div className="cms-panel__header"><div><h2 id="cms-course-review">Course evidence review</h2><p>Review retrieved source sections, agent challenges and independent verification before staging a course draft.</p></div></div><div className="cms-review-body"><form onSubmit={load}><label className="cms-field"><span>Pipeline candidate JSON</span><textarea rows={6} maxLength={5_000_001} value={input} onChange={event => setInput(event.target.value)} aria-describedby="cms-candidate-help" /></label><p id="cms-candidate-help" className="cms-muted">Paste a candidate exported by the course pipeline. Agent verification is revision-bound; incomplete and challenged records stay blocked.</p><button className="cms-button" type="submit">Inspect candidate</button></form>{error && <p className="cms-field-error" role="alert">{error}</p>}{candidate && <><div className="cms-structured-heading cms-operations-subheading"><div><h3>{candidate.record.title || candidate.courseSlug}</h3><p className="cms-muted">{candidate.courseSlug} · {candidate.candidateId}</p></div><strong>{evaluation.percent}% observed · {evaluation.state}</strong></div><p><a href={safeSource(candidate.sourceUrl)} target="_blank" rel="noreferrer">Open official course source ↗</a></p><dl className="cms-metadata"><div><dt>Content revision</dt><dd className="cms-review-digest">{candidate.contentRevision}</dd></div><div><dt>Evidence digest</dt><dd className="cms-review-digest">{candidate.evidenceDigest}</dd></div><div><dt>Independent verification</dt><dd>{evaluation.complete ? 'Passed for this candidate revision' : 'Required before approval'}</dd></div></dl>{evaluation.errors.length > 0 && <div role="alert"><h3>Blocking defects</h3><ul>{evaluation.errors.map(item => <li key={item}>{item}</li>)}</ul></div>}<div className="cms-review-sections">{REQUIRED_SECTIONS.map(id => { const section = candidate.sections[id]; return <details key={id}><summary><strong>{id.replace(/([A-Z])/g, ' $1')}</strong><span>{section.status} · {section.totalExtractedItems ?? 0}/{section.sourceItems ?? '?'} items</span></summary><p className="cms-preserve-lines">{typeof section.value === 'string' ? section.value : JSON.stringify(section.value, null, 2)}</p>{section.omissions.length > 0 && <p className="cms-field-error">Omissions: {section.omissions.join(', ')}</p>}{section.evidenceIds.map(evidenceId => { const evidence = candidate.evidence.find(item => item.id === evidenceId); return <blockquote key={evidenceId}><small>{evidenceId} · {evidence?.snapshotId || 'Missing snapshot'}</small><p>{evidence?.text || 'Missing evidence'}</p></blockquote> })}</details> })}</div>{candidate.conflicts.length > 0 && <section><h3>Source conflicts</h3><pre className="cms-review-json">{JSON.stringify(candidate.conflicts, null, 2)}</pre></section>}<section><h3>Agent review decisions</h3>{candidate.review.decisions?.length ? <ul>{candidate.review.decisions.map((item, index) => <li key={index}>{item.role} · {item.actor} · {item.verdict}{item.reasons?.length ? ` — ${item.reasons.join('; ')}` : ''}</li>)}</ul> : <p className="cms-muted">No independent decisions recorded.</p>}</section><label className="cms-field"><span>Editorial review notes</span><textarea rows={3} value={reason} onChange={event => setReason(event.target.value)} maxLength={4000} /></label><p className="cms-muted">{decision}. Staging updates the current CMS session; live publication requires the authenticated server publishing workflow.</p><div className="cms-actions cms-review-actions"><button className="cms-button" disabled={!evaluation.complete} onClick={() => { setDecision('Approved for staging'); setError(''); setNotice('Editorial approval recorded for this revision.') }}>Approve verified candidate</button><button className="cms-button cms-button--quiet" onClick={reject}>Request revision</button><button className="cms-button" disabled={!evaluation.complete || decision !== 'Approved for staging'} onClick={stage}>Stage CMS draft</button><button className="cms-button cms-button--quiet" onClick={download}>Export review</button></div></>}<p className="cms-notice" role="status">{notice}</p></div></section>
}
