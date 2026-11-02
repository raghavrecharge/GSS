
function titleCase(value = '') {
  return value.replace(/-/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function setText(node, value) {
  if (node && value !== undefined && value !== null) node.textContent = String(value)
}

function setIconLabel(node, value) {
  if (!node) return
  ;[...node.childNodes].filter((child) => child.nodeType === Node.TEXT_NODE).forEach((child) => child.remove())
  node.append(` ${value}`)
}

function courseRoute(course) {
  return `/courses/${encodeURIComponent(course.slug)}`
}

function moduleParts(module) {
  if (Array.isArray(module)) return { title: module[0], summary: module[1], meta: module[2] }
  return {
    title: module?.title || 'Programme module',
    summary: module?.summary || module?.description || '',
    meta: [module?.lectures ? `${module.lectures} lectures` : '', module?.quizzes ? `${module.quizzes} quiz` : ''].filter(Boolean).join(' · '),
  }
}

function bindCourseCard(column, course, route = courseRoute(course)) {
  column.querySelectorAll('a').forEach((link) => link.setAttribute('href', route))
  const image = column.querySelector('.tp-course-thumb img')
  if (image) image.alt = course.title
  setText(column.querySelector('.tp-course-tag span'), titleCase(course.categorySlug || course.level || 'Programme'))
  const meta = column.querySelectorAll('.tp-course-meta > span')
  setIconLabel(meta[0], `${course.modules?.length || 0} modules`)
  setIconLabel(meta[1], course.mode || 'Online')
  setText(column.querySelector('.tp-course-title a'), course.title)
  const pricing = column.querySelector('.tp-course-pricing')
  setText(pricing?.querySelector('span'), course.fee || 'Request fee')
  const secondaryPrice = pricing?.querySelector('del')
  if (secondaryPrice) setText(secondaryPrice, course.monthly || '')
  const score = column.querySelector('.tp-course-rating-star p')
  if (score) setText(score, course.sourceVerified ? 'Verified' : 'GSS')
}

function bindCourseCatalogue(main, courses, path = '/courses') {
  const row = main.querySelector('.tp-courses-area .container > .row')
  if (!row || !courses.length) return
  const templates = [...row.children].filter((column) => column.querySelector('.tp-course-item'))
  if (!templates.length) return
  row.replaceChildren(...courses.map((course, index) => {
    const column = templates[index % templates.length].cloneNode(true)
    const route = path.startsWith('/countries/') || path.startsWith('/locations/') ? `${path}/${encodeURIComponent(course.slug)}` : courseRoute(course)
    bindCourseCard(column, course, route)
    return column
  }))
  setText(main.querySelector('.tp-breadcrumb-title'), `Courses (${courses.length})`)
}

function bindCourseDetails(main, course) {
  if (!course) return
  setText(main.querySelector('.tp-course-details-title'), course.title)
  const crumbs = main.querySelectorAll('.tp-breadcrumb-5-list > span')
  setText(crumbs[crumbs.length - 1], course.title)
  const meta = main.querySelectorAll('.tp-course-details-meta > a')
  setIconLabel(meta[0], course.partner || course.university || 'GSS')
  setIconLabel(meta[1], course.mode || 'Online')
  setIconLabel(meta[2], titleCase(course.categorySlug || course.level || 'Programme'))
  setIconLabel(meta[3], course.duration || 'Flexible')

  const about = main.querySelectorAll('#info .tp-course-details-text .content p')
  setText(about[0], course.longDescription || course.description)
  setText(about[1], course.courseDetails || course.description)
  const outcomes = course.outcomes?.length ? course.outcomes : [
    `Build practical knowledge in ${course.title}.`,
    'Apply programme concepts to professional practice.',
    'Develop evidence-led decision-making skills.',
  ]
  const outcomeList = main.querySelector('#info .tp-course-details-list ul')
  if (outcomeList) {
    outcomeList.replaceChildren(...outcomes.map((outcome) => {
      const item = main.ownerDocument.createElement('li')
      item.textContent = outcome
      return item
    }))
  }

  const accordion = main.querySelector('#curriculum .accordion')
  const template = accordion?.querySelector('.accordion-item')
  const modules = (course.modules || []).map(moduleParts)
  if (accordion && template && modules.length) {
    accordion.replaceChildren(...modules.map((module, index) => {
      const item = template.cloneNode(true)
      const headingId = `gss-module-heading-${index}`
      const collapseId = `gss-module-${index}`
      const header = item.querySelector('.accordion-header')
      const button = item.querySelector('.accordion-button')
      const collapse = item.querySelector('.accordion-collapse')
      if (header) header.id = headingId
      if (button) {
        button.setAttribute('data-bs-target', `#${collapseId}`)
        button.setAttribute('aria-controls', collapseId)
        button.setAttribute('aria-expanded', index === 0 ? 'true' : 'false')
        button.classList.toggle('collapsed', index !== 0)
      }
      if (collapse) {
        collapse.id = collapseId
        collapse.setAttribute('aria-labelledby', headingId)
        collapse.classList.toggle('show', index === 0)
      }
      setText(item.querySelector('.accordion-button .span'), module.title)
      setText(item.querySelector('.accordion-button .lesson'), module.meta || 'Programme module')
      const body = item.querySelector('.accordion-body')
      if (body) {
        const summary = main.ownerDocument.createElement('p')
        summary.className = 'fw-500 mb-0'
        summary.textContent = module.summary || 'Module details are available from an admissions adviser.'
        body.replaceChildren(summary)
      }
      return item
    }))
  }

  setText(main.querySelector('.tp-course-details-widget-price span'), course.fee || 'Request fee')
  setText(main.querySelector('.tp-course-details-widget-price del'), course.monthly || '')
  const values = main.querySelectorAll('.tp-course-details-widget-list-item > span:last-child')
  const lectureCount = (course.modules || []).reduce((total, module) => total + (Number(module?.lectures) || 0), 0)
  const sidebarValues = [lectureCount || course.modules?.length || 0, course.duration || 'Flexible', titleCase(course.categorySlug || course.level || 'All levels'), 'English', 'Flexible', 'Yes']
  values.forEach((node, index) => setText(node, sidebarValues[index] ?? node.textContent))
  main.querySelectorAll('.tp-course-details-widget-btn a').forEach((link, index) => {
    link.setAttribute('href', index === 0 ? `/cart?course=${encodeURIComponent(course.slug)}` : `/checkout?course=${encodeURIComponent(course.slug)}`)
  })
  const image = main.querySelector('.tp-course-details-widget-thumb img')
  if (image) image.alt = course.title
}

function pageContent(content, path) {
  return content.find((page) => page.path === path)
}

function paragraphTexts(page) {
  return (page?.blocks || []).filter((block) => block.type === 'p' && block.text).map((block) => block.text)
}

function bindHome(main, courses, content) {
  setText(main.querySelector('.tp-hero-title'), 'Global skills for real-world progress')
  setText(main.querySelector('.tp-hero-dec'), 'Affordable, flexible programmes designed to help professionals learn, lead and create impact.')
  const cta = main.querySelector('.tp-hero-content .tp-btn')
  if (cta) cta.setAttribute('href', '/courses')
  const about = pageContent(content, '/about-msbm')
  const text = paragraphTexts(about)
  setText(main.querySelector('.tp-about-content .tp-section-title'), 'Education powered by technology and purpose')
  setText(main.querySelector('.tp-about-content .tp-section-dec'), text.find((item) => item.length > 120) || about?.description)
  const courseTotals = main.querySelectorAll('.tp-counter-item, .tp-funfact-item')
  courseTotals.forEach((item) => {
    const label = item.textContent.toLowerCase()
    if (label.includes('course') || label.includes('program')) setText(item.querySelector('[data-purecounter-end], .purecounter, h2, h3'), `${courses.length}+`)
  })
}

function bindAbout(main, content) {
  const about = pageContent(content, '/about-msbm')
  const mission = pageContent(content, '/about-msbm/our-mission')
  const vision = pageContent(content, '/about-msbm/our-vision')
  const aboutText = paragraphTexts(about)
  const missionText = paragraphTexts(mission)[0]
  const visionText = paragraphTexts(vision)[0]
  setText(main.querySelector('.tp-breadcrumb-title'), 'About Global School of Skills')
  setText(main.querySelector('.tp-about-3-content .tp-section-subtitle'), 'Education with global purpose')
  setText(main.querySelector('.tp-about-3-content .tp-section-title'), 'Accessible learning, practical transformation')
  const intro = main.querySelectorAll('.tp-about-3-content .tp-section-dec')
  setText(intro[0], aboutText.find((item) => item.includes('Social Enterprise')) || aboutText[0])
  setText(intro[1], aboutText.find((item) => item.includes('empower')) || aboutText[1])
  const features = main.querySelectorAll('.tp-about-feature-list li')
  ;['Flexible learning models', 'International pathways', 'Practical, skill-based study'].forEach((label, index) => setIconLabel(features[index], label))
  setText(main.querySelector('.tp-misson-area .tp-section-title'), 'Empowering lives and communities')
  setText(main.querySelector('.tp-misson-area .tp-section-dec'), missionText)
  setText(main.querySelector('.tp-vision-area .tp-section-title'), 'Education without borders')
  setText(main.querySelector('.tp-vision-area .tp-section-dec'), visionText || 'A future where internationally relevant education is accessible to learners everywhere.')
}

function bindCart(main, course) {
  if (!course) return
  const tbody = main.querySelector('.tp-cart-list tbody')
  const template = tbody?.querySelector('tr')
  if (tbody && template) {
    const row = template.cloneNode(true)
    setText(row.querySelector('.tp-cart-title a'), course.title)
    setText(row.querySelector('.tp-cart-price span'), course.fee || 'Request fee')
    const image = row.querySelector('.tp-cart-img img')
    if (image) image.alt = course.title
    row.querySelectorAll('a').forEach((link) => link.setAttribute('href', courseRoute(course)))
    tbody.replaceChildren(row)
  }
  setText(main.querySelector('.tp-breadcrumb-title'), 'Programme Application Cart')
  setText(main.querySelector('.tp-cart-checkout-top-price'), course.fee || 'Request fee')
  setText(main.querySelector('.tp-cart-checkout-total span:last-child'), course.fee || 'Request fee')
  setText(main.querySelector('.tp-cart-checkout-shipping-title'), 'Application payment')
  main.querySelectorAll('a[href*="checkout"]').forEach((link) => link.setAttribute('href', `/checkout?course=${encodeURIComponent(course.slug)}`))
}

function bindCheckout(main, course) {
  if (!course) return
  setText(main.querySelector('.tp-breadcrumb-title'), 'Programme Application')
  setText(main.querySelector('.tp-checkout-bill-title'), 'Applicant Details')
  const lines = main.querySelectorAll('.tp-order-info-list-desc')
  lines.forEach((line, index) => {
    if (index === 0) {
      const values = line.querySelectorAll('p, span')
      setText(values[0], course.title)
      setText(values[values.length - 1], course.fee || 'Request fee')
    } else line.remove()
  })
  setText(main.querySelector('.tp-order-info-list-subtotal span:last-child'), course.fee || 'Request fee')
  setText(main.querySelector('.tp-order-info-list-total span:last-child'), course.fee || 'Request fee')
  const form = main.querySelector('.tp-checkout-bill-form form')
  if (form) {
    form.dataset.applicationForm = 'true'
    form.dataset.courseSlug = course.slug
    const inputs = form.querySelectorAll('input')
    const names = ['firstName', 'lastName', 'company', 'country', 'address', 'address2', 'city', 'postcode', 'phone', 'email']
    inputs.forEach((input, index) => {
      if (names[index]) input.name = names[index]
      if (['firstName', 'lastName', 'email'].includes(names[index])) input.required = true
    })
  }
  const consent = main.querySelector('#read_all')
  if (consent) {
    consent.name = 'consent'
    consent.required = true
  }
  setText(main.querySelector('label[for="read_all"]'), 'I consent to GSS using these details to process my programme application. Records are retained for up to 365 days.')
  const submit = main.querySelector('.tp-checkout-btn-wrapper a')
  if (submit) {
    submit.href = '#'
    submit.dataset.submitApplication = 'true'
    setText(submit, 'Submit Application')
    const status = main.ownerDocument.createElement('p')
    status.className = 'tp-checkout-application-status mt-20'
    status.setAttribute('role', 'status')
    submit.parentElement.append(status)
  }
}

function bindContentPage(main, page) {
  if (!page) return
  setText(main.querySelector('.tp-breadcrumb-title'), page.title)
  const content = main.querySelector('.tp-about-3-content')
  if (!content) return
  const documentNode = main.ownerDocument
  const fragment = documentNode.createDocumentFragment()
  ;(page.blocks || []).forEach((block) => {
    if (/^h[1-4]$/.test(block.type)) {
      const heading = documentNode.createElement(block.type === 'h1' ? 'h2' : block.type)
      heading.className = block.type === 'h3' ? 'tp-section-title mb-20' : 'mb-20'
      heading.textContent = block.text || ''
      fragment.append(heading)
    } else if (block.type === 'p') {
      const paragraph = documentNode.createElement('p')
      paragraph.className = 'tp-section-dec mb-20'
      paragraph.textContent = block.text || ''
      fragment.append(paragraph)
    } else if ((block.type === 'ul' || block.type === 'ol') && Array.isArray(block.items)) {
      const list = documentNode.createElement(block.type)
      list.className = 'tp-about-feature-list mb-30'
      block.items.forEach((value) => {
        const item = documentNode.createElement('li')
        item.textContent = value
        list.append(item)
      })
      fragment.append(list)
    } else if (block.type === 'table' && Array.isArray(block.rows)) {
      const wrapper = documentNode.createElement('div')
      wrapper.className = 'table-responsive mb-30'
      const table = documentNode.createElement('table')
      table.className = 'table'
      block.rows.forEach((values, rowIndex) => {
        const row = documentNode.createElement('tr')
        ;(values || []).forEach((value) => {
          const cell = documentNode.createElement(rowIndex === 0 ? 'th' : 'td')
          cell.textContent = value
          row.append(cell)
        })
        table.append(row)
      })
      wrapper.append(table)
      fragment.append(wrapper)
    }
  })
  content.replaceChildren(fragment)
}

function bindDirectory(main, records, heading, routeFor) {
  const row = main.querySelector('.tp-courses-area .container > .row')
  const templates = row ? [...row.children].filter((column) => column.querySelector('.tp-course-item')) : []
  if (!row || !templates.length) return
  row.replaceChildren(...records.map((record, index) => {
    const column = templates[index % templates.length].cloneNode(true)
    const route = routeFor(record)
    column.querySelectorAll('a').forEach((link) => link.setAttribute('href', route))
    setText(column.querySelector('.tp-course-tag span'), record.countryName || 'Study location')
    setText(column.querySelector('.tp-course-title a'), record.name)
    const meta = column.querySelectorAll('.tp-course-meta > span')
    setIconLabel(meta[0], 'GSS programmes')
    setIconLabel(meta[1], 'Flexible study')
    setText(column.querySelector('.tp-course-pricing span'), 'Explore')
    const image = column.querySelector('.tp-course-thumb img')
    if (image) image.alt = `Study programmes in ${record.name}`
    return column
  }))
  setText(main.querySelector('.tp-breadcrumb-title'), `${heading} (${records.length})`)
}

export function bindThemeData(main, { path, courses = [], course = null, regionName = '', sharedData = { content: [], countries: [], regions: [] } }) {
  if (path === '/') bindHome(main, courses, sharedData.content)
  if (path === '/about') bindAbout(main, sharedData.content)
  if (path === '/courses' || path === '/courses/filter' || /^\/(?:countries|locations)\/[^/]+\/courses$/.test(path)) {
    bindCourseCatalogue(main, courses, path)
    if (regionName) setText(main.querySelector('.tp-breadcrumb-title'), `Courses in ${regionName} (${courses.length})`)
  }
  if (path === '/courses/details' || (path.startsWith('/courses/') && path !== '/courses/filter')) bindCourseDetails(main, course || courses[0])
  if (/^\/(?:countries|locations)\/[^/]+\/courses\/[^/]+$/.test(path)) bindCourseDetails(main, course || courses[0])
  if (path === '/cart') bindCart(main, course || courses[0])
  if (path === '/checkout') bindCheckout(main, course || courses[0])
  if (path === '/countries') bindDirectory(main, sharedData.countries, 'Study countries', (country) => `/countries/${country.slug}`)
  const countryDirectory = path.match(/^\/countries\/([^/]+)$/)
  if (countryDirectory) {
    const regions = sharedData.regions.find((group) => group.countrySlug === countryDirectory[1])?.locations || []
    bindDirectory(main, regions, `Study locations in ${sharedData.countries.find((country) => country.slug === countryDirectory[1])?.name || 'this country'}`, (location) => `/locations/${location.slug}/courses`)
  }
  bindContentPage(main, sharedData.content.find((page) => page.path === path))
}

