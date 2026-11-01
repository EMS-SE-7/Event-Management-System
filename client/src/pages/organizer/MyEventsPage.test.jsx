import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { apiEvent, organizer, renderAs, reply, student } from '../../test/helpers.jsx'

const mine = (events) => ({ 'GET /events/mine': () => reply(200, { data: events, meta: { page: 1, limit: 100, total: events.length } }) })

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
afterEach(() => vi.unstubAllGlobals())

describe('My Events', () => {
  test('TC-EVENT-04: lists the organizer\'s events with manage links', async () => {
    renderAs(organizer, '/organizer/events', mine([apiEvent()]))

    expect(await screen.findByRole('link', { name: 'Hackathon 2026' })).toHaveAttribute('href', '/events/ev1')
    expect(screen.getByText(/10 registered/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Edit or cancel' })).toHaveAttribute('href', '/organizer/events/ev1/edit')
    expect(screen.getByRole('link', { name: 'Attendance' })).toHaveAttribute('href', '/organizer/events/ev1/attendance')
    expect(screen.getByRole('link', { name: 'Report' })).toHaveAttribute('href', '/organizer/events/ev1/report')
  })

  test('TC-EVENT-06: cancelled and completed events have no Edit link', async () => {
    renderAs(organizer, '/organizer/events', mine([
      apiEvent({ _id: 'a', title: 'Cancelled One', status: 'Cancelled' }),
      apiEvent({ _id: 'b', title: 'Completed One', status: 'Completed' }),
    ]))

    await screen.findByText('Completed One')
    expect(screen.queryByRole('link', { name: 'Edit or cancel' })).not.toBeInTheDocument()
  })

  test('TC-EVENT-04: an organizer with no events is told so', async () => {
    renderAs(organizer, '/organizer/events', mine([]))

    expect(await screen.findByText('You have not created any events yet.')).toBeInTheDocument()
  })

  test('TC-AUTH-06: a student is sent away from My Events', async () => {
    renderAs(student, '/organizer/events', mine([apiEvent()]))

    expect(await screen.findByRole('heading', { name: 'Student Dashboard' })).toBeInTheDocument()
  })
})
