import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { apiEvent, callsTo, organizer, renderAs, reply } from '../../test/helpers.jsx'

const other = { ...organizer, id: 'org2' }
const event = apiEvent()
const routes = (extra = {}) => ({
  'GET /events/ev1': () => reply(200, { data: event }),
  'GET /events/mine': () => reply(200, { data: [], meta: { page: 1, limit: 100, total: 0 } }),
  ...extra,
})

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
afterEach(() => vi.unstubAllGlobals())

describe('Edit Event', () => {
  test('TC-EVENT-04: the form opens filled in with the event', async () => {
    renderAs(organizer, '/organizer/events/ev1/edit', routes())

    expect(await screen.findByLabelText('Title')).toHaveValue('Hackathon 2026')
    expect(screen.getByLabelText('Venue')).toHaveValue('MRD Auditorium')
    expect(screen.getByLabelText('Capacity')).toHaveValue(100)
  })

  test('TC-EVENT-04: saving sends only the changed fields', async () => {
    const fetchMock = renderAs(organizer, '/organizer/events/ev1/edit', routes({
      'PATCH /events/ev1': () => reply(200, { data: { ...event, venue: 'Room 2' } }),
    }))
    const user = userEvent.setup()

    const venue = await screen.findByLabelText('Venue')
    await user.clear(venue)
    await user.type(venue, 'Room 2')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    await screen.findByRole('heading', { name: 'Hackathon 2026' })
    expect(callsTo(fetchMock, 'PATCH', '/events/ev1')[0].body).toEqual({ venue: 'Room 2' })
  })

  test('TC-EVENT-08: a capacity below the registered count shows the server message', async () => {
    renderAs(organizer, '/organizer/events/ev1/edit', routes({
      'PATCH /events/ev1': () => reply(400, {
        error: { code: 'VALIDATION_ERROR', message: 'Invalid', details: { capacity: 'Capacity cannot be lower than the number of registered students' } },
      }),
    }))
    const user = userEvent.setup()

    const capacity = await screen.findByLabelText('Capacity')
    await user.clear(capacity)
    await user.type(capacity, '5')
    await user.click(screen.getByRole('button', { name: 'Save changes' }))

    expect(await screen.findByText('Capacity cannot be lower than the number of registered students')).toBeInTheDocument()
  })

  test('TC-EVENT-05: cancelling asks first, then cancels and returns to My Events', async () => {
    const fetchMock = renderAs(organizer, '/organizer/events/ev1/edit', routes({
      'PATCH /events/ev1/cancel': () => reply(200, { data: { ...event, status: 'Cancelled' } }),
    }))
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Cancel event' }))

    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('10 registered students'))
    expect(await screen.findByRole('heading', { name: 'My events' })).toBeInTheDocument()
    expect(callsTo(fetchMock, 'PATCH', '/events/ev1/cancel')).toHaveLength(1)
  })

  test('TC-EVENT-05: saying no to the confirmation does not cancel', async () => {
    const fetchMock = renderAs(organizer, '/organizer/events/ev1/edit', routes())
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Cancel event' }))

    expect(callsTo(fetchMock, 'PATCH', '/events/ev1/cancel')).toHaveLength(0)
    expect(screen.getByRole('heading', { name: 'Edit event' })).toBeInTheDocument()
  })

  test('TC-EVENT-07: another organizer cannot edit the event', async () => {
    renderAs(other, '/organizer/events/ev1/edit', routes())

    expect(await screen.findByRole('alert')).toHaveTextContent('You can only edit events you created.')
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
  })

  test('TC-EVENT-06: a cancelled event cannot be edited', async () => {
    renderAs(organizer, '/organizer/events/ev1/edit', routes({
      'GET /events/ev1': () => reply(200, { data: { ...event, status: 'Cancelled' } }),
    }))

    expect(await screen.findByText(/This event is cancelled/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Save changes' })).not.toBeInTheDocument()
  })
})
