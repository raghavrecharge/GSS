import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CheckoutPage, CheckoutSuccessPage } from './Checkout.jsx'
import { checkoutUrl } from './checkoutUtils.js'
import { CourseCard } from './Catalog.jsx'
import { findCourse } from '../data/msbmCatalog.js'

const course = findCourse('masters-of-business-administration')

function renderCheckout() {
  return render(<MemoryRouter initialEntries={[`/checkout/${course.slug}`]}><Routes>
    <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
    <Route path="/checkout/:courseSlug" element={<CheckoutPage />} />
  </Routes></MemoryRouter>)
}

afterEach(() => {
  cleanup()
  sessionStorage.clear()
  vi.useRealTimers()
})

describe('programme checkout', () => {
  it('adds a Buy now action to a priced course card', () => {
    render(<MemoryRouter><CourseCard course={course} /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Buy now/i })).toHaveAttribute('href', checkoutUrl(course))
  })

  it('shows Stripe and Razorpay with inline validation', async () => {
    renderCheckout()
    expect(screen.getByRole('radio', { name: /Stripe/i })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Razorpay/i })).not.toBeChecked()
    fireEvent.click(screen.getByRole('button', { name: /Continue to Stripe/i }))
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent('Check the highlighted details')
    expect(screen.getByText('First name is required.')).toBeInTheDocument()
  })

  it('completes the simulated Razorpay payment and shows a receipt', async () => {
    renderCheckout()
    const values = [
      ['First name', 'Demo'], ['Last name', 'Learner'], ['Email address', 'demo@example.com'], ['Phone number', '+44 7700 900123'],
      ['Billing address', '1 Learning Street'], ['City', 'London'], ['Country', 'United Kingdom'], ['Postcode', 'SW1A 1AA'],
    ]
    values.forEach(([label, value]) => fireEvent.change(screen.getByLabelText(label), { target: { value } }))
    fireEvent.click(screen.getByRole('radio', { name: /Razorpay/i }))
    fireEvent.click(screen.getByRole('checkbox'))
    fireEvent.click(screen.getByRole('button', { name: /Continue to Razorpay/i }))
    expect(await screen.findByRole('dialog', { name: /Complete payment with Razorpay/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Complete demo payment/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /Your payment flow works/i })).toBeInTheDocument(), { timeout: 2000 })
    expect(screen.getByText('Razorpay')).toBeInTheDocument()
    expect(sessionStorage.getItem('gss-demo-order')).toContain('razorpay')
  })
})

