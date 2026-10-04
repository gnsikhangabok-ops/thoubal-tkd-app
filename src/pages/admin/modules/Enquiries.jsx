import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { useListTools, exportCsv, byText, byDateDesc } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'
import ModuleHeader from '../../../components/ModuleHeader'
import DataTable, { StatusPill } from '../../../components/DataTable'
import { moduleTabs } from '../../../lib/moduleTabs'

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

  const tabs = moduleTabs(list, 'status', [['', 'All'], ...STATUSES.map((st) => [st, st.charAt(0).toUpperCase() + st.slice(1)])])
  const STATUS_TONE = { new: 'info', contacted: 'warn', enrolled: 'ok', closed: 'neutral' }

  return (
    <div className="p-8 max-md:p-4 max-w-[1240px] mx-auto">
      <ModuleHeader
        title="Enquiries"
        description="Leads submitted through the public website enrollment form."
        tabs={tabs.items}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

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
          { key: 'program', label: 'Program', options: programs.map((p) => ({ value: p, label: p })) },
        ]}
        sorts={[{ key: 'newest', label: 'Newest first' }, { key: 'name', label: 'Name A–Z' }]}
      />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : (
        <DataTable
          caption="Enquiries"
          rows={list.result}
          rowAccent={(e) => STATUS_COLOR[e.status]}
          empty={list.total === 0 ? "No enquiries yet. They'll appear here when someone fills out the enrollment form on the website." : 'Nothing matches this view, search or filters.'}
          columns={[
            { key: 'name', header: 'Applicant', primary: true, width: '22%', sortValue: (e) => e.child_name,
              render: (e) => (
                <span className="block leading-tight">
                  <strong className="text-heading">{e.child_name}</strong>
                  <span className="block text-xs text-subtle">Age {e.age ?? '—'}</span>
                </span>
              ) },
            { key: 'program', header: 'Program', sortValue: (e) => e.program_interested, render: (e) => e.program_interested || '—' },
            { key: 'phone', header: 'Guardian phone', render: (e) => <a href={`tel:${e.guardian_phone}`} className="tabular-nums hover:text-pay-action">{e.guardian_phone}</a> },
            { key: 'received', header: 'Received', sortValue: (e) => e.created_at, render: (e) => <span className="tabular-nums whitespace-nowrap">{new Date(e.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span> },
            { key: 'message', header: 'Message', render: (e) => (e.message ? <span className="italic line-clamp-2">“{e.message}”</span> : '—') },
            { key: 'status', header: 'Status', sortValue: (e) => STATUSES.indexOf(e.status),
              render: (e) => (
                <label className="inline-flex items-center gap-2">
                  <span className="sr-only">Status for {e.child_name}</span>
                  <StatusPill tone={STATUS_TONE[e.status]}>{e.status}</StatusPill>
                  <select
                    value={e.status}
                    onChange={(ev) => updateStatus(e, ev.target.value)}
                    onClick={(ev) => ev.stopPropagation()}
                    className="rounded-lg border border-pay-line bg-surface px-1.5 py-1 text-xs capitalize text-heading"
                  >
                    {STATUSES.map((st) => <option key={st} value={st}>{st}</option>)}
                  </select>
                </label>
              ) },
          ]}
        />
      )}
    </div>
  )
}
