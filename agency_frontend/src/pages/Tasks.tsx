import { useEffect, useState } from 'react'
import { API_URL } from '../api'

interface Task {
  id: number
  title: string
  description?: string
  status: string
  deadline?: string
  executor_id?: number
  author_id?: number
  created_at: string
  project?: string
  task_type?: string
  task_format?: string
}

interface User {
  id: number
  name: string
  role: string
}

const DESIGNER_TYPES = ['Motion', 'Статика', 'Видео', 'Карусель', 'Другое']
const DESIGNER_FORMATS = ['9:16', '1:1', '4:5', '16:9', 'Другое']
const MANAGER_TYPES = [
  'Публикация',
  'Контент план',
  'Отчет',
  'Съемка',
  'Встреча',
  'Стратегия',
  'Презентация',
  'Админ задачи',
  'Анализ',
  'Брифинг',
  'Сценарий',
  'Другое',
]
const ADMIN_TYPES = [
  'Публикация',
  'Съемки',
  'Стратегия',
  'Отчет',
  'Бухгалтерия',
  'Встреча',
  'Документы',
  'Работа с кадрами',
  'Планерка',
  'Администраторские задачи',
  'Собеседование',
  'Договор',
  'Другое',
]

const TYPE_ICONS: Record<string, string> = {
  Motion: '🎞️',
  'Статика': '🖼️',
  'Видео': '🎬',
  'Карусель': '🖼️',
  'Другое': '📌',
  'Публикация': '📝',
  'Контент план': '📅',
  'Отчет': '📊',
  'Съемка': '📹',
  'Встреча': '🤝',
  'Стратегия': '📈',
  'Презентация': '🎤',
  'Админ задачи': '🗂️',
  'Анализ': '🔎',
  'Брифинг': '📋',
  'Сценарий': '📜',
  'Съемки': '🎥',
  'Бухгалтерия': '💰',
  'Документы': '📄',
  'Работа с кадрами': '👥',
  'Планерка': '🗓️',
  'Администраторские задачи': '🛠️',
  'Собеседование': '🧑\u200d💼',
  'Договор': '✍️',
}

const FORMAT_ICONS: Record<string, string> = {
  '9:16': '📱',
  '1:1': '🔲',
  '4:5': '🖼️',
  '16:9': '🎞️',
  'Другое': '📌',
}

