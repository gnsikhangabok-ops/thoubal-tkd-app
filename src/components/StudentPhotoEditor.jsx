import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload, Camera, RotateCw, ZoomIn, ZoomOut, Trash2, Check, Sparkles, ImagePlus } from 'lucide-react'
import { btnPrimary, btnOutline } from '../lib/adminUi'
import { initials } from '../lib/people'
import { renderPhoto, coverScale, loadImage, formatBytes, saveStudentPhoto, removeStudentPhoto, PHOTO_W, PHOTO_H } from '../lib/studentPhotos'

const FRAME_W = 280
const FRAME_H = 350
const MAX_FILE = 25 * 1024 * 1024

/**
 * Upload a student photo: pick / drop / take a photo → position it in a passport frame →
 * it is cropped to 4:5, resized to 480×600 and compressed to WebP in the browser before upload.
 */
export default function StudentPhotoEditor({ student, currentUrl, onClose, onSaved }) {
  const [stage, setStage] = useState('pick') // pick | edit | saving | done
  const [source, setSource] = useState(null) // { img, url, size, name }
  const [crop, setCrop] = useState({ x: 0, y: 0, scale: 1, rotate: 0 })
  const [result, setResult] = useState(null) // { url, size }
  const [error, setError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef(null)
  const cameraRef = useRef(null)
  const drag = useRef(null)

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && stage !== 'saving' && onClose()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, stage])

  // Free object URLs when they're replaced or the editor closes
  useEffect(() => () => source?.url && URL.revokeObjectURL(source.url), [source])
  useEffect(() => () => result?.url && URL.revokeObjectURL(result.url), [result])

  async function pick(file) {
    setError('')
    if (!file) return
    if (!file.type.startsWith('image/')) return setError('Please choose a photo (JPG, PNG, HEIC or WebP).')
    if (file.size > MAX_FILE) return setError(`That file is ${formatBytes(file.size)} — please use one under 25 MB.`)
    try {
      const { img, url } = await loadImage(file)
      setSource({ img, url, size: file.size, name: file.name })
      setCrop({ x: 0, y: 0, scale: 1, rotate: 0 })
      setStage('edit')
    } catch (e) {
      setError(e.message)
    }
  }

  // Keep the photo covering the whole frame while panning / zooming / rotating
  function clamp(c) {
    if (!source) return c
    const base = coverScale(source.img, FRAME_W, FRAME_H, c.rotate) * c.scale
    const [w, h] = c.rotate % 2 ? [source.img.naturalHeight, source.img.naturalWidth] : [source.img.naturalWidth, source.img.naturalHeight]
    const mx = Math.max(0, (w * base - FRAME_W) / 2)
    const my = Math.max(0, (h * base - FRAME_H) / 2)
    return { ...c, x: Math.min(mx, Math.max(-mx, c.x)), y: Math.min(my, Math.max(-my, c.y)) }
  }
  const update = (patch) => setCrop((c) => clamp({ ...c, ...patch }))

  function onPointerDown(e) {
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { px: e.clientX, py: e.clientY, x: crop.x, y: crop.y }
  }
  function onPointerMove(e) {
    if (!drag.current) return
    const d = drag.current
    setCrop((c) => clamp({ ...c, x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py }))
  }
  function onWheel(e) {
    update({ scale: Math.min(4, Math.max(1, crop.scale * (e.deltaY < 0 ? 1.08 : 1 / 1.08))) })
  }
  function onKeyNudge(e) {
    const step = e.shiftKey ? 20 : 6
    const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }
    if (!map[e.key]) return
    e.preventDefault()
    update({ x: crop.x + map[e.key][0], y: crop.y + map[e.key][1] })
  }

  async function save() {
    setStage('saving')
    setError('')
    try {
      const blob = await renderPhoto(source.img, crop, FRAME_W, FRAME_H)
      const res = await saveStudentPhoto(student, blob)
      if (res.error) throw new Error(res.error)
      setResult({ url: URL.createObjectURL(blob), size: blob.size, type: blob.type })
      setStage('done')
      onSaved(res.path)
    } catch (e) {
      setError(e.message)
      setStage('edit')
    }
  }

  async function remove() {
    if (!window.confirm(`Remove ${student.full_name}'s photo?`)) return
    const res = await removeStudentPhoto(student)
    if (res.error) return setError(res.error)
    onSaved(null)
    onClose()
  }

  const base = source ? coverScale(source.img, FRAME_W, FRAME_H, crop.rotate) * crop.scale : 1
  const saved = result && source ? Math.max(0, Math.round((1 - result.size / source.size) * 100)) : 0

  return createPortal(
    <div className="clinic paytm !bg-pay-navy/60 fixed inset-0 z-[70] grid place-items-center p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`Photo for ${student.full_name}`}>
      <div className="w-full max-w-[660px] max-h-[94vh] overflow-y-auto bg-surface rounded-3xl shadow-2xl overflow-hidden animate-[slideIn_.18s_ease-out]">
        <div className="pay-stat !rounded-none !px-6 !py-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-white/75">Student photo</p>
            <h2 className="!text-white text-xl font-bold truncate">{student.full_name}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={stage === 'saving'} className="grid place-items-center w-9 h-9 rounded-full text-white hover:bg-white/15 shrink-0" aria-label="Close"><X size={20} /></button>
        </div>

        <div className="p-6">
          {stage === 'pick' && (
            <>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files?.[0]) }}
                className={`flex items-center gap-5 rounded-2xl border-2 border-dashed p-5 transition ${dragOver ? 'border-pay-action bg-pay-sky' : 'border-pay-line bg-pay-bg'}`}
              >
                <span className="w-[88px] h-[110px] rounded-xl overflow-hidden bg-pay-sky grid place-items-center shrink-0 ring-1 ring-pay-line">
                  {currentUrl ? <img src={currentUrl} alt="Current photo" className="w-full h-full object-cover" /> : <span className="text-2xl font-bold text-pay-action">{initials(student.full_name)}</span>}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-heading">{currentUrl ? 'Replace the photo' : 'Add a photo'}</p>
                  <p className="text-sm text-muted mt-0.5">Drag a photo here, choose a file or take one with the camera.</p>
                  <p className="text-xs text-subtle mt-2 inline-flex items-center gap-1"><Sparkles size={12} className="text-[var(--gold,var(--color-pay-action))]" /> Auto-cropped to passport size and compressed before upload.</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                <button type="button" className={btnPrimary} onClick={() => fileRef.current?.click()}><Upload size={16} /> Choose photo</button>
                <button type="button" className={btnOutline} onClick={() => cameraRef.current?.click()}><Camera size={16} /> Take photo</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
              <input ref={cameraRef} type="file" accept="image/*" capture="user" hidden onChange={(e) => { pick(e.target.files?.[0]); e.target.value = '' }} />
              {student.photo_path && (
                <button type="button" onClick={remove} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-[color:var(--status-bad)]"><Trash2 size={14} /> Remove current photo</button>
              )}
            </>
          )}

          {(stage === 'edit' || stage === 'saving') && source && (
            <div className="grid sm:grid-cols-[auto_1fr] gap-6 items-start">
              <div className="mx-auto">
                <div
                  className="relative overflow-hidden rounded-2xl bg-pay-bg ring-1 ring-pay-line cursor-grab active:cursor-grabbing touch-none select-none outline-none focus-visible:ring-2 focus-visible:ring-pay-action"
                  style={{ width: FRAME_W, height: FRAME_H }}
                  onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={() => { drag.current = null }} onPointerCancel={() => { drag.current = null }}
                  onWheel={onWheel} onKeyDown={onKeyNudge} tabIndex={0}
                  aria-label="Photo position — drag, scroll to zoom, or use the arrow keys"
                >
                  <img src={source.url} alt="" draggable={false} className="absolute left-1/2 top-1/2 max-w-none pointer-events-none"
                    style={{ width: source.img.naturalWidth * base, height: source.img.naturalHeight * base, transform: `translate(-50%, -50%) translate(${crop.x}px, ${crop.y}px) rotate(${crop.rotate * 90}deg)` }} />
                  {/* Passport guide: face oval and thirds */}
                  <svg className="absolute inset-0 pointer-events-none" width={FRAME_W} height={FRAME_H} aria-hidden="true">
                    <defs><mask id="oval"><rect width="100%" height="100%" fill="white" /><ellipse cx={FRAME_W / 2} cy={FRAME_H * 0.42} rx={FRAME_W * 0.3} ry={FRAME_H * 0.3} fill="black" /></mask></defs>
                    <rect width="100%" height="100%" fill="rgba(11,21,48,0.35)" mask="url(#oval)" />
                    <ellipse cx={FRAME_W / 2} cy={FRAME_H * 0.42} rx={FRAME_W * 0.3} ry={FRAME_H * 0.3} fill="none" stroke="#E6C877" strokeWidth="2" strokeDasharray="6 5" />
                    {[1, 2].map((i) => <line key={`v${i}`} x1={(FRAME_W * i) / 3} x2={(FRAME_W * i) / 3} y1="0" y2={FRAME_H} stroke="rgba(255,255,255,0.25)" />)}
                    {[1, 2].map((i) => <line key={`h${i}`} y1={(FRAME_H * i) / 3} y2={(FRAME_H * i) / 3} x1="0" x2={FRAME_W} stroke="rgba(255,255,255,0.25)" />)}
                  </svg>
                  {stage === 'saving' && <div className="absolute inset-0 grid place-items-center bg-pay-navy/60 text-white text-sm font-semibold">Compressing & uploading…</div>}
                </div>
                <p className="text-[0.7rem] text-subtle text-center mt-2">Drag to position · fit the face inside the oval</p>
              </div>

              <div className="flex flex-col gap-4 min-w-0">
                <div>
                  <span className="text-xs font-semibold text-muted">Zoom</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button type="button" onClick={() => update({ scale: Math.max(1, crop.scale / 1.15) })} className="grid place-items-center w-8 h-8 rounded-full border border-pay-line hover:bg-pay-bg" aria-label="Zoom out"><ZoomOut size={15} /></button>
                    <input type="range" min="1" max="4" step="0.01" value={crop.scale} onChange={(e) => update({ scale: Number(e.target.value) })} className="flex-1 min-w-0 accent-[var(--color-pay-action)]" aria-label="Zoom" />
                    <button type="button" onClick={() => update({ scale: Math.min(4, crop.scale * 1.15) })} className="grid place-items-center w-8 h-8 rounded-full border border-pay-line hover:bg-pay-bg" aria-label="Zoom in"><ZoomIn size={15} /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={`${btnOutline} !px-4`} onClick={() => update({ rotate: (crop.rotate + 1) % 4, x: 0, y: 0 })}><RotateCw size={15} /> Rotate</button>
                  <button type="button" className={`${btnOutline} !px-4`} onClick={() => setStage('pick')}><ImagePlus size={15} /> Other photo</button>
                </div>
                <div className="rounded-xl bg-pay-bg p-3 text-xs text-muted">
                  <p><strong className="text-heading">Original:</strong> {source.img.naturalWidth}×{source.img.naturalHeight} · {formatBytes(source.size)}</p>
                  <p className="mt-0.5"><strong className="text-heading">Saved as:</strong> {PHOTO_W}×{PHOTO_H} WebP, about 30–80 KB</p>
                </div>
                <button type="button" className={btnPrimary} onClick={save} disabled={stage === 'saving'}><Check size={16} /> {stage === 'saving' ? 'Saving…' : 'Save photo'}</button>
              </div>
            </div>
          )}

          {stage === 'done' && result && (
            <div className="text-center">
              <div className="flex items-end justify-center gap-6">
                <img src={result.url} alt={`New photo of ${student.full_name}`} className="w-[150px] h-[188px] object-cover rounded-2xl shadow-card ring-4 ring-[var(--gold,var(--color-pay-sky))]" />
                {/* ID card preview */}
                <div className="w-[214px] h-[135px] rounded-xl overflow-hidden bg-white text-left shadow-card ring-1 ring-black/10">
                  <div className="h-[34px] px-2.5 flex items-center text-white text-[0.6rem] font-bold" style={{ background: 'linear-gradient(135deg,#002E6E,#0057A8 60%,#00BAF2)' }}>THOUBAL TAEKWONDO ACADEMY</div>
                  <div className="flex gap-2 p-2.5">
                    <img src={result.url} alt="" className="w-[48px] h-[60px] object-cover rounded" />
                    <div className="text-[#0B2350] min-w-0">
                      <p className="text-[0.62rem] font-bold truncate">{student.full_name}</p>
                      <p className="text-[0.52rem] text-[#5B6B82]">ID card preview</p>
                    </div>
                  </div>
                </div>
              </div>
              <p className="mt-5 text-lg font-bold text-heading inline-flex items-center gap-2"><Check size={20} className="text-[color:var(--status-ok)]" /> Photo saved</p>
              <p className="text-sm text-muted mt-1">
                Compacted <strong className="text-heading">{formatBytes(source.size)}</strong> → <strong className="text-heading">{formatBytes(result.size)}</strong>
                {saved > 0 && <span className="ml-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-xs font-semibold">{saved}% smaller</span>}
              </p>
              <p className="text-xs text-subtle mt-1">{PHOTO_W}×{PHOTO_H} · {result.type === 'image/webp' ? 'WebP' : 'JPEG'} · private, staff and the student only</p>
              <button type="button" className={`${btnPrimary} mt-5`} onClick={onClose}>Done</button>
            </div>
          )}

          {error && <p role="alert" className="mt-4 bg-red-50 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</p>}
        </div>
      </div>
    </div>,
    document.body,
  )
}
