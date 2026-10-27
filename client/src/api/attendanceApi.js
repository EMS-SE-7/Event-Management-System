function getHeaders() {
  const token = localStorage.getItem('token')

  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function handleResponse(response) {
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export function getMyEvents() {
  return fetch('/api/attendance/events', { headers: getHeaders() }).then(handleResponse)
}

export function getEventAttendance(eventId) {
  return fetch(`/api/attendance/event/${eventId}`, { headers: getHeaders() }).then(handleResponse)
}

export function markAttendance(registrationId, status) {
  return fetch(`/api/attendance/${registrationId}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ status }),
  }).then(handleResponse)
}
