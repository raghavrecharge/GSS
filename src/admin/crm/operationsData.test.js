import { describe, expect, it } from 'vitest'
import { csvCell, reportCsv } from './operationsData.js'

describe('admissions report exports', () => {
  it('quotes separators, escapes embedded quotes and neutralizes spreadsheet formulas', () => {
    expect(csvCell('=SUM(A1:A2)')).toBe('"\'=SUM(A1:A2)"')
    expect(csvCell('  @example')).toBe('"\'  @example"')
    expect(reportCsv([['Programme', 'Count'], ['A, "B"', 2]])).toBe('"Programme","Count"\r\n"A, ""B""","2"')
  })
})
