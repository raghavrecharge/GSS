export function checkoutUrl(course) {
  const query = course.localLocation?.slug
    ? `?location=${encodeURIComponent(course.localLocation.slug)}`
    : course.localCountry?.slug ? `?country=${encodeURIComponent(course.localCountry.slug)}` : ''
  return `/checkout/${course.slug}${query}`
}
