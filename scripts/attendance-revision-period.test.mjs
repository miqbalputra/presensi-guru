import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const source = await readFile(new URL('../src/utils/attendanceRevisionPeriod.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } })
const { getAttendanceRevisionPeriod } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)

for (const [now, open, startDate, today] of [
  ['2026-11-01T00:00:00+07:00', true, '2026-10-01', '2026-11-01'],
  ['2026-11-05T23:59:59.999+07:00', true, '2026-10-01', '2026-11-05'],
  ['2026-11-06T00:00:00+07:00', false, '2026-11-01', '2026-11-06'],
  ['2026-11-05T17:00:00Z', false, '2026-11-01', '2026-11-06'],
  ['2026-11-30T23:59:59+07:00', false, '2026-11-01', '2026-11-30'],
  ['2027-01-05T23:59:59+07:00', true, '2026-12-01', '2027-01-05'],
  ['2027-01-06T00:00:00+07:00', false, '2027-01-01', '2027-01-06'],
  ['2028-03-01T00:00:00+07:00', true, '2028-02-01', '2028-03-01'],
]) {
  test(`teacher revision period at ${now}`, () => {
    const period = getAttendanceRevisionPeriod(new Date(now))
    assert.equal(period.previousMonthOpen, open)
    assert.equal(period.startDate, startDate)
    assert.equal(period.today, today)
    assert.equal(period.previousMonthDeadline, `${today.slice(0, 7)}-05`)
  })
}

test('server access is required and respects admin closure for the matching period', () => {
  const now = new Date('2026-11-02T10:00:00+07:00')
  assert.equal(getAttendanceRevisionPeriod(now, null).previousMonthOpen, false)
  const closed = getAttendanceRevisionPeriod(now, { periodStart: '2026-10-01', previousMonthOpen: false })
  assert.equal(closed.previousMonthOpen, false)
  assert.equal(closed.startDate, '2026-11-01')
  assert.equal(getAttendanceRevisionPeriod(now, { periodStart: '2026-10-01', previousMonthOpen: true }).previousMonthOpen, true)
  assert.equal(getAttendanceRevisionPeriod(now, { periodStart: '2026-09-01', previousMonthOpen: true }).previousMonthOpen, false)
  assert.equal(getAttendanceRevisionPeriod(new Date('2026-11-06T00:00:00+07:00'), { periodStart: '2026-10-01', previousMonthOpen: true }).previousMonthOpen, false)
})
