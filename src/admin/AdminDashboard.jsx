import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminIcon } from './AdminShell.jsx'
import { saveWorkspacePreferences, useWorkspaceState } from './services/workspaceState.js'
import { initialApplications, initialLeads, initialTasks } from './crm/crmData.js'
import { createPages, createProgrammes } from './cms/cmsData.js'

const workspaces = [
  { title: 'Customer relationships', description: 'Track enquiries, applications, students, follow-ups and team activity from one pipeline.', to: '/admin/crm', label: 'Open CRM', icon: 'users', metrics: [[initialLeads.filter((item) => !['Enrolled', 'Closed'].includes(item.status)).length, 'Sample open leads'], [initialApplications.length, 'Sample applications'], [initialTasks.filter((item) => !item.completed).length, 'Sample open tasks']] },
  { title: 'Website content', description: 'Manage pages, programmes, partners, locations and media through structured publishing workflows.', to: '/admin/cms', label: 'Open CMS', icon: 'layout', metrics: [[createPages().length, 'Source pages'], [createProgrammes().length, 'Source programmes'], ['9', 'Content tools']] },
]

const operationalChecks = ['Review unassigned enquiries', 'Check pending application documents', 'Review programme content changes', 'Confirm upcoming intake readiness']
const weeklyPerformance = [
  { week: 'Week 1', enquiries: 18, applications: 8, enrolments: 3 },
  { week: 'Week 2', enquiries: 23, applications: 11, enrolments: 5 },
  { week: 'Week 3', enquiries: 21, applications: 9, enrolments: 4 },
  { week: 'Week 4', enquiries: 28, applications: 12, enrolments: 7 },
]
function formatTime(time, preferences) {
  const date = new Date(time)
  if (preferences.dateFormat === 'ISO 8601') return date.toISOString().slice(0, 16).replace('T', ' ')
  return date.toLocaleString(preferences.dateFormat === 'Month Day Year' ? 'en-US' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: preferences.timezone })
}

export default function AdminDashboard() {
  const { activity, preferences } = useWorkspaceState()
  const [checks, setChecks] = useState([])
  return <div className="gss-admin-dashboard">
    <section className="gss-admin-welcome">
      <div><span className="gss-admin-kicker">Unified operations</span><h2>Manage the learner journey and website content in one place.</h2><p>Coordinate admissions, prepare programme intakes and review website content with a shared view of your team’s next actions.</p></div>
      <div className="gss-admin-readiness"><strong>Explore your workspace</strong><span>Admissions · Content · Reporting</span><small style={{ marginTop: 18 }}>Preview records are synthetic. Changes remain in this browser session.</small><Link className="gss-admin-welcome-link" to="/admin/reports">View reports <span aria-hidden="true">↗</span></Link></div>
    </section>
    <section className="gss-admin-workspace-grid" aria-label="Admin workspaces">
      {workspaces.map((workspace) => <article className="gss-admin-workspace-card" key={workspace.title}>
        <div className="gss-admin-card-heading"><span className="gss-admin-card-icon"><AdminIcon name={workspace.icon} /></span><div><h3>{workspace.title}</h3><p>{workspace.description}</p></div></div>
        <dl>{workspace.metrics.map(([value, label]) => <div key={label}><dt>{value}</dt><dd>{label}</dd></div>)}</dl>
        <Link to={workspace.to}>{workspace.label}<span aria-hidden="true">→</span></Link>
      </article>)}
    </section>
    <div className="gss-admin-lower-grid">
      <section className="gss-admin-panel"><div className="gss-admin-panel-heading"><div><span className="gss-admin-kicker">Activity</span><h2>Latest workspace updates</h2></div><Link className="gss-admin-outline-link" to="/admin/activity">View audit log</Link></div><ul className="gss-admin-activity-list">{activity.slice(0, 4).map((item) => <li key={item.id}><span className="gss-admin-activity-mark" aria-hidden="true" /><div><strong>{item.action}</strong><span>{item.detail}</span></div><time dateTime={item.time}>{formatTime(item.time, preferences)}</time></li>)}</ul></section>
      <aside className="gss-admin-panel gss-admin-setup-panel"><span className="gss-admin-kicker">Launch checklist</span><h2>Production setup</h2><ul>
        <li className="is-done"><span>1</span><div><strong>Admin interface</strong><small>Theme and responsive shell</small></div></li>
        <li><span>2</span><div><strong>Identity provider</strong><small>Choose secure authentication</small></div></li>
        <li><span>3</span><div><strong>Database and retention</strong><small>Approve fields and policies</small></div></li>
        <li><span>4</span><div><strong>Role permissions</strong><small>Define owner, editor and adviser access</small></div></li>
      </ul></aside>
    </div>
    <div className="gss-admin-lower-grid"><section className="gss-admin-panel"><div className="gss-admin-panel-heading"><div><span className="gss-admin-kicker">Work queue</span><h2>Today’s operational review</h2></div><span className="gss-admin-pill">{checks.length}/{operationalChecks.length} complete</span></div><p className="gss-admin-description">Use this review list to organise your team’s next actions.</p><ul className="gss-admin-checklist">{operationalChecks.map((check) => <li key={check}><label><input type="checkbox" checked={checks.includes(check)} onChange={() => setChecks((current) => current.includes(check) ? current.filter((item) => item !== check) : [...current, check])} /><span>{check}</span></label></li>)}</ul></section><section className="gss-admin-panel"><span className="gss-admin-kicker">Shortcuts</span><h2>Keep operations moving</h2><div className="gss-admin-shortcuts"><Link to="/admin/crm/communications"><AdminIcon name="mail" />Follow up with learners</Link><Link to="/admin/cms/publishing"><AdminIcon name="check" />Review the publishing queue</Link><Link to="/admin/crm/intakes"><AdminIcon name="calendar" />Prepare an upcoming intake</Link><Link to="/admin/reports"><AdminIcon name="chart" />Explore workspace reports</Link></div></section></div>
  </div>
}

