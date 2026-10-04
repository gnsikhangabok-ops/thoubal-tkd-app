import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)

async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) console.error('Error loading profile:', error.message)
  return data ?? null
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null) // { id, role, full_name, ... }
  const [loading, setLoading] = useState(true)
  const loadedUserId = useRef(null)
  const fetchSeq = useRef(0) // only the most recent profile fetch may update state

  useEffect(() => {
    let active = true

    // onAuthStateChange also fires INITIAL_SESSION on load, so no separate getSession() is needed.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      const userId = newSession?.user?.id ?? null

      if (!userId) {
        loadedUserId.current = null
        fetchSeq.current++
        setProfile(null)
        setLoading(false)
        return
      }

      // Token refreshes keep the same user — don't reload the profile or flash a loader.
      if (userId === loadedUserId.current) return
      loadedUserId.current = userId

      // Mark as loading synchronously so routes never see "session but no role yet"
      // (e.g. right after signIn resolves) and bounce the user to /login or /unauthorized.
      setLoading(true)

      // Supabase advises against awaiting other supabase calls inside this callback (it can deadlock).
      const seq = ++fetchSeq.current
      setTimeout(async () => {
        const data = await fetchProfile(userId)
        if (!active || seq !== fetchSeq.current) return
        setProfile(data)
        setLoading(false)
      }, 0)
    })

    return () => {
      active = false
      loadedUserId.current = null // so a remount (e.g. StrictMode) loads the profile again
      listener.subscription.unsubscribe()
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    const userId = loadedUserId.current
    if (!userId) return
    const seq = ++fetchSeq.current
    const data = await fetchProfile(userId)
    if (seq !== fetchSeq.current) return
    setProfile(data)
    setLoading(false)
  }, [])

  async function signIn(email, password) {
    return supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    return supabase.auth.signOut()
  }

  const value = {
    session,
    user: session?.user ?? null,
    profile,
    role: profile?.role ?? null,
    loading,
    signIn,
    signOut,
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}

