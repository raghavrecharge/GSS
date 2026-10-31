import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Swiper from 'swiper'
import { Autoplay, EffectFade, Navigation, Pagination } from 'swiper/modules'

gsap.registerPlugin(ScrollTrigger)

export default function usePageInteractions() {
  const location = useLocation()

  useEffect(() => {
    document.querySelectorAll('.has-submenu.active').forEach((item) => item.classList.remove('active'))
    document.querySelectorAll('.nav-submenu-toggle[aria-expanded="true"]').forEach((button) => button.setAttribute('aria-expanded', 'false'))
    const restoreScroll = () => {
      if (!location.hash) {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
        return
      }
      const id = decodeURIComponent(location.hash.slice(1))
      const target = document.getElementById(id)
      if (!target) return
      target.scrollIntoView?.({ block: 'start', behavior: 'auto' })
      const scrollMargin = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0
      if (scrollMargin === 0 && window.scrollBy) {
        const headerHeight = document.querySelector('.wa_sticky_header')?.getBoundingClientRect().height || 80
        const sectionNavHeight = document.querySelector('.msbm-course-nav')?.getBoundingClientRect().height || 0
        window.scrollBy({ top: -(headerHeight + sectionNavHeight + 16), left: 0, behavior: 'auto' })
      }
      target.focus?.({ preventScroll: true })
    }
    const timer = window.setTimeout(restoreScroll, 80)
    return () => window.clearTimeout(timer)
  }, [location.pathname, location.hash])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cleanups = []
    const root = document.querySelector('[data-page-content]')
    if (!root) return undefined

    const preventPlaceholderSubmit = (event) => event.preventDefault()
    root.querySelectorAll('form').forEach((form) => {
      form.addEventListener('submit', preventPlaceholderSubmit)
      cleanups.push(() => form.removeEventListener('submit', preventPlaceholderSubmit))
    })

    const submenuClick = (event) => {
      const button = event.target.closest('.nav-submenu-toggle')
      if (!button) return
      const item = button.closest('.has-submenu')
      const active = item.classList.toggle('active')
      button.setAttribute('aria-expanded', String(active))
    }
    document.addEventListener('click', submenuClick)
    cleanups.push(() => document.removeEventListener('click', submenuClick))

    const accordionClick = (event) => {
      const trigger = event.target.closest('[data-bs-toggle="collapse"], .at_accordion_item')
      if (!trigger) return
      const selector = trigger.getAttribute('data-bs-target') || trigger.getAttribute('href')
      const panel = selector?.startsWith('#') ? root.querySelector(selector) : trigger.querySelector('.at_accordion_content')
      if (!panel) return
      event.preventDefault()
      const willOpen = !panel.classList.contains('show')
      panel.classList.toggle('show', willOpen)
      trigger.classList.toggle('active', willOpen)
      trigger.setAttribute('aria-expanded', String(willOpen))
    }
    root.addEventListener('click', accordionClick)
    cleanups.push(() => root.removeEventListener('click', accordionClick))

    const filterClick = (event) => {
      const button = event.target.closest('.ma-filter-btn')
      if (!button) return
      const bar = button.closest('.ma-filter-bar')
      const filter = button.dataset.filter || '*'
      bar?.querySelectorAll('.ma-filter-btn').forEach((item) => item.classList.toggle('active', item === button))
      root.querySelectorAll('[data-category]').forEach((item) => {
        const visible = filter === '*' || filter === 'all' || item.dataset.category?.split(' ').includes(filter)
        item.hidden = !visible
        if (visible && !reduceMotion) gsap.fromTo(item, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.45 })
      })
      ScrollTrigger.refresh()
    }
    root.addEventListener('click', filterClick)
    cleanups.push(() => root.removeEventListener('click', filterClick))

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        const element = entry.target
        const target = Number(element.dataset.count)
        if (Number.isFinite(target)) {
          if (reduceMotion) element.textContent = String(target)
          else {
            const counter = { value: 0 }
            gsap.to(counter, { value: target, duration: 1.4, ease: 'power2.out', onUpdate: () => { element.textContent = String(Math.round(counter.value)) } })
          }
        }
        observer.unobserve(element)
      })
    }, { threshold: 0.25 })
    root.querySelectorAll('[data-count]').forEach((element) => observer.observe(element))
    cleanups.push(() => observer.disconnect())

    const swipers = []
    const createSwiper = (selector, options) => {
      root.querySelectorAll(selector).forEach((element) => swipers.push(new Swiper(element, { modules: [Autoplay, EffectFade, Navigation, Pagination], ...options })))
    }
    createSwiper('.ma_t3_slider', { loop: true, speed: 800, slidesPerView: 'auto', spaceBetween: 12, autoplay: { delay: 5000 }, navigation: { nextEl: '.ma_t3_slider_next', prevEl: '.ma_t3_slider_prev' }, pagination: { el: '.ma_t3_slider_pagination', clickable: true } })
    createSwiper('.ma_blog_standard_slider', { loop: true, speed: 800, spaceBetween: 12, autoplay: { delay: 5000 }, navigation: { nextEl: '.ma_blog_standard_slider_next', prevEl: '.ma_blog_standard_slider_prev' } })
    createSwiper('.pd_page_testimonial', { loop: true, speed: 500, effect: 'fade', fadeEffect: { crossFade: true }, navigation: { nextEl: '.pd_page_testimonial_next', prevEl: '.pd_page_testimonial_prev' } })
    cleanups.push(() => swipers.forEach((swiper) => swiper.destroy(true, true)))

    if (!reduceMotion) {
      const context = gsap.context(() => {
        gsap.utils.toArray('.wow, [data-ma-reveal]').forEach((element) => {
          gsap.fromTo(element, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.75, ease: 'power2.out', scrollTrigger: { trigger: element, start: 'top 88%', once: true } })
        })
        gsap.utils.toArray('.at_parallax_img, [data-ma-parallax]').forEach((element) => {
          const speed = Number(element.dataset.speed || 0.15)
          gsap.to(element, { yPercent: speed * 35, ease: 'none', scrollTrigger: { trigger: element, scrub: true } })
        })
      }, root)
      cleanups.push(() => context.revert())
    }

    const refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), 80)
    cleanups.push(() => window.clearTimeout(refreshTimer))

    return () => cleanups.reverse().forEach((cleanup) => cleanup())
  }, [location.pathname])
}
