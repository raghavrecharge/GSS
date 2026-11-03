import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCourseRecord } from './courseApi.js'

function CourseProbe({ slug }) {
  const { course } = useCourseRecord(slug)
  return <p>{course?.slug || 'missing'}</p>
}

describe('useCourseRecord', () => {
  afterEach(() => vi.restoreAllMocks())

  it('never retains the previous course when the route slug changes and the API fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const view = render(<CourseProbe slug="masters-of-business-administration" />)
    expect(screen.getByText('masters-of-business-administration')).toBeInTheDocument()

    view.rerender(<CourseProbe slug="route-that-does-not-exist" />)
    await waitFor(() => expect(screen.getByText('missing')).toBeInTheDocument())
    expect(screen.queryByText('masters-of-business-administration')).not.toBeInTheDocument()
  })
})
