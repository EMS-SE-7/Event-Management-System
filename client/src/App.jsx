import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AttendanceEventsPage from './pages/AttendanceEventsPage'
import AttendancePage from './pages/AttendancePage'
import './App.css'

// Only organizers (token + role in localStorage) can open the attendance pages.
// The real check is on the server; this just avoids showing a broken page.
function OrganizerRoute({ children }) {
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  return token && role === 'Organizer' ? children : <Navigate to="/login" replace />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/organizer/attendance"
          element={<OrganizerRoute><AttendanceEventsPage /></OrganizerRoute>}
        />
        <Route
          path="/organizer/events/:eventId/attendance"
          element={<OrganizerRoute><AttendancePage /></OrganizerRoute>}
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
