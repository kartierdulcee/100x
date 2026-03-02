import { useMemo, useState } from 'react'
import { Plus, CheckCircle2, Circle, Upload, Download, RefreshCw } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts'

const k = 'x100-os-dashboard-v1'

const seed = {
  profile: {
    mode: 'Hybrid',
    syncEndpoint: '',
    syncToken: '',
  },
  tasks: [
    { id: crypto.randomUUID(), title: 'Mark our CRT highs and lows', due: '2026-03-04T08:00', priority: 'high', done: false },
  ],
  habits: [
    { name: 'No impulse loop before deep work', streak: 2, target: 30 },
    { name: 'Trading rules followed', streak: 3, target: 30 },
    { name: 'Daily outreach done', streak: 1, target: 30 },
  ],
  trading: [
    { day: 'Mon', compliance: 82 },
    { day: 'Tue', compliance: 75 },
    { day: 'Wed', compliance: 90 },
    { day: 'Thu', compliance: 70 },
    { day: 'Fri', compliance: 88 },
  ],
  outreach: [
    { day: 'W1', sent: 62 },
    { day: 'W2', sent: 118 },
    { day: 'W3', sent: 97 },
    { day: 'W4', sent: 130 },
  ],
}

function load() {
  try {
    return JSON.parse(localStorage.getItem(k)) || seed
  } catch {
    return seed
  }
}

