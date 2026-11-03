import { describe, expect, it } from 'vitest'
import { normaliseModules, serialiseModules } from './structuredData.js'

describe('CMS curriculum round trip', () => {
  it('retains source lesson descriptions and extra metadata when saving', () => {
    const source = [{ title: 'Research methods', summary: 'Research design', credits: '6 ECTS', lectures: 1, quizzes: 0, lessons: [{ title: 'Ethics', type: 'Lecture', description: 'Informed consent and participant rights.', duration: '20 minutes' }] }]
    const draft = normaliseModules(source)
    draft[0].summary = 'Updated research design'
    const saved = serialiseModules(draft)
    expect(saved[0]).toMatchObject({ credits: '6 ECTS', summary: 'Updated research design', lessons: source[0].lessons })
    expect(saved[0].id).toBeUndefined()
    expect(saved[0].lessons[0].id).toBeUndefined()
  })
})
