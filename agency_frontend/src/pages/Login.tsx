import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api'

function Login() {
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          username: login,
          password,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('token', data.access_token)
        const me = await fetch(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${data.access_token}` },
        })
        if (me.ok) {
          const info = await me.json()
          localStorage.setItem('role', info.role)
          localStorage.setItem('userId', String(info.id))
        }
        navigate('/tasks')
      } else {
        setError('Invalid credentials')
      }
    } catch {
      setError('Unable to connect to server')
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h1 className="text-xl mb-4">Login</h1>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <input
          className="border p-2 w-full mb-4"
          placeholder="Логин"
          value={login}
          onChange={(e) => setLogin(e.target.value)}
        />
        <input
          className="border p-2 w-full mb-4"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded w-full" type="submit">
          Sign in
        </button>
      </form>
    </div>
  )
}

export default Login
