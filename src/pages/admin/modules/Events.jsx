import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import '../../../styles/site.css'

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

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        {!selectedEvent ? (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
              <h1>Events</h1>
              <button className="btn btn-primary" onClick={openAddEvent}>+ New Event</button>
            </div>
            <p className="dash-lede">Tournaments, seminars, and internal events.</p>

            {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

            {showEventForm && (
              <div className="module-card" style={{ marginBottom: 28, maxWidth: 480 }}>
                <h3 style={{ marginBottom: 16 }}>{eventForm.id ? 'Edit Event' : 'New Event'}</h3>
                <form onSubmit={handleEventSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="text" placeholder="Event title" required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  />
                  <select
                    value={eventForm.event_type}
                    onChange={(e) => setEventForm({ ...eventForm, event_type: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)', textTransform: 'capitalize' }}
                  >
                    {EVENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    type="date" required
                    value={eventForm.event_date}
                    onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  />
                  <input
                    type="text" placeholder="Location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  />
                  <label style={{ fontSize: '0.8rem' }}>Registration deadline</label>
                  <input
                    type="date"
                    value={eventForm.registration_deadline}
                    onChange={(e) => setEventForm({ ...eventForm, registration_deadline: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  />
                  <textarea
                    placeholder="Description"
                    rows={3}
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)', fontFamily: 'inherit' }}
                  />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" disabled={savingEvent}>
                      {savingEvent ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowEventForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <p>Loading…</p>
            ) : events.length === 0 ? (
              <p style={{ color: 'var(--charcoal)' }}>No events yet. Create one above.</p>
            ) : (
              <div className="module-grid">
                {events.map((ev) => (
                  <div className="module-card" key={ev.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedEvent(ev)}>
                    <h3>{ev.title}</h3>
                    <p style={{ textTransform: 'capitalize' }}>{ev.event_type}</p>
                    <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{ev.event_date} {ev.location ? `· ${ev.location}` : ''}</p>
                    <div style={{ marginTop: 12 }}>
                      <button
                        className="btn btn-outline"
                        style={{ fontSize: '0.75rem', padding: '6px 12px' }}
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
            <button className="btn btn-outline" style={{ marginBottom: 20 }} onClick={() => setSelectedEvent(null)}>
              ← All Events
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
              <h1>{selectedEvent.title}</h1>
              <button className="btn btn-primary" onClick={() => setShowRegForm(true)}>+ Register Student</button>
            </div>
            <p className="dash-lede" style={{ textTransform: 'capitalize' }}>
              {selectedEvent.event_type} · {selectedEvent.event_date} {selectedEvent.location ? `· ${selectedEvent.location}` : ''}
            </p>

            {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

            {showRegForm && (
              <div className="module-card" style={{ marginBottom: 28, maxWidth: 420 }}>
                <h3 style={{ marginBottom: 16 }}>Register Student</h3>
                <form onSubmit={handleRegSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <select
                    required
                    value={regStudentId}
                    onChange={(e) => setRegStudentId(e.target.value)}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  >
                    <option value="">— Select student —</option>
                    {availableStudents.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" disabled={savingReg}>
                      {savingReg ? 'Registering…' : 'Register'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowRegForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {registrations.length === 0 ? (
              <p style={{ color: 'var(--charcoal)' }}>No students registered for this event yet.</p>
            ) : (
              <div className="module-grid">
                {registrations.map((r) => (
                  <div className="module-card" key={r.id} style={{ borderTopColor: r.medal ? MEDAL_COLOR[r.medal] : '#ccc' }}>
                    <h3>{r.students?.full_name}</h3>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>Result</label>
                        <input
                          type="text" placeholder="e.g. Semifinal"
                          defaultValue={r.result || ''}
                          onBlur={(e) => updateResult(r, 'result', e.target.value || null)}
                          style={{ padding: 8, border: '1px solid var(--line)', fontSize: '0.85rem', width: '100%' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 120 }}>
                        <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: 4 }}>Medal</label>
                        <select
                          value={r.medal || 'none'}
                          onChange={(e) => updateResult(r, 'medal', e.target.value === 'none' ? null : e.target.value)}
                          style={{ padding: 8, border: '1px solid var(--line)', fontSize: '0.85rem', width: '100%', textTransform: 'capitalize' }}
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
    </div>
  )
}
