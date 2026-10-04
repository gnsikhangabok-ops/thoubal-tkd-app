import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'

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
    <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
      {!selectedEvent ? (
        <>
          <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
            <h1 className="text-2xl md:text-[1.7rem] font-bold text-pay-navy">Belt Exams</h1>
            <button className={btnPrimary} onClick={openAddEvent}>+ New Grading Event</button>
          </div>
          <p className="text-[#5B6B82] mb-8">Schedule grading events and record student results.</p>

          {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

          {showEventForm && (
            <div className="bg-white rounded-2xl shadow-card p-6 mb-7 max-w-[480px]">
              <h3 className="font-semibold text-base text-pay-navy mb-4">{eventForm.id ? 'Edit Grading Event' : 'New Grading Event'}</h3>
              <form onSubmit={handleEventSubmit} className="flex flex-col gap-3">
                <input
                  type="text" placeholder="Title (e.g. Autumn Grading 2026)" required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className={inputCls}
                />
                <input
                  type="date" required
                  value={eventForm.exam_date}
                  onChange={(e) => setEventForm({ ...eventForm, exam_date: e.target.value })}
                  className={inputCls}
                />
                <input
                  type="text" placeholder="Location"
                  value={eventForm.location}
                  onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                  className={inputCls}
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
            <p className="text-charcoal">No grading events yet. Create one above.</p>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {events.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-white rounded-2xl shadow-card p-6 cursor-pointer"
                  onClick={() => setSelectedEvent(ev)}
                >
                  <h3 className="font-semibold text-base text-pay-navy mb-1.5">{ev.title}</h3>
                  <p className="text-sm text-charcoal">{ev.exam_date}</p>
                  {ev.location && <p className="text-[0.85rem]">{ev.location}</p>}
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
            ← All Grading Events
          </button>
          <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
            <h1 className="text-2xl md:text-[1.7rem] font-bold text-pay-navy">{selectedEvent.title}</h1>
            <button className={btnPrimary} onClick={openAddResult}>+ Add Result</button>
          </div>
          <p className="text-[#5B6B82] mb-8">{selectedEvent.exam_date} {selectedEvent.location ? `· ${selectedEvent.location}` : ''}</p>

          {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

          {showResultForm && (
            <div className="bg-white rounded-2xl shadow-card p-6 mb-7 max-w-[480px]">
              <h3 className="font-semibold text-base text-pay-navy mb-4">Add Result</h3>
              <form onSubmit={handleResultSubmit} className="flex flex-col gap-3">
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
                  className={inputCls}
                >
                  <option value="">— Select student —</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({BELT_LABELS[s.current_belt]})</option>
                  ))}
                </select>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-[0.8rem] block mb-1">From belt</label>
                    <select
                      value={resultForm.from_belt}
                      onChange={(e) => setResultForm({ ...resultForm, from_belt: e.target.value })}
                      className={`${inputCls} w-full`}
                    >
                      {BELT_RANKS.map((b) => <option key={b} value={b}>{BELT_LABELS[b]}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="text-[0.8rem] block mb-1">To belt</label>
                    <select
                      value={resultForm.to_belt}
                      onChange={(e) => setResultForm({ ...resultForm, to_belt: e.target.value })}
                      className={`${inputCls} w-full`}
                    >
                      {BELT_RANKS.map((b) => <option key={b} value={b}>{BELT_LABELS[b]}</option>)}
                    </select>
                  </div>
                </div>

                <label className="text-sm flex items-center gap-2">
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
                  className={`${inputCls} font-body`}
                />
                <input
                  type="text" placeholder="Certificate URL (optional, add after upload)"
                  value={resultForm.certificate_url}
                  onChange={(e) => setResultForm({ ...resultForm, certificate_url: e.target.value })}
                  className={inputCls}
                />

                <div className="flex gap-2.5">
                  <button type="submit" className={btnPrimary} disabled={savingResult}>
                    {savingResult ? 'Saving…' : 'Save Result'}
                  </button>
                  <button type="button" className={btnOutline} onClick={() => setShowResultForm(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {results.length === 0 ? (
            <p className="text-charcoal">No results recorded for this event yet.</p>
          ) : (
            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
              {results.map((r) => (
                <div
                  key={r.id}
                  className="bg-white rounded-2xl shadow-card p-6"
                  style={{ borderLeftWidth: 4, borderLeftColor: r.passed ? '#047857' : '#ccc' }}
                >
                  <h3 className="font-semibold text-base text-pay-navy mb-1.5">{r.students?.full_name}</h3>
                  <p className="text-sm text-charcoal">{BELT_LABELS[r.from_belt]} → {BELT_LABELS[r.to_belt]}</p>
                  <p className="text-[0.85rem] mt-1.5" style={{ color: r.passed ? '#047857' : '#999' }}>
                    {r.passed ? 'Passed' : 'Did not pass'}
                  </p>
                  {r.remarks && <p className="text-[0.85rem] mt-1.5">{r.remarks}</p>}
                  {r.certificate_url && (
                    <a href={r.certificate_url} target="_blank" rel="noreferrer" className="text-[0.8rem] underline block mt-1.5">
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
  )
}
