import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ClipboardPlus, KanbanSquare, Table2, Inbox, ArrowRight, Clock, CalendarClock, IndianRupee, Phone, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../../lib/supabaseClient'
import { useAuth } from '../../../context/AuthContext'
import { btnPrimary, btnOutline, btnSm } from '../../../lib/adminUi'
import { useListTools, exportCsv, byText, byDateDesc } from '../../../lib/listTools'
import { moduleTabs } from '../../../lib/moduleTabs'
import { formatDate, rupees } from '../../../lib/documents'
import { ageFrom } from '../../../lib/people'
import { beltLabel } from '../../../lib/belts'
import {
  STAGES, STAGE, STAGE_COLOR, FUNNEL, BOARD, SOURCES, SOURCE_LABEL, applicationNo, netFee, balanceDue,
  docsDone, readiness, stageSince, daysSince, historyEntry, DOCUMENTS, emptyApplication,
} from '../../../lib/admissions'
import ModuleHeader from '../../../components/ModuleHeader'
import ListToolbar from '../../../components/ListToolbar'
import DataTable, { StatusPill } from '../../../components/DataTable'
import PersonCell from '../../../components/PersonCell'
import DocumentModal from '../../../components/docs/DocumentModal'
import AdmissionForm from '../../../components/docs/AdmissionForm'
import AdmissionWizard from '../admissions/AdmissionWizard'
import AdmissionDrawer, { ADMISSION_SELECT } from '../admissions/AdmissionDrawer'
import ReadinessRing from '../admissions/ReadinessRing'

const VIEW_KEY = 'tta-admissions-view'
const readView = () => { try { return localStorage.getItem(VIEW_KEY) || 'board' } catch { return 'board' } }
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) }

