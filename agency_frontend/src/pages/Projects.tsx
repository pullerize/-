import { useEffect, useState } from 'react'
import { API_URL } from '../api'

interface Project {
  id: number
  name: string
}

function Projects() {
  const [items, setItems] = useState<Project[]>([])
  const [show, setShow] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)
  const [name, setName] = useState('')

  const token = localStorage.getItem('token')

  const load = async () => {
    const res = await fetch(`${API_URL}/projects/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.ok) setItems(await res.json())
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setName('')
    setShow(true)
  }

  const openEdit = (p: Project) => {
    setEditing(p)
    setName(p.name)
    setShow(true)
  }

  const save = async () => {
    const payload = { name }
    if (editing) {
      await fetch(`${API_URL}/projects/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
    } else {
      await fetch(`${API_URL}/projects/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
    }
    setShow(false)
    load()
  }

  const remove = async (id: number) => {
    await fetch(`${API_URL}/projects/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    load()
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl">Проекты</h1>
        <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={openAdd}>Добавить</button>
      </div>
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Название</th>
            <th className="px-4 py-2 border"></th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => (
            <tr key={p.id} className="text-center border-t">
              <td className="px-4 py-2 border">{p.name}</td>
              <td className="px-4 py-2 border space-x-2">
                <button className="text-blue-500" onClick={() => openEdit(p)}>Редактировать</button>
                <button className="text-red-500" onClick={() => remove(p.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-96">
            <h2 className="text-xl mb-2">{editing ? 'Редактировать проект' : 'Новый проект'}</h2>
            <input className="border p-2 w-full mb-4" placeholder="Название" value={name} onChange={e => setName(e.target.value)} />
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

export default Projects

