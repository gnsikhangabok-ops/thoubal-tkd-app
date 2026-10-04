import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText, byDateDesc, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable, { StatusPill } from '../../../components/DataTable'
import { moduleTabs } from '../../../lib/moduleTabs'

const EVENT_TYPES = ['tournament', 'grading', 'seminar', 'internal']
const MEDALS = ['gold', 'silver', 'bronze', 'none']
const MEDAL_COLOR = { gold: '#D4A537', silver: '#A8A8A8', bronze: '#B08D57', none: '#ccc' }

const emptyEventForm = {
  id: null, title: '', event_type: 'tournament', event_date: '', location: '', description: '', registration_deadline: '',
}


export default function Events() {
  const [events, setEvents] = useState([])
  const [students, setStudents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [registrations, setRegistrations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [eventForm, setEventForm] = useState(emptyEventForm)
  const [showEventForm, setShowEventForm] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)

  const [showRegForm, setShowRegForm] = useState(false)
  const [regStudentId, setRegStudentId] = useState('')
  const [savingReg, setSavingReg] = useState(false)

  useEffect(() => {
    loadEvents()
    loadStudents()
  }, [])

  useEffect(() => {
    if (selectedEvent) loadRegistrations(selectedEvent.id)
  }, [selectedEvent])

  async function loadEvents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false })

    if (error) setError(error.message)
    else setEvents(data)
    setLoading(false)
  }

  async function loadStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name')
      .eq('active', true)
      .order('full_name')

    if (error) setError((prev) => prev || error.message)
    else setStudents(data)
  }

  async function loadRegistrations(eventId) {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*, students(full_name)')
      .eq('event_id', eventId)
      .order('registered_on', { ascending: true })

    if (error) setError(error.message)
    else setRegistrations(data)
  }

  function openAddEvent() {
    setEventForm(emptyEventForm)
    setShowEventForm(true)
  }

  function openEditEvent(ev) {
    setEventForm({
      id: ev.id, title: ev.title, event_type: ev.event_type, event_date: ev.event_date,
      location: ev.location || '', description: ev.description || '',
      registration_deadline: ev.registration_deadline || '',
    })
    setShowEventForm(true)
  }

  async function handleEventSubmit(e) {
    e.preventDefault()
    setSavingEvent(true)
    setError('')

    const payload = {
      title: eventForm.title,
      event_type: eventForm.event_type,
      event_date: eventForm.event_date,
      location: eventForm.location || null,
      description: eventForm.description || null,
      registration_deadline: eventForm.registration_deadline || null,
    }

    const { error } = eventForm.id
      ? await supabase.from('events').update(payload).eq('id', eventForm.id)
      : await supabase.from('events').insert(payload)

    setSavingEvent(false)
    if (error) {
      setError(error.message)
    } else {
      setShowEventForm(false)
      loadEvents()
    }
  }

  async function handleRegSubmit(e) {
    e.preventDefault()
    setSavingReg(true)
    setError('')

    const { error } = await supabase.from('event_registrations').insert({
      event_id: selectedEvent.id,
      student_id: regStudentId,
    })

    setSavingReg(false)
    if (error) {
      setError(error.message)
    } else {
      setShowRegForm(false)
      setRegStudentId('')
      loadRegistrations(selectedEvent.id)
    }
  }

  async function updateResult(reg, field, value) {
    const { error } = await supabase
      .from('event_registrations')
      .update({ [field]: value })
      .eq('id', reg.id)

    if (error) setError(error.message)
    else loadRegistrations(selectedEvent.id)
  }

  const registeredIds = new Set(registrations.map((r) => r.student_id))
  const availableStudents = students.filter((s) => !registeredIds.has(s.id))


  const list = useListTools(events, {
    search: (e) => [e.title, e.location, e.event_type, e.description],
    filters: {
      type: (e) => e.event_type,
      when: (e) => (e.event_date >= new Date().toISOString().slice(0, 10) ? 'upcoming' : 'past'),
    },
    sorts: { newest: byDateDesc((e) => e.event_date), title: byText((e) => e.title) },
    defaultSort: 'newest',
  })

  function handleExport() {
    exportCsv('events', list.result, [
      { label: 'Date', value: (e) => e.event_date },
      { label: 'Title', value: (e) => e.title },
      { label: 'Type', value: (e) => e.event_type },
      { label: 'Location', value: (e) => e.location },
      { label: 'Registration deadline', value: (e) => e.registration_deadline },
    ])
  }

  const tabs = moduleTabs(list, 'when', [['', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past']])
  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      {!selectedEvent ? (
        <>
          <ModuleHeader
            title="Events"
            description="Tournaments, seminars, and internal events."
            actions={<button className={btnPrimary} onClick={openAddEvent}>+ New event</button>}
            tabs={tabs.items}
            activeTab={tabs.active}
            onTabChange={tabs.select}
          />

          {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

          {showEventForm && (
            <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[480px]">
              <h3 className="font-semibold text-base text-heading mb-4">{eventForm.id ? 'Edit Event' : 'New Event'}</h3>
              <form onSubmit={handleEventSubmit} className="flex flex-col gap-3">
                <input
                  type="text" placeholder="Event title" required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className={inputCls}
                />
                <select
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                  className={`${inputCls} capitalize`}
                >
                  {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <input
                  type="date" required
                  value={eventForm.event_date}
                  onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                  className={inputCls}
                />
                <input
                  type="text" placeholder="Location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className={inputCls}
                />
                <label className="text-[0.8rem]">Registration deadline</label>
                <input
                  type="date"
                  value={eventForm.registration_deadline}
                  onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })}
                  className={inputCls}
                />
                <textarea
                  placeholder="Description"
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className={`${inputCls} font-body`}
                />
                <div className="flex gap-2.5">
                  <button type="submit" className={btnPrimary} disabled={savingEvent}>
                    {savingEvent ? 'Saving…' : 'Save'}
                  </button>
                  <button type="button" className={btnOutline} onClick={() => setShowEventForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <ListToolbar
            list={list}
            placeholder="Search event, location…"
            printTitle="Events"
            onExport={handleExport}
            filters={[
              { key: 'type', label: 'Type', options: opts(EVENT_TYPES) },
            ]}
            sorts={[{ key: 'newest', label: 'Latest date first' }, { key: 'title', label: 'Title A–Z' }]}
          />

          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : (
            <DataTable
              caption="Events"
              rows={list.result}
              onRowClick={setSelectedEvent}
              empty={list.total === 0 ? 'No events yet. Create one above.' : 'Nothing in this view.'}
              columns={[
              { key: 'title', header: 'Event', primary: true, width: '34%', sortValue: (e) => e.title, render: (e) => <strong className="text-heading">{e.title}</strong> },
              { key: 'date', header: 'Date', sortValue: (e) => e.event_date, render: (e) => <span className="tabular-nums whitespace-nowrap">{e.event_date || '—'}</span> },
              { key: 'type', header: 'Type', sortValue: (e) => e.event_type, render: (e) => <span className="capitalize">{e.event_type || '—'}</span> },
              { key: 'location', header: 'Venue', sortValue: (e) => e.location, render: (e) => e.location || '—' },
              { key: 'when', header: 'Status', render: (e) => (e.event_date >= new Date().toISOString().slice(0, 10) ? <StatusPill tone="info">Upcoming</StatusPill> : <StatusPill>Completed</StatusPill>) },
              ]}
              actions={(ev) => <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditEvent(ev)}>Edit</button>}
            />
          )}
        </>
      ) : (
        <>
          <ModuleHeader
            title={selectedEvent.title}
            description={`${selectedEvent.event_type} · ${selectedEvent.event_date}${selectedEvent.location ? ` · ${selectedEvent.location}` : ''}`}
            crumbs={[{ label: selectedEvent.title }]}
            actions={<><button className={btnOutline} onClick={() => setSelectedEvent(null)}>← All events</button><button className={btnPrimary} onClick={() => setShowRegForm(true)}>+ Register student</button></>}
          />

          {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

          {showRegForm && (
            <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[420px]">
              <h3 className="font-semibold text-base text-heading mb-4">Register Student</h3>
              <form onSubmit={handleRegSubmit} className="flex flex-col gap-3">
                <select
                  required
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">— Select student —</option>
                  {availableStudents.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
                <div className="flex gap-2.5">
                  <button type="submit" className={btnPrimary} disabled={savingReg}>
                    {savingReg ? 'Registering…' : 'Register'}
                  </button>
                  <button type="button" className={btnOutline} onClick={() => setShowRegForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          <DataTable
            caption="Registered students"
            rows={registrations}
            rowAccent={(r) => (r.medal ? MEDAL_COLOR[r.medal] : 'var(--color-pay-line)')}
            empty="No students registered for this event yet."
            columns={[
              { key: 'student', header: 'Student', primary: true, width: '30%', sortValue: (r) => r.students?.full_name, render: (r) => <strong className="text-heading">{r.students?.full_name}</strong> },
              { key: 'result', header: 'Result',
                render: (r) => (
                  <input
                    type="text" placeholder="e.g. Semifinal" aria-label={`Result for ${r.students?.full_name}`}
                    defaultValue={r.result || ''}
                    onBlur={(e) => updateResult(r, 'result', e.target.value || null)}
                    className="w-full max-w-[220px] rounded-lg border border-pay-line bg-surface px-2 py-1 text-sm"
                  />
                ) },
              { key: 'medal', header: 'Medal', sortValue: (r) => MEDALS.indexOf(r.medal || 'none'),
                render: (r) => (
                  <select
                    value={r.medal || 'none'} aria-label={`Medal for ${r.students?.full_name}`}
                    onChange={(e) => updateResult(r, 'medal', e.target.value === 'none' ? null : e.target.value)}
                    className="rounded-lg border border-pay-line bg-surface px-2 py-1 text-sm capitalize"
                  >
                    {MEDALS.map((m) => <option key={m} value={m}>{m === 'none' ? 'No medal' : m}</option>)}
                  </select>
                ) },
            ]}
          />
        </>
      )}
    </div>
  )
}