export function AdminActivity() {
  const { activity, preferences } = useWorkspaceState()
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('All areas')
  const visible = activity.filter((item) => (area === 'All areas' || item.area === area) && `${item.action} ${item.detail} ${item.actor}`.toLowerCase().includes(search.toLowerCase().trim()))
  return <div className="gss-admin-page"><div className="gss-admin-page-heading"><div><span className="gss-admin-kicker">Workspace history</span><h2>Activity and audit trail</h2><p>Review changes made across admissions, content and workspace preferences.</p></div><span className="gss-admin-pill">Session activity</span></div><section className="gss-admin-panel"><div className="gss-admin-filter-grid"><label className="gss-admin-field"><span>Search activity</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Action, item or team" /></label><label className="gss-admin-field"><span>Area</span><select value={area} onChange={(event) => setArea(event.target.value)}><option>All areas</option><option>Admissions</option><option>Content</option><option>Workspace</option></select></label></div><p className="gss-admin-description" aria-live="polite">{visible.length} events · Times shown in {preferences.dateFormat === 'ISO 8601' ? 'UTC' : preferences.timezone} · Synthetic preview history</p>{visible.length ? <div className="gss-admin-table-scroll" role="region" aria-label="Workspace activity, scroll for more columns" tabIndex={0}><table className="gss-admin-data-table"><thead><tr><th>Event</th><th>Area</th><th>Team</th><th>Time</th><th>Outcome</th></tr></thead><tbody>{visible.map((item) => <tr key={item.id}><td><strong>{item.action}</strong><small>{item.detail}</small></td><td>{item.area}</td><td>{item.actor}</td><td><time dateTime={item.time}>{formatTime(item.time, preferences)}</time></td><td><span className="gss-admin-pill">{item.outcome}</span></td></tr>)}</tbody></table></div> : <div className="gss-admin-empty"><h3>No matching events</h3><p>Change your search or area filter to review more activity.</p><button className="gss-admin-primary-button" type="button" onClick={() => { setSearch(''); setArea('All areas') }}>Clear activity filters</button></div>}</section><p className="gss-admin-description">This preview log is held in memory. A production audit trail needs server-recorded actor identity and tamper-resistant storage.</p></div>
}

