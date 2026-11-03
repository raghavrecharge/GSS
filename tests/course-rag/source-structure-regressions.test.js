// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { assembleCandidate, extractSnapshot } from '../../scripts/course-rag/core.mjs'

const url = 'https://msbm.org.uk/programme/structure-regression'
const capture = (body) => extractSnapshot({ html: `<h1>Structure regression programme</h1>${body}`, url, courseSlug: 'structure-regression' })
const outcomeItems = (result) => result.sections.learningOutcomes.value.blocks.filter((block) => block.type === 'li').map((block) => block.text)

describe('official course source structure regressions', () => {
  it.each([
    ['course-details', 'ol', 'Upon successful completion of the programme, students will be able to:'],
    ['course-details', 'ul', 'After the successful completion of this course, you will understand the following:'],
    ['details', 'ul', 'Upon completion of the program, students should be able to;'],
    ['details', 'ol', 'After completing the program, students will be able to:'],
    ['details', 'ul', 'Upon completing the programme, learners will be able to:'],
    ['course-details', 'ul', 'This course will allow students to:'],
  ])('retains exact ordered outcomes from #%s %s', (id, list, cue) => {
    const result = capture(`<section id="${id}"><p>${cue}</p><${list}><li>Evaluate source evidence.</li><li>Apply research methods.</li></${list}></section>`)
    expect(result.sections.learningOutcomes.status).toBe('observed')
    expect(outcomeItems(result)).toEqual(['Evaluate source evidence.', 'Apply research methods.'])
    const record = assembleCandidate(result, { builderRunId: 'structure-builder' }).record
    expect(record.outcomes).toEqual(['Evaluate source evidence.', 'Apply research methods.'])
  })

  it('retains explicit prose outcomes as cited rich content', () => {
    const prose = 'Upon completion of the program, students will gain expertise in advanced research methods and healthcare leadership.'
    const result = capture(`<section id="details"><p>Programme background and delivery.</p><p>${prose}</p></section>`)
    const section = result.sections.learningOutcomes
    expect(section.status).toBe('observed')
    expect(section.value.blocks.map((block) => block.text)).toEqual([prose])
    expect(section.evidenceIds.length).toBeGreaterThan(0)
    expect(result.evidence.find((chunk) => chunk.id === section.evidenceIds[0]).text).toBe(prose)
  })

  it.each(['details', 'course-details'])('does not turn an unrelated list in #%s into outcomes', (id) => {
    const result = capture(`<section id="${id}"><p>Required application documents:</p><ul><li>Academic transcript.</li><li>Identity document.</li></ul></section>`)
    expect(result.sections.learningOutcomes.status).toBe('missing')
    expect(result.sections.learningOutcomes.evidenceIds).toEqual([])
    expect(outcomeItems(result)).toEqual([])
  })

  it('keeps an admissions list separate from the following labelled outcomes list', () => {
    const result = capture('<section id="course-details"><p>Application documents:</p><ul><li>Academic transcript.</li></ul><p>Upon completion, students will be able to:</p><ul><li>Evaluate source evidence.</li></ul></section>')
    expect(outcomeItems(result)).toEqual(['Evaluate source evidence.'])
  })

  it('retains nested outcome leaves once without repeating the parent list text', () => {
    const result = capture('<section id="details"><p>Upon completion, students will be able to:</p><ul><li>Research skills<ul><li>Evaluate source evidence.</li><li>Apply research methods.</li></ul></li></ul></section>')
    expect(outcomeItems(result)).toEqual(['Evaluate source evidence.', 'Apply research methods.'])
  })

  it('ignores empty headings when projecting the course identity', () => {
    const result = extractSnapshot({ html: '<h1> </h1><h1>Published programme title</h1>', url, courseSlug: 'structure-regression' })
    expect(result.sections.identity.value.blocks).toEqual([{ type: 'h1', text: 'Published programme title' }])
    expect(assembleCandidate(result, { builderRunId: 'structure-builder' }).record.title).toBe('Published programme title')
  })

  it('distinguishes published progression, heading-only absence, and an omitted section', () => {
    const published = capture('<section id="university"><h4>University Progression</h4><p>Eligible graduates may apply for the published doctoral pathway.</p></section>')
    expect(published.sections.universityProgression.status).toBe('observed')
    expect(published.sections.universityProgression.evidenceIds.length).toBeGreaterThan(0)
    const headingOnly = capture('<section id="university"><h4>University Progression</h4></section>')
    expect(headingOnly.sections.universityProgression.status).toBe('source_absent')
    expect(headingOnly.sections.universityProgression.value.blocks).toEqual([])
    expect(headingOnly.sections.universityProgression.evidenceIds).toEqual([])
    const omitted = capture('<section id="details"><p>Published programme information.</p></section>')
    expect(omitted.sections.universityProgression.status).toBe('missing')
    expect(omitted.sections.universityProgression.evidenceIds).toEqual([])
  })

  it('does not treat a progression navigation label as published progression information', () => {
    const result = capture('<a href="#university" role="tab">University Progression</a>')
    expect(result.sections.universityProgression.status).not.toBe('observed')
    expect(result.sections.universityProgression.value.blocks).toEqual([])
    expect(result.sections.universityProgression.evidenceIds).toEqual([])
  })
})
