import { useState } from 'react'
import { courses } from '../../data/msbmCatalog.js'
import { resolveProgramme } from '../services/programmeLinks.js'

export default function ProgrammeRelations({ leads, applications, students }) {
  const [slug, setSlug] = useState(courses[0]?.slug || '')
  const course = courses.find(item => item.slug === slug)
  const groups = [['Enquiries', leads], ['Applications', applications], ['Students', students]]
  const unlinked = groups.reduce((count, [, records]) => count + records.filter(record => !resolveProgramme(record)).length, 0)
  return <section className="gss-crm-card" aria-labelledby="crm-programme-links"><div className="gss-crm-card-heading"><div><h2 id="crm-programme-links">Programme relationships</h2><p>Connect admissions records to the same catalogue ID used by CMS and checkout.</p></div></div><div className="gss-crm-field"><label htmlFor="crm-linked-programme">Programme</label><select id="crm-linked-programme" value={slug} onChange={event => setSlug(event.target.value)}>{courses.map(item => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></div>{course && <><p><a className="gss-crm-text-button" href={`/programmes/${course.slug}`} target="_blank" rel="noreferrer">Open programme details ↗</a> · <a className="gss-crm-text-button" href={`/checkout/${course.slug}`} target="_blank" rel="noreferrer">Open checkout ↗</a></p><p className="gss-crm-muted">Catalogue ID: {course.slug}</p>{groups.map(([title, records]) => { const matching = records.filter(record => resolveProgramme(record)?.slug === slug); return <section key={title} className="gss-crm-detail-section"><h3>{title} ({matching.length})</h3>{matching.length ? <ul>{matching.map(record => <li key={record.id}>{record.name} · {record.id} · {record.status || record.stage}</li>)}</ul> : <p className="gss-crm-muted">No linked {title.toLowerCase()} in this session.</p>}</section> })}</>}<p className="gss-crm-muted">{unlinked} admissions records need catalogue reconciliation. Payment and enrolment reconciliation requires persisted order IDs and payment-provider verification; demo checkout does not create a paid student record.</p></section>
}
