function setText(node, value) {
  if (node && value !== undefined && value !== null) node.textContent = String(value)
}

function setTrailingText(node, value) {
  if (!node) return
  ;[...node.childNodes].filter((child) => child.nodeType === Node.TEXT_NODE).forEach((child) => child.remove())
  node.append(String(value))
}

function titleCase(value = '') {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function detailRoute(course) {
  return `/dashboard/lms-course-details?course=${encodeURIComponent(course.slug)}`
}

function bindGrid(body, courses) {
  const row = body.querySelector('.tp-course-style-grid > .row')
  const templates = row ? [...row.children].filter((node) => node.querySelector('.tp-course-item')) : []
  if (!row || !templates.length) return
  row.replaceChildren(...courses.map((course, index) => {
    const column = templates[index % templates.length].cloneNode(true)
    column.querySelectorAll('a').forEach((link) => link.setAttribute('href', detailRoute(course)))
    setTrailingText(column.querySelector('.tp-course-teacher span'), course.partner || course.university || 'GSS')
    const image = column.querySelector('.tp-course-thumb img')
    if (image) image.alt = course.title
    setText(column.querySelector('.tp-course-tag span'), titleCase(course.categorySlug || course.level || 'Programme'))
    const meta = column.querySelectorAll('.tp-course-meta span')
    setText(meta[0], `${course.modules?.length || 0} Modules`)
    setText(meta[1], course.mode || 'Online')
    setText(column.querySelector('.tp-course-title a'), course.title)
    setText(column.querySelector('.tp-course-pricing span'), course.fee || 'Request fee')
    setText(column.querySelector('.tp-course-rating-star p'), course.sourceVerified ? 'Verified' : 'Published')
    return column
  }))
}

function bindList(body, courses) {
  const tbody = body.querySelector('table tbody')
  const templates = tbody ? [...tbody.children].filter((node) => node.matches('tr')) : []
  if (!tbody || !templates.length) return
  tbody.replaceChildren(...courses.map((course, index) => {
    const row = templates[index % templates.length].cloneNode(true)
    const cells = row.querySelectorAll(':scope > td')
    setText(cells[0]?.querySelector('h4'), course.title)
    const image = cells[0]?.querySelector('img')
    if (image) image.alt = course.title
    setText(cells[1]?.querySelector('h4'), course.partner || course.university || 'GSS')
    setText(cells[2]?.querySelector('span'), course.fee || 'Request fee')
    setText(cells[3]?.querySelector('span'), course.duration || course.mode || 'Flexible')
    setText(cells[4]?.querySelector('.badge'), course.sourceVerified ? 'Verified' : 'Published')
    const view = row.querySelector('.dropdown-menu a')
    if (view) view.setAttribute('href', detailRoute(course))
    const actions = row.querySelectorAll('.dropdown-menu button, .dropdown-menu a')
    actions.forEach((action) => {
      const label = action.textContent.trim().toLowerCase()
      if (label === 'edit') action.dataset.courseEdit = course.slug
      if (label === 'delete') action.dataset.courseDelete = course.slug
    })
    return row
  }))
}

function moduleParts(module) {
  if (Array.isArray(module)) return { title: module[0], summary: module[1] }
  return { title: module?.title || 'Programme module', summary: module?.summary || module?.description || '' }
}

function bindDetails(body, course) {
  if (!course) return
  const hero = body.querySelector('.page-content .bg-gray')
  setText(hero?.querySelector('.badge'), titleCase(course.categorySlug || course.level || 'Programme'))
  setText(hero?.querySelector('h3'), course.title)
  const heroValues = hero?.querySelectorAll('h4') || []
  setText(heroValues[0], course.partner || course.university || 'GSS')
  setText(heroValues[1], titleCase(course.categorySlug || course.level || 'Programme'))
  setText(heroValues[2], course.sourceVerified ? 'Source verified' : 'Published')
  const about = body.querySelectorAll('#about > p')
  setText(about[0], course.longDescription || course.description)
  setText(about[1], course.courseDetails || course.description)
  const list = body.querySelector('#about .tp-course-details-2-list ul')
  const outcomes = course.outcomes?.length ? course.outcomes : [`Build practical knowledge in ${course.title}.`, 'Apply learning to professional practice.']
  if (list) list.replaceChildren(...outcomes.map((outcome) => {
    const item = body.ownerDocument.createElement('li')
    item.textContent = outcome
    return item
  }))
  const accordion = body.querySelector('#curriculum .accordion')
  const template = accordion?.querySelector('.accordion-item')
  const modules = (course.modules || []).map(moduleParts)
  if (accordion && template && modules.length) {
    accordion.replaceChildren(...modules.map((module, index) => {
      const item = template.cloneNode(true)
      const button = item.querySelector('.accordion-button')
      const collapse = item.querySelector('.accordion-collapse')
      const collapseId = `dashboard-module-${index}`
      setText(button, module.title)
      if (button) {
        button.setAttribute('data-bs-target', `#${collapseId}`)
        button.setAttribute('aria-controls', collapseId)
      }
      if (collapse) collapse.id = collapseId
      const bodyNode = item.querySelector('.accordion-body')
      if (bodyNode) setText(bodyNode, module.summary || 'Module details available in the programme record.')
      return item
    }))
  }
  const sidebar = body.querySelector('.col-lg-4 .position-sticky')
  setText(sidebar?.querySelector('.fs-6'), course.fee || 'Request fee')
  setText(sidebar?.querySelector('del'), course.monthly || '')
  const values = sidebar?.querySelectorAll('.border-bottom.py-3 > span:last-child') || []
  const lectures = (course.modules || []).reduce((total, module) => total + (Number(module?.lectures) || 0), 0)
  ;[lectures || course.modules?.length || 0, course.duration || 'Flexible', titleCase(course.level || course.categorySlug || 'All levels'), 'English'].forEach((value, index) => setText(values[index], value))
}

function bindLogin(body, setupToken) {
  setText(body.querySelector('.auth-card h4'), 'GSS Administration')
  setText(body.querySelector('.auth-card p'), 'Sign in to manage programmes and applications.')
  const email = body.querySelector('#loginEmail')
  const password = body.querySelector('#loginPassword')
  const button = body.querySelector('.auth-card button[type="submit"]')
  if (email) email.name = 'email'
  if (password) password.name = 'password'
  if (button) button.dataset.adminLogin = 'true'
  if (setupToken) {
    setText(body.querySelector('.auth-card h4'), 'Set administrator password')
    setText(button, 'Set Password')
    button.dataset.adminSetup = 'true'
  }
  const status = body.ownerDocument.createElement('p')
  status.className = 'admin-action-status mt-3 text-center'
  status.setAttribute('role', 'status')
  button?.parentElement?.append(status)
}

function bindCourseEditor(body, course, isEdit) {
  const title = body.querySelector('#title')
  const slug = body.querySelector('#course-url')
  const description = body.querySelector('#short-description')
  const price = body.querySelector('#price')
  if (isEdit && course) {
    if (title) title.setAttribute('value', course.title || '')
    if (slug) { slug.setAttribute('value', course.slug || ''); slug.setAttribute('readonly', '') }
    if (description) description.textContent = course.description || ''
    if (price) price.setAttribute('value', String(course.fee || '').replace(/[^0-9.]/g, ''))
  }
  const buttons = [...body.querySelectorAll('.page-content button')]
  const publish = buttons.find((button) => button.textContent.trim() === 'Publish Now')
  const draft = buttons.find((button) => button.textContent.trim() === 'Save Draft')
  if (publish) { publish.dataset.courseSave = isEdit ? 'edit' : 'create'; publish.dataset.status = 'published' }
  if (draft) { draft.dataset.courseSave = isEdit ? 'edit' : 'create'; draft.dataset.status = 'draft' }
  const status = body.ownerDocument.createElement('p')
  status.className = 'admin-action-status mt-3'
  status.setAttribute('role', 'status')
  publish?.parentElement?.append(status)
}

function bindAcademy(body, courses) {
  const labels = [...body.querySelectorAll('span')]
  const totalCoursesLabel = labels.find((node) => node.textContent.trim() === 'Total Courses')
  const metric = totalCoursesLabel?.closest('.card, [class*="col-"]')?.querySelector('h2, h3, .fs-7, .fs-8')
  setText(metric, courses.length)
  const popularTitles = body.querySelectorAll('.tp-course-title, h3.fz-15px')
  popularTitles.forEach((node, index) => {
    if (courses[index]) setText(node, courses[index].title)
  })
  const rows = body.querySelectorAll('table tbody tr')
  rows.forEach((row, index) => {
    const course = courses[index]
    if (!course) return
    const cells = row.querySelectorAll(':scope > td')
    setText(cells[0]?.querySelector('h4, h5, h6, span'), course.title)
    const image = cells[0]?.querySelector('img')
    if (image) image.alt = course.title
  })
}

function bindApplications(body, applications) {
  setText(body.querySelector('.page-header h2'), 'Programme Applications')
  const tbody = body.querySelector('table tbody')
  const template = tbody?.querySelector('tr')
  if (!tbody || !template) return
  if (!applications.length) {
    const row = template.cloneNode(false)
    const cell = body.ownerDocument.createElement('td')
    cell.colSpan = 6
    cell.className = 'py-8 text-center'
    cell.textContent = 'No applications are available, or administrator sign-in is required.'
    row.append(cell)
    tbody.replaceChildren(row)
    return
  }
  tbody.replaceChildren(...applications.map((application) => {
    const row = template.cloneNode(true)
    row.dataset.applicationReference = application.reference
    const cells = row.querySelectorAll(':scope > td')
    setText(cells[0]?.querySelector('h4'), `${application.applicant?.firstName || ''} ${application.applicant?.lastName || ''}`.trim())
    setText(cells[1]?.querySelector('h4'), application.applicant?.email || '')
    setText(cells[2]?.querySelector('span'), application.course_slug)
    setText(cells[3]?.querySelector('span'), application.created_at)
    setText(cells[4]?.querySelector('.badge'), application.status)
    const actions = cells[5]?.querySelectorAll('.dropdown-menu button, .dropdown-menu a') || []
    actions.forEach((action) => {
      const label = action.textContent.trim().toLowerCase()
      if (label === 'edit') { action.dataset.applicationStatus = 'review'; action.href = '#' }
      if (label === 'delete') { action.dataset.applicationDelete = 'true' }
    })
    return row
  }))
}

export function bindDashboardData(body, { sourceFile, courses, course, path, applications = [], setupToken = '' }) {
  if (sourceFile === 'dashboard-academy.html') bindAcademy(body, courses)
  if (sourceFile === 'lms-course-grid.html') bindGrid(body, courses)
  if (sourceFile === 'lms-course-list.html') bindList(body, courses)
  if (sourceFile === 'lms-course-details.html') bindDetails(body, course || courses[0])
  if (sourceFile === 'auth-login-basic.html') bindLogin(body, setupToken)
  if (sourceFile === 'lms-course-add.html') bindCourseEditor(body, null, false)
  if (sourceFile === 'lms-course-edit.html') bindCourseEditor(body, course || courses[0], true)
  if (path === '/dashboard/applications') bindApplications(body, applications)
}
