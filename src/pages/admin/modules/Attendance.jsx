import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { btnPrimary, btnOutline, btnSm, inputCls } from '../../../lib/adminUi'
import { CalendarCheck, Clock, ChevronRight } from 'lucide-react'
import { useListTools, exportCsv, byText } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable from '../../../components/DataTable'
import { moduleTabs } from '../../../lib/moduleTabs'
import PersonCell from '../../../components/PersonCell'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused']
const STATUS_COLOR = {
  present: 'var(--status-ok)',
  absent: 'var(--status-bad)',
  late: 'var(--status-warn)',
  excused: 'var(--color-subtle)',
}


export default function Attendance() {
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [sessionDate, setSessionDate] = useState(today())
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [existingRecords, setExistingRecords] = useState({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadBatches()
  }, [])

  useEffect(() => {
    if (selectedBatch) loadStudentsAndAttendance()
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- reload when the batch or date changes
  }, [selectedBatch, sessionDate])

  async function loadBatches() {
    const { data, error } = await supabase
      .from('batches')
      .select('id, name, schedule_days, start_time, end_time, training_centers(name)')
      .eq('active', true)
      .order('name')

    if (error) setError(error.message)
    else setBatches(data)
  }

  async function loadStudentsAndAttendance() {
    setLoading(true)
    setError('')
    setMessage('')

    const [studentRes, attendanceRes] = await Promise.all([
      supabase
        .from('students')
        .select('id, full_name')
        .eq('batch_id', selectedBatch)
        .eq('active', true)
        .order('full_name'),
      supabase
        .from('attendance')
        .select('*')
        .eq('batch_id', selectedBatch)
        .eq('session_date', sessionDate),
    ])

    if (studentRes.error) setError(studentRes.error.message)
    else setStudents(studentRes.data)

    if (attendanceRes.error) {
      setError((prev) => prev || attendanceRes.error.message)
    } else {
      const statusMap = {}
      const recordMap = {}
      attendanceRes.data.forEach((r) => {
        statusMap[r.student_id] = r.status
        recordMap[r.student_id] = r.id
      })
      const defaulted = { ...statusMap }
      studentRes.data?.forEach((s) => {
        if (!(s.id in defaulted)) defaulted[s.id] = 'present'
      })
      setAttendance(defaulted)
      setExistingRecords(recordMap)
    }

    setLoading(false)
  }

  function setStatus(studentId, status) {
    setAttendance((prev) => ({ ...prev, [studentId]: status }))
  }

  function markAll(status) {
    const next = {}
    students.forEach((s) => { next[s.id] = status })
    setAttendance(next)
  }

  async function handleSaveAll() {
    setSaving(true)
    setError('')
    setMessage('')

    const toUpdate = []
    const toInsert = []

    students.forEach((s) => {
      const status = attendance[s.id] || 'present'
      if (existingRecords[s.id]) {
        toUpdate.push({ id: existingRecords[s.id], status })
      } else {
        toInsert.push({
          student_id: s.id,
          batch_id: selectedBatch,
          session_date: sessionDate,
          status,
          marked_by: null,
        })
      }
    })

    let hadError = false

    if (toInsert.length > 0) {
      const { error } = await supabase.from('attendance').insert(toInsert)
      if (error) { setError(error.message); hadError = true }
    }

    for (const u of toUpdate) {
      const { error } = await supabase.from('attendance').update({ status: u.status }).eq('id', u.id)
      if (error) { setError(error.message); hadError = true; break }
    }

    setSaving(false)
    if (!hadError) {
      setMessage('Attendance saved.')
      loadStudentsAndAttendance()
    }
  }

  const presentCount = Object.values(attendance).filter((s) => s === 'present').length
  const batchName = batches.find((b) => b.id === selectedBatch)?.name || 'batch'

  const list = useListTools(students, {
    search: (s) => [s.full_name],
    filters: { status: (s) => attendance[s.id] || 'unmarked' },
    sorts: { name: byText((s) => s.full_name) },
    defaultSort: 'name',
  })

  function handleExport() {
    exportCsv(`attendance-${batchName.replace(/\s+/g, '-').toLowerCase()}-${sessionDate}`, list.result, [
      { label: 'Date', value: () => sessionDate },
      { label: 'Batch', value: () => batchName },
      { label: 'Student', value: (s) => s.full_name },
      { label: 'Status', value: (s) => attendance[s.id] || 'unmarked' },
    ])
  }

  const tabs = moduleTabs(list, 'status', [['', 'Register'], ['present', 'Present'], ['absent', 'Absent'], ['late', 'Late'], ['excused', 'Excused'], ['unmarked', 'Unmarked']])
  const countOf = (st) => students.filter((s) => (attendance[s.id] || 'unmarked') === st).length
  const STAT_TILES = [
    ['Present', presentCount, 'var(--status-ok)'],
    ['Absent', countOf('absent'), 'var(--status-bad)'],
    ['Late', countOf('late'), 'var(--status-warn)'],
    ['Unmarked', countOf('unmarked'), 'var(--color-subtle)'],
  ]
  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      <ModuleHeader
        title="Attendance"
        description={selectedBatch ? `Daily register · ${batchName} · ${sessionDate}` : 'Mark the daily register for a batch.'}
        actions={selectedBatch && students.length > 0 && (
          <button className={btnPrimary} onClick={handleSaveAll} disabled={saving}>{saving ? 'Saving…' : 'Save register'}</button>
        )}
        tabs={selectedBatch && students.length > 0 ? tabs.items : undefined}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}
      {message && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{message}</p>}

      <div className="flex gap-3 flex-wrap items-end mb-6">
        {selectedBatch && (
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-semibold text-muted">Batch</span>
            <select value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)} className={`${inputCls} min-w-[260px]`}>
              {batches.map((b) => <option key={b.id} value={b.id}>{b.name} ({b.training_centers?.name})</option>)}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-muted">Date</span>
          <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className={inputCls} />
        </label>
        {selectedBatch && <button className={`${btnOutline} ${btnSm} mb-1`} onClick={() => setSelectedBatch('')}>All batches</button>}
      </div>

      {!selectedBatch ? (
        batches.length === 0 ? <p className="text-muted">No active batches yet.</p> : (
          <>
            <p className="text-sm text-muted mb-3">Choose a batch to open its register for {new Date(`${sessionDate}T00:00`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
              {batches.map((b) => {
                const today = new Date(`${sessionDate}T00:00`).toLocaleDateString('en-US', { weekday: 'short' })
                const meets = !b.schedule_days?.length || b.schedule_days.some((d) => String(d).slice(0, 3).toLowerCase() === today.toLowerCase())
                return (
                  <button key={b.id} type="button" onClick={() => setSelectedBatch(b.id)}
                    className="group text-left bg-surface rounded-2xl shadow-card p-4 relative overflow-hidden hover:ring-2 hover:ring-pay-sky-2 transition">
                    <span className="absolute inset-x-0 top-0 h-[3px]" style={{ background: meets ? 'var(--gold, var(--color-pay-action))' : 'var(--color-pay-line)' }} aria-hidden="true" />
                    <div className="flex items-start gap-3">
                      <span className="grid place-items-center w-10 h-10 rounded-xl bg-pay-sky text-pay-action shrink-0"><CalendarCheck size={18} /></span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-heading truncate group-hover:text-pay-action">{b.name}</p>
                        <p className="text-xs text-subtle truncate">{b.training_centers?.name}</p>
                      </div>
                      <ChevronRight size={18} className="text-subtle mt-1" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 text-[0.7rem] font-semibold">
                      {b.start_time && <span className="inline-flex items-center gap-1 rounded-full bg-pay-bg text-muted px-2 py-0.5"><Clock size={11} /> {String(b.start_time).slice(0, 5)}{b.end_time ? `–${String(b.end_time).slice(0, 5)}` : ''}</span>}
                      {b.schedule_days?.length > 0 && <span className="rounded-full bg-pay-bg text-muted px-2 py-0.5">{b.schedule_days.join(' · ')}</span>}
                      <span className={`rounded-full px-2 py-0.5 ${meets ? 'bg-emerald-50 text-emerald-700' : 'bg-pay-bg text-subtle'}`}>{meets ? 'Class today' : 'No class today'}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )
      ) : loading ? (
        <p className="text-muted">Loading…</p>
      ) : students.length === 0 ? (
        <p className="bg-surface rounded-2xl shadow-card px-6 py-10 text-center text-sm text-muted">No active students in this batch.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="pay-stat !p-5 col-span-2 lg:col-span-1">
              <p className="text-xs text-white/75">Present · {batchName}</p>
              <strong className="block text-3xl font-bold tabular-nums mt-1">{students.length ? Math.round((presentCount / students.length) * 100) : 0}%</strong>
              <p className="text-[0.7rem] text-white/70">{presentCount} of {students.length} students</p>
            </div>
            {STAT_TILES.slice(1).map(([label, n, color]) => (
              <div key={label} className="bg-surface rounded-2xl shadow-card p-4 relative overflow-hidden">
                <span className="absolute left-0 top-4 bottom-4 w-[3px] rounded-r-full" style={{ background: color }} aria-hidden="true" />
                <p className="text-xs text-muted">{label}</p>
                <p className="text-2xl font-bold text-heading tabular-nums mt-0.5">{n}<span className="text-sm font-medium text-subtle"> / {students.length}</span></p>
              </div>
            ))}
          </div>

          <div className="flex gap-2.5 mb-5">
            <button className={`${btnOutline} text-[0.8rem]`} onClick={() => markAll('present')}>Mark all Present</button>
            <button className={`${btnOutline} text-[0.8rem]`} onClick={() => markAll('absent')}>Mark all Absent</button>
          </div>

          <ListToolbar
            list={list}
            placeholder="Find a student…"
            printTitle={`Attendance — ${batchName} — ${sessionDate}`}
            onExport={handleExport}
          />

          <DataTable
            caption={`Attendance register — ${batchName} — ${sessionDate}`}
            rows={list.result}
            rowAccent={(s) => STATUS_COLOR[attendance[s.id]] || 'var(--color-pay-line)'}
            empty="No students in this view."
            columns={[
              { key: 'student', header: 'Student', primary: true, width: '34%', sortValue: (s) => s.full_name, render: (s) => <PersonCell name={s.full_name} /> },
              { key: 'status', header: 'Mark', fullOnMobile: true,
                sortValue: (s) => STATUS_OPTIONS.indexOf(attendance[s.id]),
                render: (s) => (
                  <div role="radiogroup" aria-label={`Attendance for ${s.full_name}`} className="grid grid-cols-4 w-full max-w-[340px] rounded-lg border border-pay-line overflow-hidden">
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        role="radio"
                        aria-checked={attendance[s.id] === opt}
                        onClick={() => setStatus(s.id, opt)}
                        className={`text-[0.75rem] px-2 py-1.5 capitalize font-semibold border-r border-pay-line last:border-r-0 ${
                          attendance[s.id] === opt ? 'text-white' : 'text-heading bg-surface hover:bg-pay-sky'
                        }`}
                        style={attendance[s.id] === opt ? { background: STATUS_COLOR[opt] } : undefined}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                ) },
            ]}
          />

          <div className="mt-5">
            <button className={btnPrimary} onClick={handleSaveAll} disabled={saving}>
              {saving ? 'Saving…' : 'Save register'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
