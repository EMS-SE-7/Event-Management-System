import { screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { apiEvent, organizer, renderAs, reply, student } from '../../test/helpers.jsx'

const other = { ...organizer, id: 'org2', name: 'Other Organizer' }
const showEvent = (event) => ({ 'GET /events/ev1': () => reply(200, { data: event }) })

beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}))
afterEach(() => vi.unstubAllGlobals())

describe('Event Details', () => {
  test('TC-DISC-04, TC-DISC-05: shows the event facts, status and seats left', async () => {
    renderAs(student, '/events/ev1', showEvent(apiEvent()))

    expect(await screen.findByRole('heading', { name: 'Hackathon 2026' })).toBeInTheDocument()
    expect(screen.getByText('MRD Auditorium')).toBeInTheDocument()
    expect(screen.getByText('Upcoming')).toBeInTheDocument()
    expect(screen.getByText('90 of 100 seats left')).toBeInTheDocument()
    expect(screen.getByText('Registration is open')).toBeInTheDocument()
  })

  test('TC-DISC-04: an unknown event shows a not found message', async () => {
    renderAs(student, '/events/nope', {})

    expect(await screen.findByRole('alert')).toHaveTextContent('This event does not exist.')
  })

  test('TC-REG-01: a student sees the Register button and no management links', async () => {
    renderAs(student, '/events/ev1', showEvent(apiEvent()))

    expect(await screen.findByRole('button', { name: /register/i })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Edit or cancel' })).not.toBeInTheDocument()
  })

  test('TC-EVENT-04: the owner sees Edit, Attendance and Report links instead of Register', async () => {
    renderAs(organizer, '/events/ev1', showEvent(apiEvent()))

    expect(await screen.findByRole('link', { name: 'Edit or cancel' })).toHaveAttribute('href', '/organizer/events/ev1/edit')
    expect(screen.getByRole('link', { name: 'Attendance' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Report' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /register/i })).not.toBeInTheDocument()
  })

  test('TC-EVENT-07: another organizer does not get the owner links', async () => {
    renderAs(other, '/events/ev1', showEvent(apiEvent()))

    await screen.findByRole('heading', { name: 'Hackathon 2026' })
    expect(screen.queryByRole('link', { name: 'Edit or cancel' })).not.toBeInTheDocument()
  })

  test('TC-EVENT-06: a cancelled event has no Edit link, even for the owner', async () => {
    renderAs(organizer, '/events/ev1', showEvent(apiEvent({ status: 'Cancelled', registrationOpen: false })))

    await screen.findByText('Cancelled')
    expect(screen.queryByRole('link', { name: 'Edit or cancel' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Report' })).toBeInTheDocument()
  })
})
