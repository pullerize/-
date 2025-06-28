import { useEffect, useState } from 'react'

interface Task {
  id: number
  title: string
  description?: string
  status: string
  deadline?: string
  executor_id?: number
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showModal, setShowModal] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [executorId, setExecutorId] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/tasks/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch(() => setTasks([]))
  }, [])

  const createTask = async () => {
    const payload = {
      title,
      description,
      executor_id: executorId ? Number(executorId) : undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    }
    const token = localStorage.getItem('token')
    await fetch('/tasks/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    setShowModal(false)
    setTitle('')
    setDescription('')
    setExecutorId('')
    setDeadline('')
    const res = await fetch('/tasks/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    setTasks(await res.json())
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl">Tasks</h1>
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={() => setShowModal(true)}
        >
          Создать задачу
        </button>
      </div>
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Заголовок</th>
            <th className="px-4 py-2 border">Описание</th>
            <th className="px-4 py-2 border">Статус</th>
            <th className="px-4 py-2 border">Дедлайн</th>
            <th className="px-4 py-2 border">Исполнитель</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className="text-center border-t">
              <td className="px-4 py-2 border">{t.title}</td>
              <td className="px-4 py-2 border">{t.description}</td>
              <td className="px-4 py-2 border">{t.status}</td>
              <td className="px-4 py-2 border">
                {t.deadline ? new Date(t.deadline).toLocaleDateString() : ''}
              </td>
              <td className="px-4 py-2 border">{t.executor_id ?? ''}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-96">
            <h2 className="text-xl mb-2">Новая задача</h2>
            <input
              className="border p-2 w-full mb-2"
              placeholder="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="border p-2 w-full mb-2"
              placeholder="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <input
              className="border p-2 w-full mb-2"
              placeholder="ID исполнителя"
              value={executorId}
              onChange={(e) => setExecutorId(e.target.value)}
            />
            <input
              type="date"
              className="border p-2 w-full mb-4"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
            <div className="flex justify-end">
              <button
                className="mr-2 px-4 py-1 border rounded"
                onClick={() => setShowModal(false)}
              >
                Отмена
              </button>
              <button
                className="bg-blue-500 text-white px-4 py-1 rounded"
                onClick={createTask}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
