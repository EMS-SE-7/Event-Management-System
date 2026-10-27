const { computeStatus, seatsLeft, withCalculatedFields } = require('../src/utils/eventStatus');

const HOUR = 60 * 60 * 1000;
const now = new Date('2026-11-10T10:00:00Z');

// An event that starts in 2 days, with registration closing in 1 day.
function event(overrides = {}) {
  return {
    title: 'Hackathon',
    status: 'Upcoming',
    startDateTime: new Date(now.getTime() + 48 * HOUR),
    endDateTime: new Date(now.getTime() + 51 * HOUR),
    registrationDeadline: new Date(now.getTime() + 24 * HOUR),
    capacity: 10,
    registeredCount: 3,
    ...overrides,
  };
}

describe('computeStatus', () => {
  test('TC-DISC-05: Upcoming before the start', () => {
    expect(computeStatus(event(), now)).toBe('Upcoming');
  });

  test('TC-DISC-05: Ongoing between start and end', () => {
    const e = event({ startDateTime: new Date(now.getTime() - HOUR), endDateTime: new Date(now.getTime() + HOUR) });
    expect(computeStatus(e, now)).toBe('Ongoing');
  });

  test('TC-DISC-05: Completed after the end', () => {
    const e = event({ startDateTime: new Date(now.getTime() - 3 * HOUR), endDateTime: new Date(now.getTime() - HOUR) });
    expect(computeStatus(e, now)).toBe('Completed');
  });

  test('TC-DISC-05: Cancelled wins over the dates', () => {
    const e = event({ status: 'Cancelled', startDateTime: new Date(now.getTime() - 3 * HOUR), endDateTime: new Date(now.getTime() - HOUR) });
    expect(computeStatus(e, now)).toBe('Cancelled');
  });
});

describe('seats', () => {
  test('TC-STATUS-02: seatsLeft is capacity minus registered', () => {
    expect(seatsLeft(event())).toBe(7);
  });

  test('TC-STATUS-02: an event with every seat taken is full', () => {
    const result = withCalculatedFields(event({ registeredCount: 10 }), now);
    expect(result.seatsLeft).toBe(0);
    expect(result.isFull).toBe(true);
  });

  test('TC-STATUS-02: an event with seats left is not full', () => {
    expect(withCalculatedFields(event(), now).isFull).toBe(false);
  });
});

describe('registrationOpen', () => {
  test('TC-DISC-06: open for an upcoming event with seats before the deadline', () => {
    expect(withCalculatedFields(event(), now).registrationOpen).toBe(true);
  });

  test('TC-DISC-06: closed when the event is full', () => {
    expect(withCalculatedFields(event({ registeredCount: 10 }), now).registrationOpen).toBe(false);
  });

  test('TC-DISC-06: closed after the registration deadline', () => {
    const e = event({ registrationDeadline: new Date(now.getTime() - HOUR) });
    expect(withCalculatedFields(e, now).registrationOpen).toBe(false);
  });

  test('TC-DISC-06: closed when the event is cancelled', () => {
    expect(withCalculatedFields(event({ status: 'Cancelled' }), now).registrationOpen).toBe(false);
  });

  test('TC-DISC-06: closed once the event has started', () => {
    const e = event({
      startDateTime: new Date(now.getTime() - HOUR),
      endDateTime: new Date(now.getTime() + HOUR),
      registrationDeadline: new Date(now.getTime() + HOUR), // even if the deadline was set late
    });
    expect(withCalculatedFields(e, now).registrationOpen).toBe(false);
  });
});
