import { useEffect, useState } from 'react'
import { PlusCircle, Pencil, Trash2, ShieldAlert } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useListTools, exportCsv, opts } from '../../../lib/listTools'
import ListToolbar from '../../../components/ListToolbar'

const ACTIONS = {
  insert: { label: 'Added', icon: PlusCircle, color: 'var(--status-ok)' },
  update: { label: 'Changed', icon: Pencil, color: 'var(--status-info)' },
  delete: { label: 'Deleted', icon: Trash2, color: 'var(--status-bad)' },
}

const TABLE_LABELS = {
  students: 'Students', coaches: 'Coaches', training_centers: 'Training centers', batches: 'Batches',
  attendance: 'Attendance', grading_events: 'Belt exams', grading_results: 'Belt exam results',
  student_performance: 'Performance', achievements: 'Achievements', events: 'Events',
  event_registrations: 'Event registrations', fee_payments: 'Fees', fee_structures: 'Fee setup',
  one_time_fees: 'One-time fees', one_time_fee_payments: 'One-time fee payments',
  accounts_transactions: 'Accounts', inventory_items: 'Equipment', enquiries: 'Enquiries',
  rules_and_regulations: 'Rules', site_content: 'Website content', profiles: 'Users', notices: 'Notices',
}

const PAGE = 300 // most recent entries loaded

// A readable one-line summary of what changed
function describe(entry) {
  const c = entry.changes || {}
  const name = c.full_name || c.title || c.name || c.child_name || c.key
  if (entry.action === 'update') {
    const fields = Object.keys(c).filter((k) => !['updated_at'].includes(k))
    return fields.map((k) => `${k.replace(/_/g, ' ')}: ${fmt(c[k]?.from)} → ${fmt(c[k]?.to)}`).join(' · ')
  }
  return name ? String(name) : ''
}
const fmt = (v) => (v == null || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v).slice(0, 60))

export default function ActivityLog() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    supabase
      .from('audit_log')
      .select('*')
      .order('at', { ascending: false })
      .limit(PAGE)
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setEntries(data)
        setLoading(false)
      })
  }, [])

  const list = useListTools(entries, {
    search: (e) => [e.actor_name, TABLE_LABELS[e.table_name], e.table_name, describe(e)],
    filters: {
      action: (e) => e.action,
      area: (e) => e.table_name,
      when: { match: (e, v) => Date.now() - new Date(e.at).getTime() <= Number(v) * 86400000 },
    },
  })

  function handleExport() {
    exportCsv('activity-log', list.result, [
      { label: 'When', value: (e) => new Date(e.at).toLocaleString('en-IN') },
      { label: 'Who', value: (e) => e.actor_name || 'System' },
      { label: 'Action', value: (e) => ACTIONS[e.action]?.label || e.action },
      { label: 'Area', value: (e) => TABLE_LABELS[e.table_name] || e.table_name },
      { label: 'Record id', value: (e) => e.row_id },
      { label: 'Details', value: (e) => describe(e) },
    ])
  }

  const areas = [...new Set(entries.map((e) => e.table_name))].sort()
  const missingTable = /audit_log/.test(error) && /(does not exist|not find|schema cache)/i.test(error)

  return (
    <div className="p-8 max-md:p-4 max-w-[1100px] mx-auto">
      <h1 className="text-2xl md:text-[1.7rem] font-bold text-heading mb-2">Activity Log</h1>
      <p className="text-muted mb-8">Who added, changed or deleted what, and when. Entries can't be edited or removed. Showing the latest {PAGE}.</p>

      {missingTable ? (
        <div className="bg-surface rounded-2xl shadow-card p-6 flex gap-4 max-w-2xl">
          <ShieldAlert className="text-[var(--status-warn)] shrink-0" />
          <div className="text-sm text-body">
            <p className="font-semibold text-heading mb-1">The activity log isn't switched on yet</p>
            Run <code className="px-1 rounded bg-pay-bg">supabase/migrations/20261005_notices_and_activity_log.sql</code> in the
            Supabase SQL editor. Changes are recorded from that point on.
          </div>
        </div>
      ) : (
        <>
          {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}
          <ListToolbar
            list={list}
            placeholder="Search person, area, details…"
            printTitle="Activity Log"
            onExport={handleExport}
            filters={[
              { key: 'when', label: 'When', options: [{ value: '1', label: 'Last 24 hours' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }] },
              { key: 'action', label: 'Action', options: opts(Object.keys(ACTIONS), { insert: 'Added', update: 'Changed', delete: 'Deleted' }) },
              { key: 'area', label: 'Area', options: areas.map((a) => ({ value: a, label: TABLE_LABELS[a] || a })) },
            ]}
          />

          {loading ? (
            <p>Loading…</p>
          ) : list.result.length === 0 ? (
            <p className="text-muted">{list.total === 0 ? 'No activity recorded yet.' : 'Nothing matches your search or filters.'}</p>
          ) : (
            <ol className="bg-surface rounded-2xl shadow-card divide-y divide-pay-line">
              {list.result.map((e) => {
                const a = ACTIONS[e.action] || ACTIONS.update
                const Icon = a.icon
                return (
                  <li key={e.id} className="flex gap-3 px-4 md:px-5 py-3.5">
                    <span className="grid place-items-center w-9 h-9 rounded-full bg-pay-bg shrink-0" style={{ color: a.color }}>
                      <Icon size={17} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-body">
                        <strong className="text-heading">{e.actor_name || 'System'}</strong> {a.label.toLowerCase()} a record in{' '}
                        <strong className="text-heading">{TABLE_LABELS[e.table_name] || e.table_name}</strong>
                      </p>
                      {describe(e) && <p className="text-xs text-muted mt-0.5 break-words">{describe(e)}</p>}
                    </div>
                    <time dateTime={e.at} className="text-xs text-subtle shrink-0 text-right">
                      {new Date(e.at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      <br />
                      {new Date(e.at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                  </li>
                )
              })}
            </ol>
          )}
        </>
      )}
    </div>
  )
}
