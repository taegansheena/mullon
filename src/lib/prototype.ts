import type { Book } from './books'
import { saveBooks } from './queries'

// The prototype kept every book in localStorage under this key and synced it to Supabase when signed in.
const KEY = 'reading-log:v1'
type PrototypeBook = Book & { dirty?: boolean }
type PrototypeDb = { books?: PrototypeBook[]; sync?: { user?: string } }

let running: Promise<number> | undefined

/**
 * Upload the books the prototype saved on this device and hadn't synced to this account yet, then set its copy
 * aside. Resolves with the number of books brought over. Each book keeps its edit time, so a newer copy already
 * in Supabase wins. Books the prototype already synced are skipped: it could hold copies missing newer fields.
 */
export const importPrototypeBooks = (userId: string) =>
  (running ??= (async () => {
    const raw = localStorage.getItem(KEY)
    if (!raw) return 0
    const db = JSON.parse(raw) as PrototypeDb
    const books = (db.books ?? []).filter((b) => db.sync?.user !== userId || b.dirty)
    await saveBooks(userId, books)
    localStorage.setItem(`${KEY}:imported`, raw)
    localStorage.removeItem(KEY)
    return books.filter((b) => !b.deleted).length
  })().finally(() => (running = undefined)))
