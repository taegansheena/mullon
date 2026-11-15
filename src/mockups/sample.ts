import { type Book, quoteCount } from '@/lib/books'

/** Example books for the mockups only. Never saved anywhere. */
const b = (id: string, title: string, author: string, start: string, end: string, owned: boolean, page = ''): Book => ({
  id,
  title,
  author,
  start,
  end,
  owned,
  page,
  cover: 'none',
  updated: 0,
})

const jacobs = [
  '<p>Reading this alongside Abundance. Jacobs is arguing from the street up; Klein and Thompson from the permit office down.</p>',
  '<blockquote>Cities have the capability of providing something for everybody, only because, and only when, they are created by everybody.</blockquote>',
  '<p>This is the line I keep coming back to. It cuts against both the planners and the people who block everything.</p>',
  '<blockquote>Old ideas can sometimes use new buildings. New ideas must use old buildings.</blockquote>',
  '<p>Cheap old space as an input to new businesses. Compare Bertaud on land prices.</p>',
  '<blockquote>Designing a dream city is easy; rebuilding a living one takes imagination.</blockquote>',
].join('')

const george = [
  '<p>Slow going but worth it. The land value tax chapter is the bit to reread.</p>',
  '<blockquote>The equal right of all men to the use of land is as clear as their equal right to breathe the air.</blockquote>',
  '<p>Who captures the uplift when a city grows? George’s answer is still the cleanest one.</p>',
].join('')

// Open Library cover IDs. Rethinking is left without one to show the coloured block used when there's no cover.
const covers: Record<string, string> = {
  abundance: '15123873',
  jacobs: '5540237',
  bertaud: '8835365',
  mazzucato: '7265270',
  criado: '8802593',
  einstein: '14745346',
  ryancollins: '10523920',
  george: '876238',
  care: '13319723',
  fisher: '12897860',
  caro: '253659',
  raworth: '8347411',
}

export const sampleBooks: Book[] = [
  b('abundance', 'Abundance', 'Ezra Klein, Derek Thompson', '2026-10-28', '', true, '<p>Supply matters, but who captures the uplift matters more.</p><p>Chapter 3 on permitting: compare with Neighborhood Defenders.</p>'),
  b('jacobs', 'The Death and Life of Great American Cities', 'Jane Jacobs', '2026-09-14', '', true, jacobs),
  b('bertaud', 'Order without Design', 'Alain Bertaud', '', '', true),
  b('mazzucato', 'The Entrepreneurial State', 'Mariana Mazzucato', '', '', true),
  b('criado', 'Invisible Women', 'Caroline Criado Perez', '', '', true),
  b('einstein', 'Neighborhood Defenders', 'Katherine Levine Einstein, David Glick, Maxwell Palmer', '', '', false),
  b('ryancollins', 'Why Can’t You Afford a Home?', 'Josh Ryan-Collins', '', '', false),
  b('george', 'Progress and Poverty', 'Henry George', '2026-07-02', '2026-08-30', true, george),
  b('care', 'The Care Manifesto', 'The Care Collective', '2026-06-03', '2026-06-21', true, '<p>Short, sharp. Care as infrastructure, not a private cost.</p><p>Pairs with Invisible Women.</p>'),
  b('rethinking', 'Rethinking the Economics of Land and Housing', 'Josh Ryan-Collins, Toby Lloyd, Laurie Macfarlane', '2026-04-10', '2026-05-19', true),
  b('fisher', 'The Chaos Machine', 'Max Fisher', '2026-03-01', '2026-03-29', false, '<p>Algorithmic feeds and politics. Borrowed from the library.</p>'),
  b('caro', 'The Power Broker', 'Robert A. Caro', '2025-08-11', '2025-12-02', true, '<p>Moses as the anti-Jacobs.</p><p>Parkways built low so buses couldn’t pass under them.</p><p>Read the Jacobs chapters next to the Moses chapters.</p>'),
  b('raworth', 'Doughnut Economics', 'Kate Raworth', '2025-03-20', '2025-04-11', true),
].map((x) => ({ ...x, cover: covers[x.id] ?? 'none' }))

/** How much is written about a book: quotes kept and note paragraphs. */
export const depth = (b: Book) => {
  const quotes = quoteCount(b.page)
  const notes = (b.page.match(/<p>(?!(<br>)*<\/p>)/g) || []).length
  return { quotes, notes, total: quotes + notes }
}

/** The text of a book's most recent quote, if it has one. */
export const lastQuote = (b: Book) => [...b.page.matchAll(/<blockquote>(.*?)<\/blockquote>/g)].at(-1)?.[1]
export const firstNote = (b: Book) => b.page.match(/<p>(.*?)<\/p>/)?.[1]
export const quotes = (b: Book) => [...b.page.matchAll(/<blockquote>(.*?)<\/blockquote>/g)].map((m) => m[1])

/** The last thing written on a book's page, quote or note: the bottom block, since the page keeps no times per paragraph. */
export const lastEntry = (b: Book): { kind: 'quote' | 'note'; text: string } | undefined => {
  const m = [...b.page.matchAll(/<(blockquote|p)>(.*?)<\/\1>/g)].filter((x) => x[2].replace(/<br>/g, '').trim()).at(-1)
  return m && { kind: m[1] === 'blockquote' ? 'quote' : 'note', text: m[2] }
}
