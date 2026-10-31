import { Link } from 'react-router-dom'
import BrandLogo from './BrandLogo.jsx'

const aboutLinks = [
  ['Our Story', '/about-msbm/our-story'], ['Our Mission', '/about-msbm/our-mission'], ['Our Vision', '/about-msbm/our-vision'], ['Our Values', '/about-msbm/our-values'],
  ['Education', '/about-msbm/education'], ['Learning Model', '/about-msbm/learning-model'], ['Accreditation', '/about-msbm/accreditation'],
  ['Culture and Structure', '/about-msbm/culture-and-structure'], ['Contact Us', '/contact'],
]
const moreLinks = [
  ['For Charities', '/charity'], ['For High Schools & Colleges', '/schools-colleges-solution'], ['Companies', '/for-business'], ['Terms and Conditions', '/terms'],
  ['Learning with GSS', '/learning-with-msbm'], ['Applying To GSS', '/learning-with-msbm/applying-to-msbm'], ['Upgrades & Top Up Fees', '/learning-with-msbm/masters-top-up-fees'],
  ['Postgraduate Fees', '/learning-with-msbm/postgraduate-fees'], ['Undergraduate Fees', '/learning-with-msbm/undergraduate-fees'], ['Certificates', '/certificates'],
  ['Study Contract', '/terms/study-contract'], ['Refund Policy', '/learning-with-msbm/refund-policy'], ['Accessibility Policy', '/terms/accessibility-policy'],
  ['Privacy Policy', '/terms/privacy-policy'], ['Admission Policy', '/terms/admission-policy'], ['Code of Conduct', '/terms/code-of-conduct'],
  ['Anti-Corruption Policy', '/terms/anti-corruption-bribery-policy'], ['Partnership Agreement', '/terms/msbm-partners'],
  ['Business and Charity', '/terms/business-and-charity'], ['Frequently Asked Questions', '/faq'],
]
const popularLinks = [
  ['Business Management', '/specializations/business-management'], ['Health and Psychology', '/specializations/health-and-psychology'], ['Business Law', '/specializations/business-law'],
  ['Information Technology', '/specializations/information-technology'], ['Personal Development', '/specializations/personal-development'],
  ['Teaching and Education', '/specializations/teaching-and-education'], ['Health and Safety', '/specializations/health-and-safety'],
  ['Finance and Accounting', '/specializations/finance-and-accounting'], ['Office Productivity', '/specializations/office-productivity'],
  ['Sales and Marketing', '/specializations/sales-and-marketing'], ['Leadership and Entrepreneurship', '/specializations/leadership-and-entrepreneurship'],
  ['Human Resources', '/specializations/human-resources'], ['Hotel, Travel and Hospitality Management', '/specializations/hotel-travel-hospitality-management'],
  ['Logistics and Supply Chain Management', '/specializations/logistics-and-supply-chain-management'],
]
const degreeLinks = [
  ['Executive MBA Tourism and Hospitality', '/programmes/executive-mba-tourism-hospitality-management'], ['DBA in Project Management', '/programmes/dba-in-project-management'],
  ['Masters of Business Administration', '/programmes/masters-of-business-administration'], ['MBA Sales and Marketing', '/programmes/mba-sales-marketing'],
  ['MSc in Health Sciences', '/programmes/msc-in-health-sciences'],
]
const partners = ['UCAM', 'Glasgow Business School', 'Girne American University', 'EIMT', 'International American University', 'University of Gloucestershire', 'Azteca University', 'Rushford Business School']

function FooterLinks({ title, items }) {
  return <div className="msbm-footer-links"><h4>{title}</h4><ul>{items.map(([label, to]) => <li key={`${label}-${to}`}><Link to={to}>{label}</Link></li>)}</ul></div>
}

export default function Footer() {
  return <footer className="ma-footer-1-area msbm-footer">
    <div className="container ma-container-1"><div className="msbm-footer-partners"><span>500+ Trusted Partners</span><div>{partners.map((partner) => <strong key={partner}>{partner}</strong>)}</div></div></div>
    <div className="container ma-container-1"><div className="msbm-footer-grid">
      <FooterLinks title="About Us" items={aboutLinks} />
      <FooterLinks title="More" items={moreLinks} />
      <div className="msbm-footer-column"><FooterLinks title="Popular Courses" items={popularLinks} /><h4 className="msbm-footer-subtitle">Executive Education Courses (CPD)</h4><ul><li><Link to="/categories/advanced-professional-certificate">Advanced Professional Certificate Courses</Link></li><li><Link to="/categories/professional-certificate">Professional Certificate Courses</Link></li><li><Link to="/categories/semp-online-sep-upgradeable">Online SEMP</Link></li></ul></div>
      <div className="msbm-footer-column"><FooterLinks title="Programme Degrees" items={degreeLinks} /><h4 className="msbm-footer-subtitle">Study by location</h4><Link className="msbm-footer-location" to="/countries"><i className="ph ph-globe-hemisphere-west" /> Browse countries and regions <i className="ph ph-arrow-right" /></Link><h4 className="msbm-footer-subtitle">Download our App</h4><p>Access the full course catalogue on your device.</p></div>
      <div className="msbm-footer-column"><h4>Campus Programmes</h4><ul><li><Link to="/campus-programmes/bachelors-degrees">Bachelor&apos;s Degree</Link></li></ul><h4 className="msbm-footer-subtitle">Postgraduate Studies</h4><ul><li><Link to="/categories/masters-degree">Master&apos;s Degree</Link></li><li><Link to="/categories/international-postgraduate-diploma-endorsed">International Postgraduate Diploma</Link></li></ul><h4 className="msbm-footer-subtitle">Other info</h4><ul><li><Link to="/contact">Contact Us</Link></li><li><Link to="/terms/msbm-partners">Partners</Link></li><li><Link to="/faq">FAQ</Link></li></ul></div>
    </div></div>
    <div className="container ma-container-1"><div className="msbm-footer-bottom"><Link to="/" aria-label="The Global School of Skills home"><BrandLogo compact /></Link><p>© 2026 The Global School of Skills (GSS). All rights reserved.</p><div><Link to="/terms/privacy-policy">Privacy Policy</Link><Link to="/terms">Terms and Conditions</Link></div></div></div>
  </footer>
}