export default function Admissions() {
  const { profile } = useAuth()
  const actorName = profile?.full_name || null
  const [admissions, setAdmissions] = useState([])
  const [centers, setCenters] = useState([])
  const [batches, setBatches] = useState([])
  const [rates, setRates] = useState([])
  const [feeTypes, setFeeTypes] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState('')
  const [view, setView] = useState(readView)
  const [wizard, setWizard] = useState(null) // initial form values while the wizard is open
  const [selectedId, setSelectedId] = useState(null)
  const [printing, setPrinting] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  async function loadData() {
    const [admRes, centerRes, batchRes, rateRes, feeRes, enqRes] = await Promise.all([
      supabase.from('admissions').select(ADMISSION_SELECT).order('created_at', { ascending: false }),
      supabase.from('training_centers').select('id, name').eq('active', true).order('name'),
      supabase.from('batches').select('id, name, training_center_id').eq('active', true).order('name'),
      supabase.from('fee_structures').select('batch_id, monthly_amount, effective_from').order('effective_from', { ascending: false }),
      supabase.from('one_time_fee_types').select('*'),
      supabase.from('enquiries').select('*').in('status', ['new', 'contacted']).order('created_at', { ascending: false }),
    ])
    if (admRes.error) setError(admRes.error.message.includes('admissions') ? `${admRes.error.message} — run supabase/migrations/20261011_admissions.sql first.` : admRes.error.message)
    else setAdmissions(admRes.data)
    if (centerRes.data) setCenters(centerRes.data)
    if (batchRes.data) setBatches(batchRes.data)
    if (rateRes.data) setRates(rateRes.data)
    if (feeRes.data) setFeeTypes(feeRes.data)
    if (enqRes.data) setEnquiries(enqRes.data)
    setLoading(false)
  }

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- state is only set after the awaited fetch
    loadData()
  }, [])

  useEffect(() => {
    if (!flash) return
    const t = setTimeout(() => setFlash(''), 3500)
    return () => clearTimeout(t)
  }, [flash])

  const admissionFeeType = feeTypes.find((f) => /admission|registration/i.test(f.name))
  const monthlyRate = (batchId) => rates.find((r) => r.batch_id === batchId)?.monthly_amount ?? null
  const selected = admissions.find((a) => a.id === selectedId)

  function changeView(v) {
    setView(v)
    try { localStorage.setItem(VIEW_KEY, v) } catch { /* private mode */ }
  }

  function startNew(prefill = {}) {
    setWizard({ ...emptyApplication, admission_fee: admissionFeeType ? String(admissionFeeType.amount) : '', ...prefill })
  }

  function startFromEnquiry(e) {
    startNew({
      enquiry_id: String(e.id),
      source: 'website',
      full_name: e.child_name || '',
      guardian_phone: e.guardian_phone || '',
      notes: [e.program_interested && `Interested in: ${e.program_interested}`, e.age && `Age given: ${e.age}`, e.message && `“${e.message}”`].filter(Boolean).join(' · '),
    })
  }

  // Deep link from the Enquiries module: /admin/admissions?enquiry=<id>
  const enquiryParam = searchParams.get('enquiry')
  useEffect(() => {
    if (!enquiryParam || loading) return
    const e = enquiries.find((x) => String(x.id) === enquiryParam)
    // oxlint-disable-next-line react/set-state-in-effect -- opens the wizard once the data has loaded
    if (e) startFromEnquiry(e)
    setSearchParams({}, { replace: true })
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- run once the list has loaded
  }, [enquiryParam, loading])

  function editApplication(a) {
    setWizard({
      ...emptyApplication,
      ...Object.fromEntries(Object.keys(emptyApplication).map((k) => [k, a[k] ?? emptyApplication[k]])),
      admission_fee: String(a.admission_fee ?? ''),
      discount: String(a.discount ?? ''),
      documents: a.documents || {},
    })
  }

  async function handleSaved(row, warning) {
    setWizard(null)
    setError(warning || '')
    setFlash(warning ? '' : `Application ${applicationNo(row)} saved`)
    await loadData()
    setSelectedId(row.id)
  }

  function handleChanged(row, message) {
    setAdmissions((list) => list.map((a) => (a.id === row.id ? row : a)))
    if (message) setFlash(message)
    if (row.status === 'enrolled') loadData()
  }

  async function dropOn(status, id) {
    setDragOver(null)
    const a = admissions.find((x) => x.id === id)
    if (!a || a.status === status) return
    if (status === 'enrolled' || a.status === 'enrolled') {
      setSelectedId(a.id) // enrolment creates a student record — confirm it from the application
      return
    }
    const history = [...(a.history || []), historyEntry(status, actorName, 'Moved on the board')]
    setAdmissions((list) => list.map((x) => (x.id === id ? { ...x, status, history } : x)))
    const { error } = await supabase.from('admissions').update({ status, history }).eq('id', id)
    if (error) { setError(error.message); loadData() } else setFlash(`${a.full_name} → ${STAGE[status].label}`)
  }

  // ---------- Analytics ----------
  const stats = useMemo(() => {
    const since = monthStart()
    const open = admissions.filter((a) => STAGE[a.status]?.open)
    const enrolled = admissions.filter((a) => a.status === 'enrolled')
    const enrolledAt = (a) => [...(a.history || [])].reverse().find((h) => h.status === 'enrolled')?.at
    const decided = admissions.filter((a) => ['enrolled', 'rejected', 'withdrawn'].includes(a.status)).length
    // Furthest pipeline stage each application has reached, for the funnel
    const reached = (a) => Math.max(FUNNEL.indexOf(a.status), ...(a.history || []).map((h) => FUNNEL.indexOf(h.status)))
    return {
      open: open.length,
      newThisMonth: admissions.filter((a) => new Date(a.created_at) >= since).length,
      enrolledThisMonth: enrolled.filter((a) => enrolledAt(a) && new Date(enrolledAt(a)) >= since).length,
      conversion: decided ? Math.round((enrolled.length / decided) * 100) : null,
      collected: admissions.reduce((s, a) => s + Number(a.amount_paid || 0), 0),
      outstanding: admissions.filter((a) => a.status !== 'rejected' && a.status !== 'withdrawn').reduce((s, a) => s + balanceDue(a), 0),
      funnel: FUNNEL.map((s, i) => ({ key: s, count: admissions.filter((a) => reached(a) >= i).length })),
    }
  }, [admissions])

  const pendingEnquiries = useMemo(() => {
    const linked = new Set(admissions.map((a) => a.enquiry_id).filter(Boolean))
    return enquiries.filter((e) => !linked.has(String(e.id)))
  }, [admissions, enquiries])

  // ---------- List ----------
  const list = useListTools(admissions, {
    search: (a) => [a.full_name, a.guardian_name, a.guardian_phone, applicationNo(a), a.training_centers?.name, a.school],
    filters: {
      view: { match: (a, v) => (v === 'open' ? !!STAGE[a.status]?.open : v === 'closed' ? ['rejected', 'withdrawn'].includes(a.status) : a.status === v) },
      center: (a) => a.training_center_id,
      source: (a) => a.source,
    },
    sorts: {
      newest: byDateDesc((a) => a.created_at),
      waiting: (x, y) => String(stageSince(x)).localeCompare(String(stageSince(y))),
      name: byText((a) => a.full_name),
      ready: (x, y) => readiness(y) - readiness(x),
    },
    defaultSort: 'newest',
  })

  const tabs = moduleTabs(list, 'view', [
    ['', 'All'], ['open', 'In pipeline'], ['applied', 'Applied'], ['under_review', 'Review'], ['trial', 'Trial'],
    ['approved', 'Approved'], ['waitlisted', 'Waitlist'], ['enrolled', 'Enrolled'], ['closed', 'Closed'],
  ])

  function handleExport() {
    exportCsv('admissions', list.result, [
      { label: 'Application no', value: applicationNo },
      { label: 'Applied on', value: (a) => a.created_at?.slice(0, 10) },
      { label: 'Status', value: (a) => STAGE[a.status]?.label },
      { label: 'Name', value: (a) => a.full_name },
      { label: 'Date of birth', value: (a) => a.dob },
      { label: 'Gender', value: (a) => a.gender },
      { label: 'Guardian', value: (a) => a.guardian_name },
      { label: 'Phone', value: (a) => a.guardian_phone },
      { label: 'Email', value: (a) => a.guardian_email },
      { label: 'Centre', value: (a) => a.training_centers?.name },
      { label: 'Batch', value: (a) => a.batches?.name },
      { label: 'Belt', value: (a) => beltLabel(a.current_belt) },
      { label: 'Source', value: (a) => SOURCE_LABEL[a.source] },
      { label: 'Trial date', value: (a) => a.trial_date },
      { label: 'Trial rating', value: (a) => a.trial_rating },
      { label: 'Documents', value: (a) => `${docsDone(a)}/${DOCUMENTS.length}` },
      { label: 'Net fee', value: netFee },
      { label: 'Paid', value: (a) => a.amount_paid },
      { label: 'Balance', value: balanceDue },
      { label: 'Readiness %', value: readiness },
    ])
  }

  const boardColumns = list.filterValues.view && BOARD.includes(list.filterValues.view) ? [list.filterValues.view] : BOARD

  const KPIS = [
    { label: 'In pipeline', value: stats.open, sub: 'awaiting a decision' },
    { label: 'New this month', value: stats.newThisMonth, sub: new Date().toLocaleDateString('en-IN', { month: 'long' }) },
    { label: 'Enrolled this month', value: stats.enrolledThisMonth, sub: 'new students' },
    { label: 'Conversion', value: stats.conversion == null ? '—' : `${stats.conversion}%`, sub: 'of decided applications' },
    { label: 'Fees collected', value: rupees(stats.collected), sub: stats.outstanding ? `${rupees(stats.outstanding)} outstanding` : 'nothing outstanding' },
  ]

  return (
    <div className="p-8 max-md:p-4 max-w-[1320px] mx-auto">
      <ModuleHeader
        title="Admissions"
        description="Every application from first contact to enrolment — review, trial class, documents, fees and the printed admission form."
        actions={
          <>
            <div className="inline-flex rounded-full border border-pay-line bg-surface p-0.5" role="group" aria-label="Layout">
              {[['board', KanbanSquare, 'Board'], ['table', Table2, 'Table']].map(([v, Icon, label]) => (
                <button key={v} type="button" aria-pressed={view === v} onClick={() => changeView(v)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${view === v ? 'bg-pay-action text-white' : 'text-muted hover:text-heading'}`}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
            <button className={btnPrimary} onClick={() => startNew()}><ClipboardPlus size={16} /> New admission</button>
          </>
        }
        tabs={tabs.items}
        activeTab={tabs.active}
        onTabChange={tabs.select}
      />

      {error && <p className="bg-red-50 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">{error}</p>}

      {/* KPI strip */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        {KPIS.map((k, i) => (
          <div key={k.label} className={`pay-stat relative overflow-hidden ${i === 4 ? 'col-span-2 md:col-span-1' : ''}`}>
            <div className="absolute -right-6 -top-8 w-24 h-24 rounded-full bg-white/10" aria-hidden="true" />
            <span className="relative text-xs text-white/80">{k.label}</span>
            <strong className="relative block text-2xl md:text-3xl font-bold text-white tabular-nums mt-0.5 truncate">{loading ? '…' : k.value}</strong>
            <span className="relative text-[0.7rem] text-white/70">{k.sub}</span>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr] mt-4">
        {/* Funnel */}
        <section className="bg-surface rounded-2xl shadow-card p-5" aria-labelledby="funnel-h">
          <div className="flex items-center justify-between">
            <h2 id="funnel-h" className="font-semibold text-heading">Admission funnel</h2>
            <span className="text-xs text-subtle">All time · furthest stage reached</span>
          </div>
          <ol className="mt-4 flex flex-col gap-2.5">
            {stats.funnel.map((f, i) => {
              const top = stats.funnel[0].count || 1
              const prev = i ? stats.funnel[i - 1].count : null
              return (
                <li key={f.key} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 text-sm">
                  <span className="text-muted truncate">{STAGE[f.key].label}</span>
                  <span className="h-7 rounded-lg bg-pay-bg overflow-hidden">
                    <span className="block h-full rounded-lg transition-all" style={{ width: `${Math.max(f.count ? 4 : 0, (f.count / top) * 100)}%`, background: `linear-gradient(90deg, var(--color-pay-action), var(--color-pay-blue))`, opacity: 1 - i * 0.12 }} />
                  </span>
                  <span className="tabular-nums text-right min-w-[72px]">
                    <strong className="text-heading">{f.count}</strong>
                    {prev ? <span className="text-xs text-subtle"> · {Math.round((f.count / prev) * 100)}%</span> : null}
                  </span>
                </li>
              )
            })}
          </ol>
        </section>

        {/* Enquiry intake */}
        <section className="bg-surface rounded-2xl shadow-card p-5" aria-labelledby="intake-h">
          <div className="flex items-center justify-between">
            <h2 id="intake-h" className="font-semibold text-heading inline-flex items-center gap-2"><Inbox size={16} className="text-pay-action" /> Website enquiries</h2>
            <span className="text-xs text-subtle">{pendingEnquiries.length} waiting</span>
          </div>
          {pendingEnquiries.length === 0 ? (
            <p className="mt-6 text-sm text-muted flex items-center gap-2"><CheckCircle2 size={16} className="text-[color:var(--status-ok)]" /> All enquiries have an application.</p>
          ) : (
            <ul className="mt-3 divide-y divide-pay-line">
              {pendingEnquiries.slice(0, 4).map((e) => (
                <li key={e.id} className="py-2.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-heading truncate">{e.child_name}{e.age ? <span className="font-normal text-subtle"> · {e.age} yrs</span> : null}</p>
                    <p className="text-xs text-subtle truncate">{[e.program_interested, formatDate(e.created_at)].filter(Boolean).join(' · ')}</p>
                  </div>
                  {e.guardian_phone && <a href={`tel:${e.guardian_phone}`} className="grid place-items-center w-8 h-8 rounded-full text-pay-action hover:bg-pay-sky" aria-label={`Call ${e.guardian_phone}`}><Phone size={15} /></a>}
                  <button className={`${btnOutline} ${btnSm}`} onClick={() => startFromEnquiry(e)}>Start <ArrowRight size={13} /></button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="mt-6" />
      <ListToolbar
        list={list}
        placeholder="Search name, phone, application no…"
        printTitle="Admissions"
        onExport={handleExport}
        filters={[
          { key: 'center', label: 'Centre', options: centers.map((c) => ({ value: c.id, label: c.name })) },
          { key: 'source', label: 'Source', options: SOURCES.map(([value, label]) => ({ value, label })) },
        ]}
        sorts={[
          { key: 'newest', label: 'Newest first' },
          { key: 'waiting', label: 'Waiting longest' },
          { key: 'ready', label: 'Most ready' },
          { key: 'name', label: 'Name A–Z' },
        ]}
      />

      {loading ? (
        <p className="text-muted">Loading…</p>
      ) : view === 'board' ? (
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1 snap-x" aria-label="Admissions board">
          {boardColumns.map((s) => {
            const cards = list.result.filter((a) => a.status === s)
            return (
              <section
                key={s}
                aria-label={STAGE[s].label}
                onDragOver={(e) => { e.preventDefault(); setDragOver(s) }}
                onDragLeave={() => setDragOver((d) => (d === s ? null : d))}
                onDrop={(e) => dropOn(s, e.dataTransfer.getData('text/plain'))}
                className={`snap-start shrink-0 w-[272px] ${boardColumns.length === 1 ? 'w-full' : ''} rounded-2xl p-2.5 flex flex-col gap-2.5 transition-colors ${dragOver === s ? 'bg-pay-sky ring-2 ring-pay-action' : 'bg-pay-line/40'}`}
              >
                <header className="flex items-center justify-between px-1.5 pt-1">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-heading">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: STAGE_COLOR[s] }} aria-hidden="true" />
                    {STAGE[s].label}
                  </span>
                  <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-semibold tabular-nums text-body">{cards.length}</span>
                </header>
                {cards.length === 0 && <p className="text-xs text-subtle px-2 py-6 text-center border-2 border-dashed border-pay-line rounded-xl">Drop here</p>}
                {cards.map((a) => <BoardCard key={a.id} a={a} onOpen={() => setSelectedId(a.id)} />)}
              </section>
            )
          })}
        </div>
      ) : (
        <DataTable
          caption="Admissions"
          rows={list.result}
          onRowClick={(a) => setSelectedId(a.id)}
          rowAccent={(a) => STAGE_COLOR[a.status]}
          empty={list.total === 0 ? 'No applications yet. Click “New admission” or start one from a website enquiry.' : 'No applications match this view, search or filters.'}
          columns={[
            { key: 'name', header: 'Applicant', primary: true, width: '24%', sortValue: (a) => a.full_name,
              render: (a) => <PersonCell name={a.full_name} sub={`${applicationNo(a)}${ageFrom(a.dob) != null ? ` · ${ageFrom(a.dob)} yrs` : ''}`} /> },
            { key: 'stage', header: 'Stage', sortValue: (a) => STAGES.findIndex((s) => s.key === a.status),
              render: (a) => (
                <span className="block leading-tight">
                  <StatusPill tone={STAGE[a.status]?.tone}>{STAGE[a.status]?.label}</StatusPill>
                  <span className="block text-[0.7rem] text-subtle mt-1">{daysSince(stageSince(a))}d in stage</span>
                </span>
              ) },
            { key: 'center', header: 'Centre / Batch', sortValue: (a) => a.training_centers?.name,
              render: (a) => <span className="block leading-tight">{a.training_centers?.name || '—'}{a.batches?.name && <span className="block text-xs text-subtle">{a.batches.name}</span>}</span> },
            { key: 'guardian', header: 'Guardian', hideOnMobile: true,
              render: (a) => <span className="block leading-tight">{a.guardian_name || '—'}{a.guardian_phone && <span className="block text-xs text-subtle tabular-nums">{a.guardian_phone}</span>}</span> },
            { key: 'docs', header: 'Docs', align: 'center', sortValue: docsDone, render: (a) => <span className="tabular-nums">{docsDone(a)}/{DOCUMENTS.length}</span> },
            { key: 'fee', header: 'Fee', align: 'right', sortValue: balanceDue,
              render: (a) => netFee(a) === 0 ? <span className="text-subtle">—</span> : balanceDue(a) === 0
                ? <StatusPill tone="ok">Paid</StatusPill>
                : <span className="tabular-nums">{rupees(balanceDue(a))} <span className="text-xs text-subtle">due</span></span> },
            { key: 'ready', header: 'Ready', align: 'center', sortValue: readiness, render: (a) => <ReadinessRing value={readiness(a)} size={36} /> },
          ]}
        />
      )}

      {wizard && (
        <AdmissionWizard
          initial={wizard}
          centers={centers}
          batches={batches}
          monthlyRate={monthlyRate}
          actorName={actorName}
          onCancel={() => setWizard(null)}
          onSaved={handleSaved}
        />
      )}

      {selected && !wizard && (
        <AdmissionDrawer
          key={selected.id + (selected.updated_at || '')}
          admission={selected}
          actorName={actorName}
          admissionFeeType={admissionFeeType}
          onClose={() => setSelectedId(null)}
          onChanged={handleChanged}
          onEdit={() => editApplication(selected)}
          onPrint={() => setPrinting(selected)}
        />
      )}

      {printing && (
        <DocumentModal title={`Admission Form — ${printing.full_name}`} size="a4" onClose={() => setPrinting(null)}>
          <AdmissionForm admission={printing} />
        </DocumentModal>
      )}

      {flash && (
        <div role="status" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] rounded-full bg-pay-navy text-white text-sm font-semibold px-5 py-2.5 shadow-2xl inline-flex items-center gap-2">
          <CheckCircle2 size={16} /> {flash}
        </div>
      )}
    </div>
  )
}

function BoardCard({ a, onOpen }) {
  const age = ageFrom(a.dob)
  const waiting = daysSince(stageSince(a))
  const due = balanceDue(a)
  return (
    <article
      draggable={a.status !== 'enrolled'}
      onDragStart={(e) => { e.dataTransfer.setData('text/plain', a.id); e.dataTransfer.effectAllowed = 'move' }}
      className="group bg-surface rounded-xl shadow-card p-3 cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-pay-sky-2 transition"
      style={{ boxShadow: `inset 3px 0 0 ${STAGE_COLOR[a.status]}, var(--shadow-card)` }}
    >
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start gap-2.5">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-heading truncate group-hover:text-pay-action">{a.full_name}</p>
            <p className="text-[0.7rem] text-subtle truncate">{applicationNo(a)}{age != null ? ` · ${age} yrs` : ''}</p>
          </div>
          <ReadinessRing value={readiness(a)} size={34} />
        </div>
        <p className="text-xs text-body mt-2 truncate">{[a.training_centers?.name, a.batches?.name].filter(Boolean).join(' · ') || 'No centre yet'}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2.5 text-[0.68rem] font-semibold">
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${waiting > 7 && STAGE[a.status]?.open ? 'bg-red-50 text-red-700' : 'bg-pay-bg text-muted'}`}><Clock size={11} /> {waiting}d</span>
          {a.trial_date && a.status === 'trial' && <span className="inline-flex items-center gap-1 rounded-full bg-pay-bg text-muted px-2 py-0.5"><CalendarClock size={11} /> {formatDate(a.trial_date).slice(0, 6)}</span>}
          {netFee(a) > 0 && (
            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 ${due ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-700'}`}>
              <IndianRupee size={10} /> {due ? `${Number(due).toLocaleString('en-IN')} due` : 'Paid'}
            </span>
          )}
          <span className="rounded-full bg-pay-bg text-muted px-2 py-0.5">{docsDone(a)}/{DOCUMENTS.length} docs</span>
        </div>
      </button>
    </article>
  )
}
