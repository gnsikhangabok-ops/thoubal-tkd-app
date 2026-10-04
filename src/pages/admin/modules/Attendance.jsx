import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { btnPrimary, btnOutline } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused']
const STATUS_COLOR = {
  present: 'var(--status-ok)',
  absent: 'var(--status-bad)',
  late: 'var(--status-warn)',
  excused: '#999',
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
      .select('id, name, training_centers(name)')
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

  return (
    <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
      <h1 className="text-2xl md:text-[1.7rem] font-bold text-heading mb-2">Attendance</h1>
      <p className="text-muted mb-8">Mark daily attendance for a batch.</p>

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}
      {message && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{message}</p>}

      <div className="flex gap-4 flex-wrap mb-7">
        <div>
          <label className="text-[0.85rem] font-semibold block mb-1.5">Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-2.5 py-2.5 border border-pay-line rounded-xl min-w-[260px]"
          >
            <option value="">— Select a batch —</option>
            {batches.map((b) => (
              <option key={b.id} value={b.id}>{b.name} ({b.training_centers?.name})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[0.85rem] font-semibold block mb-1.5">Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            className="px-2.5 py-2.5 border border-pay-line rounded-xl"
          />
        </div>
      </div>

      {!selectedBatch ? (
        <p className="text-charcoal">Select a batch to mark attendance.</p>
      ) : loading ? (
        <p>Loading…</p>
      ) : students.length === 0 ? (
        <p className="text-charcoal">No active students in this batch.</p>
      ) : (
        <>
          <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            <div className="pay-stat">
              <strong className="block text-3xl font-bold text-white">{presentCount} / {students.length}</strong>
              <span className="text-sm text-white/85">Present today</span>
            </div>
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
            filters={[{ key: 'status', label: 'Marked as', options: opts([...STATUS_OPTIONS, 'unmarked']) }]}
          />

          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {list.result.map((s) => (
              <div
                key={s.id}
                className="bg-surface rounded-2xl shadow-card p-6"
                style={{ borderLeftWidth: 4, borderLeftColor: STATUS_COLOR[attendance[s.id]] }}
              >
                <h3 className="font-semibold text-base text-heading">{s.full_name}</h3>
                <div className="flex gap-1.5 flex-wrap mt-2.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setStatus(s.id, opt)}
                      className={`text-[0.72rem] px-2.5 py-1.5 capitalize font-semibold rounded-full ${
                        attendance[s.id] === opt
                          ? 'bg-pay-action text-white border border-pay-action'
                          : 'border border-pay-line text-heading bg-surface hover:bg-pay-sky'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button className={btnPrimary} onClick={handleSaveAll} disabled={saving}>
            {saving ? 'Saving…' : 'Save Attendance'}
          </button>
        </>
      )}
    </div>
  )
}
