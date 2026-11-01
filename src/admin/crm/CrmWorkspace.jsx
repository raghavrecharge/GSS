import { useEffect, useRef, useState } from 'react'
import { admissionsOwners, applicationStages, displayDate, initialApplications, initialLeads, initialStudents, initialTasks, leadSources, leadStatuses, localDate, programmeOptions } from './crmData.js'
import { Contacts, Communications, Intakes, Reports } from './CrmOperations.jsx'
import { initialConversations, initialIntakes } from './operationsData.js'
import { recordWorkspaceActivity } from '../services/workspaceState.js'
import './crm.css'

const sections = [
  ['overview', 'Overview'], ['leads', 'Leads'], ['applications', 'Applications'], ['students', 'Students'], ['tasks', 'Tasks & follow-ups'],
  ['contacts', 'Contacts'], ['communications', 'Conversations'], ['intakes', 'Intakes & enrolment'], ['reports', 'Reports'],
]

function Status({ value }) {
  const positive = ['Enrolled', 'Active', 'Completed', 'Qualified'].includes(value)
  return <span className={`gss-crm-status${positive ? ' gss-crm-status--positive' : ''}`}>{value}</span>
}

function EmptyState({ title, children }) {
  return <div className="gss-crm-empty"><h3>{title}</h3><p>{children}</p></div>
}

function Metric({ label, value, detail }) {
  return <article className="gss-crm-metric"><span>{label}</span><strong>{value}</strong><small>{detail}</small></article>
}

function Field({ label, id, children }) {
  return <div className="gss-crm-field"><label htmlFor={id}>{label}</label>{children}</div>
}

