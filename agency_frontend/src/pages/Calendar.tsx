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
  completed?: boolean
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

const hours = Array.from({ length: 12 }, (_, i) => i + 9)
const days = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье']

function contrastText(color:string){
  if(!color) return '#000'
  if(color.startsWith('#')){
    const r=parseInt(color.slice(1,3),16)
    const g=parseInt(color.slice(3,5),16)
    const b=parseInt(color.slice(5,7),16)
    const brightness=(r*299+g*587+b*114)/1000
    return brightness>128?'#000':'#fff'
  }
  return '#000'
}

function Calendar() {
  const [shootings, setShootings] = useState<Shooting[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date()))
  const [now, setNow] = useState(new Date())
  const [filterYear,setFilterYear]=useState(new Date().getFullYear())
  const [filterMonth,setFilterMonth]=useState(new Date().getMonth())

  const token = localStorage.getItem('token')

  const parseDate = (iso: string) => {
    const normalized = /Z|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + 'Z'
    return new Date(normalized)
  }

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
  useEffect(() => {
    setFilterYear(weekStart.getFullYear())
    setFilterMonth(weekStart.getMonth())
  }, [weekStart])

  const beginStr = weekStart.toLocaleDateString('ru-RU', { day:'2-digit', month:'long' })
  const end = new Date(weekStart); end.setDate(end.getDate()+6)
  const endStr = end.toLocaleDateString('ru-RU', { day:'2-digit', month:'long' })

  const nextWeek = () => { const d=new Date(weekStart); d.setDate(d.getDate()+7); setWeekStart(d) }
  const prevWeek = () => { const d=new Date(weekStart); d.setDate(d.getDate()-7); setWeekStart(d) }
  const goToNow = () => {
    const d = startOfWeek(new Date())
    setWeekStart(d)
    setFilterYear(d.getFullYear())
    setFilterMonth(d.getMonth())
  }

  const changeYear = (y:number) => {
    setFilterYear(y)
    const d = new Date(weekStart)
    d.setFullYear(y)
    setWeekStart(startOfWeek(d))
  }
  const changeMonth = (m:number) => {
    setFilterMonth(m)
    const d = new Date(filterYear, m, 1)
    setWeekStart(startOfWeek(d))
  }

  const [modalDate, setModalDate] = useState<Date|null>(null)
  const [current, setCurrent] = useState<Shooting|null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [project, setProject] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [operatorId, setOperatorId] = useState('')
  const [managerIds, setManagerIds] = useState<string[]>([''])
  const [startHour, setStartHour] = useState(9)
  const [endHour, setEndHour] = useState(10)
  const [finishModal, setFinishModal] = useState(false)
  const [finishQuantity, setFinishQuantity] = useState(1)
  const [finishManagers, setFinishManagers] = useState<string[]>([])
  const [finishOperators, setFinishOperators] = useState<string[]>([])

  const openNew = (dt: Date) => {
    setCurrent(null)
    setIsEditing(true)
    setTitle('')
    setProject('')
    setQuantity(1)
    setOperatorId('')
    setManagerIds([''])
    setStartHour(dt.getHours())
    setEndHour(dt.getHours()+1)
    setFinishQuantity(1)
    setFinishManagers([])
    setFinishOperators([])
    setModalDate(dt)
  }

  const openInfo = (sh: Shooting) => {
    setCurrent(sh)
    setIsEditing(false)
    setTitle(sh.title)
    setProject(sh.project || '')
    setQuantity(sh.quantity || 1)
    setOperatorId(String(sh.operator_id))
    setManagerIds(sh.managers.map(String))
    const dt = parseDate(sh.datetime)
    setModalDate(dt)
    setStartHour(dt.getHours())
    setEndHour(dt.getHours()+1)
    setFinishQuantity(sh.quantity || 1)
    setFinishManagers(sh.managers.map(String))
    setFinishOperators([String(sh.operator_id)])
  }

  const startEdit = () => setIsEditing(true)

  const save = async () => {
    if(!modalDate) return
    const base = {
      title,
      project: project || undefined,
      quantity,
      operator_id: Number(operatorId),
      managers: managerIds.filter(Boolean).map(Number),
    }
    if(current){
      const dt = new Date(modalDate)
      dt.setHours(startHour,0,0,0)
      const payload = { ...base, datetime: dt.toISOString().slice(0,19) }
      await fetch(`${API_URL}/shootings/${current.id}`,{method:'PUT', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify(payload)})
    }else{
      for(let h=startHour; h<endHour; h++){
        const dt = new Date(modalDate)
        dt.setHours(h,0,0,0)
        const payload = { ...base, datetime: dt.toISOString().slice(0,19) }
        await fetch(`${API_URL}/shootings/`,{method:'POST', headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`}, body:JSON.stringify(payload)})
      }
    }
    setModalDate(null); setIsEditing(false); load()
  }

  const remove = async () => {
    if(!current) return
    await fetch(`${API_URL}/shootings/${current.id}`, {method:'DELETE', headers:{Authorization:`Bearer ${token}`}})
    setModalDate(null); setIsEditing(false); load()
  }

  const finish = async () => {
    if(!current) return
    await fetch(`${API_URL}/shootings/${current.id}/complete`, {
      method: 'POST',
      headers: {'Content-Type':'application/json', Authorization:`Bearer ${token}`},
      body: JSON.stringify({
        quantity: finishQuantity,
        managers: finishManagers.map(Number),
        operators: finishOperators.map(Number)
      })
    })
    setFinishModal(false); setModalDate(null); load()
  }

  const getShootings = (dt: Date) => {
    const ts = dt.getTime()
    return shootings.filter(s => parseDate(s.datetime).getTime() === ts)
  }

  const getOperator = (id:number) => operators.find(o=>o.id===id)
  const getUser = (id:number) => users.find(u=>u.id===id)

  const addManagerField = () => setManagerIds([...managerIds, ''])

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center justify-between mb-4 space-x-2">
        <div className="flex items-center space-x-2">
          <button onClick={prevWeek} className="px-2">←</button>
          <span className="font-semibold">{beginStr} - {endStr}</span>
          <button onClick={nextWeek} className="px-2">→</button>
        </div>
        <div className="flex items-center space-x-2 ml-auto">
          <button onClick={goToNow} className="px-2 py-1 border rounded">Настоящее время</button>
          <label>Год</label>
          <select value={filterYear} onChange={e=>changeYear(Number(e.target.value))} className="border p-1">
            {Array.from({length:5},(_,i)=>new Date().getFullYear()-2+i).map(y=>(<option key={y} value={y}>{y}</option>))}
          </select>
          <label>Месяц</label>
          <select value={filterMonth} onChange={e=>changeMonth(Number(e.target.value))} className="border p-1">
            {Array.from({length:12},(_,m)=>m).map(m=>(<option key={m} value={m}>{m+1}</option>))}
          </select>
          <div className="whitespace-nowrap text-sm">{now.toLocaleString('ru-RU',{ weekday:'long', day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit', second:'2-digit'})}</div>
        </div>
      </div>
      <div className="overflow-auto max-h-[calc(100vh-200px)] px-16">
      <table className="table-fixed border-collapse text-sm w-full">
        <thead>
          <tr>
            <th className="border p-2 w-28">День</th>
            {hours.map(h => (
              <th key={h} className="border p-2 text-center w-20">{h}:00</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((d,i)=>{
            const dayDate = new Date(weekStart); dayDate.setDate(dayDate.getDate()+i)
            return (
              <tr key={d}>
                <td className="border p-2 whitespace-nowrap">{d}</td>
                {hours.map(h=>{
                  const dt=new Date(dayDate); dt.setHours(h,0,0,0)
                  const list = getShootings(dt)
                  return (
                    <td key={h} className="border relative h-20 w-20 text-xs">
                      {list.length>0 && (
                        <div className="w-full h-full flex flex-col">
                          {list.map(sh=>{
                            const bg=getOperator(sh.operator_id)?.color
                            const color=contrastText(bg||'')
                            return (
                              <div
                                key={sh.id}
                                className="flex-1 overflow-hidden cursor-pointer flex items-center justify-center"
                                style={{background:bg,color}}
                                onClick={()=>!sh.completed && openInfo(sh)}
                              >
                                {sh.completed && <span className="absolute left-1 top-1">✓</span>}
                                <div className="text-center">
                                  <div>{sh.title}</div>
                                  <div>{sh.project}</div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      <button
                        className="absolute right-1 bottom-1 text-xs text-blue-600"
                        onClick={()=>openNew(dt)}
                      >+</button>
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      </div>

      {modalDate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded w-[72rem] space-y-2">
            {isEditing ? (
              <>
                <h2 className="text-xl mb-2">{current ? 'Редактировать съемку' : 'Новая съемка'}</h2>
                <input className="border p-2 w-full" placeholder="Название" value={title} onChange={e=>setTitle(e.target.value)} />
                <select className="border p-2 w-full" value={project} onChange={e=>setProject(e.target.value)}>
                  <option value="">Проект не выбран</option>
                  {projects.map(p=>(<option key={p.id} value={p.name}>{p.name}</option>))}
                </select>
                <input type="number" className="border p-2 w-full" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} />
                <div className="flex gap-2">
                  <select className="border p-2 flex-1" value={startHour} onChange={e=>setStartHour(Number(e.target.value))}>
                    {hours.map(h=>(<option key={h} value={h}>{h}:00</option>))}
                  </select>
                  <select className="border p-2 flex-1" value={endHour} onChange={e=>setEndHour(Number(e.target.value))}>
                    {hours.map(h=>(<option key={h+1} value={h+1}>{h+1}:00</option>))}
                  </select>
                </div>
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
                  {current && <button onClick={remove} className="px-3 py-1 border rounded text-red-600">Удалить</button>}
                  <button onClick={()=>{setModalDate(null);setIsEditing(false)}} className="px-3 py-1 border rounded">Отмена</button>
                  <button onClick={save} className="px-3 py-1 bg-blue-500 text-white rounded">Сохранить</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl mb-2">Информация о съемке</h2>
                {current && (
                  <div className="space-y-1">
                    <div>Название: {title}</div>
                    <div>Проект: {project}</div>
                    <div>Менеджеры: {managerIds.map(id=>getUser(Number(id))?.name).filter(Boolean).join(', ')}</div>
                  </div>
                )}
                <div className="flex justify-end space-x-2 pt-2">
                  {current && (
                    <button onClick={()=>openNew(modalDate!)} className="px-3 py-1 bg-blue-500 text-white rounded">Добавить съемку</button>
                  )}
                  {current && !current.completed && <button onClick={startEdit} className="px-3 py-1 border rounded">Редактировать</button>}
                  {current && !current.completed && <button onClick={remove} className="px-3 py-1 border rounded text-red-600">Удалить</button>}
                  {current && !current.completed && (
                    <button onClick={() => setFinishModal(true)} className="px-3 py-1 border rounded text-green-600">Завершить</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {finishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white p-4 rounded w-[72rem] space-y-2">
            <h2 className="text-xl mb-2">Завершить съемку</h2>
            <input type="number" className="border p-2 w-full" value={finishQuantity} onChange={e=>setFinishQuantity(Number(e.target.value))} />
            <select multiple className="border p-2 w-full" value={finishManagers} onChange={e=> setFinishManagers(Array.from(e.target.selectedOptions).map(o=>o.value))}>
              {users.filter(u=>u.role!=='designer').map(u=>(<option key={u.id} value={u.id}>{u.name}</option>))}
            </select>
            <select multiple className="border p-2 w-full" value={finishOperators} onChange={e=> setFinishOperators(Array.from(e.target.selectedOptions).map(o=>o.value))}>
              {operators.map(o=>(<option key={o.id} value={o.id}>{o.name}</option>))}
            </select>
            <div className="flex justify-end space-x-2 pt-2">
              <button onClick={()=>setFinishModal(false)} className="px-3 py-1 border rounded">Отмена</button>
              <button onClick={finish} className="px-3 py-1 bg-green-500 text-white rounded">Завершить</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Calendar
