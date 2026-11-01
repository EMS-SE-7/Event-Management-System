import { Navigate, Route, Routes } from 'react-router-dom'
import { homeFor, useAuth } from './auth-context'
import Navbar from './components/Navbar'
import { OrganizerRoute, ProtectedRoute } from './components/guards'
import BrowseEventsPage from './pages/events/BrowseEventsPage'
import EventDetailsPage from './pages/events/EventDetailsPage'
import { OrganizerDashboard, Placeholder, StudentDashboard } from './pages/Home'
import Login from './pages/Login'
import CreateEventPage from './pages/organizer/CreateEventPage'
import Register from './pages/Register'
import AttendanceEventsPage from './pages/AttendanceEventsPage'
import AttendancePage from './pages/AttendancePage'
import EventReportPage from './pages/EventReportPage'
import ReportsPage from './pages/ReportsPage'
import './App.css'

function RootRedirect() {
  const { user } = useAuth()
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />
}

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/events" element={<BrowseEventsPage />} />
          <Route path="/events/:id" element={<EventDetailsPage />} />
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/registrations" element={<Placeholder title="My Registrations" />} />
        </Route>

        <Route element={<OrganizerRoute />}>
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/organizer/events" element={<Placeholder title="My Events" />} />
          <Route path="/organizer/events/new" element={<CreateEventPage />} />
          <Route path="/organizer/attendance" element={<div className="attendance-app"><AttendanceEventsPage /></div>} />
          <Route path="/organizer/events/:eventId/attendance" element={<div className="attendance-app"><AttendancePage /></div>} />
          <Route path="/organizer/reports" element={<div className="attendance-app"><ReportsPage /></div>} />
          <Route path="/organizer/events/:eventId/report" element={<div className="attendance-app"><EventReportPage /></div>} />
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </>
  )
}
