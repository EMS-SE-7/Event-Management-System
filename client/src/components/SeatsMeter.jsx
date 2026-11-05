import { seatsText } from '../utils/format.js'

// How full an event is, as a thin bar with the seats text underneath.
export default function SeatsMeter({ event, children }) {
  const taken = Math.max((event.capacity ?? 0) - (event.seatsLeft ?? 0), 0)
  const ratio = event.capacity ? Math.min(taken / event.capacity, 1) : 0
  return (
    <div className="meter">
      <div className="meter-track" aria-hidden="true">
        <div className={`meter-fill${ratio >= 0.8 ? ' is-hot' : ''}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="meter-label">
        <span>{seatsText(event)}</span>
        {children}
      </div>
    </div>
  )
}
