import { Link } from 'react-router-dom'
import CategoryTag from './CategoryTag.jsx'
import DateStub from './DateStub.jsx'
import Icon from './Icon.jsx'
import StatusBadge from './StatusBadge.jsx'

// One event drawn as a ticket. The title link covers the whole card; `actions` stay clickable on top.
export default function EventCard({ event, foot, actions }) {
  const cancelled = event.status === 'Cancelled'
  return (
    <li className={`event-card${cancelled ? ' is-cancelled' : ''}`} data-cat={event.category}>
      <DateStub iso={event.startDateTime} />
      <div className="ticket-body">
        <div className="event-card-head">
          <CategoryTag category={event.category} />
          <StatusBadge status={event.status} />
        </div>
        <h2>
          <Link to={`/events/${event._id}`}>{event.title}</Link>
        </h2>
        <p className="ticket-meta">
          <span>
            <Icon name="pin" />
            {event.venue}
          </span>
        </p>
        {foot && <div className="event-card-foot">{foot}</div>}
        {actions && <div className="card-actions">{actions}</div>}
      </div>
    </li>
  )
}
