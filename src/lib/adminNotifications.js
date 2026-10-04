import { useEffect, useState } from 'react'
import { Inbox, Megaphone } from 'lucide-react'
import { supabase } from './supabaseClient'

const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(1, mins)} min ago`
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

// Staff bell: new website enquiries (the unread count) plus the latest notices.
// Refreshes every 2 minutes while the admin area is open.
export function useAdminNotifications() {
  const [state, setState] = useState({ items: [], unread: 0 })

  useEffect(() => {
    let active = true
    async function load() {
      const [enq, notices] = await Promise.all([
        supabase.from('enquiries').select('id, child_name, program_interested, created_at', { count: 'exact' }).eq('status', 'new').order('created_at', { ascending: false }).limit(5),
        supabase.from('notices').select('id, title, body, created_at').order('created_at', { ascending: false }).limit(3),
      ])
      if (!active) return
      const items = [
        ...(enq.data || []).map((e) => ({
          id: `enq-${e.id}`, icon: Inbox, unread: true, to: '/admin/enquiries',
          title: `New enquiry: ${e.child_name}`, body: e.program_interested, time: timeAgo(e.created_at),
        })),
        ...(notices.data || []).map((n) => ({
          id: `notice-${n.id}`, icon: Megaphone, to: '/admin/notices',
          title: n.title, body: n.body, time: timeAgo(n.created_at),
        })),
      ]
      setState({ items, unread: enq.count ?? (enq.data || []).length })
    }
    load()
    const timer = setInterval(load, 120000)
    return () => { active = false; clearInterval(timer) }
  }, [])

  return state
}

export { timeAgo }
