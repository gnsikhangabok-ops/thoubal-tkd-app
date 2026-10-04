import { useMemo, useState } from 'react'

/**
 * Search + filter + sort state for a list page.
 *
 *   const list = useListTools(rows, {
 *     search: (r) => [r.full_name, r.phone],          // text fields searched
 *     filters: {
 *       status: (r) => (r.active ? 'active' : 'inactive'),      // equals the chip value
 *       day: { match: (r, day) => r.days.includes(day) },     // custom match
 *     },
 *     sorts: { name: (a, b) => a.full_name.localeCompare(b.full_name) },
 *     defaultSort: 'name',
 *   })
 *   list.result  // rows after search, filters and sort
 */
export function useListTools(rows, { search, filters = {}, sorts = {}, defaultSort = '' } = {}) {
  const [query, setQuery] = useState('')
  const [filterValues, setFilterValues] = useState({})
  const [sort, setSort] = useState(defaultSort)

  const result = useMemo(() => {
    const q = query.trim().toLowerCase()
    let out = rows.filter((row) => {
      if (q && search) {
        const hay = search(row).filter(Boolean).join(' ').toLowerCase()
        if (!hay.includes(q)) return false
      }
      return Object.entries(filterValues).every(([key, value]) => {
        const f = filters[key]
        if (!value || !f) return true
        return typeof f === 'function' ? f(row) === value : f.match(row, value)
      })
    })
    if (sort && sorts[sort]) out = [...out].sort(sorts[sort])
    return out
    // filters/sorts/search are static config objects defined by each page
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, query, filterValues, sort])

  const setFilter = (key, value) => setFilterValues((prev) => ({ ...prev, [key]: value }))
  const activeCount = Object.values(filterValues).filter(Boolean).length + (query.trim() ? 1 : 0)
  const reset = () => { setQuery(''); setFilterValues({}) }

  // Rows matching one filter value, ignoring search and other filters (for tab counts)
  const countFor = (key, value) => {
    const f = filters[key]
    if (!value || !f) return rows.length
    return rows.filter((row) => (typeof f === 'function' ? f(row) === value : f.match(row, value))).length
  }

  return { query, setQuery, filterValues, setFilter, sort, setSort, result, total: rows.length, activeCount, reset, countFor }
}

function csvCell(value) {
  const s = value == null ? '' : String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

/** Download rows as a CSV file that opens in Excel. columns: [{ label, value: (row) => any }] */
export function exportCsv(filename, rows, columns) {
  const lines = [
    columns.map((c) => csvCell(c.label)).join(','),
    ...rows.map((row) => columns.map((c) => csvCell(c.value(row))).join(',')),
  ]
  // BOM so Excel reads ₹ and non-English names correctly
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const byText = (get) => (a, b) => String(get(a) ?? '').localeCompare(String(get(b) ?? ''), 'en', { sensitivity: 'base' })
export const byNumberDesc = (get) => (a, b) => (Number(get(b)) || 0) - (Number(get(a)) || 0)
export const byDateDesc = (get) => (a, b) => String(get(b) ?? '').localeCompare(String(get(a) ?? ''))

/** Filter chip options from a list of values: opts(['a','b'], { a: 'Label A' }) */
const sentence = (v) => { const t = String(v).replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1) }
export const opts = (values, labels = {}) => values.map((v) => ({ value: v, label: labels[v] ?? sentence(v) }))
