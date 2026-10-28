// Shows an event's calculated status: Upcoming, Ongoing, Completed or Cancelled.
export default function StatusBadge({ status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}>{status}</span>
}
