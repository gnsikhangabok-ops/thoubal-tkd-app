import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'

const STATUSES = ['new', 'contacted', 'enrolled', 'closed']
const STATUS_COLOR = {
  new: '#B3282D', contacted: '#D4A537', enrolled: '#4C6B4F', closed: '#999',
}

const inputCls = "px-2.5 py-2.5 border border-black/10"

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
    <div className="p-12 max-md:p-6 max-w-[1100px] mx-auto">
      <h1 className="font-display text-ink uppercase text-3xl mb-2">Enquiries</h1>
      <p className="text-charcoal mb-9">Leads submitted through the public website enrollment form.</p>

      {error && <p className="text-brand-red mb-4">{error}</p>}

      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
        <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
          <strong className="block font-display text-4xl text-chalk">{newCount}</strong>
          <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">New Enquiries</span>
        </div>
        <div className="bg-ink px-5 py-6 border-b-[3px] border-b-gold">
          <strong className="block font-display text-4xl text-chalk">{enquiries.length}</strong>
          <span className="text-sm text-[#B8B6B0] uppercase tracking-wide">Total Enquiries</span>
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
              className="bg-white border border-black/10 p-6"
              style={{ borderTopWidth: 3, borderTopColor: STATUS_COLOR[enq.status] }}
            >
              <h3 className="font-semibold text-base text-ink mb-1.5">{enq.child_name}</h3>
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
                  className="px-2 py-2 border border-black/10 text-[0.85rem] capitalize"
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
