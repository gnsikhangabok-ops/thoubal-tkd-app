import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Trash2, X, AlertTriangle, ShieldAlert } from 'lucide-react'
import { btnOutline, inputCls } from '../lib/adminUi'

/**
 * Confirmation for deleting a record.
 *   title, message      — what is being deleted
 *   linked              — [{ label, n }] records that go with it (shown when n > 0)
 *   blocked             — reason it can't be deleted (e.g. "deactivate instead"); hides the button
 *   confirmText         — when set, this text must be typed to enable the button
 *   onConfirm           — async; return an error message (string) to keep the dialog open
 *   extra               — optional node (e.g. an alternative action)
 */
export default function ConfirmDelete({ title, message, linked = [], blocked, confirmText, onConfirm, onClose, extra, actionLabel = 'Delete' }) {
  const [typed, setTyped] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const shown = linked.filter((l) => l.n > 0)
  const total = shown.reduce((s, l) => s + l.n, 0)
  const ok = !confirmText || typed.trim().toLowerCase() === confirmText.trim().toLowerCase()

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !busy && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, busy])

  async function go() {
    setBusy(true)
    setError('')
    const err = await onConfirm()
    if (err) { setError(err); setBusy(false) }
  }

  return createPortal(
    <div className="clinic paytm !bg-pay-navy/60 fixed inset-0 z-[75] grid place-items-center p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="confirm-del-title">
      <div className="w-full max-w-[460px] bg-surface rounded-3xl shadow-2xl overflow-hidden animate-[slideIn_.18s_ease-out]">
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <span className="grid place-items-center w-12 h-12 rounded-2xl bg-red-50 text-red-600 shrink-0"><Trash2 size={22} /></span>
          <div className="min-w-0 flex-1">
            <h2 id="confirm-del-title" className="text-lg font-bold text-heading">{title}</h2>
            {message && <p className="text-sm text-muted mt-0.5">{message}</p>}
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="grid place-items-center w-9 h-9 rounded-full text-heading hover:bg-pay-bg shrink-0" aria-label="Close"><X size={20} /></button>
        </div>
        <div className="px-6 pb-6 flex flex-col gap-4">
          {shown.length > 0 && (
            <div className="rounded-2xl border border-pay-line bg-pay-bg p-4">
              <p className="text-sm font-semibold text-heading inline-flex items-center gap-2">
                <AlertTriangle size={16} className="text-[color:var(--status-warn)]" />
                {blocked ? `${total} linked record${total === 1 ? '' : 's'}` : `${total} linked record${total === 1 ? '' : 's'} will also be deleted`}
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {shown.map((l) => <li key={l.label} className="flex justify-between gap-2 text-body"><span className="truncate">{l.label}</span><strong className="tabular-nums text-heading">{l.n}</strong></li>)}
              </ul>
            </div>
          )}
          {blocked && <p className="rounded-2xl border border-[var(--gold,var(--color-pay-line))] bg-pay-sky/40 p-4 text-sm text-body">{blocked}</p>}
          {extra}
          {!blocked && confirmText && (
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-semibold text-muted">Type <strong className="text-heading">{confirmText}</strong> to confirm</span>
              <input className={inputCls} value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus autoComplete="off" spellCheck={false} />
            </label>
          )}
          {error && <p role="alert" className="bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm inline-flex gap-2"><ShieldAlert size={16} className="shrink-0 mt-0.5" />{error}</p>}
          <div className="flex gap-2">
            {!blocked && (
              <button type="button" onClick={go} disabled={!ok || busy} autoFocus={!confirmText}
                className="inline-flex items-center justify-center gap-1.5 rounded-full px-6 py-2.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                <Trash2 size={15} /> {busy ? 'Deleting…' : actionLabel}
              </button>
            )}
            <button type="button" className={btnOutline} onClick={onClose} disabled={busy}>{blocked ? 'Close' : 'Cancel'}</button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
