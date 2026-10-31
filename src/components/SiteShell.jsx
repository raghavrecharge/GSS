import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import ContentRenderer from './ContentRenderer.jsx'
import Footer from './Footer.jsx'
import Header from './Header.jsx'
import { Offcanvas, Preloader, SearchOverlay } from './Overlays.jsx'
import usePageInteractions from '../hooks/usePageInteractions.js'

export default function SiteShell({ page, noFooter = false, children }) {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showTop, setShowTop] = useState(false)
  usePageInteractions()

  useEffect(() => {
    document.title = page.title
    document.querySelector('meta[name="description"]')?.setAttribute('content', page.description)
    document.body.className = page.bodyClass
    const showTimer = window.setTimeout(() => setLoading(true), 0)
    const hideTimer = window.setTimeout(() => setLoading(false), 650)
    return () => {
      window.clearTimeout(showTimer)
      window.clearTimeout(hideTimer)
    }
  }, [location.pathname, page])

  useEffect(() => {
    document.body.classList.remove('menu-open', 'search-open')
    document.body.style.removeProperty('overflow')
    const timer = window.setTimeout(() => {
      setMenuOpen(false)
      setSearchOpen(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const open = menuOpen || searchOpen
    document.body.classList.toggle('menu-open', menuOpen)
    document.body.classList.toggle('search-open', searchOpen)
    const onKeyDown = (event) => { if (event.key === 'Escape') { setMenuOpen(false); setSearchOpen(false) } }
    if (open) document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (open) document.body.classList.remove('menu-open', 'search-open')
    }
  }, [menuOpen, searchOpen])

  const lightHeader = !['/', '/online-learning', '/for-business'].includes(location.pathname)
  return (
    <div className={page.wrapperClass}>
      {loading && <Preloader />}
      <Header light={lightHeader} onMenuOpen={() => setMenuOpen(true)} />
      <main data-page-content>{children || <ContentRenderer html={page.body} />}</main>
      {!noFooter && <Footer />}
      <Offcanvas open={menuOpen} onClose={() => setMenuOpen(false)} onSearch={() => { setMenuOpen(false); setSearchOpen(true) }} />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <button className={`at-back-to-top at_backToTop${showTop ? ' active' : ''}`} type="button" aria-label="Back to top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polyline points="18 15 12 9 6 15" /></svg>
      </button>
      <div className={`at_offcanvas_overly${menuOpen || searchOpen ? ' active' : ''}`} onClick={() => { setMenuOpen(false); setSearchOpen(false) }} aria-hidden="true" />
    </div>
  )
}
