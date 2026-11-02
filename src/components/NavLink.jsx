import { navigate } from '../routes.js'

export default function NavLink({ to, children, className = '', onClick }) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        event.preventDefault()
        onClick?.()
        navigate(to)
      }}
    >
      {children}
    </a>
  )
}
