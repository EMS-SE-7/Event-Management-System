// Shows a status as a small stamp: event statuses (Upcoming, Ongoing, Completed, Cancelled)
// and registration/attendance statuses (Registered, Present, Absent, Not Marked).
export default function StatusBadge({ status }) {
  if (!status) return null
  return <span className={`badge badge-${status.replace(/\s+/g, '-').toLowerCase()}`}>{status}</span>
}
