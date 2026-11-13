import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { useEffect } from 'react'
import { toast } from 'sonner'
import { getUser, type User, useUser } from '@/lib/auth'
import { findCovers } from '@/lib/covers'
import { importPrototypeBooks } from '@/lib/prototype'
import { useBooks } from '@/lib/queries'

// Every screen with books needs an account; signed-out visitors go to the sign-in screen.
export const Route = createFileRoute('/_authed')({
  beforeLoad: () => {
    if (!getUser()) throw redirect({ to: '/sign-in' })
  },
  component: Authed,
})

function Authed() {
  const user = useUser()
  // Signing out clears the user before the guard above redirects; render nothing in between.
  return user ? <SignedIn user={user} /> : null
}

function SignedIn({ user }: { user: User }) {
  const { data: books } = useBooks()

  useEffect(() => {
    importPrototypeBooks(user.id)
      .then((n) => n && toast.success(`Brought over ${n} ${n === 1 ? 'book' : 'books'} saved on this device.`))
      .catch((e) => console.warn('Importing the prototype’s books failed; will retry next time', e))
  }, [user.id])

  useEffect(() => {
    if (books?.some((b) => !b.cover)) void findCovers(user.id)
  }, [books, user.id])

  return <Outlet />
}
