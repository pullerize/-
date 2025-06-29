import { useEffect, useState } from 'react'
import { API_URL } from '../api'

interface Operator {
  id: number
  name: string
  role: string
}

function Operators() {
  const [items, setItems] = useState<Operator[]>([])
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<Operator | null>(null)
  const [name, setName] = useState('')
  const [role, setRole] = useState('mobile')

  const token = localStorage.getItem('token')

  const load = async () => {
    const res = await fetch(`${API_URL}/operators/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setItems(await res.json())
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setName('')
    setRole('mobile')
    setShow(true)
  }

  const openEdit = (o: Operator) => {
    setEditing(o)
    setName(o.name)
    setRole(o.role)
    setShow(true)
  }

  const save = async () => {
    const payload = { name, role }
    if (editing) {
      await fetch(`${API_URL}/operators/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch(`${API_URL}/operators/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
    }
    setShow(false)
    load()
  }

  const remove = async (id: number) => {
    await fetch(`${API_URL}/operators/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    load()
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl">Операторы</h1>
        <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={openAdd}>Добавить</button>
      </div>
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Имя</th>
            <th className="px-4 py-2 border">Роль</th>
            <th className="px-4 py-2 border"></th>
          </tr>
        </thead>
        <tbody>
          {items.map(o => (
            <tr key={o.id} className="text-center border-t">
              <td className="px-4 py-2 border">{o.name}</td>
              <td className="px-4 py-2 border">{o.role}</td>
              <td className="px-4 py-2 border space-x-2">
                <button className="text-blue-500" onClick={() => openEdit(o)}>Редактировать</button>
                <button className="text-red-500" onClick={() => remove(o.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-96">
            <h2 className="text-xl mb-2">{editing ? 'Редактировать оператора' : 'Новый оператор'}</h2>
            <input className="border p-2 w-full mb-2" placeholder="Имя" value={name} onChange={e => setName(e.target.value)} />
            <select className="border p-2 w-full mb-4" value={role} onChange={e => setRole(e.target.value)}>
              <option value="mobile">Мобилограф</option>
              <option value="video">Видеограф</option>
            </select>
            <div className="flex justify-end">
              <button className="mr-2 px-4 py-1 border rounded" onClick={() => setShow(false)}>Отмена</button>
              <button className="bg-blue-500 text-white px-4 py-1 rounded" onClick={save}>Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Operators
