export function getAttendanceRevisionPeriod(now = new Date(), access?: { periodStart: string; previousMonthOpen: boolean } | null) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now)
  const part = (type: string) => parts.find((value) => value.type === type)!.value
  const year = part('year')
  const month = part('month')
  const day = part('day')
  const today = `${year}-${month}-${day}`
  const previousMonthStart = new Date(Date.UTC(Number(year), Number(month) - 2, 1)).toISOString().slice(0, 10)
  const previousMonthOpen = Number(day) <= 5 && (access === undefined || (access?.periodStart === previousMonthStart && access.previousMonthOpen))
  const startDate = previousMonthOpen
    ? previousMonthStart
    : `${year}-${month}-01`
  return { today, startDate, previousMonthStart, previousMonthOpen, previousMonthDeadline: `${year}-${month}-05` }
}
