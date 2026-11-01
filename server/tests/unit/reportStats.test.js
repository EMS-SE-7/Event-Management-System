const { buildEventStats, percent } = require('../../src/utils/reportStats');

const reg = (attendanceStatus, status = 'Registered') => ({ status, attendanceStatus });

describe('percent', () => {
  test('rounds to one decimal place', () => {
    expect(percent(1, 3)).toBe(33.3);
    expect(percent(2, 3)).toBe(66.7);
  });

  test('returns 0 instead of dividing by zero', () => {
    expect(percent(0, 0)).toBe(0);
  });
});

describe('buildEventStats', () => {
  test('counts registrations, present and absent (REP-01 to REP-05)', () => {
    const stats = buildEventStats([
      reg('Present'), reg('Present'), reg('Absent'), reg('Not Marked')
    ], 10);

    expect(stats.registration).toEqual({
      total: 4, cancelled: 0, capacity: 10, seatsLeft: 6, fillRate: 40
    });
    expect(stats.attendance).toEqual({
      present: 2, absent: 1, notMarked: 1
    });
  });

  test('cancelled registrations are not counted as registered or attended', () => {
    const stats = buildEventStats([
      reg('Present'), reg('Present', 'Cancelled'), reg('Not Marked', 'Cancelled')
    ], 5);

    expect(stats.registration.total).toBe(1);
    expect(stats.registration.cancelled).toBe(2);
    expect(stats.attendance.present).toBe(1);
  });

  test('event with no registrations gives all zeros', () => {
    const stats = buildEventStats([], 50);

    expect(stats.registration.total).toBe(0);
    expect(stats.registration.seatsLeft).toBe(50);
    expect(stats.attendance).toEqual({
      present: 0, absent: 0, notMarked: 0
    });
  });

  test('full event shows 100% fill and no seats left (boundary)', () => {
    const stats = buildEventStats([reg('Present'), reg('Absent')], 2);

    expect(stats.registration.fillRate).toBe(100);
    expect(stats.registration.seatsLeft).toBe(0);
  });

  test('everyone absent gives 0 present', () => {
    const stats = buildEventStats([reg('Absent'), reg('Absent')], 2);
    expect(stats.attendance.present).toBe(0);
    expect(stats.attendance.absent).toBe(2);
  });

  test('missing capacity does not break the report', () => {
    const stats = buildEventStats([reg('Present')]);

    expect(stats.registration.capacity).toBeNull();
    expect(stats.registration.seatsLeft).toBeNull();
    expect(stats.registration.fillRate).toBe(0);
  });

  test('handles undefined registration list', () => {
    expect(buildEventStats(undefined, 10).registration.total).toBe(0);
  });
});
