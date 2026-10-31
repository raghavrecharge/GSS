import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CountrySwitcher, Navigation } from './Header.jsx'
import { courses } from '../data/msbmCatalog.js'
import BrandLogo from './BrandLogo.jsx'

export function Preloader() {
  return <div className="ma-preloader-1"><div className="ma-preloader-1-wrap" role="status" aria-label="Loading The Global School of Skills"><BrandLogo compact /><div className="ma-preloader-1-bar" /></div></div>
}

export function Offcanvas({ open, onClose, onSearch }) {
  const closeRef = useRef(null)
  useEffect(() => { if (open) closeRef.current?.focus() }, [open])
  return (
    <div className={`at-offcanvas-area at_offcanvas_box lenis lenis-smooth${open ? ' active' : ''}`} aria-hidden={!open}>
      <div className="at-offcanvas-wrap">
        <div className="at-offcanvas-top"><Link to="/" className="at-offcanvas-top-logo msbm-wordmark-link" aria-label="The Global School of Skills home" onClick={onClose}><BrandLogo dark /></Link><button ref={closeRef} className="at-offcanvas-close at_offcanvas_close" aria-label="Close menu" onClick={onClose}><span /><span /></button></div>
        <CountrySwitcher mobile onNavigate={onClose} />
        <Navigation mobile onNavigate={onClose} />
        <div className="at-offcanvas-contact">
          <h4 className="at-offcanvas-title">Get in touch</h4>
          <a href="mailto:info@globalschoolofskills.com">info@globalschoolofskills.com</a>
          <button type="button" className="at_search_btn_toggle" onClick={onSearch}>Search the site</button>
        </div>
      </div>
    </div>
  )
}

export function SearchOverlay({ open, onClose }) {
  const inputRef = useRef(null)
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  const submitSearch = (event) => {
    event.preventDefault()
    const term = query.trim().toLocaleLowerCase()
    if (!term) return
    const match = courses.find((course) => course.title.toLocaleLowerCase() === term)
      || courses.find((course) => [course.title, course.level, course.university].some((value) => value?.toLocaleLowerCase().includes(term)))
    navigate(match ? `/programmes/${match.slug}` : '/programmes')
    onClose()
  }

  return (
    <div className={`at-search-box at_search_box${open ? ' active' : ''}`} role="dialog" aria-modal="true" aria-label="Site search" aria-hidden={!open}>
      <div className="at-search-box-container"><div className="container"><div className="at-search-box-form"><label className="at-search-box-title" htmlFor="site-course-search">Search</label><form className="at-search-form" role="search" onSubmit={submitSearch}><input id="site-course-search" ref={inputRef} className="at-search-form-input ma-p-1" type="search" placeholder="Search programmes..." list="site-course-search-options" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" /><datalist id="site-course-search-options">{courses.map((course) => <option value={course.title} key={course.slug} />)}</datalist><button className="visually-hidden" type="submit">Search programmes</button></form></div></div></div>
      <button aria-label="Close search" type="button" className="at-search-box-close at_search_box_close" onClick={onClose}><i className="ph ph-arrow-up" /></button>
    </div>
  )
}
