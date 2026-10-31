export default function BrandLogo({ compact = false, dark = false }) {
  return <img
    className={`gss-brand-logo ${dark ? 'is-dark-ink' : 'is-light-ink'}${compact ? ' is-compact' : ''}`}
    src={`/assets/img/global-school-of-skills${dark ? '-dark' : ''}.svg`}
    alt="The Global School of Skills (GSS)"
    width="256"
    height="105"
  />
}
