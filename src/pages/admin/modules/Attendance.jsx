import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../context/AuthContext'

function today() {
  return new Date().toISOString().slice(0, 10)
}

const STATUS_OPTIONS = ['present', 'absent', 'late', 'excused']
const STATUS_COLOR = {
  present: 'var(--red)',
  absent: '#8B0000',
  late: '#B8860B',
  excused: '#999',
}

export default function Attendance() {
  const { profile } = useAuth()
  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState('')
  const [sessionDate, setSessionDate] = useState(today())
  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({}) // student_id -> status
  const [existingRecords, setExistingRecords] = useState({}) // student_id -> record id
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
      // default any student without a record yet to 'present'
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

    // Upsert: update existing records, insert new ones
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
          marked_by: null, // could link to coaches table via profile lookup later
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
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <h1>Attendance</h1>
        <p className="dash-lede">Mark daily attendance for a batch.</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}
        {message && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{message}</p>}

        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Batch</label>
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              style={{ padding: 10, border: '1px solid var(--line)', minWidth: 260 }}
            >
              <option value="">— Select a batch —</option>
              {batches.map((b) => (
                <option key={b.id} value={b.id}>{b.name} ({b.training_centers?.name})</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: 6 }}>Date</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              style={{ padding: 10, border: '1px solid var(--line)' }}
            />
          </div>
        </div>

        {!selectedBatch ? (
          <p style={{ color: 'var(--charcoal)' }}>Select a batch to mark attendance.</p>
        ) : loading ? (
          <p>Loading…</p>
        ) : students.length === 0 ? (
          <p style={{ color: 'var(--charcoal)' }}>No active students in this batch.</p>
        ) : (
          <>
            <div className="stat-grid" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <strong>{presentCount} / {students.length}</strong>
                <span>Present today</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
              <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => markAll('present')}>Mark all Present</button>
              <button className="btn btn-outline" style={{ fontSize: '0.8rem' }} onClick={() => markAll('absent')}>Mark all Absent</button>
            </div>

            <div className="module-grid" style={{ marginBottom: 24 }}>
              {students.map((s) => (
                <div className="module-card" key={s.id} style={{ borderTopColor: STATUS_COLOR[attendance[s.id]] }}>
                  <h3>{s.full_name}</h3>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                    {STATUS_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setStatus(s.id, opt)}
                        className={attendance[s.id] === opt ? 'btn btn-primary' : 'btn btn-outline'}
                        style={{ fontSize: '0.72rem', padding: '5px 10px', textTransform: 'capitalize' }}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button className="btn btn-primary" onClick={handleSaveAll} disabled={saving}>
              {saving ? 'Saving…' : 'Save Attendance'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
