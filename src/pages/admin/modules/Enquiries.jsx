import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useListTools, exportCsv, byText, byDateDesc, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'

const STATUSES = ['new', 'contacted', 'enrolled', 'closed']
const STATUS_COLOR = {
  new: 'var(--status-info)', contacted: 'var(--status-warn)', enrolled: 'var(--status-ok)', closed: '#999',
}


export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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

  const newCount = enquiries.filter((e) => e.status === 'new').length


  const list = useListTools(enquiries, {
    search: (e) => [e.child_name, e.guardian_phone, e.program_interested, e.message],
    filters: { status: (e) => e.status, program: (e) => e.program_interested },
    sorts: { newest: byDateDesc((e) => e.created_at), name: byText((e) => e.child_name) },
    defaultSort: 'newest',
  })
  const programs = [...new Set(enquiries.map((e) => e.program_interested).filter(Boolean))]

  function handleExport() {
    exportCsv('enquiries', list.result, [
      { label: 'Received', value: (e) => e.created_at?.slice(0, 10) },
      { label: 'Name', value: (e) => e.child_name },
      { label: 'Age', value: (e) => e.age },
      { label: 'Guardian phone', value: (e) => e.guardian_phone },
      { label: 'Program', value: (e) => e.program_interested },
      { label: 'Status', value: (e) => e.status },
      { label: 'Message', value: (e) => e.message },
    ])
  }

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

      <div className="mt-6" />
      <ListToolbar
        list={list}
        placeholder="Search name, phone, program…"
        printTitle="Enquiries"
        onExport={handleExport}
        filters={[
          { key: 'status', label: 'Status', options: opts(STATUSES) },
          { key: 'program', label: 'Program', options: programs.map((p) => ({ value: p, label: p })) },
        ]}
        sorts={[{ key: 'newest', label: 'Newest first' }, { key: 'name', label: 'Name A–Z' }]}
      />

      {loading ? (
        <p>Loading…</p>
      ) : list.result.length === 0 ? (
        <p className="text-muted">{list.total === 0 ? <>No enquiries yet. They'll appear here when someone fills out the enrollment form on the website.</> : 'Nothing matches your search or filters.'}</p>
      ) : (
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {list.result.map((enq) => (
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
