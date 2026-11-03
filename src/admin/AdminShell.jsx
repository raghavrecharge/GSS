import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo.jsx'
import './admin.css'
import { markNotificationRead, useWorkspaceState } from './services/workspaceState.js'

const sections = [
  { label: 'Workspace', links: [{ to: '/admin', label: 'Overview', icon: 'grid', end: true }] },
  { label: 'Relationships', links: [
    { to: '/admin/crm', label: 'CRM dashboard', icon: 'pulse', end: true },
    { to: '/admin/crm/leads', label: 'Leads', icon: 'users' },
    { to: '/admin/crm/applications', label: 'Applications', icon: 'pipeline' },
    { to: '/admin/crm/students', label: 'Students', icon: 'student' },
    { to: '/admin/crm/tasks', label: 'Tasks', icon: 'check' },
    { to: '/admin/crm/contacts', label: 'Contacts', icon: 'users' },
    { to: '/admin/crm/communications', label: 'Communications', icon: 'mail' },
    { to: '/admin/crm/intakes', label: 'Intakes', icon: 'calendar' },
    { to: '/admin/crm/reports', label: 'Admissions reports', icon: 'chart' },
    { to: '/admin/crm/programmes', label: 'Programme relationships', icon: 'book' },
  ] },
  { label: 'Content', links: [
    { to: '/admin/cms', label: 'CMS dashboard', icon: 'layout', end: true },
    { to: '/admin/cms/pages', label: 'Pages', icon: 'page' },
    { to: '/admin/cms/programmes', label: 'Programmes', icon: 'book' },
    { to: '/admin/cms/course-review', label: 'Course evidence review', icon: 'check' },
    { to: '/admin/cms/media', label: 'Media', icon: 'image' },
    { to: '/admin/cms/navigation', label: 'Navigation', icon: 'menu' },
    { to: '/admin/cms/universities', label: 'Universities', icon: 'student' },
    { to: '/admin/cms/countries', label: 'Countries', icon: 'globe' },
    { to: '/admin/cms/taxonomies', label: 'Categories & subjects', icon: 'grid' },
    { to: '/admin/cms/testimonials', label: 'Testimonials', icon: 'quote' },
    { to: '/admin/cms/faqs', label: 'FAQs', icon: 'help' },
    { to: '/admin/cms/forms', label: 'Forms', icon: 'page' },
    { to: '/admin/cms/blocks', label: 'Reusable blocks', icon: 'layout' },
    { to: '/admin/cms/publishing', label: 'Publishing queue', icon: 'check' },
    { to: '/admin/cms/settings', label: 'Website settings', icon: 'settings' },
  ] },
  { label: 'Operations', links: [
    { to: '/admin/reports', label: 'Workspace reports', icon: 'chart' },
    { to: '/admin/activity', label: 'Activity log', icon: 'pulse' },
    { to: '/admin/settings', label: 'Workspace settings', icon: 'settings' },
  ] },
]

const titles = {
  '/admin': 'Admin overview', '/admin/crm': 'CRM dashboard', '/admin/crm/leads': 'Leads',
  '/admin/crm/applications': 'Applications', '/admin/crm/students': 'Students', '/admin/crm/tasks': 'Tasks',
  '/admin/cms': 'CMS dashboard', '/admin/cms/pages': 'Pages', '/admin/cms/programmes': 'Programmes',
  '/admin/cms/media': 'Media library', '/admin/cms/navigation': 'Navigation',
  '/admin/activity': 'Activity log', '/admin/reports': 'Workspace reports', '/admin/settings': 'Workspace settings',
}
for (const section of sections) for (const link of section.links) titles[link.to] ||= link.label

function AdminIcon({ name }) {
  const paths = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    pulse: <path d="M3 12h4l2.2-6 4.2 12 2.2-6H21" />,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    pipeline: <><circle cx="5" cy="5" r="2" /><circle cx="19" cy="5" r="2" /><circle cx="12" cy="19" r="2" /><path d="M7 5h10M5 7v3a9 9 0 0 0 7 8.8M19 7v3a9 9 0 0 1-7 8.8" /></>,
    student: <><path d="m3 10 9-5 9 5-9 5-9-5Z" /><path d="M7 12.5V17c2.8 2.2 7.2 2.2 10 0v-4.5M21 10v6" /></>,
    check: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
    layout: <><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18M9 21V9" /></>,
    page: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6M8 13h8M8 17h6" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    image: <><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 6 9 7 9-7" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 11h18" /></>,
    chart: <><path d="M3 3v18h18M7 17v-5M12 17V7M17 17v-8" /></>,
    globe: <><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></>,
    quote: <><path d="M10 5H4v7h5c0 3-1 4-3 5M21 5h-6v7h5c0 3-1 4-3 5" /></>,
    help: <><circle cx="12" cy="12" r="9" /><path d="M9 9a3 3 0 0 1 6 0c0 2-3 2-3 5M12 17h.01" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="m9 3-1 3-3 1 1 3-3 2 3 2-1 3 3 1 1 3h6l1-3 3-1-1-3 3-2-3-2 1-3-3-1-1-3Z" /></>,
  }
  return <svg className="gss-admin-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name] || paths.grid}</svg>
}

