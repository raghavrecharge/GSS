import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { findCourse, getCountryCourse, getLocationCourse } from '../data/msbmCatalog.js'

const initialDetails = {
  firstName: '', lastName: '', email: '', phone: '', address: '', city: '', country: '', postcode: '',
}

const gatewayDetails = {
  stripe: {
    name: 'Stripe', short: 'stripe', icon: 'ph-credit-card',
    description: 'International cards and secure browser checkout.',
    testLabel: 'Test card', testValue: '4242 4242 4242 4242',
  },
  razorpay: {
    name: 'Razorpay', short: 'Razorpay', icon: 'ph-device-mobile',
    description: 'Cards, UPI and netbanking for supported regions.',
    testLabel: 'Test UPI ID', testValue: 'success@razorpay',
  },
}

function checkoutCourse(slug, country, location) {
  if (country) return getCountryCourse(country, slug) || findCourse(slug)
  if (location) return getLocationCourse(location, slug) || findCourse(slug)
  return findCourse(slug)
}

function priceState(course) {
  const fee = course?.fee || 'Request fees'
  const isFree = /^free$/i.test(fee.trim())
  const hasPrice = isFree || (/\d/.test(fee) && !/request|confirm/i.test(fee))
  const monthly = course?.monthly || ''
  const hasMonthly = /\d/.test(monthly) && !/was|flexible|no payment/i.test(monthly)
  return { fee, isFree, hasPrice, monthly, hasMonthly }
}

function validateDetails(values) {
  const errors = {}
  const labels = { firstName: 'First name', lastName: 'Last name', email: 'Email address', phone: 'Phone number', address: 'Billing address', city: 'City', country: 'Country', postcode: 'Postcode' }
  Object.entries(labels).forEach(([key, label]) => { if (!values[key].trim()) errors[key] = `${label} is required.` })
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errors.email = 'Enter a valid email address.'
  if (values.phone && !/^[+\d][\d\s()-]{6,19}$/.test(values.phone)) errors.phone = 'Enter a valid phone number.'
  return errors
}

function Field({ id, label, value, error, type = 'text', autoComplete, onChange, onBlur }) {
  return <label className={`gss-checkout-field${error ? ' has-error' : ''}`} htmlFor={id}>
    <span>{label}</span>
    <input id={id} name={id} type={type} value={value} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={onChange} onBlur={onBlur} />
    {error && <small id={`${id}-error`} role="alert">{error}</small>}
  </label>
}

function CheckoutSteps({ current = 1 }) {
  return <ol className="gss-checkout-steps" aria-label="Checkout progress">
    {['Your details', 'Payment', 'Confirmation'].map((label, index) => <li className={index + 1 <= current ? 'is-active' : ''} aria-current={index + 1 === current ? 'step' : undefined} key={label}><span>{index + 1}</span><strong>{label}</strong></li>)}
  </ol>
}

function OrderSummary({ course, plan, pricing }) {
  const amount = plan === 'monthly' ? pricing.monthly : pricing.fee
  return <aside className="gss-order-summary" aria-label="Order summary">
    <span className="gss-checkout-kicker">Order summary</span>
    <div className="gss-order-course"><img src={course.image} alt="" /><div><small>{course.level}</small><h2>{course.title}</h2><p>{course.university}</p></div></div>
    <dl>
      <div><dt>Study mode</dt><dd>{course.mode}</dd></div>
      <div><dt>Duration</dt><dd>{course.duration}</dd></div>
      <div><dt>Payment plan</dt><dd>{plan === 'monthly' ? 'Instalment' : pricing.isFree ? 'Free enrolment' : 'Pay in full'}</dd></div>
      <div className="is-total"><dt>{pricing.isFree ? 'Due today' : plan === 'monthly' ? 'First payment' : 'Total due'}</dt><dd>{pricing.isFree ? '£ 0' : amount}</dd></div>
    </dl>
    <p className="gss-order-secure"><i className="ph ph-lock-key" aria-hidden="true" /> Secure checkout · No real charge in demo mode</p>
  </aside>
}

