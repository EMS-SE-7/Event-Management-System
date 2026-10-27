// Calculated event fields (team agreement section 5.2).
// Only "Upcoming" and "Cancelled" are stored; everything here is worked out
// from the dates and counts each time an event is returned.

// DISC-05, STATUS-01: Cancelled, Completed, Ongoing or Upcoming
function computeStatus(event, now = new Date()) {
  if (event.status === 'Cancelled') return 'Cancelled';
  if (now > event.endDateTime) return 'Completed';
  if (now >= event.startDateTime) return 'Ongoing';
  return 'Upcoming';
}

function seatsLeft(event) {
  return Math.max(event.capacity - (event.registeredCount || 0), 0);
}

// Returns a plain object ready to send: the stored fields plus
// status, seatsLeft, isFull (STATUS-02) and registrationOpen (DISC-06).
function withCalculatedFields(event, now = new Date()) {
  const plain = typeof event.toObject === 'function' ? event.toObject() : { ...event };
  const status = computeStatus(plain, now);
  const left = seatsLeft(plain);
  return {
    ...plain,
    status,
    seatsLeft: left,
    isFull: left === 0,
    registrationOpen: status === 'Upcoming' && left > 0 && now < plain.registrationDeadline,
  };
}

module.exports = { computeStatus, seatsLeft, withCalculatedFields };
