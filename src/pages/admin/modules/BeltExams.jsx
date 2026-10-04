import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls, btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { BELT_RANKS, BELT_LABELS } from '../../../lib/belts'
import { useListTools, exportCsv, byText, byDateDesc } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import DocumentModal from '../../../components/docs/DocumentModal'
import BeltCertificate from '../../../components/docs/BeltCertificate'
import { Award } from 'lucide-react'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable, { StatusPill } from '../../../components/DataTable'
import { moduleTabs } from '../../../lib/moduleTabs'

const emptyEventForm = { id: null, title: '', exam_date: '', location: '' }
const emptyResultForm = {
  id: null, student_id: '', from_belt: 'white', to_belt: 'yellow',
  passed: true, remarks: '', certificate_url: '',
}


export default function BeltExams() {
  const [events, setEvents] = useState([])
  const [students, setStudents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [certificateFor, setCertificateFor] = useState(null)
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


  const list = useListTools(events, {
    search: (e) => [e.title, e.location],
    filters: { when: (e) => (e.exam_date >= new Date().toISOString().slice(0, 10) ? 'upcoming' : 'past') },
    sorts: { newest: byDateDesc((e) => e.exam_date), title: byText((e) => e.title) },
    defaultSort: 'newest',
  })

  function handleExport() {
    exportCsv('belt-exams', list.result, [
      { label: 'Exam date', value: (e) => e.exam_date },
      { label: 'Title', value: (e) => e.title },
      { label: 'Location', value: (e) => e.location },
    ])
  }

  const tabs = moduleTabs(list, 'when', [['', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past']])
  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      {!selectedEvent ? (
        <>
          <ModuleHeader
            title="Belt Exams"
            description="Schedule grading events and record student results."
            actions={<button className={btnPrimary} onClick={openAddEvent}>+ New grading event</button>}
            tabs={tabs.items}
            activeTab={tabs.active}
            onTabChange={tabs.select}
          />

          {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

          {showEventForm && (
            <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[480px]">
              <h3 className="font-semibold text-base text-heading mb-4">{eventForm.id ? 'Edit Grading Event' : 'New Grading Event'}</h3>
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

          <ListToolbar
            list={list}
            placeholder="Search exam, location…"
            printTitle="Belt Exams"
            onExport={handleExport}
            sorts={[{ key: 'newest', label: 'Latest date first' }, { key: 'title', label: 'Title A–Z' }]}
          />

          {loading ? (
            <p className="text-muted">Loading…</p>
          ) : (
            <DataTable
              caption="Belt Exams"
              rows={list.result}
              onRowClick={setSelectedEvent}
              empty={list.total === 0 ? 'No grading events yet. Create one above.' : 'Nothing in this view.'}
              columns={[
              { key: 'title', header: 'Grading event', primary: true, width: '34%', sortValue: (e) => e.title, render: (e) => <strong className="text-heading">{e.title}</strong> },
              { key: 'date', header: 'Date', sortValue: (e) => e.exam_date, render: (e) => <span className="tabular-nums whitespace-nowrap">{e.exam_date || '—'}</span> },
              { key: 'location', header: 'Venue', sortValue: (e) => e.location, render: (e) => e.location || '—' },
              { key: 'when', header: 'Status', render: (e) => (e.exam_date >= new Date().toISOString().slice(0, 10) ? <StatusPill tone="info">Upcoming</StatusPill> : <StatusPill>Completed</StatusPill>) },
              ]}
              actions={(ev) => <button className={`${btnOutline} ${btnSm}`} onClick={() => openEditEvent(ev)}>Edit</button>}
            />
          )}
        </>
      ) : (
        <>
          <ModuleHeader
            title={selectedEvent.title}
            description={`${selectedEvent.exam_date}${selectedEvent.location ? ` · ${selectedEvent.location}` : ''}`}
            crumbs={[{ label: selectedEvent.title }]}
            actions={<><button className={btnOutline} onClick={() => setSelectedEvent(null)}>← All grading events</button><button className={btnPrimary} onClick={openAddResult}>+ Add result</button></>}
          />

          {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

          {showResultForm && (
            <div className="bg-surface rounded-2xl shadow-card p-6 mb-7 max-w-[480px]">
              <h3 className="font-semibold text-base text-heading mb-4">Add Result</h3>
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

          <DataTable
            caption="Results"
            rows={results}
            rowAccent={(r) => (r.passed ? 'var(--status-ok)' : 'var(--status-bad)')}
            empty="No results recorded for this event yet."
            columns={[
              { key: 'student', header: 'Student', primary: true, width: '26%', sortValue: (r) => r.students?.full_name, render: (r) => <strong className="text-heading">{r.students?.full_name}</strong> },
              { key: 'promotion', header: 'Promotion', render: (r) => <span className="whitespace-nowrap">{BELT_LABELS[r.from_belt]} → {BELT_LABELS[r.to_belt]}</span> },
              { key: 'result', header: 'Result', sortValue: (r) => (r.passed ? 0 : 1), render: (r) => <StatusPill tone={r.passed ? 'ok' : 'bad'}>{r.passed ? 'Passed' : 'Not passed'}</StatusPill> },
              { key: 'remarks', header: 'Remarks', render: (r) => r.remarks || '—' },
            ]}
            actions={(r) => (
              <>
                {r.certificate_url && <a href={r.certificate_url} target="_blank" rel="noreferrer" className={`${btnOutline} ${btnSm}`}>Uploaded</a>}
                {r.passed && <button className={`${btnPrimary} ${btnSm}`} onClick={() => setCertificateFor(r)}><Award size={13} /> Certificate</button>}
              </>
            )}
          />
        </>
      )}
      {certificateFor && (
        <DocumentModal title={`Certificate — ${certificateFor.students?.full_name}`} size="a4-landscape" onClose={() => setCertificateFor(null)}>
          <BeltCertificate result={certificateFor} studentName={certificateFor.students?.full_name} exam={selectedEvent} />
        </DocumentModal>
      )}
    </div>
  )
}
