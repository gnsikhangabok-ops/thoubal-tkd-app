import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'

const BELT_RANKS = [
  'white', 'yellow', 'green', 'blue', 'red',
  'black_1', 'black_2', 'black_3', 'black_4_plus',
]
const BELT_LABELS = {
  white: 'White Belt', yellow: 'Yellow Belt', green: 'Green Belt',
  blue: 'Blue Belt', red: 'Red Belt', black_1: 'Black Belt 1st Dan',
  black_2: 'Black Belt 2nd Dan', black_3: 'Black Belt 3rd Dan', black_4_plus: 'Black Belt 4th Dan+',
}

const emptyEventForm = { id: null, title: '', exam_date: '', location: '' }
const emptyResultForm = {
  id: null, student_id: '', from_belt: 'white', to_belt: 'yellow',
  passed: true, remarks: '', certificate_url: '',
}

export default function BeltExams() {
  const [events, setEvents] = useState([])
  const [students, setStudents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [eventForm, setEventForm] = useState(emptyEventForm)
  const [showEventForm, setShowEventForm] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)

  const [resultForm, setResultForm] = useState(emptyResultForm)
  const [showResultForm, setShowResultForm] = useState(false)
  const [savingResult, setSavingResult] = useState(false)

  useEffect(() => {
    loadEvents()
    loadStudents()
  }, [])

  useEffect(() => {
    if (selectedEvent) loadResults(selectedEvent.id)
  }, [selectedEvent])

  async function loadEvents() {
    setLoading(true)
    const { data, error } = await supabase
      .from('grading_events')
      .select('*')
      .order('exam_date', { ascending: false })

    if (error) setError(error.message)
    else setEvents(data)
    setLoading(false)
  }

  async function loadStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, current_belt')
      .eq('active', true)
      .order('full_name')

    if (error) setError((prev) => prev || error.message)
    else setStudents(data)
  }

  async function loadResults(eventId) {
    const { data, error } = await supabase
      .from('grading_results')
      .select('*, students(full_name)')
      .eq('grading_event_id', eventId)
      .order('created_at', { ascending: true })

    if (error) setError(error.message)
    else setResults(data)
  }

  function openAddEvent() {
    setEventForm(emptyEventForm)
    setShowEventForm(true)
  }

  function openEditEvent(ev) {
    setEventForm({ id: ev.id, title: ev.title, exam_date: ev.exam_date, location: ev.location || '' })
    setShowEventForm(true)
  }

  async function handleEventSubmit(e) {
    e.preventDefault()
    setSavingEvent(true)
    setError('')

    const payload = { title: eventForm.title, exam_date: eventForm.exam_date, location: eventForm.location || null }
    const { error } = eventForm.id
      ? await supabase.from('grading_events').update(payload).eq('id', eventForm.id)
      : await supabase.from('grading_events').insert(payload)

    setSavingEvent(false)
    if (error) {
      setError(error.message)
    } else {
      setShowEventForm(false)
      loadEvents()
    }
  }

  function openAddResult() {
    setResultForm(emptyResultForm)
    setShowResultForm(true)
  }

  async function handleResultSubmit(e) {
    e.preventDefault()
    setSavingResult(true)
    setError('')

    const payload = {
      grading_event_id: selectedEvent.id,
      student_id: resultForm.student_id,
      from_belt: resultForm.from_belt,
      to_belt: resultForm.to_belt,
      passed: resultForm.passed,
      remarks: resultForm.remarks || null,
      certificate_url: resultForm.certificate_url || null,
    }

    const { error } = await supabase.from('grading_results').insert(payload)

    setSavingResult(false)
    if (error) {
      setError(error.message)
    } else {
      // If passed, update student's current belt
      if (resultForm.passed) {
        await supabase
          .from('students')
          .update({ current_belt: resultForm.to_belt })
          .eq('id', resultForm.student_id)
        loadStudents()
      }
      setShowResultForm(false)
      loadResults(selectedEvent.id)
    }
  }

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
              <h1>Belt Exams</h1>
              <button className="btn btn-primary" onClick={openAddEvent}>+ New Grading Event</button>
            </div>
            <p className="dash-lede">Schedule grading events and record student results.</p>

            {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

            {showEventForm && (
              <div className="module-card" style={{ marginBottom: 28, maxWidth: 480 }}>
                <h3 style={{ marginBottom: 16 }}>{eventForm.id ? 'Edit Grading Event' : 'New Grading Event'}</h3>
                <form onSubmit={handleEventSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <input
                    type="text" placeholder="Title (e.g. Autumn Grading 2026)" required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  />
                  <input
                    type="date" required
                    value={eventForm.exam_date}
                    onChange={(e) => setEventForm({ ...eventForm, exam_date: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  />
                  <input
                    type="text" placeholder="Location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
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
              <p style={{ color: 'var(--charcoal)' }}>No grading events yet. Create one above.</p>
            ) : (
              <div className="module-grid">
                {events.map((ev) => (
                  <div className="module-card" key={ev.id} style={{ cursor: 'pointer' }} onClick={() => setSelectedEvent(ev)}>
                    <h3>{ev.title}</h3>
                    <p>{ev.exam_date}</p>
                    {ev.location && <p style={{ fontSize: '0.85rem' }}>{ev.location}</p>}
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
              ← All Grading Events
            </button>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
              <h1>{selectedEvent.title}</h1>
              <button className="btn btn-primary" onClick={openAddResult}>+ Add Result</button>
            </div>
            <p className="dash-lede">{selectedEvent.exam_date} {selectedEvent.location ? `· ${selectedEvent.location}` : ''}</p>

            {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

            {showResultForm && (
              <div className="module-card" style={{ marginBottom: 28, maxWidth: 480 }}>
                <h3 style={{ marginBottom: 16 }}>Add Result</h3>
                <form onSubmit={handleResultSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <select
                    required
                    value={resultForm.student_id}
                    onChange={(e) => {
                      const student = students.find((s) => s.id === e.target.value)
                      setResultForm({
                        ...resultForm,
                        student_id: e.target.value,
                        from_belt: student?.current_belt || 'white',
                      })
                    }}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  >
                    <option value="">— Select student —</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.id}>{s.full_name} ({BELT_LABELS[s.current_belt]})</option>
                    ))}
                  </select>

                  <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>From belt</label>
                      <select
                        value={resultForm.from_belt}
                        onChange={(e) => setResultForm({ ...resultForm, from_belt: e.target.value })}
                        style={{ padding: 10, border: '1px solid var(--line)', width: '100%' }}
                      >
                        {BELT_RANKS.map((b) => <option key={b} value={b}>{BELT_LABELS[b]}</option>)}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', display: 'block', marginBottom: 4 }}>To belt</label>
                      <select
                        value={resultForm.to_belt}
                        onChange={(e) => setResultForm({ ...resultForm, to_belt: e.target.value })}
                        style={{ padding: 10, border: '1px solid var(--line)', width: '100%' }}
                      >
                        {BELT_RANKS.map((b) => <option key={b} value={b}>{BELT_LABELS[b]}</option>)}
                      </select>
                    </div>
                  </div>

                  <label style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={resultForm.passed}
                      onChange={(e) => setResultForm({ ...resultForm, passed: e.target.checked })}
                    />
                    Passed (updates student's current belt automatically)
                  </label>

                  <textarea
                    placeholder="Remarks"
                    rows={2}
                    value={resultForm.remarks}
                    onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)', fontFamily: 'inherit' }}
                  />
                  <input
                    type="text" placeholder="Certificate URL (optional, add after upload)"
                    value={resultForm.certificate_url}
                    onChange={(e) => setResultForm({ ...resultForm, certificate_url: e.target.value })}
                    style={{ padding: 10, border: '1px solid var(--line)' }}
                  />

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" className="btn btn-primary" disabled={savingResult}>
                      {savingResult ? 'Saving…' : 'Save Result'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setShowResultForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {results.length === 0 ? (
              <p style={{ color: 'var(--charcoal)' }}>No results recorded for this event yet.</p>
            ) : (
              <div className="module-grid">
                {results.map((r) => (
                  <div className="module-card" key={r.id} style={{ borderTopColor: r.passed ? 'var(--red)' : '#ccc' }}>
                    <h3>{r.students?.full_name}</h3>
                    <p>{BELT_LABELS[r.from_belt]} → {BELT_LABELS[r.to_belt]}</p>
                    <p style={{ fontSize: '0.85rem', color: r.passed ? 'var(--red)' : '#999', marginTop: 6 }}>
                      {r.passed ? 'Passed' : 'Did not pass'}
                    </p>
                    {r.remarks && <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{r.remarks}</p>}
                    {r.certificate_url && (
                      <a href={r.certificate_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', textDecoration: 'underline', display: 'block', marginTop: 6 }}>
                        View Certificate
                      </a>
                    )}
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
