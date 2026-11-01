import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPages, createProgrammes, initialMedia, initialNavigation } from './cmsData.js'
import { collectionDefinitions, createCollections, initialForms, initialSettings } from './cmsCollections.js'
import { CollectionManager, FormsManager, PublishingManager, SettingsManager } from './CmsOperations.jsx'
import { recordWorkspaceActivity } from '../services/workspaceState.js'
import { CustomSectionsEditor, ProgrammeStructureEditor, ProgrammeStructurePreview } from './StructuredFields.jsx'
import { validateStructuredDraft } from './structuredData.js'
import NavigationManager from './NavigationManager.jsx'
import { additionalNavigation } from './cmsNavigationData.js'
import './cms.css'

const sections = [
  ['overview', 'Overview', 'squares-four'], ['pages', 'Pages', 'files'],
  ['programmes', 'Programmes', 'graduation-cap'], ['media', 'Media library', 'images'],
  ['navigation', 'Navigation', 'list-bullets'],
  ['universities', 'Universities & partners', 'buildings'], ['countries', 'Countries & locations', 'globe'],
  ['taxonomies', 'Categories & specialisations', 'tag'], ['testimonials', 'Testimonials', 'quotes'],
  ['faqs', 'FAQs', 'question'], ['forms', 'Forms', 'clipboard-text'], ['blocks', 'Reusable blocks', 'stack'],
  ['publishing', 'Publishing & revisions', 'check-circle'], ['settings', 'Site settings', 'gear'],
]

function Icon({ name }) { return <i className={`ph ph-${name}`} aria-hidden="true" /> }
function Status({ value }) { return <span className={`cms-status cms-status--${value.toLowerCase()}`}>{value}</span> }

