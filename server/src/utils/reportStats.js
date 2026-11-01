// Works out the numbers shown on an event report.
// Kept separate from the controller so it can be unit tested without a database.

function percent(part, whole) {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10; // one decimal place
}

// registrations: [{ status, attendanceStatus }] for one event
// capacity: event capacity (can be missing)
function buildEventStats(registrations, capacity) {
  const list = registrations || [];

  const active = list.filter((reg) => reg.status === 'Registered');
  const cancelled = list.length - active.length;

  const present = active.filter((reg) => reg.attendanceStatus === 'Present').length;
  const absent = active.filter((reg) => reg.attendanceStatus === 'Absent').length;
  const notMarked = active.length - present - absent;

  const seats = Number.isInteger(capacity) ? capacity : null;

  return {
    // REP-01, REP-03: registration statistics
    registration: {
      total: active.length,
      cancelled,
      capacity: seats,
      seatsLeft: seats === null ? null : Math.max(seats - active.length, 0),
      fillRate: seats === null ? 0 : percent(active.length, seats)
    },
    // REP-02, REP-04, REP-05: attendance statistics
    attendance: {
      present,
      absent,
      notMarked
    }
  };
}

module.exports = { buildEventStats, percent };
