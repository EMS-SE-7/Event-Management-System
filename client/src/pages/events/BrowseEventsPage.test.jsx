import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { apiEvent, callsTo, organizer, renderAs, reply, student } from '../../test/helpers.jsx'

const list = (events, total = events.length) => () => reply(200, { data: events, meta: { page: 1, limit: 10, total } })

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
afterEach(() => vi.unstubAllGlobals())

describe('Browse Events', () => {
  test('TC-DISC-01, TC-DISC-05, TC-DISC-06: lists events with status, seats and registration', async () => {
    renderAs(student, '/events', {
      'GET /events': list([
        apiEvent(),
        apiEvent({ _id: 'ev2', title: 'Cultural Night', status: 'Upcoming', seatsLeft: 0, isFull: true, registrationOpen: false }),
      ]),
    })

    await screen.findByText('Cultural Night')
    const cards = [...document.querySelectorAll('.event-card')]
    expect(cards).toHaveLength(2)
    expect(within(cards[0]).getByText('90 of 100 seats left')).toBeInTheDocument()
    expect(within(cards[0]).getByText('Registration open')).toBeInTheDocument()
    expect(within(cards[1]).getByText('Full')).toBeInTheDocument()
    expect(within(cards[1]).getByText('Registration closed')).toBeInTheDocument()
  })

  test('TC-DISC-02: searching sends ?q= and shows the matches', async () => {
    const fetchMock = renderAs(student, '/events', { 'GET /events': list([apiEvent()]) })
    const user = userEvent.setup()

    await screen.findByText('Hackathon 2026')
    await user.type(screen.getByRole('searchbox', { name: 'Search events' }), 'hack')
    await user.click(screen.getByRole('button', { name: 'Search' }))

    await screen.findByText('Hackathon 2026')
    expect(callsTo(fetchMock, 'GET', '/events').at(-1).url).toContain('q=hack')
  })

  test('TC-DISC-03, TC-DISC-05: category and status dropdowns filter the list', async () => {
    const fetchMock = renderAs(student, '/events', { 'GET /events': list([apiEvent()]) })
    const user = userEvent.setup()

    await screen.findByText('Hackathon 2026')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'Cultural')
    await user.selectOptions(screen.getByRole('combobox', { name: 'Status' }), 'Upcoming')

    await screen.findByText('Hackathon 2026')
    const url = callsTo(fetchMock, 'GET', '/events').at(-1).url
    expect(url).toContain('category=Cultural')
    expect(url).toContain('status=Upcoming')
  })

  test('TC-DISC-02: a search with no results says so', async () => {
    renderAs(student, '/events?q=zzz', { 'GET /events': list([]) })

    expect(await screen.findByText('No events match these filters.')).toBeInTheDocument()
  })

  test('TC-DISC-01: more than one page shows Next, which loads page 2', async () => {
    const fetchMock = renderAs(student, '/events', { 'GET /events': list([apiEvent()], 25) })
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: /Next/ }))

    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument()
    expect(callsTo(fetchMock, 'GET', '/events').at(-1).url).toContain('page=2')
  })

  test('TC-AUTH-06: only organizers see the Create event button', async () => {
    renderAs(student, '/events', { 'GET /events': list([apiEvent()]) })
    await screen.findByText('Hackathon 2026')
    expect(screen.queryByRole('link', { name: 'Create event' })).not.toBeInTheDocument()
  })

  test('TC-EVENT-01: an organizer sees the Create event button', async () => {
    renderAs(organizer, '/events', { 'GET /events': list([apiEvent()]) })
    expect(await screen.findByRole('link', { name: 'Create event' })).toBeInTheDocument()
  })

  test('TC-DISC-01: a server error is shown instead of the list', async () => {
    renderAs(student, '/events', { 'GET /events': () => reply(500, { error: { code: 'SERVER_ERROR', message: 'Something went wrong' } }) })

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load events: Something went wrong')
  })
})
