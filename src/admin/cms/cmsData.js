import { courses } from '../../data/msbmCatalog.js'
import contentPages from '../../data/msbmContentPages.json'
import { normaliseModules } from './structuredData.js'

const date = '2026-11-01'

export function createPages() {
  const featured = [
    { id: 'home', title: 'Home', path: '/', description: 'Education that fits your ambition. Explore flexible online, blended and classroom programmes.', content: 'Flexible online, blended and classroom programmes designed for practical skills, recognised pathways and career progression.' },
    { id: 'about', title: 'About GSS', path: '/about', description: 'Discover The Global School of Skills and our approach to education.', content: 'We connect ambitious learners with practical skills and internationally relevant study pathways.' },
    { id: 'contact', title: 'Contact', path: '/contact', description: 'Speak with the GSS admissions team.', content: 'Get guidance on choosing a programme, entry requirements and your next steps.' },
  ]
  const seen = new Set(featured.map(page => page.path))
  return [...featured, ...contentPages.filter(page => !seen.has(page.path)).map((page, index) => ({
    id: `source-page-${index}`, title: page.title, path: page.path,
    description: page.description || '', content: (page.blocks || []).map(block => block.text || '').filter(Boolean).join('\n\n'),
    customSections: (page.blocks || []).map((block, blockIndex) => ({ id: `source-section-${index}-${blockIndex}`, label: block.title || block.heading || `Section ${blockIndex + 1}`, type: 'Long text', value: block.text || (block.items || []).join('\n') })),
  }))].map(page => ({ customSections: [], ...page, kind: 'page', status: 'Published', updated: date, seoTitle: page.title, seoDescription: page.description, template: 'Standard page', navigationLabel: page.title, heroTitle: page.title, heroImage: '', parentPath: '/', ctaLabel: '', ctaPath: '/contact' }))
}

export function createProgrammes() {
  return courses.map((course, index) => toProgrammeDraft(course, `programme-${index}`))
}

export function toProgrammeDraft(course, id = `programme-${course.slug}`) {
  return {
    ...course, id, kind: 'programme', path: `/programmes/${course.slug}`,
    content: course.longDescription || course.description || '', seoTitle: course.title,
    status: 'Published', updated: date,
    modulesText: (course.modules || []).map(module => Array.isArray(module) ? module.filter(Boolean).join(' — ') : [module.title, module.summary, module.lectures ? `${module.lectures} lectures` : '', module.quizzes ? `${module.quizzes} quizzes` : '', ...(module.lessons || []).map(lesson => typeof lesson === 'string' ? lesson : lesson.title || lesson.name || '')].filter(Boolean).join('\n')).join('\n\n'),
    entryText: Array.isArray(course.entry) ? course.entry.join('\n') : course.entry || '',
    accreditationText: course.accreditation || '',
    outcomesText: (course.outcomes || []).join('\n'),
    courseDetails: course.courseDetails || '', progression: course.progression || '',
    workshops: course.workshops || '', visa: course.visa || '', library: course.library || '',
    certificate: (course.certificateDetails || []).map(item => Array.isArray(item) ? item.slice(1).join(' — ') : String(item)).join('\n'),
    tuitionNotes: [course.paymentSchedule, course.administrativeFee ? `Administrative fee: ${course.administrativeFee}` : '', course.paymentMonths ? `Payment period: ${course.paymentMonths}` : ''].filter(Boolean).join('\n'),
    moduleRecords: normaliseModules(course.modules),
    advantageRecords: (course.advantages || []).map(([icon, title, text], itemIndex) => ({ id: `benefit-${itemIndex}`, icon, title, text })),
    credentialRecords: (course.certificateDetails || []).map(([icon, title, text], itemIndex) => ({ id: `credential-${itemIndex}`, icon, title, text })),
    testimonialRecords: (course.testimonials || []).map(([name, quote], itemIndex) => ({ id: `testimonial-${itemIndex}`, name, quote })),
    faqRecords: (course.faqs || []).map((item, itemIndex) => ({ id: `faq-${itemIndex}`, question: item.question || item[0] || '', answer: item.answer || item[1] || '' })),
    gettingStartedRecords: (course.gettingStarted || []).map((step, index) => ({ id: `step-${index}`, title: typeof step === 'string' ? step : step.title || '', description: typeof step === 'string' ? '' : step.description || '' })),
    gettingStartedText: (course.gettingStarted || []).map(step => typeof step === 'string' ? step : [step.title, step.description].filter(Boolean).join(' — ')).join('\n'), subjectsText: (course.subjects || []).join('\n'), seoDescription: course.description || '', customSections: course.customSections || [],
  }
}

export const initialMedia = [
  { id: 'brand', title: 'GSS primary logo', src: '/assets/img/global-school-of-skills-dark.svg', alt: 'The Global School of Skills', type: 'SVG', usage: 'Header and navigation' },
  { id: 'hero', title: 'Learning and ambition', src: '/assets/img/hero/hero-1.webp', alt: 'A collaborative learning environment', type: 'WEBP', usage: 'Homepage' },
  { id: 'classroom', title: 'Business programmes', src: '/assets/img/hero/hero-2.webp', alt: 'Professionals learning together', type: 'WEBP', usage: 'Programme cards' },
  { id: 'learning', title: 'Our learning community', src: '/assets/img/about/about-1.webp', alt: 'Members of the GSS learning community', type: 'WEBP', usage: 'About GSS' },
  { id: 'study', title: 'Programme cover', src: '/assets/img/case-study/cs-2.webp', alt: 'Business and management study', type: 'WEBP', usage: 'Programme detail' },
  { id: 'student', title: 'Student story', src: '/assets/img/testimonial/author-1.webp', alt: 'Student testimonial portrait', type: 'WEBP', usage: 'Student stories' },
]

export const initialNavigation = [
  { id: 'nav-home', label: 'Home', path: '/', visible: true },
  { id: 'nav-programmes', label: 'Programmes', path: '/programmes', visible: true },
  { id: 'nav-categories', label: 'About GSS', path: '/about', visible: true },
  { id: 'nav-universities', label: 'Insights', path: '/insights', visible: true },
  { id: 'nav-about', label: 'Why GSS', path: '/about', visible: true },
  { id: 'nav-contact', label: 'Contact Us', path: '/contact', visible: true },
]
