export type Book = {
  id: string
  title: string
  author: string
  /** Dates as YYYY-MM-DD, or '' when not set. */
  start: string
  end: string
  /** Open Library cover ID, 'none' when there is no cover, or '' when not looked up yet. */
  cover: string
  /** Whether the book is on the shelf. */
  owned: boolean
  /** Notes and quotes as HTML: only paragraphs, blockquotes and line breaks (see sanitize). */
  page: string
  /** When the book was last edited, in ms. The database keeps the most recent edit of each book. */
  updated: number
  deleted?: boolean
}

export type Row = {
  user_id: string
  id: string
  title: string
  author: string
  start_date: string
  end_date: string
  cover: string
  owned: boolean
  page: string
  deleted: boolean
  updated: number
}

export const toRow = (b: Book, userId: string): Row => ({
  user_id: userId,
  id: b.id,
  title: b.title,
  author: b.author,
  start_date: b.start || '',
  end_date: b.end || '',
  cover: b.cover || '',
  owned: !!b.owned,
  page: b.page || '',
  deleted: !!b.deleted,
  updated: b.updated || 0,
})

export const fromRow = (r: Row): Book => ({
  id: r.id,
  title: r.title,
  author: r.author,
  start: r.start_date,
  end: r.end_date,
  cover: r.cover || '',
  owned: !!r.owned,
  page: sanitize(r.page),
  updated: Number(r.updated),
})

export type Status = 'tbr' | 'reading' | 'read'
// A book's list comes from its dates: no dates is to be read, a start only is reading, a finish is read.
export const status = (b: Pick<Book, 'start' | 'end'>): Status => (b.end ? 'read' : b.start ? 'reading' : 'tbr')

export const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10)

const fmt = (d: string, year = true) =>
  d ? new Date(d + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', ...(year ? { year: 'numeric' } : {}) }) : ''

export const dateRange = (b: Book) => {
  if (!b.end) return b.start ? `Started ${fmt(b.start)}` : ''
  if (!b.start) return `Finished ${fmt(b.end)}`
  return `${fmt(b.start, b.start.slice(0, 4) !== b.end.slice(0, 4))} – ${fmt(b.end)}`
}

export const hue = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)
export const coverUrl = (id: string | number, size: 'S' | 'M' | 'L') => `https://covers.openlibrary.org/b/id/${id}-${size}.jpg`
export const hasCover = (cover: string) => /^\d+$/.test(cover || '')

export const quoteCount = (html: string) => (html.match(/<blockquote>(?!(<br>)*<\/blockquote>)/g) || []).length

// Keep only paragraphs, quotes and line breaks from the page.
export const sanitize = (html: string) => {
  const src = document.createElement('template')
  src.innerHTML = html
  const out = document.createElement('div')
  const walk = (from: Node, to: Node) => {
    for (const n of from.childNodes) {
      if (n.nodeType === Node.TEXT_NODE) {
        to.appendChild(document.createTextNode(n.textContent ?? ''))
        continue
      }
      if (!(n instanceof Element)) continue
      const tag = n.tagName
      if (tag === 'BR') {
        to.appendChild(document.createElement('br'))
        continue
      }
      if (tag === 'BLOCKQUOTE' || tag === 'P' || tag === 'DIV') {
        const el = document.createElement(tag === 'BLOCKQUOTE' ? 'blockquote' : 'p')
        walk(n, el)
        to.appendChild(el)
        continue
      }
      if (tag === 'SCRIPT' || tag === 'STYLE') continue
      walk(n, to)
    }
  }
  walk(src.content, out)
  return out.innerHTML
}
