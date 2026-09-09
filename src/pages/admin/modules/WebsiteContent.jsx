import { useEffect, useState } from 'react'
import { supabase } from '../../../lib/supabaseClient'
import { Upload, Check, ImageIcon } from 'lucide-react'

// Defines every editable field on the public site.
// type: 'text' | 'textarea' | 'image'
const FIELD_GROUPS = [
  {
    label: 'Hero Section',
    fields: [
      { key: 'hero_kicker', label: 'Kicker text', type: 'text', placeholder: 'Khangabok, Thoubal · Manipur' },
      { key: 'hero_headline', label: 'Headline', type: 'text', placeholder: 'Discipline earns the black belt.' },
      { key: 'hero_body', label: 'Body text', type: 'textarea', placeholder: 'Thoubal Taekwondo Academy trains students...' },
    ],
  },
  {
    label: 'About Section',
    fields: [
      { key: 'about_image', label: 'Academy photo', type: 'image' },
      { key: 'about_heading', label: 'Heading', type: 'text', placeholder: 'Built on respect, discipline, and hard work' },
      { key: 'about_paragraph_1', label: 'Paragraph 1', type: 'textarea' },
      { key: 'about_paragraph_2', label: 'Paragraph 2', type: 'textarea' },
      { key: 'stat_students', label: 'Stat: Students trained', type: 'text', placeholder: '200+' },
      { key: 'stat_medals', label: 'Stat: State & national medals', type: 'text', placeholder: '15+' },
      { key: 'stat_belts', label: 'Stat: Belt ranks taught', type: 'text', placeholder: '8' },
    ],
  },
  {
    label: 'Coaches',
    fields: [
      { key: 'coach_1_photo', label: 'Head Coach photo', type: 'image' },
      { key: 'coach_1_name', label: 'Head Coach name', type: 'text', placeholder: 'Ranbir Moirangthem' },
      { key: 'coach_1_role', label: 'Head Coach role', type: 'text', placeholder: 'Head Coach · NIS Certified (SAI Bangalore)' },
      { key: 'coach_2_photo', label: 'Assistant Coach photo', type: 'image' },
      { key: 'coach_2_name', label: 'Assistant Coach name', type: 'text', placeholder: 'Jemsh Saikhom' },
      { key: 'coach_2_role', label: 'Assistant Coach role', type: 'text', placeholder: 'Assistant Coach · State Taekwondo Referee' },
    ],
  },
  {
    label: 'Gallery',
    fields: [
      { key: 'gallery_1', label: 'Gallery photo 1 (large)', type: 'image' },
      { key: 'gallery_2', label: 'Gallery photo 2', type: 'image' },
      { key: 'gallery_3', label: 'Gallery photo 3', type: 'image' },
      { key: 'gallery_4', label: 'Gallery photo 4', type: 'image' },
      { key: 'gallery_5', label: 'Gallery photo 5', type: 'image' },
      { key: 'gallery_6', label: 'Gallery photo 6 (wide)', type: 'image' },
    ],
  },
  {
    label: 'Contact',
    fields: [
      { key: 'contact_address', label: 'Address', type: 'text', placeholder: 'Khangabok, Thoubal, Manipur' },
      { key: 'contact_phone', label: 'Phone number', type: 'text', placeholder: '+91 XXXXX XXXXX' },
      { key: 'contact_email', label: 'Email', type: 'text', placeholder: 'info@thoubaltkd.in' },
    ],
  },
]

const inputCls = "px-2.5 py-2.5 border border-black/10 w-full"

