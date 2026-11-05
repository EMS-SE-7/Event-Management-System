import { dateParts } from '../utils/format.js'

// The left-hand stub of an event ticket: month, big day number, weekday and start time.
export default function DateStub({ iso, className = 'ticket-stub', showTime = true }) {
  const { month, day, weekday, time } = dateParts(iso)
  return (
    <div className={className} aria-hidden="true">
      <span className="stub-month">{month}</span>
      <span className="stub-day">{day}</span>
      <span className="stub-week">{weekday}</span>
      {showTime && <span className="stub-time">{time}</span>}
    </div>
  )
}
