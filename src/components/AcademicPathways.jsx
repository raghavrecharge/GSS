import { Link } from 'react-router-dom'

const pathways = [
  {
    eyebrow: 'Academic pathway',
    title: 'MSc in Business Administration',
    description: 'Build advanced management knowledge through a flexible postgraduate study route.',
    to: '/categories/masters-degree',
    icon: 'ph-graduation-cap',
    featured: true,
  },
  {
    eyebrow: 'Postgraduate degree',
    title: 'MBA in Banking and Insurance',
    description: 'Develop strategic expertise for leadership across financial services.',
    to: '/programmes/master-of-business-administration-in-banking-and-insurance',
    icon: 'ph-bank',
  },
  {
    eyebrow: 'Executive degree',
    title: 'Executive MBA in Human Resource Management',
    description: 'Strengthen people leadership, organisational strategy and decision-making.',
    to: '/specializations/human-resources',
    icon: 'ph-users-three',
  },
  {
    eyebrow: 'Executive degree',
    title: 'MBA in Operations and Supply Chain Management',
    description: 'Advance your capability in operations, logistics and resilient supply networks.',
    to: '/specializations/logistics-and-supply-chain-management',
    icon: 'ph-flow-arrow',
  },
  {
    eyebrow: 'Professional learning',
    title: 'Professional Certificate Programmes',
    description: 'Focused, practical online study for immediate workplace application.',
    to: '/categories/professional-certificate',
    icon: 'ph-certificate',
  },
  {
    eyebrow: 'Career development',
    title: 'Executive Education',
    description: 'Short, applied programmes designed for ambitious working professionals.',
    to: '/categories/semp-online-sep-upgradeable',
    icon: 'ph-briefcase',
  },
]

export default function AcademicPathways() {
  return (
    <section className="gss-pathways" aria-labelledby="gss-pathways-title">
      <div className="container ma-container-1">
        <div className="gss-pathways__heading">
          <div>
            <span className="gss-pathways__kicker">Study routes</span>
            <h2 id="gss-pathways-title">Academic and awarding-body pathways</h2>
          </div>
          <p>Explore flexible qualifications and focused professional learning designed to support your next career move.</p>
        </div>

        <div className="gss-pathways__grid">
          {pathways.map((pathway, index) => (
            <Link className={`gss-pathway-card${pathway.featured ? ' is-featured' : ''}`} to={pathway.to} key={pathway.title}>
              <span className="gss-pathway-card__number">0{index + 1}</span>
              <span className="gss-pathway-card__icon" aria-hidden="true"><i className={`ph ${pathway.icon}`} /></span>
              <span className="gss-pathway-card__eyebrow">{pathway.eyebrow}</span>
              <h3>{pathway.title}</h3>
              <p>{pathway.description}</p>
              <span className="gss-pathway-card__link">Explore pathway <i className="ph ph-arrow-up-right" aria-hidden="true" /></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
