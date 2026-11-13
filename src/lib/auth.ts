import { useSyncExternalStore } from 'react'
import { AUTH_STORAGE_KEY, supabase } from './supabase'

export type User = { id: string; email: string }

// The signed-in user, kept by the app rather than read from supabase-js on each start. With no network and an
// expired access token, supabase-js reports no session until it can refresh, but the books cached on this device
// should still open. So the user stays signed in here until they sign out or Supabase drops the stored session.
const KEY = 'mullon:user'
const read = (): User | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null')
  } catch {
    return null
  }
}

let user = read()
const listeners = new Set<() => void>()
const set = (next: User | null) => {
  if (next?.id === user?.id && next?.email === user?.email) return
  user = next
  if (next) localStorage.setItem(KEY, JSON.stringify(next))
  else localStorage.removeItem(KEY)
  listeners.forEach((l) => l())
}

supabase.auth.onAuthStateChange((event, session) => {
  if (session) set({ id: session.user.id, email: session.user.email ?? '' })
  else if (event === 'SIGNED_OUT' || !localStorage.getItem(AUTH_STORAGE_KEY)) set(null)
})

export const getUser = () => user

export const useUser = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => user,
  )
