import { useState } from 'react'
import { API_URL } from '../api'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

function Chat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const token = localStorage.getItem('token')

  const send = async () => {
    if (!input.trim()) return
    const newMessages = [...messages, { role: 'user', content: input }]
    setMessages(newMessages)
    setInput('')
    try {
      const res = await fetch(`${API_URL}/gpt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ prompt: input }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages([...newMessages, { role: 'assistant', content: data.response }])
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div>
      <div className="border h-96 overflow-y-auto p-2 rounded mb-2 bg-white">
        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'text-right' : 'text-left'}>
            <span className="font-bold mr-1">{m.role === 'user' ? 'Вы:' : 'GPT:'}</span>
            {m.content}
          </div>
        ))}
      </div>
      <div className="flex space-x-2">
        <input
          className="border flex-grow p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Введите сообщение"
        />
        <button className="bg-blue-500 text-white px-4 rounded" onClick={send}>
          Отправить
        </button>
      </div>
    </div>
  )
}

function Neuro() {
  const [open, setOpen] = useState(false)
  return (
    <div className="p-4">
      {!open ? (
        <div
          className="max-w-xs mx-auto p-6 border rounded shadow cursor-pointer text-center"
          onClick={() => setOpen(true)}
        >
          <img src="/gpt.svg" alt="GPT" className="h-20 mx-auto mb-2" />
          <p className="text-lg font-semibold">Chat GPT</p>
        </div>
      ) : (
        <div>
          <button className="text-blue-500 mb-2" onClick={() => setOpen(false)}>
            ← Назад
          </button>
          <Chat />
        </div>
      )}
    </div>
  )
}

export default Neuro
