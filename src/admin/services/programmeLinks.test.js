import { describe, expect, it } from 'vitest'
import { resolveProgramme } from './programmeLinks.js'

describe('CRM catalogue identity', () => {
  const catalogue = [{ slug: 'mba', title: 'MBA' }]
  it('prefers the stable programme ID over a stale display title', () => {
    expect(resolveProgramme({ courseSlug: 'mba', programme: 'Previous title' }, catalogue)).toEqual(catalogue[0])
  })
  it('does not silently substitute a title match for a broken ID', () => {
    expect(resolveProgramme({ courseSlug: 'unknown', programme: 'MBA' }, catalogue)).toBeNull()
    expect(resolveProgramme({ programme: ' mba ' }, catalogue)).toEqual(catalogue[0])
  })
})
