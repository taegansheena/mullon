import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister'
import { MutationObserver, onlineManager, QueryClient, queryOptions, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useUser } from './auth'
import { type Book, fromRow, type Row, toRow } from './books'
import { supabase, TABLE } from './supabase'

const MONTH = 1000 * 60 * 60 * 24 * 30

// TanStack Query assumes it starts online and only learns otherwise from an 'offline' event. When the app opens
// with no connection, start offline so edits wait in the queue instead of failing.
onlineManager.setOnline(navigator.onLine)

export const queryClient = new QueryClient({
  // Books are saved to this device (see persister) so the app opens offline, so they must stay in memory too.
  // Infinity rather than a month: a gcTime over ~24.8 days overflows setTimeout and collects the query at once.
  defaultOptions: { queries: { gcTime: Infinity, staleTime: 30_000 } },
})

// Saves the books query and any edits still waiting for the network, so both survive closing the app offline.
export const persister = createSyncStoragePersister({ storage: localStorage, key: 'mullon:query-cache' })
export const persistOptions = {
  persister,
  maxAge: MONTH,
  buster: '1',
  // Keep the last books read even when a later read failed, such as with a poor connection.
  dehydrateOptions: { shouldDehydrateQuery: (q: { queryKey: readonly unknown[]; state: { data: unknown } }) => q.queryKey[0] === 'books' && q.state.data !== undefined },
}

export const booksQuery = (userId: string) =>
  queryOptions({
    queryKey: ['books', userId],
    queryFn: async () => {
      const books: Book[] = []
      for (let from = 0; ; from += 1000) {
        const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', userId).eq('deleted', false).order('id').range(from, from + 999)
        if (error) throw error
        books.push(...(data as Row[]).map(fromRow))
        if (data.length < 1000) return books
      }
    },
  })

export const useBooks = () => useQuery(booksQuery(useUser()!.id))

export const useBook = (id: string) => {
  const q = useQuery({ ...booksQuery(useUser()!.id), select: (books) => books.find((b) => b.id === id) })
  return { ...q, book: q.data }
}

// ---------- saving ----------
// Every edit is one 'saveBook' mutation that writes the whole book. Its options are registered here, rather than at
// the call site, so edits made offline can be restored from the persisted cache and sent once the app is back online.
// Each edit carries the time it was made; the database keeps whichever edit of a book is most recent.
type SaveVars = { userId: string; book: Book }

const upsert = (books: Book[], book: Book) =>
  book.deleted ? books.filter((b) => b.id !== book.id) : books.some((b) => b.id === book.id) ? books.map((b) => (b.id === book.id ? book : b)) : [...books, book]

queryClient.setMutationDefaults(['saveBook'], {
  mutationFn: async ({ userId, book }: SaveVars) => {
    const { error } = await supabase.from(TABLE).upsert(toRow(book, userId), { onConflict: 'user_id,id' })
    if (error) throw error
  },
  onMutate: async ({ userId, book }: SaveVars) => {
    await queryClient.cancelQueries({ queryKey: ['books', userId] })
    queryClient.setQueryData<Book[]>(['books', userId], (books = []) => upsert(books, book))
  },
  onError: (error) => {
    console.warn('Save failed', error)
    toast.error('Couldn’t save your last change.', { description: (error as Error).message })
  },
  onSettled: (_data: unknown, _error: unknown, { userId }: SaveVars) => {
    // Re-read once the last pending save finishes, so a quick run of edits doesn't refetch after each one.
    if (queryClient.isMutating({ mutationKey: ['saveBook'] }) === 1) return queryClient.invalidateQueries({ queryKey: ['books', userId] })
  },
  // Keep retrying when the request didn't reach Supabase (no error code), so a change isn't lost on a poor connection.
  // Errors from Supabase itself, such as a rejected write, stop after three tries.
  retry: (count, error) => count < 3 || !(error as { code?: string }).code,
})

/** Save a book: shows the change straight away, then writes it to Supabase (or queues it while offline). */
export const saveBook = (userId: string, book: Book) => {
  new MutationObserver<void, Error, SaveVars>(queryClient, { mutationKey: ['saveBook'] })
    .mutate({ userId, book: { ...book, updated: Date.now() } })
    .catch(() => {}) // reported by onError
}

/** Write many books in one request, such as an imported backup. */
export const saveBooks = async (userId: string, books: Book[]) => {
  for (let i = 0; i < books.length; i += 500) {
    const { error } = await supabase.from(TABLE).upsert(books.slice(i, i + 500).map((b) => toRow(b, userId)), { onConflict: 'user_id,id' })
    if (error) throw error
  }
  // Drop a read that started before these writes: with no books loaded yet, invalidating alone would reuse it.
  await queryClient.cancelQueries({ queryKey: ['books', userId] })
  await queryClient.invalidateQueries({ queryKey: ['books', userId] })
}
