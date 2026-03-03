import { useEffect, useMemo, useState } from 'react'
import { BarChart3, CheckSquare, ClipboardList, Gauge, LayoutDashboard, LineChart, Target } from 'lucide-react'
import { Card, CardContent } from './components/ui/card'
import { cn } from './lib/utils'
import { supabase } from './lib/supabase'

const PIPELINE = ['new', 'contacted', 'booked', 'closed', 'lost']

const NAV = [
  { key: 'overview', label: 'Overview', icon: LayoutDashboard },
  { key: 'pipeline', label: 'Pipeline', icon: BarChart3 },
  { key: 'tasks', label: 'Tasks', icon: ClipboardList },
  { key: 'habits', label: 'Habits', icon: Target },
  { key: 'kpis', label: 'KPIs', icon: Gauge },
  { key: 'checkins', label: 'Check-ins', icon: CheckSquare },
]

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
    <main className="min-h-screen bg-[#07090d] text-zinc-100 p-6 grid place-items-center">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0b0f16] p-6 space-y-4">
        <h1 className="text-2xl font-semibold">First Class Head Quarters</h1>
        <p className="text-sm text-zinc-400">Email/password login</p>
        <input className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <input className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <button onClick={submit} className="w-full rounded-lg bg-white text-black py-2">{mode === 'login' ? 'Login' : 'Create account'}</button>
        <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-sm text-zinc-300 underline">
          Switch to {mode === 'login' ? 'Sign up' : 'Login'}
        </button>
        <p className="text-xs text-zinc-500">{msg}</p>
      </div>
    </main>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-zinc-800/90 bg-gradient-to-b from-[#101826] to-[#0b0f16] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
      <p className="text-[11px] uppercase tracking-widest text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
      <div className="mt-3 h-1 w-16 rounded bg-emerald-400/60" />
    </div>
  )
}

