import { onlineManager, useIsFetching, useIsMutating, useQueryClient } from '@tanstack/react-query'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSyncExternalStore } from 'react'
import { Title, TopBar } from '@/components/top-bar'
import { Button } from '@/components/ui/button'
import { useUser } from '@/lib/auth'
import { booksQuery, useBooks } from '@/lib/queries'
import { IS_LIVE, supabase } from '@/lib/supabase'

export const Route = createFileRoute('/_authed/account')({ component: Account })

const ago = (t: number) => {
  const s = (Date.now() - t) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  return new Date(t).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
}

function Account() {
  const user = useUser()!
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { dataUpdatedAt, isError, refetch } = useBooks()
  const online = useSyncExternalStore(onlineManager.subscribe.bind(onlineManager), () => onlineManager.isOnline())
  const busy = useIsFetching({ queryKey: ['books'] }) + useIsMutating({ mutationKey: ['saveBook'] }) > 0
  const pending = useIsMutating({ mutationKey: ['saveBook'] })

  const status = !online
    ? pending
      ? 'Offline. Your changes will sync when you’re back online.'
      : 'Offline. Showing the books saved on this device.'
    : busy
      ? 'Syncing…'
      : isError
        ? 'Couldn’t sync. It will try again shortly.'
        : dataUpdatedAt
          ? `Last synced ${ago(dataUpdatedAt)}`
          : ''

  const signOut = async () => {
    await supabase.auth.signOut({ scope: 'local' })
    queryClient.removeQueries({ queryKey: booksQuery(user.id).queryKey })
    navigate({ to: '/sign-in', replace: true })
  }

  return (
    <>
      <TopBar back={{ to: '/' }} backLabel="All books">
        <Title>Account</Title>
      </TopBar>
      <p className="mt-2 mb-5 text-pretty">
        Signed in as <strong className="font-medium">{user.email}</strong>. Books you add or change here show up on your other devices.
      </p>
      <p className="mb-4 text-[13px] text-muted-foreground">{status}</p>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="lg" className="rounded-full px-4" onClick={() => refetch()} disabled={!online}>
          Sync now
        </Button>
        <span className="flex-1" />
        <Button variant="ghost" size="lg" className="text-destructive hover:text-destructive" onClick={signOut}>
          Sign out
        </Button>
      </div>
      {!IS_LIVE && <p className="mt-8 text-[13px] text-muted-foreground">This is a preview. Books here are kept separately from your real books.</p>}
    </>
  )
}
