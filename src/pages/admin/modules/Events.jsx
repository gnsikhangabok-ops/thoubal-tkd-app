import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

const EVENT_TYPES = ['tournament', 'grading', 'seminar', 'internal']
const MEDALS = ['gold', 'silver', 'bronze', 'none']
const MEDAL_COLOR = { gold: '#D4A537', silver: '#A8A8A8', bronze: '#B08D57', none: '#ccc' }

const emptyEventForm = {
  id: null, title: '', event_type: 'tournament', event_date: '', location: '', description: '', registration_deadline: '',
}

const inputCls = "px-2.5 py-2.5 border border-black/10"
const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"
const btnSm = "text-[0.75rem] px-3 py-1.5"

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

  return (
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      {!selectedEvent ? (
        <>
          <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
            <h1 className="font-display text-ink uppercase text-3xl">Events</h1>
            <button className={btnPrimary} onClick={openAddEvent}>+ New Event</button>
          </div>
          <p className="text-charcoal mb-9">Tournaments, seminars, and internal events.</p>

          {error && <p className="text-brand-red mb-4">{error}</p>}

          {showEventForm && (
            <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-7 max-w-[480px]">
              <h3 className="font-semibold text-base text-ink mb-4">{eventForm.id ? 'Edit Event' : 'New Event'}</h3>
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

          {loading ? (
            <p>Loading…</p>
          ) : events.length === 0 ? (
            <p className="text-charcoal">No events yet. Create one above.</p>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 cursor-pointer"
                  onClick={() => setSelectedEvent(ev)}
                >
                  <h3 className="font-semibold text-base text-ink mb-1.5">{ev.title}</h3>
                  <p className="text-sm text-charcoal capitalize">{ev.event_type}</p>
                  <p className="text-[0.85rem] mt-1.5">{ev.event_date} {ev.location ? `· ${ev.location}` : ''}</p>
                  <div className="mt-3">
                    <button
                      className={`${btnOutline} ${btnSm}`}
                      onClick={(e) => { e.stopPropagation(); openEditEvent(ev) }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <button className={`${btnOutline} mb-5`} onClick={() => setSelectedEvent(null)}>
            ← All Events
          </button>
          <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
            <h1 className="font-display text-ink uppercase text-3xl">{selectedEvent.title}</h1>
            <button className={btnPrimary} onClick={() => setShowRegForm(true)}>+ Register Student</button>
          </div>
          <p className="text-charcoal mb-9 capitalize">
            {selectedEvent.event_type} · {selectedEvent.event_date} {selectedEvent.location ? `· ${selectedEvent.location}` : ''}
          </p>

          {error && <p className="text-brand-red mb-4">{error}</p>}

          {showRegForm && (
            <div className="bg-white border border-black/10 border-t-[3px] border-t-brand-red p-6 mb-7 max-w-[420px]">
              <h3 className="font-semibold text-base text-ink mb-4">Register Student</h3>
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

          {registrations.length === 0 ? (
            <p className="text-charcoal">No students registered for this event yet.</p>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {registrations.map((r) => (
                <div
                  key={r.id}
                  className="bg-white border border-black/10 p-6"
                  style={{ borderTopWidth: 3, borderTopColor: r.medal ? MEDAL_COLOR[r.medal] : '#ccc' }}
                >
                  <h3 className="font-semibold text-base text-ink mb-1.5">{r.students?.full_name}</h3>
                  <div className="flex gap-2 mt-2.5 flex-wrap">
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[0.75rem] block mb-1">Result</label>
                      <input
                        type="text" placeholder="e.g. Semifinal"
                        defaultValue={r.result || ''}
                        onBlur={(e) => updateResult(r, 'result', e.target.value || null)}
                        className="px-2 py-2 border border-black/10 text-[0.85rem] w-full"
                      />
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="text-[0.75rem] block mb-1">Medal</label>
                      <select
                        value={r.medal || 'none'}
                        onChange={(e) => updateResult(r, 'medal', e.target.value === 'none' ? null : e.target.value)}
                        className="px-2 py-2 border border-black/10 text-[0.85rem] w-full capitalize"
                      >
                        {MEDALS.map((m) => <option key={m} value={m}>{m === 'none' ? 'No medal' : m}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
