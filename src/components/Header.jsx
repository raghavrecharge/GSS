import { useEffect, useState } from 'react'
import NavLink from './NavLink.jsx'

const navigation = [
  { label: 'Home', to: '/', children: [
    ['Online Academy', '/'], ['Online Course', '/online-course'], ['Online Mentor', '/online-mentor'],
  ] },
  { label: 'Pages', to: '/about', children: [
    ['About', '/about'], ['Services', '/services'], ['Our Team', '/team'],
    ['Testimonials', '/testimonials'], ['FAQ', '/faq'], ['Shop', '/shop'],
  ] },
  { label: 'Courses', to: '/courses', children: [
    ['All Courses', '/courses'], ['Course Details', '/courses/details'],
  ] },
  { label: 'Blog', to: '/blog', children: [
    ['Blog Grid', '/blog'], ['Blog Standard', '/blog/standard'], ['Blog Details', '/blog/details'],
  ] },
  { label: 'Contact Us', to: '/contact' },
]

export default function Header({ activePath, onSearch }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState('')
  const [sticky, setSticky] = useState(false)

  useEffect(() => {
    const onScroll = () => setSticky(window.scrollY > 80)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <header className={`react-header ${sticky ? 'is-sticky' : ''}`}>
        <div className="container">
          <div className="react-header__inner">
            <NavLink to="/" className="react-header__logo" aria-label="Mindu home">
              <img src="/assets/img/logo/logo-white.png" alt="Mindu" />
            </NavLink>

            <nav className="react-nav" aria-label="Primary navigation">
              {navigation.map((item) => (
                <div className="react-nav__item" key={item.label}>
                  <NavLink to={item.to} className={activePath === item.to ? 'is-active' : ''}>{item.label}</NavLink>
                  {item.children && (
                    <div className="react-nav__dropdown">
                      {item.children.map(([label, to]) => <NavLink to={to} key={to}>{label}</NavLink>)}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="react-header__actions">
              <button type="button" className="icon-button" aria-label="Search" onClick={onSearch}>
                <i className="fa-regular fa-magnifying-glass" aria-hidden="true" />
              </button>
              <NavLink to="/dashboard" className="react-dashboard-link">Dashboard</NavLink>
              <NavLink to="/login" className="tp-btn react-login">Login <i className="fa-regular fa-arrow-right" /></NavLink>
              <button
                type="button"
                className="icon-button menu-button"
                aria-label="Open navigation menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen(true)}
              >
                <i className="fa-regular fa-bars" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className={`mobile-drawer ${mobileOpen ? 'is-open' : ''}`} aria-hidden={!mobileOpen}>
        <button className="mobile-drawer__backdrop" aria-label="Close menu" onClick={() => setMobileOpen(false)} />
        <aside className="mobile-drawer__panel" aria-label="Mobile navigation">
          <div className="mobile-drawer__top">
            <img src="/assets/img/logo/logo.png" alt="Mindu" />
            <button className="icon-button" type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)}>
              <i className="fa-regular fa-xmark" />
            </button>
          </div>
          <nav>
            {navigation.map((item) => (
              <div className="mobile-nav__group" key={item.label}>
                <div className="mobile-nav__row">
                  <NavLink to={item.to} onClick={() => setMobileOpen(false)}>{item.label}</NavLink>
                  {item.children && (
                    <button type="button" aria-label={`Toggle ${item.label} submenu`} onClick={() => setOpenGroup(openGroup === item.label ? '' : item.label)}>
                      <i className={`fa-regular fa-chevron-${openGroup === item.label ? 'up' : 'down'}`} />
                    </button>
                  )}
                </div>
                {item.children && openGroup === item.label && (
                  <div className="mobile-nav__subnav">
                    {item.children.map(([label, to]) => <NavLink to={to} onClick={() => setMobileOpen(false)} key={to}>{label}</NavLink>)}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="mobile-drawer__contact">
            <h3>Information</h3>
            <a href="tel:+42077001007">+ 4 20 7700 1007</a>
            <a href="mailto:hello@mindu.com">hello@mindu.com</a>
            <span>Avenue de Roma 158b, Lisboa</span>
          </div>
        </aside>
      </div>
    </>
  )
}
