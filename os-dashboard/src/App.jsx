import { useEffect, useMemo, useState } from 'react'
import { supabase } from './lib/supabase'

const PIPELINE = ['new', 'contacted', 'booked', 'closed', 'lost']

function AuthScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [msg, setMsg] = useState('')

  const submit = async () => {
    if (!supabase) return setMsg('Missing Supabase env vars')
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      setMsg(error ? error.message : 'Logged in')
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      setMsg(error ? error.message : 'Account created. Check email if confirmation is enabled.')
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground p-6 grid place-items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 space-y-4">
        <h1 className="text-2xl font-semibold">First Class Head Quarters</h1>
        <p className="text-sm text-zinc-400">Single-user login (email + password)</p>
        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full rounded-lg border border-border bg-muted px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={submit} className="w-full rounded-lg bg-white text-black py-2">{mode === 'login' ? 'Login' : 'Create account'}</button>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-zinc-300 underline">
          Switch to {mode === 'login' ? 'Sign up' : 'Login'}
        </button>
        <p className="text-xs text-zinc-500">{msg}</p>
      </div>
    </main>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [tasks, setTasks] = useState([])
  const [habits, setHabits] = useState([])
  const [leads, setLeads] = useState([])
  const [closes, setCloses] = useState([])
  const [kpis, setKpis] = useState([])
  const [checkins, setCheckins] = useState([])

  const [taskTitle, setTaskTitle] = useState('')
  const [leadName, setLeadName] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [leadNiche, setLeadNiche] = useState('')
  const [habitName, setHabitName] = useState('')
  const [habitTarget, setHabitTarget] = useState(30)
  const [kpiLabel, setKpiLabel] = useState('')
  const [kpiValue, setKpiValue] = useState('')
  const [checkinText, setCheckinText] = useState('')

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const loadAll = async () => {
    if (!supabase || !session?.user) return
    const user_id = session.user.id
    const [t, h, l, c, k, d] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
      supabase.from('habits').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
      supabase.from('leads').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
      supabase.from('closes').select('*').eq('user_id', user_id).order('closed_at', { ascending: false }),
      supabase.from('kpis').select('*').eq('user_id', user_id).order('created_at', { ascending: false }),
      supabase.from('daily_checkins').select('*').eq('user_id', user_id).order('created_at', { ascending: false }).limit(7),
    ])
    setTasks(t.data || [])
    setHabits(h.data || [])
    setLeads(l.data || [])
    setCloses(c.data || [])
    setKpis(k.data || [])
    setCheckins(d.data || [])
  }

  useEffect(() => { loadAll() }, [session?.user?.id])

  const addTask = async () => {
    if (!taskTitle.trim()) return
    await supabase.from('tasks').insert({ user_id: session.user.id, title: taskTitle, priority: 'med' })
    setTaskTitle('')
    loadAll()
  }

  const addLead = async () => {
    if (!leadName.trim()) return
    await supabase.from('leads').insert({
      user_id: session.user.id,
      business_name: leadName,
      phone: leadPhone || null,
      niche: leadNiche || null,
      status: 'new',
    })
    setLeadName('')
    setLeadPhone('')
    setLeadNiche('')
    loadAll()
  }

  const addHabit = async () => {
    if (!habitName.trim()) return
    await supabase.from('habits').insert({ user_id: session.user.id, name: habitName, target: Number(habitTarget) || 30, streak: 0 })
    setHabitName('')
    setHabitTarget(30)
    loadAll()
  }

  const updateHabit = async (id, patch) => {
    await supabase.from('habits').update(patch).eq('id', id)
    loadAll()
  }

  const removeHabit = async (id) => {
    await supabase.from('habits').delete().eq('id', id)
    loadAll()
  }

  const addKpi = async () => {
    if (!kpiLabel.trim() || kpiValue === '') return
    await supabase.from('kpis').insert({ user_id: session.user.id, label: kpiLabel, value: Number(kpiValue) })
    setKpiLabel('')
    setKpiValue('')
    loadAll()
  }

  const updateKpi = async (id, value) => {
    await supabase.from('kpis').update({ value: Number(value) || 0 }).eq('id', id)
    loadAll()
  }

  const removeKpi = async (id) => {
    await supabase.from('kpis').delete().eq('id', id)
    loadAll()
  }

  const addCheckin = async () => {
    if (!checkinText.trim()) return
    await supabase.from('daily_checkins').insert({ user_id: session.user.id, note: checkinText })
    setCheckinText('')
    loadAll()
  }

  const setLeadStatus = async (id, status) => {
    await supabase.from('leads').update({ status }).eq('id', id)
    loadAll()
  }

  const toggleTask = async (id, done) => {
    await supabase.from('tasks').update({ done: !done }).eq('id', id)
    loadAll()
  }

  const addCloseFromLead = async (lead) => {
    await supabase.from('closes').insert({ user_id: session.user.id, lead_id: lead.id, amount: 100 })
    await supabase.from('leads').update({ status: 'closed' }).eq('id', lead.id)
    loadAll()
  }

  const coreKpis = useMemo(() => {
    const totalLeads = leads.length
    const booked = leads.filter(l => l.status === 'booked').length
    const closed = leads.filter(l => l.status === 'closed').length
    const revenue = closes.reduce((a, c) => a + Number(c.amount || 0), 0)
    return { totalLeads, booked, closed, revenue }
  }, [leads, closes])

  const leadsByStage = useMemo(() => (
    PIPELINE.reduce((acc, stage) => {
      acc[stage] = leads.filter((l) => l.status === stage)
      return acc
    }, {})
  ), [leads])

  if (!session) return <AuthScreen />

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-border bg-card p-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">First Class Head Quarters</h1>
            <p className="text-sm text-zinc-400">Progress · Leads · Habits · Closes</p>
          </div>
          <button className="rounded-lg border border-border bg-muted px-3 py-2 text-sm" onClick={() => supabase.auth.signOut()}>Logout</button>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <Stat label="Leads" value={coreKpis.totalLeads} />
          <Stat label="Booked" value={coreKpis.booked} />
          <Stat label="Closed" value={coreKpis.closed} />
          <Stat label="Revenue" value={`$${coreKpis.revenue}`} />
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <h2 className="text-lg font-semibold">Custom KPI Cards</h2>
          <div className="grid gap-2 md:grid-cols-4">
            <input className="rounded-lg border border-border bg-muted px-3 py-2" placeholder="KPI Label (Calls today)" value={kpiLabel} onChange={(e) => setKpiLabel(e.target.value)} />
            <input className="rounded-lg border border-border bg-muted px-3 py-2" placeholder="Value" value={kpiValue} onChange={(e) => setKpiValue(e.target.value)} />
            <button className="rounded-lg bg-white text-black px-3 py-2" onClick={addKpi}>Add KPI</button>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.id} className="rounded-xl border border-border bg-muted p-3 space-y-2">
                <p className="text-xs uppercase tracking-wide text-zinc-400">{k.label}</p>
                <input className="w-full rounded border border-border bg-card px-2 py-1 text-sm" defaultValue={k.value} onBlur={(e) => updateKpi(k.id, e.target.value)} />
                <button className="text-xs underline text-zinc-400" onClick={() => removeKpi(k.id)}>Remove</button>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-lg font-semibold">Tasks</h2>
            <div className="flex gap-2">
              <input className="flex-1 rounded-lg border border-border bg-muted px-3 py-2" placeholder="Add task..." value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <button className="rounded-lg bg-white text-black px-3" onClick={addTask}>Add</button>
            </div>
            {tasks.map(t => (
              <div key={t.id} className="rounded-lg border border-border bg-muted p-3 flex items-center justify-between">
                <span className={t.done ? 'line-through text-zinc-500' : ''}>{t.title}</span>
                <button className="text-xs underline" onClick={() => toggleTask(t.id, t.done)}>{t.done ? 'Undo' : 'Done'}</button>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-lg font-semibold">Leads Intake</h2>
            <div className="grid gap-2 md:grid-cols-4">
              <input className="rounded-lg border border-border bg-muted px-3 py-2" placeholder="Business name..." value={leadName} onChange={(e) => setLeadName(e.target.value)} />
              <input className="rounded-lg border border-border bg-muted px-3 py-2" placeholder="Phone" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} />
              <input className="rounded-lg border border-border bg-muted px-3 py-2" placeholder="Niche" value={leadNiche} onChange={(e) => setLeadNiche(e.target.value)} />
              <button className="rounded-lg bg-white text-black px-3" onClick={addLead}>Add Lead</button>
            </div>
            {leads.slice(0, 4).map(l => (
              <div key={l.id} className="rounded-lg border border-border bg-muted p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span>{l.business_name}</span>
                  <span className="text-xs uppercase text-zinc-400">{l.status}</span>
                </div>
                <div className="text-xs text-zinc-400">{l.phone || 'No phone'} {l.niche ? `· ${l.niche}` : ''}</div>
                <div className="flex flex-wrap gap-2">
                  {PIPELINE.map(s => <button key={s} className="text-xs border border-border rounded px-2 py-1" onClick={() => setLeadStatus(l.id, s)}>{s}</button>)}
                  <button className="text-xs border border-border rounded px-2 py-1" onClick={() => addCloseFromLead(l)}>+ $100 close</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <h2 className="text-lg font-semibold">Pipeline Tracker</h2>
          <div className="grid gap-3 md:grid-cols-5">
            {PIPELINE.map((stage) => (
              <div key={stage} className="rounded-xl border border-border bg-muted p-3">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-zinc-400">{stage}</p>
                  <span className="text-xs text-zinc-500">{(leadsByStage[stage] || []).length}</span>
                </div>
                <div className="space-y-2 max-h-72 overflow-auto">
                  {(leadsByStage[stage] || []).map((lead) => (
                    <div key={lead.id} className="rounded-lg border border-border bg-card p-2">
                      <p className="text-sm font-medium">{lead.business_name}</p>
                      <p className="text-xs text-zinc-500">{lead.phone || 'No phone'} {lead.niche ? `· ${lead.niche}` : ''}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {PIPELINE.filter((s) => s !== stage).map((s) => (
                          <button key={s} className="text-[10px] border border-border rounded px-2 py-1" onClick={() => setLeadStatus(lead.id, s)}>{s}</button>
                        ))}
                        {stage !== 'closed' && <button className="text-[10px] border border-border rounded px-2 py-1" onClick={() => addCloseFromLead(lead)}>close +$100</button>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-lg font-semibold">Habits</h2>
            <div className="grid gap-2 md:grid-cols-3">
              <input className="rounded-lg border border-border bg-muted px-3 py-2" placeholder="Habit name" value={habitName} onChange={(e) => setHabitName(e.target.value)} />
              <input className="rounded-lg border border-border bg-muted px-3 py-2" type="number" placeholder="Target" value={habitTarget} onChange={(e) => setHabitTarget(e.target.value)} />
              <button className="rounded-lg bg-white text-black px-3 py-2" onClick={addHabit}>Add Habit</button>
            </div>
            {habits.map((h) => (
              <div key={h.id} className="rounded-lg border border-border bg-muted p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p>{h.name}</p>
                  <p className="text-xs text-zinc-400">{h.streak}/{h.target}</p>
                </div>
                <div className="h-2 rounded bg-zinc-800">
                  <div className="h-2 rounded bg-zinc-200" style={{ width: `${Math.min(100, (h.streak / Math.max(1, h.target)) * 100)}%` }} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="text-xs border border-border rounded px-2 py-1" onClick={() => updateHabit(h.id, { streak: h.streak + 1 })}>+1</button>
                  <button className="text-xs border border-border rounded px-2 py-1" onClick={() => updateHabit(h.id, { streak: 0 })}>Reset</button>
                  <button className="text-xs border border-border rounded px-2 py-1" onClick={() => updateHabit(h.id, { target: h.target + 5 })}>Target +5</button>
                  <button className="text-xs border border-border rounded px-2 py-1" onClick={() => removeHabit(h.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <h2 className="text-lg font-semibold">Daily Check-in (Last 7)</h2>
            <div className="flex gap-2">
              <input className="flex-1 rounded-lg border border-border bg-muted px-3 py-2" placeholder="Win/loss note..." value={checkinText} onChange={(e) => setCheckinText(e.target.value)} />
              <button className="rounded-lg bg-white text-black px-3" onClick={addCheckin}>Log</button>
            </div>
            {checkins.map((c) => (
              <div key={c.id} className="rounded-lg border border-border bg-muted p-3">
                <p className="text-sm">{c.note}</p>
                <p className="text-xs text-zinc-500 mt-1">{new Date(c.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}

export default App
