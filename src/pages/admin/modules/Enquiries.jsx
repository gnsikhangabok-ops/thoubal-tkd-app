import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { inputCls } from '../../../lib/adminUi'

const STATUSES = ['new', 'contacted', 'enrolled', 'closed']
const STATUS_COLOR = {
  new: 'var(--status-info)', contacted: 'var(--status-warn)', enrolled: 'var(--status-ok)', closed: '#999',
}


export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  async function loadEnquiries() {
    const { data, error } = await supabase
      .from('enquiries')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setEnquiries(data)
    setLoading(false)
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- state is only set after the awaited fetch
    loadEnquiries()
  }, [])

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
    <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
      <h1 className="text-2xl md:text-[1.7rem] font-bold text-heading mb-2">Enquiries</h1>
      <p className="text-muted mb-8">Leads submitted through the public website enrollment form.</p>

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="pay-stat">
          <strong className="block text-3xl font-bold text-white">{newCount}</strong>
          <span className="text-sm text-white/85">New Enquiries</span>
        </div>
        <div className="pay-stat">
          <strong className="block text-3xl font-bold text-white">{enquiries.length}</strong>
          <span className="text-sm text-white/85">Total Enquiries</span>
        </div>
      </div>

      <div className="my-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={inputCls}
        >
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p>Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-charcoal">No enquiries yet. They'll appear here when someone fills out the enrollment form on the website.</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {filtered.map((enq) => (
            <div
              key={enq.id}
              className="bg-surface rounded-2xl shadow-card p-6"
              style={{ borderLeftWidth: 4, borderLeftColor: STATUS_COLOR[enq.status] }}
            >
              <h3 className="font-semibold text-base text-heading mb-1.5">{enq.child_name}</h3>
              <p className="text-sm text-charcoal">Age {enq.age} · {enq.program_interested}</p>
              <p className="text-[0.85rem] mt-1.5">{enq.guardian_phone}</p>
              {enq.message && <p className="text-[0.85rem] mt-1.5 italic">"{enq.message}"</p>}
              <p className="text-[0.8rem] mt-1.5 text-charcoal">
                {new Date(enq.created_at).toLocaleDateString()}
              </p>
              <div className="mt-3">
                <label className="text-[0.75rem] block mb-1 uppercase tracking-wide">Status</label>
                <select
                  value={enq.status}
                  onChange={(e) => updateStatus(enq, e.target.value)}
                  className="px-2 py-2 border border-pay-line rounded-xl text-[0.85rem] capitalize"
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
  )
}
