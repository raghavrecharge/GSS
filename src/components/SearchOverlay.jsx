import { useEffect, useRef } from 'react'
import { navigate } from '../routes.js'

export default function SearchOverlay({ open, onClose }) {
  const inputRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    inputRef.current?.focus()
    const onKey = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="react-search" role="dialog" aria-modal="true" aria-label="Search courses">
      <button className="react-search__backdrop" aria-label="Close search" onClick={onClose} />
      <div className="react-search__panel">
        <div className="react-search__top">
          <img src="/assets/img/logo/logo.png" alt="Mindu" />
          <button className="icon-button" type="button" aria-label="Close search" onClick={onClose}><i className="fa-regular fa-xmark" /></button>
        </div>
        <form onSubmit={(event) => { event.preventDefault(); onClose(); navigate('/courses') }}>
          <label htmlFor="site-search">What are you looking for?</label>
          <div><input ref={inputRef} id="site-search" type="search" placeholder="Search courses..." /><button type="submit" aria-label="Search"><i className="fa-regular fa-magnifying-glass" /></button></div>
        </form>
      </div>
    </div>
  )
}
