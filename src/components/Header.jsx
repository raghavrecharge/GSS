import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { countries, findCountry, findLocation } from '../data/msbmCatalog.js'
import BrandLogo from './BrandLogo.jsx'

const groups = [
  {
    label: 'Home',
    items: [
      ['GSS Home', '/'],
      ['Online Learning', '/online-learning'],
      ['GSS For Business', '/for-business'],
    ],
  },
  { label: 'About GSS', to: '/about' },
  {
    label: 'Why GSS',
    items: [
      ['Accreditation', '/accreditation'],
      ['Fees & Payments', '/tuition'],
      ['Learning with GSS', '/learning'],
      ['Student Stories', '/student-stories'],
    ],
  },
  {
    label: 'Programmes',
    items: [
      ['All Programmes', '/programmes'],
      ['Programme Categories', '/categories'],
      ['Specializations', '/specializations'],
      ['MBA Programme', '/programmes/mba'],
      ['University Partners', '/universities'],
      ['Study by Country', '/countries'],
    ],
  },
  {
    label: 'Insights',
    items: [
      ['All Insights', '/insights'],
      ['Online Learning', '/insights/online-learning'],
    ],
  },
  { label: 'Contact Us', to: '/contact' },
]

export function Navigation({ mobile = false, onNavigate }) {
  return (
    <nav className={mobile ? 'at-offcanvas-menu' : 'ma-main-navigation at_mobile_menu_get'} aria-label={mobile ? 'Mobile navigation' : 'Primary navigation'}>
      <ul className={mobile ? 'at_mobile_menu_set' : undefined}>
        {groups.map((group) => (
          <li className={group.items ? 'has-submenu' : undefined} key={group.label}>
            {group.to ? (
              <Link to={group.to} onClick={onNavigate}>{group.label}</Link>
            ) : (
              <button className="nav-submenu-toggle" type="button" aria-expanded="false">{group.label}</button>
            )}
            {group.items && (
              <ul className="submenu">
                {group.items.map(([label, to]) => (
                  <li key={to}><Link to={to} onClick={onNavigate}>{label}</Link></li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}

export function CountrySwitcher({ mobile = false, onNavigate }) {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const countryMatch = location.pathname.match(/^\/countries\/([^/]+)/) || location.pathname.match(/^\/([^/]+)\/programme\//)
  const locationMatch = location.pathname.match(/^\/locations\/([^/]+)/)
  const currentLocation = locationMatch ? findLocation(locationMatch[1]) : null
  const currentCountry = currentLocation ? findCountry(currentLocation.countrySlug) : countryMatch ? findCountry(countryMatch[1]) : null
  const normalizedQuery = deferredQuery.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
  const matches = useMemo(() => countries.filter((country) => country.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase().includes(normalizedQuery)), [normalizedQuery])

  useEffect(() => {
    if (!open) return undefined
    searchRef.current?.focus()
    const handlePointer = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const handleKey = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('pointerdown', handlePointer)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handlePointer)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const selectCountry = () => {
    setOpen(false)
    setQuery('')
    onNavigate?.()
  }

  return <div className={`msbm-country-switcher${mobile ? ' is-mobile' : ''}`} ref={rootRef}>
    <button className="msbm-country-switcher__toggle" type="button" aria-expanded={open} aria-controls={`country-switcher-${mobile ? 'mobile' : 'desktop'}`} onClick={() => setOpen((value) => !value)}>
      <i className="ph ph-globe-hemisphere-west" aria-hidden="true" />
      <span>{currentCountry?.name || 'Country'}</span>
      <i className="ph ph-caret-down" aria-hidden="true" />
    </button>
    <div className={`msbm-country-switcher__panel${open ? ' is-open' : ''}`} id={`country-switcher-${mobile ? 'mobile' : 'desktop'}`} aria-hidden={!open}>
      <div className="msbm-country-switcher__heading"><strong>Switch country</strong><span>{countries.length} destinations</span></div>
      <label htmlFor={`country-switch-search-${mobile ? 'mobile' : 'desktop'}`}>Find your country</label>
      <div className="msbm-country-switcher__search"><i className="ph ph-magnifying-glass" aria-hidden="true" /><input ref={searchRef} id={`country-switch-search-${mobile ? 'mobile' : 'desktop'}`} type="search" placeholder="Search countries" value={query} onChange={(event) => setQuery(event.target.value)} autoComplete="off" /></div>
      <div className="msbm-country-switcher__list" role="list">
        {matches.map((country) => <Link key={country.slug} to={`/countries/${country.slug}`} onClick={selectCountry} className={currentCountry?.slug === country.slug ? 'is-current' : undefined}><span>{country.name}</span>{currentCountry?.slug === country.slug && <i className="ph ph-check" aria-label="Current country" />}</Link>)}
        {!matches.length && <p>No matching country found.</p>}
      </div>
      <Link className="msbm-country-switcher__all" to="/countries" onClick={selectCountry}>View all country pages <i className="ph ph-arrow-right" /></Link>
    </div>
  </div>
}

export default function Header({ light, onMenuOpen }) {
  return (
    <header className={`ma-header-1-area wa_sticky_header${light ? ' has-light' : ''}`}>
      <div className="container ma-container-1">
        <div className="ma-header-1-wrap">
          <div className="ma-header-1-logo">
            <Link to="/" aria-label="The Global School of Skills home" className="msbm-wordmark-link">
              <BrandLogo dark />
              <BrandLogo />
            </Link>
          </div>
          <div className="ma-header-1-menu d-none d-xl-inline-flex"><Navigation /></div>
          <div className="ma-header-1-actions">
            <CountrySwitcher />
            <Link to="/programmes" className="ma-pr-btn-1 d-none d-md-inline-flex" data-ma-magnetic data-strength="24">
              <span>Explore Programmes</span><i className="ph ph-arrow-right" />
            </Link>
            <button className="offcanvas-btn at_offcanvas_toggle" aria-label="Open menu" onClick={onMenuOpen}>
              <span /><span /><span />
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
