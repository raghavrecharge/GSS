import { useEffect, useRef, useState } from 'react'
import { dashboardRouteFromFile, navigate } from '../routes.js'
import { bindDashboardData } from '../data/dashboardBindings.js'

const assetPrefix = '/conca/'

function resolveAsset(value) {
  if (!value || /^(?:https?:|data:|#|mailto:|tel:|javascript:)/i.test(value)) return value
  if (value.startsWith('../../../cdn.plyr.io/')) return `https://cdn.plyr.io/${value.slice('../../../cdn.plyr.io/'.length)}`
  if (value.startsWith('assets/')) return `${assetPrefix}${value}`
  return value
}

function prepareDashboard(source, data) {
  const documentNode = new DOMParser().parseFromString(source, 'text/html')
  const stylesheetUrls = [...documentNode.querySelectorAll('link[rel="stylesheet"]')]
    .map((link) => resolveAsset(link.getAttribute('href')))
    .filter(Boolean)

  documentNode.body.querySelectorAll('script, noscript').forEach((node) => node.remove())
  documentNode.body.querySelectorAll('[src]').forEach((node) => node.setAttribute('src', resolveAsset(node.getAttribute('src'))))
  documentNode.body.querySelectorAll('[poster]').forEach((node) => node.setAttribute('poster', resolveAsset(node.getAttribute('poster'))))
  documentNode.body.querySelectorAll('[href]').forEach((node) => {
    const href = node.getAttribute('href')
    if (/^[^:#?]+\.html(?:#.*)?$/i.test(href || '')) {
      node.setAttribute('href', dashboardRouteFromFile(href.split('/').pop()))
    } else {
      node.setAttribute('href', resolveAsset(href))
    }
  })
  ;[...documentNode.body.querySelectorAll('.menu-title')].filter((node) => node.textContent.trim() === 'Orders').forEach((node) => {
    node.textContent = 'Applications'
    node.closest('a')?.setAttribute('href', '/dashboard/applications')
  })
  documentNode.body.querySelectorAll('[data-bg], [data-background]').forEach((node) => {
    const key = node.hasAttribute('data-bg') ? 'data-bg' : 'data-background'
    node.setAttribute(key, resolveAsset(node.getAttribute(key)))
  })
  documentNode.body.querySelectorAll('[style]').forEach((node) => {
    node.setAttribute('style', node.getAttribute('style').replaceAll('url(assets/', 'url(/conca/assets/'))
  })
  bindDashboardData(documentNode.body, data)

  return {
    html: documentNode.body.innerHTML,
    title: documentNode.title || 'Mindu Dashboard',
    bodyClass: documentNode.body.className,
    stylesheetUrls,
  }
}

export default function DashboardPage({ sourceFile, courses, course, path }) {
  const [page, setPage] = useState(null)
  const [error, setError] = useState('')
  const rootRef = useRef(null)
  const [csrfToken, setCsrfToken] = useState('')
  const [applications, setApplications] = useState([])
  const [adminCourses, setAdminCourses] = useState([])
  const setupToken = new URLSearchParams(window.location.search).get('setup') || ''

  useEffect(() => {
    const controller = new AbortController()
    fetch('/api/auth/session', { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => setCsrfToken(result?.csrfToken || ''))
      .catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!csrfToken) return
    fetch('/api/admin/courses', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load administrator catalogue.')))
      .then((result) => setAdminCourses((result.data || []).map((record) => ({ ...record.payload, status: record.status, version: record.version }))))
      .catch(() => {})
  }, [csrfToken])

  useEffect(() => {
    if (path !== '/dashboard/applications' || !csrfToken) return
    fetch('/api/applications', { credentials: 'same-origin', headers: { Accept: 'application/json' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load applications.')))
      .then((result) => setApplications(Array.isArray(result.data) ? result.data : []))
      .catch(() => {})
  }, [path, csrfToken])

  useEffect(() => {
    let active = true
    fetch(`/conca/source/${sourceFile}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Dashboard page “${sourceFile}” was not found.`)
        return response.text()
      })
      .then((source) => {
        const effectiveCourses = adminCourses.length ? adminCourses : courses
        const requestedSlug = new URLSearchParams(window.location.search).get('course')
        const effectiveCourse = effectiveCourses.find((item) => item.slug === requestedSlug) || course
        if (active) setPage(prepareDashboard(source, { sourceFile, courses: effectiveCourses, course: effectiveCourse, path, applications, setupToken }))
      })
      .catch((reason) => active && setError(reason.message))
    return () => { active = false }
  }, [sourceFile, courses, course, path, applications, adminCourses, setupToken])

  useEffect(() => {
    if (!page) return undefined
    const previousTitle = document.title
    const previousBodyClass = document.body.className
    document.title = page.title
    document.body.className = `conca-react ${page.bodyClass}`.trim()

    const links = page.stylesheetUrls.map((href) => {
      const existing = document.head.querySelector(`link[data-conca-style="${href}"]`)
      if (existing) return existing
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      link.dataset.concaStyle = href
      document.head.appendChild(link)
      return link
    })

    const root = rootRef.current
    const onClick = async (event) => {
      const loginButton = event.target.closest('[data-admin-login]')
      if (loginButton) {
        event.preventDefault()
        const status = root.querySelector('.admin-action-status')
        const email = root.querySelector('#loginEmail')?.value || ''
        const password = root.querySelector('#loginPassword')?.value || ''
        if (status) status.textContent = 'Signing in…'
        try {
          const response = await fetch(loginButton.dataset.adminSetup ? '/api/auth/set-password' : '/api/auth/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(loginButton.dataset.adminSetup ? { token: setupToken, password } : { email, password }) })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Sign in failed.')
          setCsrfToken(result.csrfToken || '')
          navigate('/dashboard')
        } catch (reason) {
          if (status) status.textContent = reason instanceof Error ? reason.message : 'Sign in failed.'
        }
        return
      }

      const saveButton = event.target.closest('[data-course-save]')
      if (saveButton) {
        event.preventDefault()
        if (!csrfToken) { navigate('/dashboard/login'); return }
        const status = root.querySelector('.admin-action-status')
        const title = root.querySelector('#title')?.value.trim() || ''
        const requestedSlug = root.querySelector('#course-url')?.value.trim() || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        const payload = {
          slug: requestedSlug,
          title,
          description: root.querySelector('#short-description')?.value.trim() || '',
          fee: root.querySelector('#price')?.value ? `£ ${root.querySelector('#price').value}` : '',
          status: saveButton.dataset.status || 'draft',
        }
        if (status) status.textContent = 'Saving programme…'
        try {
          const editing = saveButton.dataset.courseSave === 'edit'
          const response = await fetch(`/api/admin/courses${editing ? `/${encodeURIComponent(payload.slug)}` : ''}`, {
            method: editing ? 'PATCH' : 'POST', credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrfToken }, body: JSON.stringify(payload),
          })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Programme could not be saved.')
          if (status) status.textContent = 'Programme saved.'
          window.location.assign(`/dashboard/lms-course-details?course=${encodeURIComponent(payload.slug)}`)
        } catch (reason) {
          if (status) status.textContent = reason instanceof Error ? reason.message : 'Programme could not be saved.'
        }
        return
      }
      const courseDelete = event.target.closest('[data-course-delete]')
      if (courseDelete) {
        event.preventDefault()
        if (!csrfToken) { navigate('/dashboard/login'); return }
        const slug = courseDelete.dataset.courseDelete
        const response = await fetch(`/api/admin/courses/${encodeURIComponent(slug)}`, { method: 'DELETE', credentials: 'same-origin', headers: { Accept: 'application/json', 'X-CSRF-Token': csrfToken } })
        if (response.ok) window.location.reload()
        return
      }
      const courseEdit = event.target.closest('[data-course-edit]')
      if (courseEdit) {
        event.preventDefault()
        navigate(`/dashboard/lms-course-edit?course=${encodeURIComponent(courseEdit.dataset.courseEdit)}`)
        return
      }
      const applicationAction = event.target.closest('[data-application-status], [data-application-delete]')
      if (applicationAction) {
        event.preventDefault()
        if (!csrfToken) { navigate('/dashboard/login'); return }
        const reference = applicationAction.closest('tr')?.dataset.applicationReference
        if (!reference) return
        const deleting = applicationAction.hasAttribute('data-application-delete')
        const response = await fetch(`/api/applications/${encodeURIComponent(reference)}`, {
          method: deleting ? 'DELETE' : 'PATCH', credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': csrfToken },
          ...(deleting ? {} : { body: JSON.stringify({ status: applicationAction.dataset.applicationStatus }) }),
        })
        if (response.ok) {
          setApplications((current) => deleting ? current.filter((item) => item.reference !== reference) : current.map((item) => item.reference === reference ? { ...item, status: applicationAction.dataset.applicationStatus } : item))
        }
        return
      }
      const anchor = event.target.closest('a[href]')
      if (anchor) {
        const href = anchor.getAttribute('href')
        if (href?.startsWith('/dashboard')) {
          event.preventDefault()
          navigate(href)
          return
        }
        if (href?.startsWith('javascript:')) event.preventDefault()
      }

      const dropdown = event.target.closest('.has-dropdown > .menu-link')
      if (dropdown) {
        event.preventDefault()
        const item = dropdown.parentElement
        item.classList.toggle('open')
        item.classList.toggle('active')
        const submenu = item.querySelector(':scope > .app-sidebar-submenu')
        if (submenu) submenu.style.display = submenu.style.display === 'block' ? 'none' : 'block'
      }

      if (event.target.closest('.app-sidebar-mobile-toggle, .app-sidebar-toggle')) {
        root.querySelector('#app-sidebar')?.classList.add('show')
        root.classList.add('sidebar-open')
      }
      if (event.target.closest('.app-sidebar-mobile-close')) {
        root.querySelector('#app-sidebar')?.classList.remove('show')
        root.classList.remove('sidebar-open')
      }

      const passwordToggle = event.target.closest('.input-group-text, .password-toggle')
      const passwordInput = passwordToggle?.parentElement?.querySelector('input[type="password"], input[data-password]')
      if (passwordInput) passwordInput.type = passwordInput.type === 'password' ? 'text' : 'password'

      const dismiss = event.target.closest('[data-bs-dismiss="alert"]')
      dismiss?.closest('.alert')?.remove()

      const dropdownToggle = event.target.closest('[data-bs-toggle="dropdown"]')
      if (dropdownToggle) {
        event.preventDefault()
        dropdownToggle.parentElement?.querySelector('.dropdown-menu')?.classList.toggle('show')
      }
      const accordionButton = event.target.closest('.accordion-button')
      if (accordionButton) {
        event.preventDefault()
        const selector = accordionButton.getAttribute('data-bs-target')
        if (selector?.startsWith('#')) root.querySelector(selector)?.classList.toggle('show')
        accordionButton.classList.toggle('collapsed')
      }
      const tabButton = event.target.closest('[data-bs-toggle="pill"], [data-bs-toggle="tab"]')
      if (tabButton) {
        event.preventDefault()
        const selector = tabButton.getAttribute('data-bs-target')
        tabButton.closest('.nav')?.querySelectorAll('.nav-link').forEach((item) => item.classList.remove('active'))
        tabButton.classList.add('active')
        root.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.remove('show', 'active'))
        if (selector?.startsWith('#')) root.querySelector(selector)?.classList.add('show', 'active')
      }
    }
    const onSubmit = (event) => event.preventDefault()
    root.addEventListener('click', onClick)
    root.addEventListener('submit', onSubmit)
    return () => {
      root.removeEventListener('click', onClick)
      root.removeEventListener('submit', onSubmit)
      links.forEach((link) => link.remove())
      document.title = previousTitle
      document.body.className = previousBodyClass
    }
  }, [page, csrfToken, setupToken])

  if (error) {
    return <main className="dashboard-state"><h1>Dashboard page unavailable</h1><p>{error}</p><button onClick={() => navigate('/dashboard')}>Return to dashboard</button></main>
  }
  if (!page) return <main className="dashboard-state" aria-busy="true"><div className="page-loader" /><p>Loading dashboard…</p></main>

  return (
    <div className="dashboard-react-shell">
      <button className="dashboard-site-link" type="button" onClick={() => navigate('/')}>
        <i className="fa-regular fa-arrow-left" aria-hidden="true" /> View website
      </button>
      <div ref={rootRef} className="dashboard-source" dangerouslySetInnerHTML={{ __html: page.html }} />
    </div>
  )
}
