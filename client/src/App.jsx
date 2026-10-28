import { Navigate, Route, Routes } from 'react-router-dom'
import BrowseEventsPage from './pages/events/BrowseEventsPage.jsx'
import EventDetailsPage from './pages/events/EventDetailsPage.jsx'
import CreateEventPage from './pages/organizer/CreateEventPage.jsx'
import LoginPage from './pages/LoginPage'
import AttendanceEventsPage from './pages/AttendanceEventsPage'
import AttendancePage from './pages/AttendancePage'
import './App.css'

// Only organizers can open the attendance pages.
// The real authorization check is done on the server.
function OrganizerRoute({ children }) {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  return token && role === 'Organizer'
    ? <div className="attendance-app">{children}</div>
    : <Navigate to="/login" replace />
}

function App() {
  return (
    <Routes>
      {/* Event Management */}
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route path="/events" element={<BrowseEventsPage />} />
      <Route path="/events/:id" element={<EventDetailsPage />} />
      <Route
        path="/organizer/events/new"
        element={<CreateEventPage />}
      />

      {/* Authentication */}
      <Route
        path="/login"
        element={
          <div className="attendance-app">
            <LoginPage />
          </div>
        }
      />

      {/* Attendance */}
      <Route
        path="/organizer/attendance"
        element={
          <OrganizerRoute>
            <AttendanceEventsPage />
          </OrganizerRoute>
        }
      />

      <Route
        path="/organizer/events/:eventId/attendance"
        element={
          <OrganizerRoute>
            <AttendancePage />
          </OrganizerRoute>
        }
      />

      {/* Unknown route */}
      <Route path="*" element={<Navigate to="/events" replace />} />
    </Routes>
  )
}

export default App