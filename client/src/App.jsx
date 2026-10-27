import { Navigate, Route, Routes } from 'react-router-dom'
import BrowseEventsPage from './pages/events/BrowseEventsPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/events" replace />} />
      <Route path="/events" element={<BrowseEventsPage />} />
    </Routes>
  )
}
