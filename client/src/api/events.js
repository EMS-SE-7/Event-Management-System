// The only file the pages import events from.
//
// Demo mode (default): sample events from mockEvents.js, no server needed.
// Real mode: create client/.env.local containing   VITE_USE_MOCK=false
// and restart `npm run dev`. The pages do not change.
import * as mock from './mockEvents.js'
import * as http from './httpEvents.js'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'
const source = useMock ? mock : http

export const listEvents = source.listEvents
export const getEvent = source.getEvent
