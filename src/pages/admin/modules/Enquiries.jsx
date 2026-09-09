import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../lib/supabaseClient'
import '../../../styles/site.css'

const STATUSES = ['new', 'contacted', 'enrolled', 'closed']
const STATUS_COLOR = {
  new: 'var(--red)', contacted: 'var(--gold)', enrolled: '#4C6B4F', closed: '#999',
}

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    loadEnquiries()
  }, [])

  async function loadEnquiries() {
    setLoading(true)
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setEnquiries(data)
    setLoading(false)
  }

  async function updateStatus(enquiry, status) {
    const { error } = await supabase
      .from('enquiries')
      .update({ status })
      .eq('id', enquiry.id)

    if (error) setError(error.message)
    else loadEnquiries()
  }

  const filtered = statusFilter ? enquiries.filter((e) => e.status === statusFilter) : enquiries
  const newCount = enquiries.filter((e) => e.status === 'new').length

  return (
    <div className="dash-shell">
      <div className="dash-topbar">
        <Link to="/admin" className="logo" style={{ color: 'var(--chalk)' }}>THOUBAL <span>TKD</span></Link>
        <Link to="/admin" className="dash-signout">← Back to Dashboard</Link>
      </div>

      <div className="dash-body">
        <h1>Enquiries</h1>
        <p className="dash-lede">Leads submitted through the public website enrollment form.</p>

        {error && <p style={{ color: 'var(--red)', marginBottom: 16 }}>{error}</p>}

        <div className="stat-grid">
          <div className="stat-card">
            <strong>{newCount}</strong>
            <span>New Enquiries</span>
          </div>
          <div className="stat-card">
            <strong>{enquiries.length}</strong>
            <span>Total Enquiries</span>
          </div>
        </div>

        <div style={{ margin: '24px 0' }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: 10, border: '1px solid var(--line)' }}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading…</p>
        ) : filtered.length === 0 ? (
          <p style={{ color: 'var(--charcoal)' }}>No enquiries yet. They'll appear here when someone fills out the enrollment form on the website.</p>
        ) : (
          <div className="module-grid">
            {filtered.map((enq) => (
              <div className="module-card" key={enq.id} style={{ borderTopColor: STATUS_COLOR[enq.status] }}>
                <h3>{enq.child_name}</h3>
                <p>Age {enq.age} · {enq.program_interested}</p>
                <p style={{ fontSize: '0.85rem', marginTop: 6 }}>{enq.guardian_phone}</p>
                {enq.message && <p style={{ fontSize: '0.85rem', marginTop: 6, fontStyle: 'italic' }}>"{enq.message}"</p>}
                <p style={{ fontSize: '0.8rem', marginTop: 6, color: 'var(--charcoal)' }}>
                  {new Date(enq.created_at).toLocaleDateString()}
                </p>
                <div style={{ marginTop: 12 }}>
                  <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    Status
                  </label>
                  <select
                    value={enq.status}
                    onChange={(e) => updateStatus(enq, e.target.value)}
                    style={{ padding: 8, border: '1px solid var(--line)', fontSize: '0.85rem', textTransform: 'capitalize' }}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