const formatDate = (iso?: string) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', {
    timeZone: 'Asia/Tashkent',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showModal, setShowModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [executorId, setExecutorId] = useState('')
  const [deadline, setDeadline] = useState('')
  const [project, setProject] = useState('')
  const [taskType, setTaskType] = useState('')
  const [taskFormat, setTaskFormat] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<{id: number; name: string}[]>([])

  const [filterRole, setFilterRole] = useState('')
  const [filterUser, setFilterUser] = useState('')
  const [filterDate, setFilterDate] = useState('all')
  const [filterStatus, setFilterStatus] = useState('active')
  const [filterProject, setFilterProject] = useState('')

  const role = localStorage.getItem('role') || ''
  const userId = Number(localStorage.getItem('userId'))

  const allowedUsers = users.filter((u) => {
    if (role === 'admin') return true
    if (role === 'designer') return u.role === 'designer'
    if (role === 'smm_manager') return u.role === 'designer' || u.id === userId
    if (role === 'head_smm')
      return u.role === 'designer' || u.role === 'smm_manager' || u.id === userId
    return false
  })

  const getExecutorName = (id?: number) => {
    const u = users.find((x) => x.id === id)
    return u ? u.name : ''
  }

  const getUserName = (id?: number) => {
    const u = users.find((x) => x.id === id)
    return u ? u.name : ''
  }
  
  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API_URL}/tasks/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setTasks(data))
      .catch(() => setTasks([]))
    fetch(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setUsers(data))
      .catch(() => setUsers([]))
    fetch(`${API_URL}/projects/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setProjects(data))
      .catch(() => setProjects([]))
  }, [])

  const filteredTasks = tasks.filter((t) => {
    if (filterStatus !== 'all') {
      if (filterStatus === 'active' && t.status === 'done') return false
      if (filterStatus === 'done' && t.status !== 'done') return false
    }
    if (filterRole) {
      const exec = users.find((u) => u.id === t.executor_id)
      if (!exec || exec.role !== filterRole) return false
    }
    if (filterUser && String(t.executor_id) !== filterUser) return false
    if (filterProject && t.project !== filterProject) return false
    if (filterDate !== 'all') {
      const created = new Date(t.created_at)
      const now = new Date()
      const diff = now.getTime() - created.getTime()
      if (filterDate === 'today' && diff > 86400000) return false
      if (filterDate === 'week' && diff > 7 * 86400000) return false
      if (filterDate === 'month' && diff > 30 * 86400000) return false
    }
    return true
  })

  const createTask = async () => {
    const payload = {
      title,
      description,
      project: project || undefined,
      task_type: taskType || undefined,
      task_format: taskFormat || undefined,
      executor_id: executorId ? Number(executorId) : undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    }
    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/tasks/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    setShowModal(false)
    setSelectedTask(null)
    setIsEditing(false)
    setIsEditing(false)
    setTitle('')
    setDescription('')
    setProject('')
    setTaskType('')
    setTaskFormat('')
    setExecutorId('')
    setDeadline('')
    const res = await fetch(`${API_URL}/tasks/`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    setTasks(await res.json())
  }

  const saveTask = async () => {
    if (!selectedTask) return
    const payload = {
      title,
      description,
      project: project || undefined,
      task_type: taskType || undefined,
      task_format: taskFormat || undefined,
      executor_id: executorId ? Number(executorId) : undefined,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
    }
    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/tasks/${selectedTask.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    })
    setShowModal(false)
    setSelectedTask(null)
    setTitle('')
    setDescription('')
    setProject('')
    setTaskType('')
    setTaskFormat('')
    setExecutorId('')
    setDeadline('')
    const res = await fetch(`${API_URL}/tasks/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    setTasks(await res.json())
  }

  const deleteTask = async (id: number) => {
    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/tasks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    setTasks(tasks.filter((t) => t.id !== id))
  }

  const completeTask = async (id: number) => {
    const token = localStorage.getItem('token')
    await fetch(`${API_URL}/tasks/${id}/status?status=done`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
    })
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, status: 'done' } : t))
    )
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl">Tasks</h1>
        <button
          className="bg-blue-500 text-white px-3 py-1 rounded"
          onClick={() => {
            setSelectedTask(null)
            setIsEditing(true)
            setTitle('')
            setDescription('')
            setProject('')
            setTaskType('')
            setTaskFormat('')
            setExecutorId('')
            setDeadline('')
            setShowModal(true)
          }}
        >
          Создать задачу
        </button>
      </div>
      <div className="mb-4 flex gap-2">
        <select
          className="border p-1"
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
        >
          <option value="">Все проекты</option>
          {projects.map(p => (
            <option key={p.id} value={p.name}>{p.name}</option>
          ))}
        </select>
        {role !== 'designer' && (
          <select
            className="border p-1"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
          >
            <option value="">Все роли</option>
            <option value="designer">Дизайнер</option>
            <option value="smm_manager">СММ-менеджер</option>
            <option value="head_smm">Head of SMM</option>
            <option value="admin">Админ</option>
          </select>
        )}
        <select
          className="border p-1"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
        >
          <option value="">Все сотрудники</option>
          {users
            .filter((u) => (filterRole ? u.role === filterRole : true))
            .map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
        </select>
        <select
          className="border p-1"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        >
          <option value="all">За все время</option>
          <option value="today">За сегодня</option>
          <option value="week">За неделю</option>
          <option value="month">За месяц</option>
        </select>
        <select
          className="border p-1"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="active">Активные</option>
          <option value="done">Завершенные</option>
          <option value="all">Все</option>
        </select>
        <span className="ml-auto">Всего: {filteredTasks.length}</span>
      </div>

      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">Название задачи</th>
            <th className="px-4 py-2 border">Проект</th>
            <th className="px-4 py-2 border">Тип задачи</th>
            <th className="px-4 py-2 border">Кто поставил</th>
            <th className="px-4 py-2 border">Исполнитель</th>
            <th className="px-4 py-2 border">Когда поставлена</th>
            <th className="px-4 py-2 border">Дедлайн</th>
            <th className="px-4 py-2 border">Действия</th>
          </tr>
        </thead>
        <tbody>
          {filteredTasks.map((t) => (
            <tr key={t.id} className="text-center border-t hover:bg-gray-50">
              <td
                className="px-4 py-2 border cursor-pointer underline"
                onClick={() => {
                  setSelectedTask(t)
                  setIsEditing(false)
                  setShowModal(true)
                  setTitle(t.title)
                  setDescription(t.description || '')
                  setProject(t.project || '')
                  setTaskType(t.task_type || '')
                  setTaskFormat(t.task_format || '')
                  setExecutorId(t.executor_id ? String(t.executor_id) : '')
                  setDeadline(t.deadline ? new Date(t.deadline).toISOString().slice(0,16) : '')
                }}
              >
                {t.title}
              </td>
              <td className="px-4 py-2 border">{t.project}</td>
              <td className="px-4 py-2 border">
                {TYPE_ICONS[t.task_type || '']}&nbsp;{t.task_type}
                {t.task_format && (
                  <span className="ml-1 text-sm">{FORMAT_ICONS[t.task_format] || ''}</span>
                )}
              </td>
              <td className="px-4 py-2 border">{getUserName(t.author_id)}</td>
              <td className="px-4 py-2 border">{getExecutorName(t.executor_id)}</td>
              <td className="px-4 py-2 border">{formatDate(t.created_at)}</td>
              <td className="px-4 py-2 border">{formatDate(t.deadline)}</td>
              <td className="px-4 py-2 border space-x-2">
                <button className="text-sm text-red-600" onClick={() => deleteTask(t.id)}>Удалить</button>
                {t.status !== 'done' && (
                  <button className="text-sm text-green-600" onClick={() => completeTask(t.id)}>
                    Завершить
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded w-[40rem] space-y-2">
            <h2 className="text-xl mb-2">
              {isEditing ? (selectedTask ? 'Редактировать задачу' : 'Новая задача') : 'Информация о задаче'}
            </h2>
            <input
              className="border p-2 w-full mb-2"
              placeholder="Заголовок"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={!isEditing}
            />
            <textarea
              className="border p-2 w-full mb-2"
              placeholder="Описание"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={!isEditing}
            />
            <select
              className="border p-2 w-full mb-2"
              value={executorId}
              onChange={(e) => setExecutorId(e.target.value)}
              disabled={!isEditing}
            >
              <option value="">Не назначено</option>
              {allowedUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.role})
                </option>
              ))}
            </select>
            {(executorId || role === 'designer') && (
              <>
                <select
                  className="border p-2 w-full mb-2"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="">Проект не выбран</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
                <select
                  className="border p-2 w-full mb-2"
                  value={taskType}
                  onChange={(e) => setTaskType(e.target.value)}
                  disabled={!isEditing}
                >
                  <option value="">Тип задачи не выбран</option>
                  {(
                    (users.find((u) => u.id === Number(executorId))?.role || role) === 'designer'
                      ? DESIGNER_TYPES
                      : (users.find((u) => u.id === Number(executorId))?.role || role) === 'admin'
                      ? ADMIN_TYPES
                      : MANAGER_TYPES
                  ).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                {!isEditing && taskType && (
                  <div className="mb-2">
                    {TYPE_ICONS[taskType]} {taskType}
                  </div>
                )}
                {(
                  users.find((u) => u.id === Number(executorId))?.role || role
                ) === 'designer' && (
                  <select
                    className="border p-2 w-full mb-2"
                    value={taskFormat}
                    onChange={(e) => setTaskFormat(e.target.value)}
                    disabled={!isEditing}
                  >
                    <option value="">Формат не выбран</option>
                    {DESIGNER_FORMATS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                )}
                {!isEditing && taskFormat && (
                  <div className="mb-2">
                    {FORMAT_ICONS[taskFormat]} {taskFormat}
                  </div>
                )}
              </>
            )}
            <input
              type="datetime-local"
              className="border p-2 w-full mb-4"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              disabled={!isEditing}
            />
            <div className="flex justify-end">
              <button
                className="mr-2 px-4 py-1 border rounded"
                onClick={() => { setShowModal(false); setSelectedTask(null); setIsEditing(false); }}
              >
                Отмена
              </button>
              {!isEditing && selectedTask && (
                <button
                  className="mr-2 px-4 py-1 border rounded"
                  onClick={() => setIsEditing(true)}
                >
                  Редактировать
                </button>
              )}
              {isEditing && (
                <button
                  className="bg-blue-500 text-white px-4 py-1 rounded"
                  onClick={selectedTask ? saveTask : createTask}
                >
                  Сохранить
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Tasks