function DemoPayment({ gateway, amount, course, onClose, onSuccess }) {
  const [status, setStatus] = useState('ready')
  const dialog = useRef(null)
  const details = gatewayDetails[gateway]

  useEffect(() => {
    dialog.current?.focus()
    const close = (event) => { if (event.key === 'Escape' && status !== 'processing') onClose() }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [onClose, status])

  function simulate(success) {
    setStatus('processing')
    window.setTimeout(() => success ? onSuccess() : setStatus('failed'), 900)
  }

  return <div className="gss-payment-backdrop" role="presentation">
    <section ref={dialog} className="gss-payment-dialog" role="dialog" aria-modal="true" aria-labelledby="demo-payment-title" tabIndex={-1}>
      <header><div className={`gss-gateway-mark is-${gateway}`} aria-hidden="true">{details.short}</div><button type="button" aria-label="Close demo payment" onClick={onClose} disabled={status === 'processing'}><i className="ph ph-x" /></button></header>
      <div className="gss-payment-merchant"><span>Paying GSS</span><strong>{amount}</strong><small>{course.title}</small></div>
      <div className="gss-demo-banner"><i className="ph ph-flask" aria-hidden="true" /><div><strong>Demo payment</strong><p>This screen simulates the provider experience. No payment details are transmitted and no money is charged.</p></div></div>
      <h2 id="demo-payment-title">Complete payment with {details.name}</h2>
      {status === 'failed' && <div className="gss-payment-error" role="alert"><i className="ph ph-warning-circle" aria-hidden="true" /><div><strong>Demo payment declined</strong><p>No charge was made. Retry the successful flow or return to checkout.</p></div></div>}
      <div className="gss-demo-payment-method">
        <span>{details.testLabel}</span><strong>{details.testValue}</strong>
        {gateway === 'stripe' ? <small>Expiry 12/34 · CVC 123 · Test mode</small> : <small>UPI approval simulated · Test mode</small>}
      </div>
      <button className="gss-payment-complete" type="button" onClick={() => simulate(true)} disabled={status === 'processing'}>{status === 'processing' ? <><i className="ph ph-spinner-gap" aria-hidden="true" /> Processing demo payment…</> : <>Complete demo payment <i className="ph ph-arrow-right" aria-hidden="true" /></>}</button>
      {status !== 'processing' && <button className="gss-payment-fail" type="button" onClick={() => simulate(false)}>Test a declined payment</button>}
      <footer><i className="ph ph-shield-check" aria-hidden="true" /> Demo only. Live gateway credentials are not configured.</footer>
    </section>
  </div>
}

export function CheckoutPage() {
  const { courseSlug } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const course = useMemo(() => checkoutCourse(courseSlug, searchParams.get('country'), searchParams.get('location')), [courseSlug, searchParams])
  const pricing = useMemo(() => priceState(course), [course])
  const [details, setDetails] = useState(initialDetails)
  const [errors, setErrors] = useState({})
  const [plan, setPlan] = useState('full')
  const [gateway, setGateway] = useState('stripe')
  const [accepted, setAccepted] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const errorSummary = useRef(null)

  if (!course) return <section className="gss-checkout-missing"><h1>Programme not found</h1><p>This checkout link does not match a current programme.</p><Link to="/programmes">Browse programmes</Link></section>

  const amount = plan === 'monthly' ? pricing.monthly : pricing.fee
  const setField = (key, value) => { setDetails(current => ({ ...current, [key]: value })); if (errors[key]) setErrors(current => ({ ...current, [key]: undefined })) }
  const blurField = (key) => setErrors(current => ({ ...current, [key]: validateDetails(details)[key] }))

  function submit(event) {
    event.preventDefault()
    const nextErrors = validateDetails(details)
    if (!accepted) nextErrors.terms = 'Accept the enrolment and privacy terms to continue.'
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      window.setTimeout(() => errorSummary.current?.focus(), 0)
      return
    }
    if (pricing.isFree) completeOrder('free')
    else setPaymentOpen(true)
  }

  function completeOrder(selectedGateway = gateway) {
    const receipt = {
      id: `GSS-DEMO-${Date.now().toString(36).toUpperCase()}`,
      courseSlug: course.slug,
      amount: pricing.isFree ? '£ 0' : amount,
      plan,
      gateway: selectedGateway,
      completedAt: new Date().toISOString(),
    }
    sessionStorage.setItem('gss-demo-order', JSON.stringify(receipt))
    navigate('/checkout/success', { replace: true, state: receipt })
  }

  if (!pricing.hasPrice) return <section className="gss-checkout-page"><div className="container ma-container-1"><CheckoutSteps /><div className="gss-price-confirmation"><i className="ph ph-chats-circle" aria-hidden="true" /><span className="gss-checkout-kicker">Pricing confirmation</span><h1>Confirm the programme fee before checkout</h1><p>The current fee for <strong>{course.title}</strong> is available on request. An advisor will confirm tuition, your location and the next intake before taking payment.</p><div><Link className="ma-pr-btn-1" to="/contact"><span>Request programme fee</span><i className="ph ph-arrow-right" /></Link><Link to={`/programmes/${course.slug}`}>Return to programme</Link></div></div></div></section>

  return <section className="gss-checkout-page"><div className="container ma-container-1">
    <CheckoutSteps />
    <div className="gss-checkout-heading"><div><span className="gss-checkout-kicker">Secure enrolment checkout</span><h1>Complete your enrolment</h1><p>Review your programme, enter your billing details and complete a simulated payment.</p></div><Link to={`/programmes/${course.slug}`}><i className="ph ph-arrow-left" aria-hidden="true" /> Back to programme</Link></div>
    <div className="gss-checkout-layout">
      <form className="gss-checkout-form" onSubmit={submit} noValidate>
        {Object.keys(errors).length > 0 && <div ref={errorSummary} className="gss-checkout-error-summary" role="alert" tabIndex={-1}><strong>Check the highlighted details</strong><p>Complete all required fields before continuing to payment.</p></div>}
        <fieldset><legend><span>1</span> Student and billing details</legend><p>Used to prepare the enrolment record and payment receipt.</p><div className="gss-checkout-fields">
          <Field id="firstName" label="First name" value={details.firstName} error={errors.firstName} autoComplete="given-name" onChange={event => setField('firstName', event.target.value)} onBlur={() => blurField('firstName')} />
          <Field id="lastName" label="Last name" value={details.lastName} error={errors.lastName} autoComplete="family-name" onChange={event => setField('lastName', event.target.value)} onBlur={() => blurField('lastName')} />
          <Field id="email" label="Email address" type="email" value={details.email} error={errors.email} autoComplete="email" onChange={event => setField('email', event.target.value)} onBlur={() => blurField('email')} />
          <Field id="phone" label="Phone number" type="tel" value={details.phone} error={errors.phone} autoComplete="tel" onChange={event => setField('phone', event.target.value)} onBlur={() => blurField('phone')} />
          <Field id="address" label="Billing address" value={details.address} error={errors.address} autoComplete="street-address" onChange={event => setField('address', event.target.value)} onBlur={() => blurField('address')} />
          <Field id="city" label="City" value={details.city} error={errors.city} autoComplete="address-level2" onChange={event => setField('city', event.target.value)} onBlur={() => blurField('city')} />
          <Field id="country" label="Country" value={details.country} error={errors.country} autoComplete="country-name" onChange={event => setField('country', event.target.value)} onBlur={() => blurField('country')} />
          <Field id="postcode" label="Postcode" value={details.postcode} error={errors.postcode} autoComplete="postal-code" onChange={event => setField('postcode', event.target.value)} onBlur={() => blurField('postcode')} />
        </div></fieldset>
        <fieldset><legend><span>2</span> Payment plan</legend><p>Choose how you want to pay for this programme.</p><div className="gss-payment-options">
          <label className={plan === 'full' ? 'is-selected' : ''}><input type="radio" name="payment-plan" value="full" checked={plan === 'full'} onChange={() => setPlan('full')} /><span><strong>{pricing.isFree ? 'Free enrolment' : 'Pay in full'}</strong><small>{pricing.isFree ? 'No payment required' : 'One secure payment'}</small></span><b>{pricing.isFree ? '£ 0' : pricing.fee}</b></label>
          {pricing.hasMonthly && <label className={plan === 'monthly' ? 'is-selected' : ''}><input type="radio" name="payment-plan" value="monthly" checked={plan === 'monthly'} onChange={() => setPlan('monthly')} /><span><strong>Pay by instalments</strong><small>First instalment due today</small></span><b>{pricing.monthly}</b></label>}
        </div></fieldset>
        {!pricing.isFree && <fieldset><legend><span>3</span> Payment gateway</legend><p>Select a provider. Both options run in safe demo mode until live credentials are added.</p><div className="gss-gateway-options">
          {Object.entries(gatewayDetails).map(([id, item]) => <label className={gateway === id ? 'is-selected' : ''} key={id}><input type="radio" name="gateway" value={id} checked={gateway === id} onChange={() => setGateway(id)} /><span className={`gss-gateway-mark is-${id}`} aria-hidden="true">{item.short}</span><span><strong>{item.name}</strong><small>{item.description}</small></span><i className="ph ph-check-circle" aria-hidden="true" /></label>)}
        </div></fieldset>}
        <label className={`gss-checkout-consent${errors.terms ? ' has-error' : ''}`}><input type="checkbox" checked={accepted} onChange={event => { setAccepted(event.target.checked); setErrors(current => ({ ...current, terms: undefined })) }} /><span>I agree to the <Link to="/terms" target="_blank">terms and conditions</Link> and acknowledge the <Link to="/terms/privacy-policy" target="_blank">privacy policy</Link>.</span></label>
        {errors.terms && <p className="gss-checkout-inline-error" role="alert">{errors.terms}</p>}
        <button className="gss-checkout-submit" type="submit">{pricing.isFree ? 'Complete demo enrolment' : `Continue to ${gatewayDetails[gateway].name}`} <i className="ph ph-arrow-right" aria-hidden="true" /></button>
        <p className="gss-checkout-demo-note"><i className="ph ph-info" aria-hidden="true" /> Demo mode: no payment credentials are collected, no charge is made and submitted contact details are not stored.</p>
      </form>
      <OrderSummary course={course} plan={plan} pricing={pricing} />
    </div>
  </div>{paymentOpen && <DemoPayment gateway={gateway} amount={amount} course={course} onClose={() => setPaymentOpen(false)} onSuccess={() => completeOrder()} />}</section>
}

