import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused']
const STATUS_COLOR = {
  present: '#B3282D',
  absent: '#8B0000',
  late: '#B8860B',
  excused: '#999',
}

const btnPrimary = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide bg-brand-red text-chalk hover:bg-brand-red-dark disabled:opacity-60"
const btnOutline = "inline-block px-6 py-3 font-display font-semibold text-sm uppercase tracking-wide border border-ink text-ink hover:bg-ink hover:text-chalk"

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

  return (
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <h1 className="font-display text-ink uppercase text-3xl mb-2">Attendance</h1>
      <p className="text-charcoal mb-9">Mark daily attendance for a batch.</p>

      {error && <p className="text-brand-red mb-4">{error}</p>}
      {message && <p className="text-brand-red mb-4">{message}</p>}

      <div className="flex gap-4 flex-wrap mb-7">
        <div>
          <label className="text-[0.85rem] font-semibold block mb-1.5">Batch</label>
          <select
            value={selectedBatch}
            onChange={(e) => setSelectedBatch(e.target.value)}
            className="px-2.5 py-2.5 border border-black/10 min-w-[260px]"
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
            className="px-2.5 py-2.5 border border-black/10"
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
            <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
              <strong className="block font-display text-4xl text-chalk">{presentCount} / {students.length}</strong>
              <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Present today</span>
            </div>
          </div>

          <div className="flex gap-2.5 mb-5">
            <button className={`${btnOutline} text-[0.8rem]`} onClick={() => markAll('present')}>Mark all Present</button>
            <button className={`${btnOutline} text-[0.8rem]`} onClick={() => markAll('absent')}>Mark all Absent</button>
          </div>

          <div className="grid gap-4 mb-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {students.map((s) => (
              <div
                key={s.id}
                className="bg-white border border-black/10 p-6"
                style={{ borderTopWidth: 3, borderTopColor: STATUS_COLOR[attendance[s.id]] }}
              >
                <h3 className="font-semibold text-base text-ink">{s.full_name}</h3>
                <div className="flex gap-1.5 flex-wrap mt-2.5">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setStatus(s.id, opt)}
                      className={`text-[0.72rem] px-2.5 py-1.5 capitalize font-display font-semibold uppercase tracking-wide ${
                        attendance[s.id] === opt
                          ? 'bg-brand-red text-chalk'
                          : 'border border-ink text-ink hover:bg-ink hover:text-chalk'
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
