// The navy left half of the Login and Register pages.
const SAMPLE = [
  { day: '14', month: 'NOV', title: 'Hackathon 2026', where: 'MRD Auditorium', cat: 'var(--cat-technical)' },
  { day: '18', month: 'NOV', title: 'Cultural Night', where: 'Open Air Theatre', cat: 'var(--cat-cultural)' },
  { day: '22', month: 'NOV', title: 'Robotics Workshop', where: 'Lab 3, ECE Block', cat: 'var(--cat-workshop)' },
]

export default function AuthPoster() {
  return (
    <aside className="auth-poster">
      <span className="eyebrow" style={{ color: '#9fb0cc' }}>PES University · Event Management</span>
      <div style={{ display: 'grid', gap: 18 }}>
        <h2>
          Everything on <em>campus</em>, in one place.
        </h2>
        <p>Find events, grab a seat before the deadline, and keep track of what you signed up for. Organizers run registrations, attendance and reports from the same desk.</p>
      </div>
      <div className="poster-tickets" aria-hidden="true">
        {SAMPLE.map((t) => (
          <div className="poster-ticket" key={t.title} style={{ '--cat': t.cat }}>
            <div className="stub">
              <b>{t.day}</b>
              <span>{t.month}</span>
            </div>
            <div className="info">
              <strong>{t.title}</strong>
              <span>{t.where}</span>
            </div>
          </div>
        ))}
      </div>
    </aside>
  )
}