export function AdminReports() {
  const [period, setPeriod] = useState('Last 4 weeks')
  const [metric, setMetric] = useState('enquiries')
  const rows = period === 'Last 2 weeks' ? weeklyPerformance.slice(-2) : weeklyPerformance
  const total = (key) => rows.reduce((sum, row) => sum + row[key], 0)
  const conversion = Math.round(total('enrolments') / total('enquiries') * 100)
  return <div className="gss-admin-page"><div className="gss-admin-page-heading"><div><span className="gss-admin-kicker">Performance</span><h2>Workspace reporting</h2><p>Understand the learner funnel and keep content operations on schedule.</p></div><label className="gss-admin-field"><span>Reporting period</span><select value={period} onChange={(event) => setPeriod(event.target.value)}><option>Last 4 weeks</option><option>Last 2 weeks</option></select></label></div><p className="gss-admin-sample-note">Sample reporting dataset · Figures illustrate the reporting workflow and are not live business metrics.</p><div className="gss-admin-stat-grid">{[[total('enquiries'), 'Enquiries'], [total('applications'), 'Applications'], [total('enrolments'), 'Enrolments'], [`${conversion}%`, 'Enquiry to enrolment']].map(([value, label]) => <article className="gss-admin-panel" key={label}><span className="gss-admin-description">{label}</span><strong className="gss-admin-stat-value">{value}</strong></article>)}</div><div className="gss-admin-lower-grid"><section className="gss-admin-panel"><div className="gss-admin-panel-heading"><div><span className="gss-admin-kicker">Admissions trend</span><h2>Learner funnel by week</h2></div><label className="gss-admin-field"><span>Metric</span><select value={metric} onChange={(event) => setMetric(event.target.value)}><option value="enquiries">Enquiries</option><option value="applications">Applications</option><option value="enrolments">Enrolments</option></select></label></div><div className="gss-admin-bar-chart" role="img" aria-label={`${metric} by week: ${rows.map((row) => `${row.week}: ${row[metric]}`).join(', ')}`}>{rows.map((row) => <div key={row.week}><span>{row.week}</span><div><i style={{ width: `${row[metric] / Math.max(...rows.map((item) => item[metric])) * 100}%` }} /></div><strong>{row[metric]}</strong></div>)}</div><details className="gss-admin-report-details"><summary>View accessible data table</summary><table className="gss-admin-data-table"><thead><tr><th>Week</th><th>Enquiries</th><th>Applications</th><th>Enrolments</th></tr></thead><tbody>{rows.map((row) => <tr key={row.week}><th>{row.week}</th><td>{row.enquiries}</td><td>{row.applications}</td><td>{row.enrolments}</td></tr>)}</tbody></table></details></section><section className="gss-admin-panel"><span className="gss-admin-kicker">Content operations</span><h2>Editorial attention</h2><ul className="gss-admin-health-list"><li><span>Programme drafts awaiting review</span><strong>3</strong></li><li><span>Pages in draft</span><strong>8</strong></li><li><span>Media missing descriptive alt text</span><strong>2</strong></li><li><span>Scheduled publishing items</span><strong>2</strong></li></ul><Link className="gss-admin-outline-link" to="/admin/cms/publishing">Open publishing queue</Link></section></div><section className="gss-admin-panel"><span className="gss-admin-kicker">Next actions</span><h2>Turn reports into work</h2><div className="gss-admin-shortcuts gss-admin-shortcuts--grid"><Link to="/admin/crm/reports">Admissions source and programme reports <span aria-hidden="true">↗</span></Link><Link to="/admin/cms/media">Review media accessibility <span aria-hidden="true">↗</span></Link><Link to="/admin/activity">Review recent changes <span aria-hidden="true">↗</span></Link></div></section></div>
}

export function AdminSettings() {
  const { preferences } = useWorkspaceState()
  const [values, setValues] = useState(preferences)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const set = (key, value) => { setValues((current) => ({ ...current, [key]: value })); setMessage(''); setError('') }
  function save(event) {
    event.preventDefault()
    try { saveWorkspacePreferences(values); setMessage('Workspace preferences saved for this session.'); setError('') }
    catch (failure) { setError(failure.message) }
  }
  return <div className="gss-admin-page"><div className="gss-admin-page-heading"><div><span className="gss-admin-kicker">Preferences</span><h2>Set up your workspace</h2><p>Personalise operational defaults and review the connections needed for production.</p></div><span className="gss-admin-pill">Session preferences</span></div><form className="gss-admin-panel" onSubmit={save}><h3>General preferences</h3><div className="gss-admin-settings-grid"><label className="gss-admin-field"><span>Workspace name</span><input value={values.workspaceName} onChange={(event) => set('workspaceName', event.target.value)} maxLength={80} required /></label><label className="gss-admin-field"><span>Time zone</span><select value={values.timezone} onChange={(event) => set('timezone', event.target.value)}><option>Europe/London</option><option>Asia/Kolkata</option><option>Africa/Lagos</option><option>UTC</option></select></label><label className="gss-admin-field"><span>Date display preference</span><select value={values.dateFormat} onChange={(event) => set('dateFormat', event.target.value)}><option>Day Month Year</option><option>Month Day Year</option><option>ISO 8601</option></select></label></div><fieldset className="gss-admin-preference-checks"><legend>Notification preferences</legend><label><input type="checkbox" checked={values.weeklyDigest} onChange={(event) => set('weeklyDigest', event.target.checked)} />Weekly operations digest</label><label><input type="checkbox" checked={values.contentReview} onChange={(event) => set('contentReview', event.target.checked)} />Content ready for review</label><p>No email is sent from the preview workspace.</p></fieldset>{error && <p role="alert" className="gss-admin-error">{error}</p>}{message && <p role="status" className="gss-admin-success">{message}</p>}<button className="gss-admin-primary-button" type="submit">Save workspace preferences</button></form><section className="gss-admin-panel"><span className="gss-admin-kicker">Connections</span><h2>Production services</h2><div className="gss-admin-connection-grid">{[['Identity & permissions', 'Secure sign-in and server-enforced staff permissions'], ['Database', 'Shared CRM records, revisions and audit history'], ['Email delivery', 'Application updates and staff notifications'], ['Media storage', 'Validated uploads and a managed asset library']].map(([title, description]) => <article key={title}><AdminIcon name="settings" /><div><h3>{title}</h3><p>{description}</p><span className="gss-admin-pill">Not connected</span></div></article>)}</div></section></div>
}