function LeadForm({ onCreate, onCancel }) {
  const [error, setError] = useState('')
  const nameInput = useRef(null)
  function submit(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (!values.name.trim() || !values.email.trim() || !values.country.trim()) {
      setError('Enter a name, email address and country to create the enquiry.')
      nameInput.current?.focus()
      return
    }
    onCreate({ ...values, name: values.name.trim(), email: values.email.trim(), country: values.country.trim() })
  }
  return <section className="gss-crm-card gss-crm-form-card" aria-labelledby="crm-new-lead-heading">
    <div className="gss-crm-card-heading"><div><h3 id="crm-new-lead-heading">New enquiry</h3><p>Add a record to this preview workspace.</p></div></div>
    <form onSubmit={submit}>
      <div className="gss-crm-form-grid">
        <Field label="Full name" id="crm-lead-name"><input ref={nameInput} id="crm-lead-name" name="name" required maxLength={120} autoComplete="off" /></Field>
        <Field label="Email address" id="crm-lead-email"><input id="crm-lead-email" type="email" name="email" required maxLength={254} autoComplete="off" /></Field>
        <Field label="Country" id="crm-lead-country"><input id="crm-lead-country" name="country" required maxLength={80} autoComplete="off" /></Field>
        <Field label="Programme of interest" id="crm-lead-programme"><select id="crm-lead-programme" name="programme">{programmeOptions.map(value => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Source" id="crm-lead-source"><select id="crm-lead-source" name="source">{leadSources.map(value => <option key={value}>{value}</option>)}</select></Field>
        <Field label="Assigned team" id="crm-lead-owner"><select id="crm-lead-owner" name="owner">{admissionsOwners.map(value => <option key={value}>{value}</option>)}</select></Field>
      </div>
      {error && <p className="gss-crm-error" role="alert">{error}</p>}
      <div className="gss-crm-form-actions"><button className="gss-crm-button" type="submit">Create enquiry</button><button className="gss-crm-button gss-crm-button--secondary" type="button" onClick={onCancel}>Cancel</button></div>
    </form>
  </section>
}

function LeadDetail({ lead, onUpdate, onClose }) {
  const [note, setNote] = useState('')
  const panel = useRef(null)
  useEffect(() => { panel.current?.focus() }, [])
  function addNote(event) {
    event.preventDefault()
    const text = note.trim()
    if (!text) return
    onUpdate({ ...lead, notes: [{ id: crypto.randomUUID(), text, date: localDate() }, ...lead.notes] }, 'A note was added')
    setNote('')
  }
  return <aside ref={panel} tabIndex={-1} className="gss-crm-card gss-crm-detail" aria-label={`Enquiry details for ${lead.name}`}>
    <div className="gss-crm-card-heading"><div><span className="gss-crm-eyebrow">{lead.id}</span><h3>{lead.name}</h3></div><button className="gss-crm-icon-button" type="button" aria-label="Close enquiry details" onClick={onClose}><span aria-hidden="true">×</span></button></div>
    <p className="gss-crm-detail-email">{lead.email}</p>
    <dl className="gss-crm-definition"><div><dt>Programme</dt><dd>{lead.programme}</dd></div><div><dt>Country</dt><dd>{lead.country}</dd></div><div><dt>Source</dt><dd>{lead.source}</dd></div><div><dt>Received</dt><dd>{displayDate(lead.created)}</dd></div></dl>
    <Field label="Enquiry status" id="crm-detail-status"><select id="crm-detail-status" value={lead.status} onChange={event => onUpdate({ ...lead, status: event.target.value }, `Status changed to ${event.target.value}`)}>{leadStatuses.map(value => <option key={value}>{value}</option>)}</select></Field>
    <Field label="Assigned team" id="crm-detail-owner"><select id="crm-detail-owner" value={lead.owner} onChange={event => onUpdate({ ...lead, owner: event.target.value }, `Assigned to ${event.target.value}`)}>{admissionsOwners.map(value => <option key={value}>{value}</option>)}</select></Field>
    <section className="gss-crm-detail-section" aria-labelledby="crm-notes-heading"><h4 id="crm-notes-heading">Notes</h4><form onSubmit={addNote}><label className="gss-crm-sr-only" htmlFor="crm-add-note">New note</label><textarea id="crm-add-note" value={note} onChange={event => setNote(event.target.value)} placeholder="Add context for the next conversation…" maxLength={2000} rows={3} /><button className="gss-crm-button gss-crm-button--secondary" type="submit" disabled={!note.trim()}>Add note</button></form>{lead.notes.length ? <ul className="gss-crm-notes">{lead.notes.map(item => <li key={item.id}><p>{item.text}</p><time dateTime={item.date}>{displayDate(item.date)}</time></li>)}</ul> : <p className="gss-crm-muted">No notes yet.</p>}</section>
    <section className="gss-crm-detail-section" aria-labelledby="crm-activity-heading"><h4 id="crm-activity-heading">Activity</h4><ol className="gss-crm-timeline">{lead.activities.map(activity => <li key={activity.id}><p>{activity.text}</p><time dateTime={activity.date}>{displayDate(activity.date)}</time></li>)}</ol></section>
  </aside>
}

function Leads({ leads, setLeads, announce }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [source, setSource] = useState('All sources')
  const [selectedId, setSelectedId] = useState(null)
  const [creating, setCreating] = useState(false)
  const selectedTrigger = useRef(null)
  const selectedLead = leads.find(lead => lead.id === selectedId)
  const visibleLeads = leads.filter(lead => (status === 'All statuses' || lead.status === status) && (source === 'All sources' || lead.source === source) && `${lead.name} ${lead.email} ${lead.programme} ${lead.country} ${lead.id}`.toLowerCase().includes(search.trim().toLowerCase()))
  function createLead(values) {
    const id = `GSS-L${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const lead = { ...values, id, status: 'New enquiry', created: localDate(), notes: [], activities: [{ id: crypto.randomUUID(), text: 'Enquiry created', date: localDate() }] }
    setLeads(current => [lead, ...current])
    setSelectedId(id)
    setCreating(false)
    setSearch('')
    setStatus('All statuses')
    setSource('All sources')
    announce(`Enquiry created for ${lead.name}.`)
  }
  function updateLead(next, activityText) {
    setLeads(current => current.map(lead => lead.id === next.id ? { ...next, activities: [{ id: crypto.randomUUID(), text: activityText, date: localDate() }, ...lead.activities] } : lead))
    announce(`${next.name}: ${activityText.toLowerCase()}.`)
  }
  return <>
    <div className="gss-crm-section-heading"><div><h2>Enquiries & leads</h2><p>Follow every prospective learner from first interest to enrolment.</p></div><button type="button" className="gss-crm-button" aria-expanded={creating} onClick={() => setCreating(value => !value)}>{creating ? 'Close form' : 'New enquiry'}</button></div>
    {creating && <LeadForm onCreate={createLead} onCancel={() => setCreating(false)} />}
    <div className={`gss-crm-leads-layout${selectedLead ? ' gss-crm-leads-layout--detail' : ''}`}>
      <section className="gss-crm-card" aria-label="Enquiries list">
        <div className="gss-crm-filters"><Field label="Search enquiries" id="crm-lead-search"><input id="crm-lead-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, programme or country" /></Field><Field label="Status" id="crm-status-filter"><select id="crm-status-filter" value={status} onChange={event => setStatus(event.target.value)}><option>All statuses</option>{leadStatuses.map(value => <option key={value}>{value}</option>)}</select></Field><Field label="Source" id="crm-source-filter"><select id="crm-source-filter" value={source} onChange={event => setSource(event.target.value)}><option>All sources</option>{leadSources.map(value => <option key={value}>{value}</option>)}</select></Field></div>
        <p className="gss-crm-result-count" aria-live="polite">{visibleLeads.length} of {leads.length} enquiries</p>
        {visibleLeads.length ? <div className="gss-crm-table-wrap" role="region" aria-label="Enquiries table, scroll horizontally for more columns" tabIndex={0}><table className="gss-crm-table"><thead><tr><th scope="col">Learner</th><th scope="col">Programme</th><th scope="col">Status</th><th scope="col">Assigned team</th><th scope="col">Action</th></tr></thead><tbody>{visibleLeads.map(lead => <tr key={lead.id} className={selectedId === lead.id ? 'is-selected' : ''}><td><strong>{lead.name}</strong><span>{lead.country} · {lead.source}</span></td><td className="gss-crm-programme-cell">{lead.programme}</td><td><Status value={lead.status} /></td><td>{lead.owner}</td><td><button className="gss-crm-text-button" type="button" aria-label={`View enquiry for ${lead.name}`} aria-pressed={selectedId === lead.id} onClick={event => { selectedTrigger.current = event.currentTarget; setSelectedId(lead.id) }}>View <span aria-hidden="true">↗</span></button></td></tr>)}</tbody></table></div> : <EmptyState title="No enquiries match these filters">Try a different search or choose all statuses and sources.</EmptyState>}
      </section>
      {selectedLead && <LeadDetail key={selectedLead.id} lead={selectedLead} onUpdate={updateLead} onClose={() => { setSelectedId(null); if (selectedTrigger.current?.isConnected) selectedTrigger.current.focus() }} />}
    </div>
  </>
}

function Applications({ applications, setApplications, announce }) {
  const [search, setSearch] = useState('')
  const visible = applications.filter(item => `${item.name} ${item.programme} ${item.id}`.toLowerCase().includes(search.trim().toLowerCase()))
  function moveApplication(id, stage) {
    setApplications(current => current.map(item => item.id === id ? { ...item, stage } : item))
    announce(`Application ${id} moved to ${stage.toLowerCase()}.`)
  }
  return <><div className="gss-crm-section-heading"><div><h2>Applications pipeline</h2><p>Track the next step for every application and the documents still needed.</p></div></div><div className="gss-crm-inline-search"><Field label="Search applications" id="crm-application-search"><input id="crm-application-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Learner or programme" /></Field><span aria-live="polite">{visible.length} applications</span></div><div className="gss-crm-pipeline">{applicationStages.map(stage => { const items = visible.filter(item => item.stage === stage); return <section className="gss-crm-pipeline-column" key={stage} aria-label={`${stage} applications`}><div className="gss-crm-pipeline-heading"><h3>{stage}</h3><span>{items.length}</span></div>{items.length ? items.map(item => <article className="gss-crm-application" key={item.id}><span className="gss-crm-eyebrow">{item.id}</span><h4>{item.name}</h4><p>{item.programme}</p><dl><div><dt>Intake</dt><dd>{item.intake}</dd></div><div><dt>Documents</dt><dd>{item.documents}/{item.requiredDocuments} received</dd></div></dl><label htmlFor={`stage-${item.id}`}>Move to stage</label><select id={`stage-${item.id}`} value={item.stage} onChange={event => moveApplication(item.id, event.target.value)}>{applicationStages.map(value => <option key={value}>{value}</option>)}</select></article>) : <p className="gss-crm-pipeline-empty">No applications in this stage.</p>}</section> })}</div></>
}

function Students({ students }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All statuses')
  const visible = students.filter(student => (status === 'All statuses' || student.status === status) && `${student.name} ${student.email} ${student.programme} ${student.country} ${student.id}`.toLowerCase().includes(search.trim().toLowerCase()))
  return <><div className="gss-crm-section-heading"><div><h2>Student directory</h2><p>A clear view of enrolled learners, their programmes and support teams.</p></div></div><section className="gss-crm-card"><div className="gss-crm-filters gss-crm-filters--two"><Field label="Search students" id="crm-student-search"><input id="crm-student-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Name, programme or country" /></Field><Field label="Student status" id="crm-student-status"><select id="crm-student-status" value={status} onChange={event => setStatus(event.target.value)}><option>All statuses</option><option>Active</option><option>On hold</option><option>Completed</option></select></Field></div><p className="gss-crm-result-count" aria-live="polite">{visible.length} of {students.length} students</p>{visible.length ? <div className="gss-crm-table-wrap" role="region" aria-label="Student directory, scroll horizontally for more columns" tabIndex={0}><table className="gss-crm-table"><thead><tr><th scope="col">Student</th><th scope="col">Programme</th><th scope="col">Intake</th><th scope="col">Status</th><th scope="col">Support team</th></tr></thead><tbody>{visible.map(student => <tr key={student.id}><td><strong>{student.name}</strong><span>{student.email}</span><span>{student.id} · {student.country}</span></td><td className="gss-crm-programme-cell">{student.programme}</td><td>{student.intake}</td><td><Status value={student.status} /></td><td>{student.advisor}</td></tr>)}</tbody></table></div> : <EmptyState title="No students found">Adjust the search or student status to find a learner.</EmptyState>}</section></>
}

function TaskList({ tasks, onToggle, compact = false }) {
  return <ul className={`gss-crm-task-list${compact ? ' gss-crm-task-list--compact' : ''}`}>{tasks.map(task => <li key={task.id} className={task.completed ? 'is-completed' : ''}><input id={`task-${task.id}`} type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} /><div><label htmlFor={`task-${task.id}`}>{task.title}</label><p>{task.related ? `${task.related} · ` : ''}{task.owner}</p><div className="gss-crm-task-meta"><time dateTime={task.due}>{displayDate(task.due)}</time><span>{task.priority} priority</span>{task.completed && <span>Completed</span>}{!task.completed && task.due < localDate() && <span className="gss-crm-overdue">Overdue</span>}</div></div></li>)}</ul>
}

function Tasks({ tasks, setTasks, announce }) {
  const [filter, setFilter] = useState('Open')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')
  const visible = tasks.filter(task => filter === 'All tasks' || (filter === 'Completed' ? task.completed : !task.completed))
  function addTask(event) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget))
    if (!values.title.trim()) { setError('Enter a task title.'); return }
    setTasks(current => [{ ...values, title: values.title.trim(), related: values.related.trim(), id: `GSS-T${crypto.randomUUID().slice(0, 8)}`, completed: false }, ...current])
    setCreating(false)
    setFilter('Open')
    setError('')
    announce('Follow-up task created.')
  }
  function toggleTask(id) {
    const task = tasks.find(item => item.id === id)
    setTasks(current => current.map(item => item.id === id ? { ...item, completed: !item.completed } : item))
    announce(`Task ${task.completed ? 'reopened' : 'completed'}: ${task.title}.`)
  }
  return <><div className="gss-crm-section-heading"><div><h2>Tasks & follow-ups</h2><p>Keep the next conversation, document review and welcome call on track.</p></div><button className="gss-crm-button" type="button" aria-expanded={creating} onClick={() => setCreating(value => !value)}>{creating ? 'Close form' : 'New task'}</button></div>{creating && <section className="gss-crm-card gss-crm-form-card" aria-label="New follow-up task"><form onSubmit={addTask}><div className="gss-crm-form-grid"><Field label="Task title" id="crm-task-title"><input id="crm-task-title" name="title" required maxLength={160} /></Field><Field label="Related learner (optional)" id="crm-task-related"><input id="crm-task-related" name="related" maxLength={120} /></Field><Field label="Due date" id="crm-task-due"><input id="crm-task-due" type="date" name="due" defaultValue={localDate()} required /></Field><Field label="Assigned team" id="crm-task-owner"><select id="crm-task-owner" name="owner">{admissionsOwners.map(value => <option key={value}>{value}</option>)}</select></Field><Field label="Priority" id="crm-task-priority"><select id="crm-task-priority" name="priority"><option>Normal</option><option>High</option></select></Field></div>{error && <p className="gss-crm-error" role="alert">{error}</p>}<div className="gss-crm-form-actions"><button className="gss-crm-button" type="submit">Create task</button><button className="gss-crm-button gss-crm-button--secondary" type="button" onClick={() => setCreating(false)}>Cancel</button></div></form></section>}<section className="gss-crm-card"><div className="gss-crm-card-heading"><Field label="Show tasks" id="crm-task-filter"><select id="crm-task-filter" value={filter} onChange={event => setFilter(event.target.value)}><option>Open</option><option>Completed</option><option>All tasks</option></select></Field><span className="gss-crm-muted" aria-live="polite">{visible.length} tasks</span></div>{visible.length ? <TaskList tasks={visible} onToggle={toggleTask} /> : <EmptyState title={filter === 'Open' ? 'You’re all caught up' : 'No tasks to show'}>{filter === 'Open' ? 'Create a follow-up when there is a next step to arrange.' : 'Completed follow-ups will appear here.'}</EmptyState>}</section></>
}

function Overview({ leads, applications, tasks, onNavigate, onToggleTask }) {
  const openTasks = tasks.filter(task => !task.completed)
  const activeLeads = leads.filter(lead => !['Enrolled', 'Closed'].includes(lead.status))
  return <><div className="gss-crm-section-heading"><div><h2>Admissions at a glance</h2><p>A shared view of new interest, applications and the next actions for your team.</p></div></div><div className="gss-crm-metrics"><Metric label="Active enquiries" value={activeLeads.length} detail={`${leads.filter(lead => lead.status === 'New enquiry').length} waiting for first contact`} /><Metric label="Applications" value={applications.length} detail={`${applications.filter(item => item.stage === 'Under review').length} ready for review`} /><Metric label="Enrolled learners" value={applications.filter(item => item.stage === 'Enrolled').length} detail="Across the preview admissions pipeline" /><Metric label="Open follow-ups" value={openTasks.length} detail={`${openTasks.filter(task => task.due < localDate()).length} overdue tasks`} /></div><div className="gss-crm-overview-grid"><section className="gss-crm-card"><div className="gss-crm-card-heading"><div><h3>Application progress</h3><p>Where learners are in their admissions journey.</p></div>{onNavigate && <button className="gss-crm-text-button" type="button" onClick={() => onNavigate('applications')}>View pipeline <span aria-hidden="true">↗</span></button>}</div><ol className="gss-crm-stage-summary">{applicationStages.map((stage, index) => { const count = applications.filter(item => item.stage === stage).length; return <li key={stage}><span className="gss-crm-stage-number">{String(index + 1).padStart(2, '0')}</span><div><span>{stage}</span><div className="gss-crm-bar-track" aria-hidden="true"><span style={{width:`${applications.length ? Math.max(count / applications.length * 100, 3) : 0}%`}} /></div></div><strong>{count}<span className="gss-crm-sr-only"> applications</span></strong></li> })}</ol></section><section className="gss-crm-card"><div className="gss-crm-card-heading"><div><h3>Next actions</h3><p>Complete a follow-up when it has been handled.</p></div>{onNavigate && <button type="button" className="gss-crm-text-button" onClick={() => onNavigate('tasks')}>All tasks <span aria-hidden="true">↗</span></button>}</div>{openTasks.length ? <TaskList tasks={openTasks.slice(0, 4)} onToggle={onToggleTask} compact /> : <EmptyState title="No open follow-ups">Your team is up to date.</EmptyState>}</section></div><section className="gss-crm-card"><div className="gss-crm-card-heading"><div><h3>Recent enquiries</h3><p>The latest learners looking for their next step.</p></div>{onNavigate && <button type="button" className="gss-crm-text-button" onClick={() => onNavigate('leads')}>All enquiries <span aria-hidden="true">↗</span></button>}</div><ul className="gss-crm-recent-list">{leads.slice(0, 4).map(lead => <li key={lead.id}><span className="gss-crm-avatar" aria-hidden="true">{lead.name.split(' ').map(part => part[0]).slice(0, 2).join('')}</span><div><strong>{lead.name}</strong><span>{lead.programme}</span></div><Status value={lead.status} /></li>)}</ul></section></>
}

export default function CrmWorkspace({ section, showNavigation = true, onNavigate }) {
  const [localSection, setLocalSection] = useState('overview')
  const [leads, setLeads] = useState(initialLeads)
  const [applications, setApplications] = useState(initialApplications)
  const [students, setStudents] = useState(initialStudents)
  const [tasks, setTasks] = useState(initialTasks)
  const [conversations, setConversations] = useState(initialConversations)
  const [intakes, setIntakes] = useState(initialIntakes)
  const [reviews, setReviews] = useState({})
  const [announcement, setAnnouncement] = useState('')
  function announce(message) {
    setAnnouncement(message)
    recordWorkspaceActivity({ area: 'Admissions', action: message.slice(0, 160), outcome: 'Updated' })
  }
  function enrolStudent(application) {
    const relatedLead = leads.find(lead => lead.name === application.name && lead.programme === application.programme)
    setStudents(current => current.some(student => student.name === application.name && student.programme === application.programme) ? current : [...current, {
      id: `GSS-S${crypto.randomUUID().slice(0, 8).toUpperCase()}`, name: application.name,
      email: relatedLead?.email || 'Email not recorded', country: relatedLead?.country || 'Country not recorded',
      programme: application.programme, intake: application.intake, status: 'Active', advisor: 'Student support',
    }])
    if (relatedLead) setLeads(current => current.map(lead => lead.id === relatedLead.id ? { ...lead, status: 'Enrolled', owner: 'Student support' } : lead))
  }
  const activeSection = sections.some(([value]) => value === section) ? section : localSection
  function navigate(value) { if (onNavigate) onNavigate(value); else setLocalSection(value) }
  function toggleOverviewTask(id) {
    setTasks(current => current.map(task => task.id === id ? { ...task, completed: !task.completed } : task))
    announce('Follow-up task updated.')
  }
  const canNavigate = section === undefined || typeof onNavigate === 'function'
  return <div className="gss-crm">
    <div className="gss-crm-preview-note"><span className="gss-crm-preview-dot" aria-hidden="true" /><p>Preview workspace <span>· Synthetic records. Changes stay in this session.</span></p></div>
    {showNavigation && canNavigate && <nav className="gss-crm-tabs" aria-label="CRM sections">{sections.map(([value, label]) => <button key={value} type="button" aria-current={activeSection === value ? 'page' : undefined} onClick={() => navigate(value)}>{label}</button>)}</nav>}
    <p role="status" className="gss-crm-sr-only" aria-live="polite">{announcement}</p>
    {activeSection === 'overview' && <Overview leads={leads} applications={applications} tasks={tasks} onNavigate={canNavigate ? navigate : undefined} onToggleTask={toggleOverviewTask} />}
    {activeSection === 'leads' && <Leads leads={leads} setLeads={setLeads} announce={announce} />}
    {activeSection === 'applications' && <Applications applications={applications} setApplications={setApplications} announce={announce} />}
    {activeSection === 'students' && <Students students={students} />}
    {activeSection === 'tasks' && <Tasks tasks={tasks} setTasks={setTasks} announce={announce} />}
    {activeSection === 'contacts' && <Contacts leads={leads} setLeads={setLeads} students={students} announce={announce} />}
    {activeSection === 'communications' && <Communications leads={leads} conversations={conversations} setConversations={setConversations} announce={announce} />}
    {activeSection === 'intakes' && <Intakes intakes={intakes} setIntakes={setIntakes} applications={applications} setApplications={setApplications} reviews={reviews} setReviews={setReviews} onEnrolment={enrolStudent} announce={announce} />}
    {activeSection === 'reports' && <Reports leads={leads} applications={applications} tasks={tasks} conversations={conversations} />}
  </div>
}