function ContentEditor({ record, existingPaths, onSave, onClose }) {
  const [draft, setDraft] = useState({ ...record })
  const [preview, setPreview] = useState(false)
  const [errors, setErrors] = useState({})
  const [discard, setDiscard] = useState(false)
  const dialog = useRef(null)
  const fieldId = useId()
  const dirty = JSON.stringify(draft) !== JSON.stringify(record)
  const programme = draft.kind === 'programme'
  useEffect(() => {
    const element = dialog.current
    element.showModal()
    return () => element.close()
  }, [])
  const change = (field, value) => { setDraft(current => ({ ...current, [field]: value })); setErrors(current => ({ ...current, [field]: undefined })); setDiscard(false) }
  const close = () => dirty ? setDiscard(true) : onClose()
  const save = (event) => {
    event.preventDefault()
    const nextErrors = {}
    if (!draft.title.trim()) nextErrors.title = 'Enter a title.'
    if (!/^\/(?!\/)[a-zA-Z0-9/_-]*$/.test(draft.path)) nextErrors.path = 'Use a local path, such as /about or /programmes/my-course.'
    else if (existingPaths.includes(draft.path)) nextErrors.path = 'Another content item already uses this page path.'
    if (!draft.content.trim()) nextErrors.content = 'Add the main page content.'
    if (draft.description.length > 320) nextErrors.description = 'Keep the description within 320 characters.'
    const structuredError = validateStructuredDraft(draft)
    if (structuredError) nextErrors.structured = structuredError
    if (draft.ctaPath && !/^\/(?!\/)[a-zA-Z0-9/_#-]*$/.test(draft.ctaPath)) nextErrors.structured = 'Use a local destination for the call to action.'
    if (programme && draft.image && !/^\/assets\/[a-zA-Z0-9/_.-]+$/.test(draft.image)) nextErrors.structured = 'Use an existing local asset path for the programme image.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => dialog.current?.querySelector('[aria-invalid="true"]')?.focus())
      return
    }
    const lines = text => String(text || '').split('\n').map(item => item.trim()).filter(Boolean)
    onSave({ ...draft, title: draft.title.trim(), updated: new Date().toISOString().slice(0, 10), ...(programme ? {
      longDescription: draft.content, accreditation: draft.accreditationText, entry: lines(draft.entryText), outcomes: lines(draft.outcomesText), subjects: lines(draft.subjectsText), gettingStarted: lines(draft.gettingStartedText),
      modules: (draft.moduleRecords || []).map(module => ({ title: module.title, summary: module.summary, meta: module.meta, lectures: Number(module.lectures) || 0, quizzes: Number(module.quizzes) || 0, lessons: module.lessons.map(({ title, type }) => ({ title, type })) })),
      advantages: (draft.advantageRecords || []).map(({ icon, title, text }) => [icon, title, text]), certificateDetails: (draft.credentialRecords || []).map(({ icon, title, text }) => [icon, title, text]), testimonials: (draft.testimonialRecords || []).map(({ name, quote }) => [name, quote]), faqs: (draft.faqRecords || []).map(({ question, answer }) => ({ question, answer })),
    } : {}) })
  }
  const input = (field, label, options = {}) => {
    if (field === 'modulesText') return null
    return <label className={`cms-field ${options.wide ? 'cms-field--wide' : ''}`} htmlFor={`${fieldId}-${field}`}>
    <span>{label}{options.required && <span aria-hidden="true"> *</span>}</span>
    {options.multiline ? <textarea id={`${fieldId}-${field}`} rows={options.rows || 4} value={draft[field] || ''} onChange={event => change(field, event.target.value)} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${fieldId}-${field}-error` : undefined} maxLength={options.maxLength || 30000} /> : <input id={`${fieldId}-${field}`} value={draft[field] || ''} onChange={event => change(field, event.target.value)} aria-invalid={Boolean(errors[field])} aria-describedby={errors[field] ? `${fieldId}-${field}-error` : undefined} maxLength={options.maxLength || 240} />}
    {errors[field] && <small className="cms-field-error" id={`${fieldId}-${field}-error`}>{errors[field]}</small>}
  </label> }
  return <dialog ref={dialog} className="gss-cms cms-editor" aria-labelledby={`${fieldId}-dialog-title`} onCancel={event => { event.preventDefault(); close() }}>
    <form onSubmit={save} noValidate>
      <div className="cms-editor__header"><div><span className="cms-eyebrow">{programme ? 'Programme editor' : 'Page editor'}</span><h2 id={`${fieldId}-dialog-title`}>{record.title || 'New page'}</h2></div><button className="cms-icon-button" type="button" onClick={close} aria-label="Close editor"><Icon name="x" /></button></div>
      <div className="cms-editor__toolbar"><span className="cms-demo-label">Preview workspace · changes stay in this session</span><button className="cms-button cms-button--quiet" type="button" aria-pressed={preview} onClick={() => setPreview(value => !value)}><Icon name={preview ? 'pencil-simple' : 'eye'} />{preview ? 'Continue editing' : 'Preview content'}</button></div>
      {preview ? <article className="cms-content-preview"><span className="cms-eyebrow">Content preview</span><h2>{draft.title || 'Untitled page'}</h2><p className="cms-content-preview__intro">{draft.description}</p><div>{draft.content.split('\n').map((paragraph, index) => <p key={index}>{paragraph || '\u00a0'}</p>)}</div>{programme && <><h3>Programme information</h3><dl><div><dt>Awarding institution</dt><dd>{draft.university || 'Not set'}</dd></div><div><dt>Duration</dt><dd>{draft.duration || 'Not set'}</dd></div><div><dt>Tuition</dt><dd>{draft.fee || 'Not set'}</dd></div></dl><h3>Modules</h3><p className="cms-preserve-lines">{draft.modulesText || 'No modules added.'}</p><h3>Entry requirements</h3><p className="cms-preserve-lines">{draft.entryText || 'No entry requirements added.'}</p></>}</article> : <div className="cms-editor__body"><div className="cms-editor__main"><h3>Content</h3><div className="cms-form-grid">{input('title', 'Title', { required: true, wide: true })}{input('path', 'Page path', { required: true, wide: true })}{input('description', 'Short description', { multiline: true, rows: 3, wide: true, maxLength: 321 })}{input('content', 'Main content', { multiline: true, rows: 9, required: true, wide: true })}</div>{programme && <><h3>Programme details</h3><div className="cms-form-grid">{input('university', 'Awarding institution', { wide: true })}{input('duration', 'Duration')}{input('mode', 'Study mode')}{input('fee', 'Tuition fee')}{input('monthly', 'Monthly payment')}{input('modulesText', 'Modules · one per line', { multiline: true, rows: 7, wide: true })}{input('entryText', 'Entry requirements', { multiline: true, wide: true })}{input('accreditationText', 'Accreditation', { multiline: true, wide: true })}</div></>}<h3>Search appearance</h3>{input('seoTitle', 'SEO title', { maxLength: 120 })}</div><aside className="cms-editor__aside"><h3>Publishing</h3><label className="cms-field" htmlFor={`${fieldId}-status`}><span>Editorial status</span><select id={`${fieldId}-status`} value={draft.status} onChange={event => change('status', event.target.value)}><option>Draft</option><option>Review</option><option>Published</option></select></label><p className="cms-muted">Changing this status updates the preview workspace. It does not publish to the live website.</p><dl className="cms-metadata"><div><dt>Content type</dt><dd>{programme ? 'Programme' : 'Website page'}</dd></div><div><dt>Last updated</dt><dd>{record.updated}</dd></div></dl></aside></div>}
      {programme && <section className={preview ? 'cms-content-preview' : 'cms-editor__main'} aria-label="Additional programme information"><h3>Full programme information</h3>{preview ? [['courseDetails', 'Course details'], ['outcomesText', 'Learning outcomes'], ['progression', 'University progression'], ['workshops', 'Workshops'], ['visa', 'Visa requirements'], ['library', 'Library'], ['certificate', 'Certificate'], ['tuitionNotes', 'Tuition notes']].filter(([key]) => draft[key]).map(([key, label]) => <div key={key}><h3>{label}</h3><p className="cms-preserve-lines">{draft[key]}</p></div>) : <div className="cms-form-grid">{[['courseDetails', 'Course details'], ['outcomesText', 'Learning outcomes · one per line'], ['progression', 'University progression'], ['workshops', 'Workshops'], ['visa', 'Visa requirements'], ['library', 'Library resources'], ['tuitionNotes', 'Tuition and additional fee notes']].map(([key, label]) => <div key={key} className="cms-field--wide">{input(key, label, { multiline: true, rows: 4, wide: true })}</div>)}</div>}</section>}
      {programme && !preview && <ProgrammeStructureEditor draft={draft} onChange={change} />}
      {programme && preview && <ProgrammeStructurePreview draft={draft} />}
      {!programme && !preview && <section className="cms-editor__main" aria-label="Page configuration"><h3>Page layout, navigation & actions</h3><div className="cms-form-grid"><label className="cms-field"><span>Page template</span><select value={draft.template || 'Standard page'} onChange={event => change('template', event.target.value)}><option>Standard page</option><option>Landing page</option><option>Information page</option><option>Policy page</option><option>Contact page</option></select></label>{[['navigationLabel', 'Navigation label'], ['parentPath', 'Parent page path'], ['heroTitle', 'Hero heading'], ['heroImage', 'Hero image path'], ['ctaLabel', 'Call to action label'], ['ctaPath', 'Call to action path'], ['seoDescription', 'SEO description']].map(([key, label]) => <div key={key}>{input(key, label, { multiline: key === 'seoDescription', maxLength: key === 'seoDescription' ? 320 : 240 })}</div>)}</div></section>}
      <CustomSectionsEditor sections={draft.customSections || []} onChange={value => change('customSections', value)} preview={preview} />
      {errors.structured && <p className="cms-operations-notice cms-field-error" role="alert">{errors.structured}</p>}
      <div className="cms-editor__footer">{discard ? <div className="cms-discard" role="alert"><span>Discard your unsaved changes?</span><button type="button" className="cms-button cms-button--quiet" onClick={() => setDiscard(false)}>Keep editing</button><button type="button" className="cms-button" onClick={onClose}>Discard changes</button></div> : <><span className="cms-muted">{dirty ? 'Unsaved changes' : 'All changes saved in this session'}</span><div className="cms-actions"><button type="button" className="cms-button cms-button--quiet" onClick={close}>Cancel</button><button type="submit" className="cms-button"><Icon name="floppy-disk" />Save changes</button></div></>}</div>
    </form>
  </dialog>
}

function ContentList({ records, title, description, onEdit, onNew }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All statuses')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const filtered = useMemo(() => records.filter(record => `${record.title} ${record.path} ${record.university || ''}`.toLowerCase().includes(query.toLowerCase()) && (status === 'All statuses' || record.status === status)), [records, query, status])
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const id = useId()
  return <section className="cms-panel"><div className="cms-panel__header"><div><h2>{title}</h2><p>{description}</p></div>{onNew && <button className="cms-button" onClick={onNew}><Icon name="plus" />New page</button>}</div><div className="cms-filters"><label className="cms-search" htmlFor={`${id}-search`}><Icon name="magnifying-glass" /><span className="cms-sr-only">Search {title.toLowerCase()}</span><input id={`${id}-search`} type="search" placeholder={`Search ${title.toLowerCase()}…`} value={query} onChange={event => { setQuery(event.target.value); setPage(1) }} /></label><label htmlFor={`${id}-status`} className="cms-filter-label"><span className="cms-sr-only">Filter by status</span><select id={`${id}-status`} value={status} onChange={event => { setStatus(event.target.value); setPage(1) }}><option>All statuses</option><option>Published</option><option>Draft</option><option>Review</option></select></label></div><div className="cms-table-wrap"><table className="cms-table"><caption className="cms-sr-only">{title}, {filtered.length} matching entries</caption><thead><tr><th scope="col">{title === 'Programmes' ? 'Programme' : 'Page title'}</th><th scope="col">Status</th><th scope="col">{title === 'Programmes' ? 'Institution' : 'Page path'}</th><th scope="col">Updated</th><th scope="col"><span className="cms-sr-only">Actions</span></th></tr></thead><tbody>{visible.map(record => <tr key={record.id}><th scope="row"><button className="cms-text-button cms-content-title" onClick={() => onEdit(record)}>{record.title}</button>{record.kind === 'programme' && <small>{record.level || record.categorySlug}</small>}</th><td><Status value={record.status} /></td><td className="cms-table__secondary">{record.kind === 'programme' ? record.university || 'GSS' : record.path}</td><td className="cms-nowrap">{record.updated}</td><td><button className="cms-icon-button" onClick={() => onEdit(record)} aria-label={`Edit ${record.title}`}><Icon name="pencil-simple" /></button></td></tr>)}</tbody></table>{!visible.length && <div className="cms-empty"><Icon name="magnifying-glass" /><h3>No matching content</h3><p>Try a different title or status.</p><button className="cms-button cms-button--quiet" onClick={() => { setQuery(''); setStatus('All statuses'); setPage(1) }}>Clear filters</button></div>}</div><div className="cms-pagination"><span>{filtered.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length}` : '0 entries'}</span><div className="cms-actions"><button className="cms-icon-button" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page"><Icon name="caret-left" /></button><span>Page {currentPage} of {totalPages}</span><button className="cms-icon-button" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Next page"><Icon name="caret-right" /></button></div></div></section>
}

function MediaLibrary({ media, onUpdate }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(media[0]?.id)
  const [notice, setNotice] = useState('')
  const selected = media.find(item => item.id === selectedId)
  const filtered = media.filter(item => `${item.title} ${item.type}`.toLowerCase().includes(query.toLowerCase()))
  const id = useId()
  return <section className="cms-panel"><div className="cms-panel__header"><div><h2>Media library</h2><p>Organise the images and brand assets already used across GSS.</p></div><span className="cms-count">{media.length} assets</span></div><label className="cms-search cms-media-search" htmlFor={`${id}-search`}><Icon name="magnifying-glass" /><span className="cms-sr-only">Search media</span><input type="search" id={`${id}-search`} value={query} onChange={event => setQuery(event.target.value)} placeholder="Search assets…" /></label><div className="cms-media-layout"><div className="cms-media-grid">{filtered.map(item => <button className={`cms-media-card ${selectedId === item.id ? 'is-selected' : ''}`} key={item.id} aria-pressed={selectedId === item.id} onClick={() => { setSelectedId(item.id); setNotice('') }}><div className="cms-media-card__image"><img src={item.src} alt="" loading="lazy" /></div><span>{item.title}</span><small>{item.type} · {item.usage}</small></button>)}{!filtered.length && <div className="cms-empty"><h3>No assets found</h3><p>Try another search term.</p></div>}</div>{selected && <aside className="cms-asset-details"><h3>Asset details</h3><img src={selected.src} alt={selected.alt} /><form key={selected.id} onSubmit={event => { event.preventDefault(); const data = new FormData(event.currentTarget); onUpdate({ ...selected, title: String(data.get('title')).trim(), alt: String(data.get('alt')).trim() }); setNotice('Asset description saved in this session.') }}><label className="cms-field"><span>Asset title</span><input name="title" required maxLength={120} defaultValue={selected.title} /></label><label className="cms-field"><span>Alternative text</span><textarea name="alt" rows={3} maxLength={240} defaultValue={selected.alt} /></label><p className="cms-muted">Describe the image for people using screen readers. Leave empty only if the image is decorative.</p><button className="cms-button" type="submit">Save description</button></form><p className="cms-notice" role="status">{notice}</p><a className="cms-text-button" href={selected.src} target="_blank" rel="noreferrer">Open original <Icon name="arrow-up-right" /></a></aside>}</div></section>
}

function NavigationEditor({ items, onChange }) {
  return <NavigationManager items={items} onChange={onChange} />
}

function Overview({ pages, programmes, media, onView, onEdit }) {
  const allContent = [...pages, ...programmes]
  const stats = [ ['Website pages', pages.length, 'files'], ['Programmes', programmes.length, 'graduation-cap'], ['In review', allContent.filter(record => record.status === 'Review').length, 'clock'], ['Media assets', media.length, 'images'] ]
  return <><div className="cms-stat-grid">{stats.map(([label, value, icon]) => <div className="cms-stat" key={label}><span className="cms-stat__icon"><Icon name={icon} /></span><span>{label}</span><strong>{value.toLocaleString()}</strong></div>)}</div><div className="cms-overview-grid"><section className="cms-panel"><div className="cms-panel__header"><div><h2>Content workspace</h2><p>Keep every part of your learning catalogue up to date.</p></div></div><div className="cms-workspace-links">{sections.slice(1).map(([key, label, icon]) => <button key={key} onClick={() => onView(key)}><span className="cms-workspace-links__icon"><Icon name={icon} /></span><span><strong>{label}</strong><small>{{pages:'Edit website copy and search appearance',programmes:'Manage course information and modules',media:'Review images and accessible descriptions',navigation:'Organise your main menu'}[key]}</small></span><Icon name="arrow-up-right" /></button>)}</div></section><section className="cms-panel"><div className="cms-panel__header"><div><h2>Recently available</h2><p>Open an item to start an editorial update.</p></div></div><div className="cms-recent-list">{[...pages.slice(0, 3), ...programmes.slice(0, 2)].map(record => <button key={record.id} onClick={() => onEdit(record)}><span><strong>{record.title}</strong><small>{record.kind === 'programme' ? 'Programme' : 'Website page'} · {record.updated}</small></span><Status value={record.status} /></button>)}</div></section></div></>
}

export default function CmsWorkspace({ initialView = 'overview', view: controlledView, hideNavigation = false, onNavigate }) {
  const [view, setView] = useState(initialView)
  const [pages, setPages] = useState(createPages)
  const [programmes, setProgrammes] = useState(createProgrammes)
  const [media, setMedia] = useState(initialMedia)
  const [navigation, setNavigation] = useState(() => [...initialNavigation, ...additionalNavigation])
  const [collections, setCollections] = useState(createCollections)
  const [forms, setForms] = useState(initialForms)
  const [settings, setSettings] = useState(initialSettings)
  const [revisions, setRevisions] = useState([])
  const [editor, setEditor] = useState(null)
  const [notice, setNotice] = useState('')
  const activeView = controlledView || view
  const navigate = next => { setView(next); setNotice(''); onNavigate?.(next) }
  const save = record => {
    const previous = [...pages, ...programmes].find(item => item.id === record.id)
    if (previous) setRevisions(current => [{ id: crypto.randomUUID(), record: { ...previous }, created: new Date().toLocaleString() }, ...current])
    const update = current => current.some(item => item.id === record.id) ? current.map(item => item.id === record.id ? record : item) : [record, ...current]
    if (record.kind === 'programme') setProgrammes(update); else setPages(update)
    setNotice(`“${record.title}” saved in this session.`)
    setEditor(null)
    recordWorkspaceActivity({ area: 'Content', action: 'Content saved', detail: record.title, outcome: 'Success' })
  }
  const newPage = () => setEditor({ id: `page-${Date.now()}`, kind: 'page', title: '', path: '/', description: '', content: '', seoTitle: '', status: 'Draft', updated: new Date().toISOString().slice(0, 10) })
  const operationView = collectionDefinitions[activeView] ? <CollectionManager key={activeView} type={activeView} records={collections[activeView]} onChange={items => { setCollections(current => ({ ...current, [activeView]: items })); recordWorkspaceActivity({ area: 'Content', action: 'Collection updated', detail: collectionDefinitions[activeView].title, outcome: 'Success' }) }} /> : activeView === 'forms' ? <FormsManager forms={forms} onChange={setForms} /> : activeView === 'settings' ? <SettingsManager settings={settings} onChange={value => { setSettings(value); recordWorkspaceActivity({ area: 'Content', action: 'Site settings saved', detail: 'Brand, SEO and announcement settings', outcome: 'Success' }) }} /> : activeView === 'publishing' ? <PublishingManager records={[...pages, ...programmes]} revisions={revisions} onTransition={(record, status) => save({ ...record, status, updated: new Date().toISOString().slice(0, 10) })} onRestore={record => save({ ...record, status: 'Draft', updated: new Date().toISOString().slice(0, 10) })} onEdit={setEditor} /> : null
  return <div className="gss-cms">
    <div className="cms-workspace-heading"><div><span className="cms-eyebrow">Content management</span><h1>Your content, connected.</h1><p>Manage the GSS website and programme catalogue in one place.</p></div><span className="cms-demo-label"><span aria-hidden="true" />Preview workspace</span></div>
    {!hideNavigation && <nav className="cms-tabs" aria-label="Content management sections">{sections.map(([key, label, icon]) => <button key={key} className={activeView === key ? 'is-active' : ''} aria-current={activeView === key ? 'page' : undefined} onClick={() => navigate(key)}><Icon name={icon} />{label}</button>)}</nav>}
    <p className="cms-notice cms-workspace-notice" role="status">{notice}</p>
    {activeView === 'overview' && <Overview pages={pages} programmes={programmes} media={media} onView={navigate} onEdit={setEditor} />}
    {activeView === 'pages' && <ContentList records={pages} title="Website pages" description="Page content, editorial status and search appearance." onEdit={setEditor} onNew={newPage} />}
    {activeView === 'programmes' && <ContentList records={programmes} title="Programmes" description="Your existing GSS catalogue, ready for structured editorial updates." onEdit={setEditor} />}
    {activeView === 'media' && <MediaLibrary media={media} onUpdate={item => setMedia(current => current.map(asset => asset.id === item.id ? item : asset))} />}
    {activeView === 'navigation' && <NavigationEditor items={navigation} onChange={setNavigation} />}
    {operationView}
    {editor && <ContentEditor key={editor.id} record={editor} existingPaths={[...pages, ...programmes].filter(item => item.id !== editor.id).map(item => item.path)} onSave={save} onClose={() => setEditor(null)} />}
  </div>
}

export function CmsOverview() { return <CmsWorkspace initialView="overview" /> }
export function CmsPages() { return <CmsWorkspace initialView="pages" /> }
export function CmsProgrammes() { return <CmsWorkspace initialView="programmes" /> }
export function CmsMedia() { return <CmsWorkspace initialView="media" /> }
export function CmsNavigation() { return <CmsWorkspace initialView="navigation" /> }
