import { Link, useNavigate } from 'react-router-dom'

function Navbar() {
  const navigate = useNavigate()
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('userId')
    navigate('/login')
  }

  const role = localStorage.getItem('role')

  return (
    <nav className="bg-gray-800 text-white p-4 flex justify-between">
      <div className="space-x-4">
        <Link to="/tasks" className="hover:underline">Задачи</Link>
        <Link to="/calendar" className="hover:underline">Календарь</Link>
        <Link to="/finance" className="hover:underline">Финансы</Link>
        <Link to="/reports" className="hover:underline">Отчеты</Link>
        {role === 'admin' && (
          <>
            <Link to="/users" className="hover:underline">Пользователи</Link>
            <Link to="/operators" className="hover:underline">Операторы</Link>
          </>
        )}
      </div>
      <button onClick={logout} className="hover:underline">Выйти</button>
    </nav>
  )
}

export default Navbar
