import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export const PHOTO_BUCKET = 'student-photos'
// Passport-style 4:5 portrait, the shape of the ID card photo box
export const PHOTO_W = 480
export const PHOTO_H = 600

/**
 * Render the framed part of an image to a compact WebP (JPEG where WebP isn't supported).
 * crop: { x, y, scale, rotate } — the image's offset (px, frame space), zoom and quarter turns,
 * exactly as shown in the editor's frame of size frameW × frameH.
 */
export async function renderPhoto(img, crop, frameW, frameH) {
  const canvas = document.createElement('canvas')
  canvas.width = PHOTO_W
  canvas.height = PHOTO_H
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, PHOTO_W, PHOTO_H)
  ctx.imageSmoothingQuality = 'high'
  const k = PHOTO_W / frameW // frame px → output px
  ctx.translate(PHOTO_W / 2 + crop.x * k, PHOTO_H / 2 + crop.y * k)
  ctx.rotate((crop.rotate * Math.PI) / 2)
  const base = coverScale(img, frameW, frameH, crop.rotate) * crop.scale * k
  ctx.drawImage(img, (-img.naturalWidth * base) / 2, (-img.naturalHeight * base) / 2, img.naturalWidth * base, img.naturalHeight * base)

  for (const [type, quality] of [['image/webp', 0.82], ['image/jpeg', 0.85]]) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, type, quality))
    if (blob && blob.type === type) return blob
  }
  throw new Error('This browser could not process the photo.')
}

/** Scale at which the (possibly rotated) image just covers the frame */
export function coverScale(img, frameW, frameH, rotate = 0) {
  const [w, h] = rotate % 2 ? [img.naturalHeight, img.naturalWidth] : [img.naturalWidth, img.naturalHeight]
  return Math.max(frameW / w, frameH / h)
}

export function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => resolve({ img, url })
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file is not an image this browser can open.')) }
    img.src = url
  })
}

export const formatBytes = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`)

// ---------- Storage ----------

const cache = new Map() // path → { url, expires }

/** Upload a processed photo for a student, point the student at it and remove the old file. */
export async function saveStudentPhoto(student, blob) {
  const ext = blob.type === 'image/webp' ? 'webp' : 'jpg'
  const path = `${student.id}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: '31536000' })
  if (error) return { error: hint(error) }
  const { error: dbError } = await supabase.from('students').update({ photo_path: path }).eq('id', student.id)
  if (dbError) {
    await supabase.storage.from(PHOTO_BUCKET).remove([path])
    return { error: hint(dbError) }
  }
  if (student.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([student.photo_path])
  return { path }
}

export async function removeStudentPhoto(student) {
  const { error } = await supabase.from('students').update({ photo_path: null }).eq('id', student.id)
  if (error) return { error: hint(error) }
  if (student.photo_path) await supabase.storage.from(PHOTO_BUCKET).remove([student.photo_path])
  return {}
}

const hint = (e) => (/photo_path|bucket|not found/i.test(e.message || '') ? `${e.message} — run supabase/migrations/20261013_student_photos.sql first.` : e.message)

/** Signed links (valid 1 hour, cached) for the given students' photos: { [studentId]: url } */
export function useStudentPhotos(students) {
  const key = (students || []).map((s) => s?.photo_path || '').join('|')
  const [urls, setUrls] = useState({})
  useEffect(() => {
    let active = true
    const list = (students || []).filter((s) => s?.photo_path)
    // oxlint-disable-next-line react/set-state-in-effect -- clear when no student has a photo
    if (!list.length) { setUrls({}); return }
    const now = Date.now()
    const missing = [...new Set(list.map((s) => s.photo_path).filter((p) => !(cache.get(p)?.expires > now)))]
    const done = () => {
      if (!active) return
      setUrls(Object.fromEntries(list.map((s) => [s.id, cache.get(s.photo_path)?.url]).filter(([, u]) => u)))
    }
    if (!missing.length) return done()
    supabase.storage.from(PHOTO_BUCKET).createSignedUrls(missing, 3600).then(({ data }) => {
      (data || []).forEach((d) => { if (d.signedUrl) cache.set(d.path, { url: d.signedUrl, expires: now + 50 * 60 * 1000 }) })
      done()
    })
    return () => { active = false }
    // oxlint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the set of photos changes
  }, [key])
  return urls
}
