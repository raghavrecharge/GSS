import { useEffect, useRef, useState } from 'react'
import { htmlToRoute, navigate } from '../routes.js'
import { bindThemeData } from '../data/themeBindings.js'

function preparePage(source, data) {
  const documentNode = new DOMParser().parseFromString(source, 'text/html')
  const main = documentNode.querySelector('main')
  const bodyClass = documentNode.body.className
  const title = documentNode.querySelector('title')?.textContent || 'Mindu'
  if (!main) throw new Error('This theme page has no main content.')

  main.querySelectorAll('script, noscript').forEach((node) => node.remove())
  main.querySelectorAll('[src]').forEach((node) => {
    const src = node.getAttribute('src')
    if (src?.startsWith('assets/')) node.setAttribute('src', `/${src}`)
  })
  main.querySelectorAll('[poster]').forEach((node) => {
    const poster = node.getAttribute('poster')
    if (poster?.startsWith('assets/')) node.setAttribute('poster', `/${poster}`)
  })
  main.querySelectorAll('[href]').forEach((node) => {
    const href = node.getAttribute('href')
    const file = href?.split('/').pop()?.split('#')[0]
    if (file && htmlToRoute[file]) node.setAttribute('href', htmlToRoute[file])
  })
  main.querySelectorAll('[data-bg-color]').forEach((node) => {
    node.style.backgroundColor = node.getAttribute('data-bg-color')
  })
  main.querySelectorAll('[data-background]').forEach((node) => {
    const image = node.getAttribute('data-background')
    if (image) node.style.backgroundImage = `url("/${image.replace(/^\//, '')}")`
  })
  bindThemeData(main, data)
  return { html: main.innerHTML, bodyClass, title }
}

export default function ThemePage({ sourceFile, path, courses, course, regionName, sharedData }) {
  const [page, setPage] = useState(null)
  const [error, setError] = useState('')
  const rootRef = useRef(null)

  useEffect(() => {
    let active = true
    fetch(`/source/${sourceFile}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Unable to load ${sourceFile}`)
        return response.text()
      })
      .then((source) => active && setPage(preparePage(source, { path, courses, course, regionName, sharedData })))
      .catch((reason) => active && setError(reason.message))
    return () => { active = false }
  }, [sourceFile, path, courses, course, regionName, sharedData])

  useEffect(() => {
    if (!page) return undefined
    document.title = page.title
    document.body.className = page.bodyClass
    const root = rootRef.current

    const onClick = async (event) => {
      const applicationButton = event.target.closest('[data-submit-application]')
      if (applicationButton) {
        event.preventDefault()
        const form = root.querySelector('[data-application-form]')
        const status = root.querySelector('.tp-checkout-application-status')
        const data = form ? new FormData(form) : null
        const payload = {
          firstName: String(data?.get('firstName') || ''),
          lastName: String(data?.get('lastName') || ''),
          email: String(data?.get('email') || ''),
          country: String(data?.get('country') || ''),
          courseSlug: form?.dataset.courseSlug || '',
          consent: Boolean(root.querySelector('#read_all')?.checked),
        }
        if (!form?.reportValidity() || !payload.consent) {
          if (status) status.textContent = 'Complete the required fields and consent before submitting.'
          return
        }
        applicationButton.setAttribute('aria-disabled', 'true')
        if (status) status.textContent = 'Submitting your application…'
        try {
          const response = await fetch('/api/applications', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
          const result = await response.json()
          if (!response.ok) throw new Error(result.error || 'Application could not be submitted.')
          if (status) status.textContent = `Application ${result.data.reference} submitted. Save this private access token now: ${result.data.accessToken}`
          applicationButton.remove()
        } catch (reason) {
          if (status) status.textContent = reason instanceof Error ? reason.message : 'Application could not be submitted.'
          applicationButton.removeAttribute('aria-disabled')
        }
        return
      }
      const link = event.target.closest('a[href]')
      if (link) {
        const href = link.getAttribute('href')
        if (href?.startsWith('/')) {
          event.preventDefault()
          navigate(href)
          return
        }
      }

      const accordionButton = event.target.closest('.accordion-button')
      if (accordionButton) {
        event.preventDefault()
        const item = accordionButton.closest('.accordion-item')
        const collapse = item?.querySelector('.accordion-collapse')
        const parent = item?.parentElement
        parent?.querySelectorAll('.accordion-collapse.show').forEach((open) => {
          if (open !== collapse) open.classList.remove('show')
        })
        collapse?.classList.toggle('show')
        accordionButton.classList.toggle('collapsed', !collapse?.classList.contains('show'))
        accordionButton.setAttribute('aria-expanded', collapse?.classList.contains('show') ? 'true' : 'false')
      }

      const tab = event.target.closest('[data-bs-toggle="tab"]')
      if (tab) {
        event.preventDefault()
        const selector = tab.getAttribute('data-bs-target') || tab.getAttribute('href')
        const tabList = tab.closest('[role="tablist"], ul, .nav')
        tabList?.querySelectorAll('[data-bs-toggle="tab"]').forEach((item) => item.classList.remove('active'))
        tab.classList.add('active')
        root.querySelectorAll('.tab-pane').forEach((pane) => pane.classList.remove('show', 'active'))
        if (selector?.startsWith('#')) root.querySelector(selector)?.classList.add('show', 'active')
      }

      const plus = event.target.closest('.tp-cart-plus, .cart-plus')
      const minus = event.target.closest('.tp-cart-minus, .cart-minus')
      if (plus || minus) {
        const input = (plus || minus).parentElement?.querySelector('input')
        if (input) input.value = String(Math.max(1, Number(input.value || 1) + (plus ? 1 : -1)))
      }
    }

    const onSubmit = (event) => {
      if (event.target.matches('form')) event.preventDefault()
    }
    root.addEventListener('click', onClick)
    root.addEventListener('submit', onSubmit)
    return () => {
      root.removeEventListener('click', onClick)
      root.removeEventListener('submit', onSubmit)
      document.body.className = ''
    }
  }, [page])

  if (error) return <main id="main-content" className="page-state"><h1>Page unavailable</h1><p>{error}</p></main>
  if (!page) return <main id="main-content" className="page-state" aria-busy="true"><div className="page-loader" /><p>Loading Mindu…</p></main>

  return <main id="main-content" ref={rootRef} className="react-theme-page" dangerouslySetInnerHTML={{ __html: page.html }} />
}
