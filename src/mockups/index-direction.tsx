import { cn } from 'cn'
import { useState } from 'react'
import { type Book, dateRange, status } from '@/lib/books'
import { Eyebrow, Fab, groupBooks, MockHeader, type Nav } from './parts'
import { depth, firstNote, lastQuote, sampleBooks } from './sample'

const filters = { All: () => true, Reading: (b: Book) => status(b) === 'reading', 'To read': (b: Book) => status(b) === 'tbr', Read: (b: Book) => status(b) === 'read' }
type Filter = keyof typeof filters

/** Direction 1, from "Strata index": the list as an editorial index, one hairline per note or quote. */
export function IndexList({ nav }: { nav: Nav }) {
  const [tab, setTab] = useState<Filter>('All')
  const groups = groupBooks(sampleBooks.filter(filters[tab]))
  const count = (s: string) => sampleBooks.filter((b) => status(b) === s).length
  const quotesKept = sampleBooks.reduce((n, b) => n + depth(b).quotes, 0)
  const stats = [
    ['Reading now', count('reading')],
    ['To read', count('tbr')],
    ['Read in 2026', sampleBooks.filter((b) => b.end.startsWith('2026')).length],
    ['Quotes kept', quotesKept],
  ] as const

  return (
    <>
      <MockHeader tabs={Object.keys(filters)} tab={tab} onTab={(t) => setTab(t as Filter)} />
      <main className="mx-auto max-w-6xl px-5 pt-6 pb-28 md:grid md:grid-cols-[220px_1fr] md:gap-12 md:pt-10">
        <aside>
          <Eyebrow>Books</Eyebrow>
          <h1 className="mt-2 font-serif text-[32px] leading-[1.05] tracking-tight text-balance text-primary md:text-[40px]">What you’ve been reading</h1>
          <dl className="mt-5 grid grid-cols-4 gap-x-3 border-y py-3 md:grid-cols-1 md:gap-y-2 md:border-y-0 md:py-0">
            {stats.map(([k, v]) => (
              <div key={k} className="flex flex-col-reverse gap-0.5 md:flex-row md:items-baseline md:justify-between md:border-b md:pb-2">
                <dt className="text-[11px] leading-tight text-muted-foreground md:text-[12px]">{k}</dt>
                <dd className="font-serif text-[20px] tabular-nums md:text-[15px]">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 hidden space-y-3 md:block">
            <Eyebrow>Reading the depth</Eyebrow>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <Depth n={4} className="w-10" /> One line per note or quote
            </div>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <Depth n={3} reading className="w-10" /> Reading now
            </div>
            <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
              <Depth n={0} className="w-10" /> Nothing written yet
            </div>
          </div>
        </aside>

        <section className="mt-2 md:mt-0">
          <div className="hidden grid-cols-[minmax(0,1.3fr)_96px_150px_minmax(0,1fr)] gap-6 border-b pb-2 md:grid">
            {['Book', 'Depth', 'Dates', 'Latest quote or note'].map((h) => (
              <Eyebrow key={h}>{h}</Eyebrow>
            ))}
          </div>
          {groups.map((g) => (
            <div key={g.name}>
              <div className="flex items-baseline justify-between pt-6 pb-1.5">
                <Eyebrow className={cn(g.kind === 'reading' && 'text-primary')}>{g.name}</Eyebrow>
                <span className="text-[11px] text-muted-foreground tabular-nums">{g.books.length}</span>
              </div>
              {g.books.map((b) => (
                <IndexRow key={b.id} book={b} onOpen={() => nav.open(b.id)} />
              ))}
            </div>
          ))}
        </section>
      </main>
      <Fab />
    </>
  )
}

export function IndexRow({ book: b, onOpen }: { book: Book; onOpen: () => void }) {
  const d = depth(b)
  const reading = status(b) === 'reading'
  const latest = lastQuote(b)
  return (
    <button
      onClick={onOpen}
      className="group grid w-full grid-cols-[minmax(0,1fr)_64px] items-start gap-x-4 border-b py-3 text-left md:grid-cols-[minmax(0,1.3fr)_96px_150px_minmax(0,1fr)] md:gap-6"
    >
      <span className="min-w-0">
        <span className="block font-serif text-[17px] leading-snug underline-offset-[3px] group-hover:underline">{b.title}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{b.author}</span>
        <span className="mt-1 block text-[11.5px] text-muted-foreground tabular-nums md:hidden">{dateRange(b) || (b.owned ? 'On shelf' : 'Not on shelf')}</span>
      </span>
      <span className="pt-1.5">
        <Depth n={d.total} reading={reading} />
        <span className="mt-1 block text-[10.5px] text-muted-foreground tabular-nums">{d.quotes ? `${d.quotes} ${d.quotes === 1 ? 'quote' : 'quotes'}` : d.notes ? `${d.notes} notes` : ''}</span>
      </span>
      <span className="hidden pt-0.5 text-[12.5px] text-muted-foreground tabular-nums md:block">{dateRange(b) || (b.owned ? 'On shelf' : 'Not on shelf')}</span>
      <span className="hidden min-w-0 pt-0.5 text-[13px] leading-snug md:block">
        {latest ? (
          <span className="line-clamp-2 font-serif italic">{latest}</span>
        ) : firstNote(b) ? (
          <span className="line-clamp-2 text-muted-foreground">{firstNote(b)}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </span>
    </button>
  )
}

/** A stack of hairlines, one per note or quote. */
export function Depth({ n, reading, className }: { n: number; reading?: boolean; className?: string }) {
  if (!n) return <span className={cn('block h-px w-full border-t border-dashed border-muted-foreground/50', className)} />
  return (
    <span className={cn('flex w-full flex-col gap-[2px]', className)}>
      {Array.from({ length: Math.min(n, 10) }, (_, i) => (
        <span key={i} className={cn('h-px w-full', reading ? 'bg-primary' : 'bg-foreground/45')} />
      ))}
    </span>
  )
}
