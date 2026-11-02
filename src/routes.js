export const pageRoutes = {
  '/': 'index.html',
  '/online-course': 'index-2.html',
  '/online-mentor': 'index-3.html',
  '/about': 'about.html',
  '/services': 'service.html',
  '/services/details': 'service-details.html',
  '/team': 'team.html',
  '/team/details': 'team-details.html',
  '/testimonials': 'testimonial.html',
  '/faq': 'faq.html',
  '/courses': 'course.html',
  '/courses/filter': 'course-with-filter.html',
  '/courses/details': 'course-details.html',
  '/blog': 'blog.html',
  '/blog/standard': 'blog-standard.html',
  '/blog/details': 'blog-details.html',
  '/shop': 'shop.html',
  '/shop/details': 'shop-details.html',
  '/cart': 'cart.html',
  '/checkout': 'checkout.html',
  '/login': 'login.html',
  '/register': 'register.html',
  '/contact': 'contact.html',
  '/404': 'error.html',
}

export const htmlToRoute = Object.fromEntries(
  Object.entries(pageRoutes).map(([route, file]) => [file, route]),
)

export function normalizePath(pathname) {
  if (!pathname || pathname === '/index.html') return '/'
  const clean = pathname.split(/[?#]/)[0].replace(/\/+$/, '') || '/'
  if (clean === '/dashboard' || clean.startsWith('/dashboard/')) return clean
  if (pageRoutes[clean]) return clean
  const file = clean.split('/').pop()
  return htmlToRoute[file] || clean
}

export function dashboardFileFromPath(pathname) {
  if (pathname === '/dashboard') return 'dashboard-academy.html'
  const slug = pathname.replace(/^\/dashboard\/?/, '')
  if (slug === 'login') return 'auth-login-basic.html'
  if (slug === 'applications') return 'lms-course-list.html'
  return `${slug || 'dashboard-academy'}.html`
}

export function dashboardRouteFromFile(file) {
  const slug = file.replace(/\.html(?:#.*)?$/i, '')
  return slug === 'dashboard-academy' ? '/dashboard' : `/dashboard/${slug}`
}

export function navigate(to) {
  const url = new URL(to, window.location.origin)
  const target = normalizePath(url.pathname)
  const destination = `${target}${url.search}${url.hash}`
  if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== destination) {
    window.history.pushState({}, '', destination)
  }
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