export default function WebsiteContent() {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState(null)
  const [savedKey, setSavedKey] = useState(null)
  const [uploadingKey, setUploadingKey] = useState(null)

  useEffect(() => {
    loadContent()
  }, [])

  async function loadContent() {
    setLoading(true)
    const { data, error } = await supabase.from('site_content').select('*')
    if (error) {
      setError(error.message)
    } else {
      const map = {}
      data.forEach((row) => { map[row.key] = row.value })
      setContent(map)
    }
    setLoading(false)
  }

  async function saveField(key, value) {
    setSavingKey(key)
    setError('')

    const { error } = await supabase
      .from('site_content')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })

    setSavingKey(null)
    if (error) {
      setError(error.message)
    } else {
      setContent((prev) => ({ ...prev, [key]: value }))
      setSavedKey(key)
      setTimeout(() => setSavedKey(null), 1500)
    }
  }

  function handleTextChange(key, value) {
    setContent((prev) => ({ ...prev, [key]: value }))
  }

  function handleTextBlur(key) {
    saveField(key, content[key] || '')
  }

  async function handleImageUpload(key, file) {
    if (!file) return
    setUploadingKey(key)
    setError('')

    const ext = file.name.split('.').pop()
    const path = `${key}-${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('site-images')
      .upload(path, file, { upsert: true })

    if (uploadError) {
      setError(uploadError.message)
      setUploadingKey(null)
      return
    }

    const { data: urlData } = supabase.storage.from('site-images').getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    await saveField(key, publicUrl)
    setUploadingKey(null)
  }

  return (
    <div className="p-12 max-md:p-6 max-w-[900px] mx-auto">
      <h1 className="font-display text-ink uppercase text-3xl mb-2">Website Content</h1>
      <p className="text-charcoal mb-9">
        Edit the text and images shown on the public homepage. Changes save automatically and go live immediately.
      </p>

      {error && <p className="text-brand-red mb-6">{error}</p>}

      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="flex flex-col gap-12">
          {FIELD_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="font-display text-ink uppercase text-sm tracking-[0.08em]">{group.label}</h2>
                <div className="h-px flex-1 bg-black/10" />
              </div>

              <div className="flex flex-col gap-5">
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-[0.85rem] font-semibold text-ink block mb-1.5">
                      {field.label}
                    </label>

                    {field.type === 'image' ? (
                      <div className="flex items-center gap-4">
                        <div className="w-28 h-28 bg-black/5 border border-black/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {content[field.key] ? (
                            <img src={content[field.key]} alt={field.label} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon size={24} className="text-charcoal/30" />
                          )}
                        </div>
                        <label className="inline-flex items-center gap-2 px-4 py-2.5 border border-ink text-ink text-sm font-display uppercase tracking-wide cursor-pointer hover:bg-ink hover:text-chalk">
                          <Upload size={15} />
                          {uploadingKey === field.key ? 'Uploading…' : 'Upload Photo'}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload(field.key, e.target.files?.[0])}
                            disabled={uploadingKey === field.key}
                          />
                        </label>
                        {savedKey === field.key && (
                          <span className="text-brand-red text-sm flex items-center gap-1"><Check size={14} /> Saved</span>
                        )}
                      </div>
                    ) : field.type === 'textarea' ? (
                      <div className="relative">
                        <textarea
                          rows={3}
                          value={content[field.key] || ''}
                          onChange={(e) => handleTextChange(field.key, e.target.value)}
                          onBlur={() => handleTextBlur(field.key)}
                          placeholder={field.placeholder}
                          className={`${inputCls} font-body`}
                        />
                        {savingKey === field.key && <span className="absolute top-2 right-2 text-[0.7rem] text-charcoal">Saving…</span>}
                        {savedKey === field.key && <span className="absolute top-2 right-2 text-[0.7rem] text-brand-red flex items-center gap-1"><Check size={12} /> Saved</span>}
                      </div>
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={content[field.key] || ''}
                          onChange={(e) => handleTextChange(field.key, e.target.value)}
                          onBlur={() => handleTextBlur(field.key)}
                          placeholder={field.placeholder}
                          className={inputCls}
                        />
                        {savingKey === field.key && <span className="absolute top-1/2 -translate-y-1/2 right-3 text-[0.7rem] text-charcoal">Saving…</span>}
                        {savedKey === field.key && <span className="absolute top-1/2 -translate-y-1/2 right-3 text-[0.7rem] text-brand-red flex items-center gap-1"><Check size={12} /> Saved</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
