import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { apiEvent, callsTo, organizer, renderAs, reply } from '../../test/helpers.jsx'

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
afterEach(() => vi.unstubAllGlobals())

describe('Create Event', () => {
  test('TC-EVENT-02, TC-EVENT-08: server validation messages appear next to each field', async () => {
    renderAs(organizer, '/organizer/events/new', {
      'POST /events': () => reply(400, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Some fields are missing or invalid',
          details: { title: 'Title is required', capacity: 'Capacity must be at least 1' },
        },
      }),
    })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Create event' }))

    expect(await screen.findByText('Title is required')).toBeInTheDocument()
    expect(screen.getByText('Capacity must be at least 1')).toBeInTheDocument()
    expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true')
  })

  test('TC-EVENT-01, TC-EVENT-03: a valid event is sent and its details page opens', async () => {
    const fetchMock = renderAs(organizer, '/organizer/events/new', {
      'POST /events': () => reply(201, { data: apiEvent({ _id: 'new1', title: 'Robotics Workshop' }) }),
      'GET /events/new1': () => reply(200, { data: apiEvent({ _id: 'new1', title: 'Robotics Workshop' }) }),
    })
    const user = userEvent.setup()

    await user.type(await screen.findByLabelText('Title'), 'Robotics Workshop')
    await user.selectOptions(screen.getByLabelText('Category'), 'Workshop')
    await user.type(screen.getByLabelText('Venue'), 'Lab 3')
    await user.type(screen.getByLabelText('Capacity'), '20')
    await user.click(screen.getByRole('button', { name: 'Create event' }))

    expect(await screen.findByRole('heading', { name: 'Robotics Workshop' })).toBeInTheDocument()
    expect(callsTo(fetchMock, 'POST', '/events')[0].body).toEqual({
      title: 'Robotics Workshop',
      category: 'Workshop',
      venue: 'Lab 3',
      capacity: 20,
    })
  })
})