export function CheckoutSuccessPage() {
  const location = useLocation()
  const receipt = useMemo(() => {
    if (location.state?.id) return location.state
    try { return JSON.parse(sessionStorage.getItem('gss-demo-order') || 'null') } catch { return null }
  }, [location.state])
  const course = receipt ? findCourse(receipt.courseSlug) : null
  const gateway = receipt?.gateway === 'free' ? 'Free enrolment' : gatewayDetails[receipt?.gateway]?.name

  return <section className="gss-checkout-success"><div className="container ma-container-1"><CheckoutSteps current={3} /><div className="gss-success-card">
    <span className="gss-success-icon"><i className="ph ph-check" aria-hidden="true" /></span><span className="gss-checkout-kicker">Demo transaction complete</span><h1>Your payment flow works</h1><p>{course ? <>The simulated enrolment for <strong>{course.title}</strong> completed successfully.</> : 'The simulated checkout completed successfully.'} No money was charged.</p>
    {receipt && <dl><div><dt>Demo order</dt><dd>{receipt.id}</dd></div><div><dt>Amount</dt><dd>{receipt.amount}</dd></div><div><dt>Payment method</dt><dd>{gateway}</dd></div><div><dt>Status</dt><dd><span>Demo paid</span></dd></div></dl>}
    <div className="gss-success-next"><h2>What happens in the live flow?</h2><ol><li><span>1</span><div><strong>Payment verification</strong><p>The selected gateway verifies the transaction server-side.</p></div></li><li><span>2</span><div><strong>Receipt and enrolment email</strong><p>The learner receives confirmed payment and programme instructions.</p></div></li><li><span>3</span><div><strong>Student onboarding</strong><p>The admissions team activates the learner record and next steps.</p></div></li></ol></div>
    <div className="gss-success-actions"><Link className="ma-pr-btn-1" to="/programmes"><span>Explore more programmes</span><i className="ph ph-arrow-right" /></Link>{course && <Link to={`/programmes/${course.slug}`}>Return to programme</Link>}</div>
  </div></div></section>
}

