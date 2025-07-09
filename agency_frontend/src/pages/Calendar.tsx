import { useEffect, useState } from 'react'
import { API_URL } from '../api'

interface Shooting {
  id: number
  title: string
  project?: string
  quantity?: number
  operator_id: number
  managers: number[]
  datetime: string
}

interface Operator { id: number; name: string; role: string; color: string }
interface User { id: number; name: string; role: string }
interface Project { id: number; name: string }

function startOfWeek(d: Date) {
  const day = d.getDay()
  const diff = (day === 0 ? -6 : 1) - day
  const res = new Date(d)
  res.setDate(d.getDate() + diff)
  res.setHours(0, 0, 0, 0)
  return res
}

const hours = Array.from({ length: 12 }, (_, i) => i + 8)
const days = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье']

function Calendar() {
  const [shootings, setShootings] = useState<Shooting[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()))
  const [now, setNow] = useState(new Date())

  const token = localStorage.getItem('token')

  const load = async () => {
    const [sh, ops, us, pr] = await Promise.all([
      fetch(`${API_URL}/shootings/`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()),
      fetch(`${API_URL}/operators/`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()),
      fetch(`${API_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()),
      fetch(`${API_URL}/projects/`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()),
    ])
    setShootings(sh)
    setOperators(ops)
    setUsers(us)
    setProjects(pr)
  }

  useEffect(() => { load() }, [])
  useEffect(() => { const id=setInterval(()=>setNow(new Date()),1000); return ()=>clearInterval(id) }, [])

  const beginStr = weekStart.toLocaleDateString('ru-RU', { day:'2-digit', month:'long' })
  const end = new Date(weekStart); end.setDate(end.getDate()+6)
  const endStr = end.toLocaleDateString('ru-RU', { day:'2-digit', month:'long' })

  const nextWeek = () => { const d=new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d) }
  const prevWeek = () => { const d=new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d) }

  const [modalDate, setModalDate] = useState<Date|null>(null)
  const [editing, setEditing] = useState<Shooting|null>(null)
  const [title, setTitle] = useState('')
  const [project, setProject] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [operatorId, setOperatorId] = useState('')
  const [managerIds, setManagerIds] = useState<string[]>([''])

  const openNew = (dt: Date) => {
    setEditing(null)
    setTitle('')
    setProject('')
    setQuantity(1)
    setOperatorId('')
    setManagerIds([''])
    setModalDate(dt)
  }

  const openEdit = (sh: Shooting) => {
    setEditing(sh)
    setTitle(sh.title)
    setProject(sh.project || '')
    setQuantity(sh.quantity || 1)
    setOperatorId(String(sh.operator_id))
    setManagerIds(sh.managers.map(String))
    setModalDate(new Date(sh.datetime))
  }

  const save = async () => {
    if(!modalDate) return
    const payload = {
      title,
      project: project || undefined,
      quantity,
      operator_id: Number(operatorId),
      managers: managerIds.filter(Boolean).map(Number),
      datetime: modalDate.toISOString(),
    }
    if(editing){
      await fetch(`${API_URL}/shootings/${editing.id}`,{method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify(payload)})
    }else{
      await fetch(`${API_URL}/shootings/`,{method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify(payload)})
    }
    setModalDate(null); load()
  }

  const remove = async () => {
    if(!editing) return
    await fetch(`${API_URL}/shootings/${editing.id}`, {method:'DELETE', headers:{Authorization:`Bearer ${token}`}})
    setModalDate(null); load()
  }

  const getShooting = (dt: Date) => {
    const ts = dt.getTime()
    return shootings.find(s => new Date(s.datetime).getTime() === ts)
  }

  const getOperator = (id:number) => operators.find(o=>o.id===id)
  const getUser = (id:number) => users.find(u=>u.id===id)

  const addManagerField = () => setManagerIds([...managerIds, ''])

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <button onClick={prevWeek} className="px-2">←</button>
        <h1 className="text-xl">{beginStr} - {endStr}</h1>
        <button onClick={nextWeek} className="px-2">→</button>
        <div className="ml-auto">{now.toLocaleString('ru-RU',{ weekday:'long', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit'})}</div>
      </div>
      <table className="table-fixed border-collapse w-full">
        <thead>
          <tr>
            <th className="border p-2 w-32">День</th>
            {hours.map(h=> (<th key={h} className="border p-2 text-center">{h}:00</th>))}
          </tr>
        </thead>
        <tbody>
          {days.map((d,i)=> {
            const day = new Date(weekStart); day.setDate(day.getDate()+i)
            return (
              <tr key={d}>
                <td className="border p-2">{d}</td>
                {hours.map(h => {
                  const dt = new Date(day); dt.setHours(h,0,0,0)
                  const sh = getShooting(dt)
                  return (
                    <td key={h} className="border h-16 cursor-pointer" style={{background: sh? getOperator(sh.operator_id)?.color : undefined}} onClick={() => sh? openEdit(sh) : openNew(dt)}>
                      {sh && (
                        <div className="text-xs">
                          <div>{sh.project}</div>
                          <div>{getUser(sh.managers[0])?.name}</div>
                        </div>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>

      {modalDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded w-96 space-y-2">
            <h2 className="text-xl mb-2">{editing ? 'Редактировать съемку' : 'Новая съемка'}</h2>
            <input className="border p-2 w-full" placeholder="Название" value={title} onChange={e=>setTitle(e.target.value)} />
            <select className="border p-2 w-full" value={project} onChange={e=>setProject(e.target.value)}>
              <option value="">Проект не выбран</option>
              {projects.map(p=>(<option key={p.id} value={p.name}>{p.name}</option>))}
            </select>
            <input type="number" className="border p-2 w-full" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} />
            <select className="border p-2 w-full" value={operatorId} onChange={e=>setOperatorId(e.target.value)}>
              <option value="">Выберите оператора</option>
              {operators.map(o=>(<option key={o.id} value={o.id}>{o.name}</option>))}
            </select>
            {managerIds.map((m,idx)=>(
              <select key={idx} className="border p-2 w-full" value={m} onChange={e=> setManagerIds(managerIds.map((x,i)=> i===idx? e.target.value: x))}>
                <option value="">Выберите менеджера</option>
                {users.filter(u=>u.role!=='designer').map(u=>(<option key={u.id} value={u.id}>{u.name}</option>))}
              </select>
            ))}
            <button className="text-blue-500" onClick={addManagerField}>+ менеджер</button>
            <div className="flex justify-end space-x-2 pt-2">
              {editing && <button onClick={remove} className="px-3 py-1 border rounded text-red-600">Удалить</button>}
              <button onClick={()=>setModalDate(null)} className="px-3 py-1 border rounded">Отмена</button>
              <button onClick={save} className="px-3 py-1 bg-blue-500 text-white rounded">Сохранить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
