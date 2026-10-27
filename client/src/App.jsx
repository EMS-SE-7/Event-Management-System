import { Navigate, Route, Routes } from 'react-router-dom'
import { homeFor, useAuth } from './auth-context'
import Navbar from './components/Navbar'
import { OrganizerRoute, ProtectedRoute } from './components/guards'
import { OrganizerDashboard, Placeholder, StudentDashboard } from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
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
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/events" element={<Placeholder title="Browse Events" />} />
          <Route path="/student/registrations" element={<Placeholder title="My Registrations" />} />
        </Route>

        <Route element={<OrganizerRoute />}>
          <Route path="/organizer" element={<OrganizerDashboard />} />
          <Route path="/organizer/events" element={<Placeholder title="My Events" />} />
          <Route path="/organizer/events/new" element={<Placeholder title="Create Event" />} />
        </Route>

        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </>
  )
}
