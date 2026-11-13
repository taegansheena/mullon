import type { Book } from './books'
import { searchBooks } from './openlibrary'
import { booksQuery, queryClient, saveBook } from './queries'

let finding = false

// Look up covers for books that don't have one yet, one search a second to stay within Open Library's limit.
// Stops on the first failure, such as going offline, and tries again the next time the books change.
export const findCovers = async (userId: string) => {
  if (finding) return
  finding = true
  const current = (id: string) => queryClient.getQueryData<Book[]>(booksQuery(userId).queryKey)?.find((b) => b.id === id)
  try {
    for (const { id } of queryClient.getQueryData<Book[]>(booksQuery(userId).queryKey)?.filter((b) => !b.cover) ?? []) {
      const b = current(id)
      if (!b || b.cover) continue
      const hit = (await searchBooks(`${b.title} ${b.author}`)).find((d) => d.cover_i)
      const now = current(id)
      if (now && !now.cover) saveBook(userId, { ...now, cover: hit ? String(hit.cover_i) : 'none' })
      await new Promise((r) => setTimeout(r, 1100))
    }
  } catch (e) {
    console.warn('Cover lookup stopped', e)
  } finally {
    finding = false
  }
}