function App() {
  const [db, setDb] = useState(load)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState('med')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('Local mode')

  const persist = (next) => {
    setDb(next)
    localStorage.setItem(k, JSON.stringify(next))
  }

  const metrics = useMemo(() => {
    const total = db.tasks.length
    const done = db.tasks.filter((x) => x.done).length
    const open = total - done
    const upcoming = db.tasks.filter((t) => !t.done && t.due).sort((a, b) => +new Date(a.due) - +new Date(b.due)).slice(0, 5)
    return { total, done, open, upcoming }
  }, [db.tasks])

  const addTask = () => {
    if (!title.trim()) return
    persist({
      ...db,
      tasks: [{ id: crypto.randomUUID(), title: title.trim(), due, priority, done: false }, ...db.tasks],
    })
    setTitle('')
    setDue('')
    setPriority('med')
  }

  const toggleTask = (id) => persist({
    ...db,
    tasks: db.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
  })

  const removeTask = (id) => persist({ ...db, tasks: db.tasks.filter((t) => t.id !== id) })

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'x100-os-dashboard.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importJson = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        persist(parsed)
        setSyncMsg('Imported JSON successfully')
      } catch {
        setSyncMsg('Invalid JSON file')
      }
    }
    reader.readAsText(file)
  }

  const syncNow = async () => {
    if (!db.profile.syncEndpoint) {
      setSyncMsg('Add sync endpoint to enable cloud sync')
      return
    }
    try {
      setSyncing(true)
      const res = await fetch(db.profile.syncEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: db.profile.syncToken ? `Bearer ${db.profile.syncToken}` : '',
        },
        body: JSON.stringify(db),
      })
      setSyncMsg(res.ok ? 'Synced successfully' : `Sync failed (${res.status})`)
    } catch {
      setSyncMsg('Sync failed (network)')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-border bg-card p-5 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">100x OS Dashboard</h1>
              <p className="text-sm text-zinc-400">Tasks · Trading Discipline · Outreach · Habits · Sync Control</p>
            </div>
            <div className="text-sm text-zinc-300">Mode: <span className="font-medium">{db.profile.mode}</span></div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          {[['Total Tasks', metrics.total], ['Open', metrics.open], ['Done', metrics.done], ['Habit Rows', db.habits.length]].map(([l, v]) => (
            <div key={l} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs uppercase tracking-wide text-zinc-500">{l}</p>
              <p className="mt-2 text-2xl font-semibold">{v}</p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Mission Tasks</h2>
            </div>
            <div className="mb-4 grid gap-2 md:grid-cols-[1fr_170px_120px_100px]">
              <input className="rounded-lg border border-border bg-muted px-3 py-2 outline-none" placeholder="Add task..." value={title} onChange={(e) => setTitle(e.target.value)} />
              <input className="rounded-lg border border-border bg-muted px-3 py-2 outline-none" type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} />
              <select className="rounded-lg border border-border bg-muted px-3 py-2 outline-none" value={priority} onChange={(e) => setPriority(e.target.value)}>
                <option value="high">High</option>
                <option value="med">Medium</option>
                <option value="low">Low</option>
              </select>
              <button onClick={addTask} className="inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-black">
                <Plus size={16} /> Add
              </button>
            </div>

            <div className="space-y-2">
              {db.tasks.map((t) => (
                <div key={t.id} className="flex items-center gap-3 rounded-xl border border-border bg-muted px-3 py-2">
                  <button onClick={() => toggleTask(t.id)}>{t.done ? <CheckCircle2 size={18} /> : <Circle size={18} />}</button>
                  <div className="flex-1">
                    <p className={t.done ? 'line-through text-zinc-500' : ''}>{t.title}</p>
                    <p className="text-xs text-zinc-500">{t.due ? new Date(t.due).toLocaleString() : 'No due date'}</p>
                  </div>
                  <span className="rounded-full border border-border px-2 py-1 text-xs uppercase text-zinc-400">{t.priority}</span>
                  <button onClick={() => removeTask(t.id)} className="text-xs text-zinc-400 hover:text-white">Delete</button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-4 text-lg font-semibold">Upcoming</h2>
            <div className="space-y-2">
              {metrics.upcoming.length ? metrics.upcoming.map((u) => (
                <div key={u.id} className="rounded-xl border border-border bg-muted p-3">
                  <p className="text-sm font-medium">{u.title}</p>
                  <p className="text-xs text-zinc-500">{new Date(u.due).toLocaleString()}</p>
                </div>
              )) : <p className="text-sm text-zinc-500">No upcoming items.</p>}
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-semibold">Trading Rule Compliance</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={db.trading}>
                  <XAxis dataKey="day" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip />
                  <Area type="monotone" dataKey="compliance" stroke="#fafafa" fill="#27272a" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-semibold">Outreach Volume</h2>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={db.outreach}>
                  <XAxis dataKey="day" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip />
                  <Bar dataKey="sent" fill="#f4f4f5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="mb-3 text-lg font-semibold">Habit Tracker</h2>
            <div className="space-y-3">
              {db.habits.map((h) => (
                <div key={h.name} className="rounded-xl border border-border bg-muted p-3">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span>{h.name}</span><span className="text-zinc-400">{h.streak}/{h.target}</span>
                  </div>
                  <div className="h-2 rounded bg-zinc-800">
                    <div className="h-2 rounded bg-zinc-200" style={{ width: `${Math.min(100, (h.streak / h.target) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-lg font-semibold">Sync + Autonomy Controls</h2>
            <select
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 outline-none"
              value={db.profile.mode}
              onChange={(e) => persist({ ...db, profile: { ...db.profile, mode: e.target.value } })}
            >
              <option>Council</option>
              <option>Operator</option>
              <option>Hybrid</option>
            </select>
            <input
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 outline-none"
              placeholder="Sync endpoint (webhook / API)"
              value={db.profile.syncEndpoint}
              onChange={(e) => persist({ ...db, profile: { ...db.profile, syncEndpoint: e.target.value } })}
            />
            <input
              className="w-full rounded-lg border border-border bg-muted px-3 py-2 outline-none"
              placeholder="Sync token (optional)"
              value={db.profile.syncToken}
              onChange={(e) => persist({ ...db, profile: { ...db.profile, syncToken: e.target.value } })}
            />
            <div className="flex flex-wrap gap-2">
              <button onClick={syncNow} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm">{syncing ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}Sync now</button>
              <button onClick={exportJson} className="inline-flex items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm"><Download size={14} />Export</button>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-muted px-3 py-2 text-sm"><Upload size={14} />Import
                <input type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importJson(e.target.files[0])} />
              </label>
            </div>
            <p className="text-xs text-zinc-500">{syncMsg}</p>
          </div>
        </section>
      </div>
    </main>
  )
}

export default App
