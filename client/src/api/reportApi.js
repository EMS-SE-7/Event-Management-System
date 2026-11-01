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

export function getMyReports() {
  return fetch('/api/reports/events', { headers: getHeaders() }).then(handleResponse)
}

export function getEventReport(eventId) {
  return fetch(`/api/reports/event/${eventId}`, { headers: getHeaders() }).then(handleResponse)
}
