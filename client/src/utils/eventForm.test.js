import { describe, expect, test } from 'vitest'
import { changedFields, toFormValues, toPayload } from './eventForm.js'

describe('event form helpers', () => {
  test('TC-EVENT-02: toPayload leaves out empty fields and converts dates and capacity', () => {
    const payload = toPayload({ title: 'Talk', venue: '', capacity: '25', startDateTime: '2030-01-05T10:00' })

    expect(payload).toEqual({ title: 'Talk', capacity: 25, startDateTime: new Date('2030-01-05T10:00').toISOString() })
  })

  test('TC-EVENT-04: toFormValues turns an API event back into form values', () => {
    const start = new Date('2030-01-05T10:00')
    const values = toFormValues({ title: 'Talk', category: 'Seminar', venue: 'Hall', startDateTime: start.toISOString(), capacity: 30 })

    expect(values.startDateTime).toBe('2030-01-05T10:00')
    expect(values.capacity).toBe('30')
    expect(values.description).toBe('')
  })

  test('TC-EVENT-04: changedFields returns only what the organizer changed', () => {
    const original = toFormValues({ title: 'Talk', category: 'Seminar', venue: 'Hall', capacity: 30, startDateTime: new Date('2030-01-05T10:00').toISOString() })

    expect(changedFields(original, { ...original })).toEqual({})
    expect(changedFields(original, { ...original, venue: 'Room 2', capacity: '40' })).toEqual({ venue: 'Room 2', capacity: 40 })
  })

  test('TC-EVENT-04: clearing a field sends it empty so the server can reject or clear it', () => {
    const original = toFormValues({ title: 'Talk', description: 'Old text' })

    expect(changedFields(original, { ...original, description: '' })).toEqual({ description: '' })
  })
})
