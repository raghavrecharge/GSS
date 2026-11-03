import { describe, expect, it } from 'vitest'
import { compareModuleProjection } from '../../scripts/course-rag-verify/browser.mjs'

describe('independent rendered curriculum comparison', () => {
  const modules = [{ title: 'Research Methods', lessons: [{ title: 'Research design' }, { title: 'Ethics' }] }, { title: 'Thesis', lessons: [] }]
  it('accepts exact ordered module and lesson projection', () => {
    expect(compareModuleProjection([{ title: 'Research Methods', lessons: ['Research design', 'Ethics'] }, { title: 'Thesis', lessons: [] }], modules)).toEqual([])
  })
  it('rejects a missing nested lesson despite the module title being present', () => {
    expect(compareModuleProjection([{ title: 'Research Methods', lessons: ['Research design'] }, { title: 'Thesis', lessons: [] }], modules)).not.toEqual([])
  })
  it('rejects reordering or duplicate substitutions with the same total count', () => {
    expect(compareModuleProjection([{ title: 'Research Methods', lessons: ['Ethics', 'Research design'] }, { title: 'Thesis', lessons: [] }], modules)).not.toEqual([])
  })
})
