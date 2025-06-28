import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Login from './pages/Login'
import Tasks from './pages/Tasks'
import Calendar from './pages/Calendar'
import Reports from './pages/Reports'
import Finance from './pages/Finance'
import Users from './pages/Users'
import Operators from './pages/Operators'

function App() {
  const token = localStorage.getItem('token')
  return (
    <>
      {token && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/tasks"
          element={token ? <Tasks /> : <Navigate to="/login" />} />
        <Route
          path="/calendar"
          element={token ? <Calendar /> : <Navigate to="/login" />} />
        <Route
          path="/finance"
          element={token ? <Finance /> : <Navigate to="/login" />} />
        <Route
          path="/reports"
          element={token ? <Reports /> : <Navigate to="/login" />} />
        <Route
          path="/users"
          element={token ? <Users /> : <Navigate to="/login" />} />
        <Route
          path="/operators"
          element={token ? <Operators /> : <Navigate to="/login" />} />
        <Route
          path="*"
          element={<Navigate to={token ? '/tasks' : '/login'} />} />
      </Routes>
    </>
  )
}

export default App
