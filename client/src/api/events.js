// The only file the pages import events from.
//
// Real mode (default): talks to the Express server with the login token.
// Demo mode: put   VITE_USE_MOCK=true   in client/.env.local and restart `npm run dev`
// to use the sample events in mockEvents.js. The pages do not change.
import * as mock from './mockEvents.js'
import * as http from './httpEvents.js'

const useMock = import.meta.env.VITE_USE_MOCK === 'true'
const source = useMock ? mock : http

export const listEvents = source.listEvents
export const getEvent = source.getEvent
export const createEvent = source.createEvent
