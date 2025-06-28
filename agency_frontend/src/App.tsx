import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'
import Finance from './pages/Finance'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/tasks" element={<Tasks />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/finance" element={<Finance />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  )
}

export default App