export default function AdminShell({ children }) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [compactNavigation, setCompactNavigation] = useState(() => window.matchMedia?.('(max-width: 1100px)').matches ?? false)
  const sidebar = useRef(null)
  const menuTrigger = useRef(null)
  const [utility, setUtility] = useState(null)
  const [search, setSearch] = useState('')
  const utilityDialog = useRef(null)
  const utilityTrigger = useRef(null)
  const workspace = useWorkspaceState()
  const unread = workspace.notifications.filter((item) => !item.read).length
  const destinations = sections.flatMap((section) => section.links.map((link) => ({ ...link, group: section.label })))
  const matches = destinations.filter((link) => `${link.label} ${link.group}`.toLowerCase().includes(search.trim().toLowerCase()))
  const title = useMemo(() => titles[location.pathname] || 'GSS admin', [location.pathname])

  useEffect(() => {
    const previousClass = document.body.className
    document.body.className = 'gss-admin-body'
    document.title = `${title} | The Global School of Skills (GSS)`
    window.scrollTo(0, 0)
    return () => { document.body.className = previousClass }
  }, [location.pathname, title])

  useEffect(() => {
    if (!menuOpen) return undefined
    const previousOverflow = document.body.style.overflow
    if (compactNavigation) document.body.style.overflow = 'hidden'
    const close = (event) => {
      if (event.key === 'Escape') { setMenuOpen(false); menuTrigger.current?.focus() }
      if (event.key === 'Tab' && compactNavigation) {
        const controls = [...sidebar.current.querySelectorAll('a,summary')].filter((item) => item.getClientRects().length)
        const first = controls[0]
        const last = controls.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    if (compactNavigation) sidebar.current.querySelector('a.active')?.focus()
    document.addEventListener('keydown', close)
    return () => { document.removeEventListener('keydown', close); document.body.style.overflow = previousOverflow }
  }, [menuOpen, compactNavigation])

  useEffect(() => {
    const query = window.matchMedia?.('(max-width: 1100px)')
    if (!query) return undefined
    const change = () => setCompactNavigation(query.matches)
    query.addEventListener('change', change)
    return () => query.removeEventListener('change', change)
  }, [])

  useEffect(() => {
    const shortcut = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        utilityTrigger.current = document.activeElement
        setSearch('')
        setUtility('search')
      }
    }
    document.addEventListener('keydown', shortcut)
    return () => document.removeEventListener('keydown', shortcut)
  }, [])

  useEffect(() => {
    const dialog = utilityDialog.current
    if (utility && dialog && !dialog.open) dialog.showModal()
    if (!utility && dialog?.open) dialog.close()
  }, [utility])

  function openUtility(name, event) { utilityTrigger.current = event.currentTarget; setSearch(''); setUtility(name) }
  function closeUtility() { setUtility(null); utilityDialog.current?.close(); utilityTrigger.current?.focus() }

  return <div className="gss-admin-shell">
    <a className="gss-admin-skip-link" href="#admin-main">Skip to workspace content</a>
    <aside ref={sidebar} className={`gss-admin-sidebar${menuOpen ? ' is-open' : ''}`} aria-label="Admin navigation" inert={compactNavigation && !menuOpen}>
      <div className="gss-admin-brand"><Link to="/admin" aria-label="GSS admin overview"><BrandLogo /></Link><span>Admin workspace</span></div>
      <nav>{sections.map((section) => <details className="gss-admin-nav-group" key={section.label} open><summary>{section.label}</summary>{section.links.map((link) => <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setMenuOpen(false)}><AdminIcon name={link.icon} /><span>{link.label}</span></NavLink>)}</details>)}</nav>
      <div className="gss-admin-sidebar-footer"><span className="gss-admin-status-dot" aria-hidden="true" /><div><strong>Demo workspace</strong><small>No production data connected</small></div></div>
    </aside>
    <div className="gss-admin-stage">
      <header className="gss-admin-topbar">
        <button ref={menuTrigger} className="gss-admin-menu-button" type="button" aria-label={menuOpen ? 'Close admin navigation' : 'Open admin navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><AdminIcon name="menu" /></button>
        <div><span className="gss-admin-eyebrow">GSS operations</span><h1>{title}</h1></div>
        <div className="gss-admin-topbar-actions"><button className="gss-admin-utility-button gss-admin-search-trigger" type="button" aria-label="Search admin workspace" onClick={(event) => openUtility('search', event)}><AdminIcon name="search" /><span>Search</span><kbd>Ctrl K</kbd></button><button className="gss-admin-utility-button gss-admin-notification-trigger" type="button" aria-label={`Notifications, ${unread} unread`} onClick={(event) => openUtility('notifications', event)}><AdminIcon name="bell" />{unread > 0 && <b>{unread}</b>}</button><span className="gss-admin-demo-badge">Demo mode</span><Link className="gss-admin-view-site" to="/">View website <span aria-hidden="true">↗</span></Link><button className="gss-admin-avatar" type="button" aria-label="Open account menu" onClick={(event) => openUtility('account', event)}>GA</button></div>
      </header>
      <main id="admin-main" tabIndex={-1} className="gss-admin-main">{children}</main>
    </div>
    {menuOpen && <button className="gss-admin-scrim" type="button" aria-label="Close admin navigation" onClick={() => setMenuOpen(false)} />}
    <dialog ref={utilityDialog} className="gss-admin-utility-dialog" aria-labelledby="admin-utility-title" onCancel={(event) => { event.preventDefault(); closeUtility() }} onClick={(event) => { if (event.target === event.currentTarget) closeUtility() }}>
      <div className="gss-admin-utility-heading"><div><span className="gss-admin-kicker">GSS workspace</span><h2 id="admin-utility-title">{utility === 'search' ? 'Find a workspace' : utility === 'notifications' ? 'Notifications' : 'Your workspace'}</h2></div><button type="button" className="gss-admin-utility-button" aria-label="Close workspace panel" onClick={closeUtility}>×</button></div>
      {utility === 'search' && <><label className="gss-admin-field"><span>Search destinations</span><input autoFocus type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Try programmes, contacts or reports" /></label><p className="gss-admin-utility-meta" aria-live="polite">{matches.length} destinations</p><div className="gss-admin-search-results">{matches.length ? matches.map((link) => <Link key={link.to} to={link.to} onClick={() => { closeUtility(); setMenuOpen(false) }}><AdminIcon name={link.icon} /><span><strong>{link.label}</strong><small>{link.group}</small></span><span aria-hidden="true">↗</span></Link>) : <p>No destinations match. Try a different keyword.</p>}</div></>}
      {utility === 'notifications' && <><div className="gss-admin-utility-toolbar"><p>{unread} unread updates</p><button type="button" onClick={() => markNotificationRead('all')} disabled={!unread}>Mark all as read</button></div><ul className="gss-admin-notices">{workspace.notifications.map((notice) => <li key={notice.id} className={notice.read ? 'is-read' : ''}><span className="gss-admin-notice-dot" aria-hidden="true" /><div><strong>{notice.title}</strong><p>{notice.detail}</p><Link to={notice.to} onClick={() => { markNotificationRead(notice.id); closeUtility() }}>Open workspace <span aria-hidden="true">↗</span></Link></div><button type="button" aria-label={`Mark ${notice.title} as read`} onClick={() => markNotificationRead(notice.id)} disabled={notice.read}>{notice.read ? 'Read' : 'Mark read'}</button></li>)}</ul></>}
      {utility === 'account' && <div className="gss-admin-account"><span className="gss-admin-avatar">GA</span><h3>GSS administrator</h3><p>{workspace.preferences.workspaceName}</p><p className="gss-admin-utility-meta">Your administrator session is protected by the GSS server.</p><Link to="/admin/settings" onClick={closeUtility}>Workspace settings</Link><Link to="/admin/activity" onClick={closeUtility}>View activity log</Link><Link to="/" onClick={closeUtility}>Return to the website</Link><button type="button" onClick={() => { closeUtility(); window.dispatchEvent(new Event('gss:logout')) }}>Sign out</button></div>}
    </dialog>
  </div>
}

export { AdminIcon }