export default function App() {
  const [session, setSession] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

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
  const [density, setDensity] = useState('comfortable')
  const [commandOpen, setCommandOpen] = useState(false)
  const [dragLeadId, setDragLeadId] = useState(null)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandOpen((v) => !v)
      }
      if (e.key === 'Escape') setCommandOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
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
  const toggleTask = async (id, done) => { await supabase.from('tasks').update({ done: !done }).eq('id', id); loadAll() }

  const addLead = async () => {
    if (!leadName.trim()) return
    await supabase.from('leads').insert({ user_id: session.user.id, business_name: leadName, phone: leadPhone || null, niche: leadNiche || null, status: 'new' })
    setLeadName(''); setLeadPhone(''); setLeadNiche(''); loadAll()
  }
  const setLeadStatus = async (id, status) => { await supabase.from('leads').update({ status }).eq('id', id); loadAll() }
  const addCloseFromLead = async (lead) => {
    await supabase.from('closes').insert({ user_id: session.user.id, lead_id: lead.id, amount: 100 })
    await supabase.from('leads').update({ status: 'closed' }).eq('id', lead.id)
    loadAll()
  }

  const addHabit = async () => {
    if (!habitName.trim()) return
    await supabase.from('habits').insert({ user_id: session.user.id, name: habitName, target: Number(habitTarget) || 30, streak: 0 })
    setHabitName(''); setHabitTarget(30); loadAll()
  }
  const updateHabit = async (id, patch) => { await supabase.from('habits').update(patch).eq('id', id); loadAll() }
  const removeHabit = async (id) => { await supabase.from('habits').delete().eq('id', id); loadAll() }

  const addKpi = async () => {
    if (!kpiLabel.trim() || kpiValue === '') return
    await supabase.from('kpis').insert({ user_id: session.user.id, label: kpiLabel, value: Number(kpiValue) })
    setKpiLabel(''); setKpiValue(''); loadAll()
  }
  const updateKpi = async (id, value) => { await supabase.from('kpis').update({ value: Number(value) || 0 }).eq('id', id); loadAll() }
  const removeKpi = async (id) => { await supabase.from('kpis').delete().eq('id', id); loadAll() }

  const addCheckin = async () => {
    if (!checkinText.trim()) return
    await supabase.from('daily_checkins').insert({ user_id: session.user.id, note: checkinText })
    setCheckinText(''); loadAll()
  }

  const quickAction = (action) => {
    if (action === 'toggle-density') setDensity((d) => d === 'compact' ? 'comfortable' : 'compact')
    if (action.startsWith('tab:')) setActiveTab(action.replace('tab:', ''))
    setCommandOpen(false)
  }

  const coreKpis = useMemo(() => {
    const totalLeads = leads.length
    const booked = leads.filter(l => l.status === 'booked').length
    const closed = leads.filter(l => l.status === 'closed').length
    const revenue = closes.reduce((a, c) => a + Number(c.amount || 0), 0)
    return { totalLeads, booked, closed, revenue }
  }, [leads, closes])

  const leadsByStage = useMemo(() => PIPELINE.reduce((acc, stage) => {
    acc[stage] = leads.filter((l) => l.status === stage)
    return acc
  }, {}), [leads])

  const panelPad = density === 'compact' ? 'p-3' : 'p-4'

  if (!session) return <AuthScreen />

  return (
    <main className="min-h-screen bg-[#07090d] text-zinc-100">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[250px_1fr]">
        <aside className="border-r border-zinc-900 bg-[#06080c] p-4 lg:p-5">
          <div className="mb-4 rounded-lg border border-zinc-800 bg-[#0b0f16] p-3">
            <p className="text-sm font-medium">First Class HQ</p>
            <p className="text-xs text-zinc-500">{session.user.email}</p>
          </div>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key)}
                  className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition ${activeTab === item.key ? 'border-emerald-500/40 bg-[#0f1726] text-white shadow-[0_0_0_1px_rgba(16,185,129,0.15)]' : 'border-zinc-900 bg-[#0a0d13] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'}`}
                >
                  <span className="flex items-center gap-2">
                    <Icon size={15} className={activeTab === item.key ? 'text-emerald-300' : 'text-zinc-500'} />
                    {item.label}
                  </span>
                </button>
              )
            })}
          </nav>
          <button className="mt-6 w-full rounded-lg border border-zinc-800 bg-[#0b0f16] px-3 py-2 text-sm" onClick={() => supabase.auth.signOut()}>Logout</button>
        </aside>

        <section className="p-4 md:p-6 lg:p-8 space-y-5">
          <div className="rounded-xl border border-zinc-800 bg-gradient-to-r from-[#0b0f16] to-[#0d1420] px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-zinc-400">{NAV.find(x => x.key === activeTab)?.label || 'Overview'}</p>
              <h1 className="text-xl font-semibold tracking-tight">First Class Head Quarters</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')} className="text-xs rounded border border-zinc-700 px-2 py-1 text-zinc-300">{density === 'compact' ? 'Comfortable' : 'Compact'}</button>
              <button onClick={() => setCommandOpen(true)} className="text-xs rounded border border-zinc-700 px-2 py-1 text-zinc-300">⌘K</button>
              <p className="text-xs text-emerald-300 inline-flex items-center gap-1"><LineChart size={14} />Live Workspace</p>
            </div>
          </div>

          {activeTab === 'overview' && (
            <div className="mx-auto grid grid-cols-1 gap-px rounded-xl bg-zinc-800 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { name: 'Leads', value: `${coreKpis.totalLeads}`, change: '+0%', changeType: 'positive' },
                { name: 'Booked', value: `${coreKpis.booked}`, change: '+0%', changeType: 'positive' },
                { name: 'Closed', value: `${coreKpis.closed}`, change: '+0%', changeType: 'positive' },
                { name: 'Revenue', value: `$${coreKpis.revenue.toFixed(2)}`, change: '+0%', changeType: 'positive' },
              ].map((stat, index, arr) => (
                <Card
                  key={stat.name}
                  className={cn(
                    'rounded-none border-0 shadow-none py-0',
                    index === 0 && 'rounded-l-xl',
                    index === arr.length - 1 && 'rounded-r-xl',
                  )}
                >
                  <CardContent className={cn('flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2', density === 'compact' ? 'p-3' : 'p-4 sm:p-6')}>
                    <div className="text-sm font-medium text-zinc-400">{stat.name}</div>
                    <div className={cn('tabular-nums text-xs font-medium', stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400')}>
                      {stat.change}
                    </div>
                    <div className="tabular-nums w-full flex-none text-3xl font-medium tracking-tight text-zinc-100">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {activeTab === 'pipeline' && (
            <>
              <div className={cn("rounded-xl border border-zinc-800 bg-[#0b0f16] space-y-3", panelPad)}>
                <h2 className="font-semibold">Lead Intake</h2>
                <div className="grid gap-2 md:grid-cols-4">
                  <input className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" placeholder="Business name" value={leadName} onChange={(e) => setLeadName(e.target.value)} />
                  <input className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" placeholder="Phone" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} />
                  <input className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" placeholder="Niche" value={leadNiche} onChange={(e) => setLeadNiche(e.target.value)} />
                  <button className="rounded-lg bg-white text-black px-3 py-2" onClick={addLead}>Add Lead</button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-5">
                {PIPELINE.map((stage) => (
                  <div
                    key={stage}
                    className="rounded-xl border border-zinc-800 bg-[#0b0f16] p-3"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => dragLeadId && setLeadStatus(dragLeadId, stage)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs uppercase tracking-wide text-zinc-500">{stage}</p>
                      <span className="text-xs text-zinc-500">{(leadsByStage[stage] || []).length}</span>
                    </div>
                    <div className="space-y-2 max-h-80 overflow-auto">
                      {(leadsByStage[stage] || []).map((lead) => (
                        <div
                          key={lead.id}
                          className={cn('rounded-lg border border-zinc-800 bg-zinc-950', density === 'compact' ? 'p-1.5' : 'p-2')}
                          draggable
                          onDragStart={() => setDragLeadId(lead.id)}
                          onDragEnd={() => setDragLeadId(null)}
                        >
                          <p className="text-sm font-medium">{lead.business_name}</p>
                          <p className="text-xs text-zinc-500">{lead.phone || 'No phone'} {lead.niche ? `· ${lead.niche}` : ''}</p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {PIPELINE.filter((s) => s !== stage).map((s) => (
                              <button key={s} className="text-[10px] border border-zinc-700 rounded px-2 py-1" onClick={() => setLeadStatus(lead.id, s)}>{s}</button>
                            ))}
                            {stage !== 'closed' && <button className="text-[10px] border border-zinc-700 rounded px-2 py-1" onClick={() => addCloseFromLead(lead)}>close +$100</button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'tasks' && (
            <div className="rounded-xl border border-zinc-800 bg-[#0b0f16] p-4 space-y-3">
              <h2 className="font-semibold">Tasks</h2>
              <div className="flex gap-2">
                <input className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" placeholder="Add task" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
                <button className="rounded-lg bg-white text-black px-3" onClick={addTask}>Add</button>
              </div>
              {tasks.map(t => (
                <div key={t.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 flex items-center justify-between">
                  <span className={t.done ? 'line-through text-zinc-500' : ''}>{t.title}</span>
                  <button className="text-xs underline" onClick={() => toggleTask(t.id, t.done)}>{t.done ? 'Undo' : 'Done'}</button>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'habits' && (
            <div className="rounded-xl border border-zinc-800 bg-[#0b0f16] p-4 space-y-3">
              <h2 className="font-semibold">Habits</h2>
              <div className="grid gap-2 md:grid-cols-3">
                <input className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" placeholder="Habit name" value={habitName} onChange={(e) => setHabitName(e.target.value)} />
                <input className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" type="number" placeholder="Target" value={habitTarget} onChange={(e) => setHabitTarget(e.target.value)} />
                <button className="rounded-lg bg-white text-black px-3 py-2" onClick={addHabit}>Add Habit</button>
              </div>
              {habits.map((h) => (
                <div key={h.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p>{h.name}</p><p className="text-xs text-zinc-400">{h.streak}/{h.target}</p>
                  </div>
                  <div className="h-2 rounded bg-zinc-800"><div className="h-2 rounded bg-zinc-200" style={{ width: `${Math.min(100, (h.streak / Math.max(1, h.target)) * 100)}%` }} /></div>
                  <div className="flex flex-wrap gap-2">
                    <button className="text-xs border border-zinc-700 rounded px-2 py-1" onClick={() => updateHabit(h.id, { streak: h.streak + 1 })}>+1</button>
                    <button className="text-xs border border-zinc-700 rounded px-2 py-1" onClick={() => updateHabit(h.id, { streak: 0 })}>Reset</button>
                    <button className="text-xs border border-zinc-700 rounded px-2 py-1" onClick={() => updateHabit(h.id, { target: h.target + 5 })}>Target +5</button>
                    <button className="text-xs border border-zinc-700 rounded px-2 py-1" onClick={() => removeHabit(h.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'kpis' && (
            <div className="rounded-xl border border-zinc-800 bg-[#0b0f16] p-4 space-y-3">
              <h2 className="font-semibold">Custom KPIs</h2>
              <div className="grid gap-2 md:grid-cols-4">
                <input className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" placeholder="KPI Label" value={kpiLabel} onChange={(e) => setKpiLabel(e.target.value)} />
                <input className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" placeholder="Value" value={kpiValue} onChange={(e) => setKpiValue(e.target.value)} />
                <button className="rounded-lg bg-white text-black px-3 py-2" onClick={addKpi}>Add KPI</button>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                {kpis.map((k) => (
                  <div key={k.id} className="rounded-xl border border-zinc-800 bg-zinc-950 p-3 space-y-2">
                    <p className="text-xs uppercase tracking-wide text-zinc-400">{k.label}</p>
                    <input className="w-full rounded border border-zinc-700 bg-[#090c12] px-2 py-1 text-sm" defaultValue={k.value} onBlur={(e) => updateKpi(k.id, e.target.value)} />
                    <button className="text-xs underline text-zinc-400" onClick={() => removeKpi(k.id)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'checkins' && (
            <div className="rounded-xl border border-zinc-800 bg-[#0b0f16] p-4 space-y-3">
              <h2 className="font-semibold">Daily Check-ins</h2>
              <div className="flex gap-2">
                <input className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2" placeholder="Win/loss note" value={checkinText} onChange={(e) => setCheckinText(e.target.value)} />
                <button className="rounded-lg bg-white text-black px-3" onClick={addCheckin}>Log</button>
              </div>
              {checkins.map((c) => (
                <div key={c.id} className="rounded-lg border border-zinc-800 bg-zinc-950 p-3">
                  <p className="text-sm">{c.note}</p>
                  <p className="text-xs text-zinc-500 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {commandOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-start pt-24" onClick={() => setCommandOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-zinc-700 bg-[#0b0f16] p-2" onClick={(e) => e.stopPropagation()}>
            <div className="px-3 py-2 text-xs text-zinc-400">Quick Actions</div>
            <div className="space-y-1">
              <CmdItem label="Go to Overview" onClick={() => quickAction('tab:overview')} />
              <CmdItem label="Go to Pipeline" onClick={() => quickAction('tab:pipeline')} />
              <CmdItem label="Go to Tasks" onClick={() => quickAction('tab:tasks')} />
              <CmdItem label="Go to Habits" onClick={() => quickAction('tab:habits')} />
              <CmdItem label="Go to KPIs" onClick={() => quickAction('tab:kpis')} />
              <CmdItem label="Go to Check-ins" onClick={() => quickAction('tab:checkins')} />
              <CmdItem label="Toggle Compact Mode" onClick={() => quickAction('toggle-density')} />
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

function CmdItem({ label, onClick }) {
  return <button className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-900" onClick={onClick}>{label}</button>
}
