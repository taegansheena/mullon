import { queryOptions } from '@tanstack/react-query'

export type OpenLibraryBook = { title: string; author_name: string[]; cover_i?: number; first_publish_year?: number }

// Search Open Library by title and/or author; keeps the first 5 results that have an author, those with covers first
// (results without one are often summaries and study guides).
export const searchBooks = async (q: string, signal?: AbortSignal): Promise<OpenLibraryBook[]> => {
  const r = await fetch(
    `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=title,author_name,cover_i,first_publish_year&limit=10`,
    { signal },
  )
  if (!r.ok) throw new Error(`Open Library search failed: ${r.status}`)
  const { docs } = (await r.json()) as { docs: OpenLibraryBook[] }
  return docs
    .filter((d) => d.author_name?.length)
    .sort((a, b) => Number(!a.cover_i) - Number(!b.cover_i))
    .slice(0, 5)
}

export const searchBooksQuery = (q: string) =>
  queryOptions({
    queryKey: ['openlibrary', q],
    queryFn: ({ signal }) => searchBooks(q, signal),
    staleTime: Infinity,
    enabled: q.length >= 3,
  })
