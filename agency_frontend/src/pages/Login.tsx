import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`${API_URL}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username,
        password,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      localStorage.setItem('token', data.access_token)
      navigate('/tasks')
    }
  }

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow-md w-80">
        <h1 className="text-xl mb-4">Login</h1>
        <input
          className="border p-2 w-full mb-4"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
