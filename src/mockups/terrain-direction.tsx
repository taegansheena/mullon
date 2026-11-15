import { cn } from 'cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { type Book, dateRange } from '@/lib/books'
import { Contour } from './contour'
import { Eyebrow, Fab, fmtMonth, groupBooks, MockHeader, type Nav } from './parts'
import { depth, firstNote, lastQuote, sampleBooks } from './sample'

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : one + 's'}`

/** Direction 2, from "Terrain": the books you're reading lead, each drawn as a contour that deepens as you write. */
export function TerrainList({ nav }: { nav: Nav }) {
  const groups = groupBooks(sampleBooks)
  const reading = groups.find((g) => g.kind === 'reading')?.books ?? []
  const tbr = groups.filter((g) => g.kind === 'tbr').flatMap((g) => g.books)
  const read = groups.filter((g) => g.kind === 'read')

  return (
    <>
      <MockHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-10 px-5 pt-6 pb-28 md:grid md:grid-cols-[minmax(0,1fr)_320px] md:gap-x-12 md:pt-10">
        <section>
          <Eyebrow>Reading now</Eyebrow>
          <div className="mt-3 grid gap-4">
            {reading.map((b) => (
              <ReadingCard key={b.id} book={b} onOpen={() => nav.open(b.id)} />
            ))}
          </div>
        </section>

        <aside className="md:col-start-2 md:row-span-2 md:row-start-1 md:border-l md:pl-8">
          <Eyebrow>Up next</Eyebrow>
          <p className="mt-1 text-[12.5px] text-muted-foreground">Waiting to be started, on your shelf first.</p>
          <div className="-mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2 md:mx-0 md:block md:overflow-visible md:px-0">
            {tbr.map((b) => (
              <button
                key={b.id}
                onClick={() => nav.open(b.id)}
                className="group flex w-[150px] flex-none snap-start flex-col gap-2 rounded-lg border bg-card p-3 text-left md:w-full md:flex-row md:items-center md:gap-3 md:rounded-none md:border-x-0 md:border-t-0 md:bg-transparent md:px-0"
              >
                <Contour seed={b.title} rings={1} dashed size={36} />
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 font-serif text-[15px] leading-snug group-hover:underline">{b.title}</span>
                  <span className="block truncate text-[12px] text-muted-foreground">{b.author}</span>
                </span>
                <Badge variant={b.owned ? 'secondary' : 'outline'} className="text-[10.5px] font-normal">
                  {b.owned ? 'On shelf' : 'Not on shelf'}
                </Badge>
              </button>
            ))}
          </div>
        </aside>

        <section>
          {read.map((g) => (
            <div key={g.name} className="mb-6">
              <div className="flex items-baseline justify-between border-b pb-1.5">
                <Eyebrow>Read in {g.name}</Eyebrow>
                <span className="text-[11px] text-muted-foreground tabular-nums">{g.books.length}</span>
              </div>
              {g.books.map((b) => (
                <button key={b.id} onClick={() => nav.open(b.id)} className="group flex w-full items-center gap-3.5 border-b py-2.5 text-left">
                  <Contour seed={b.title} rings={depth(b).total} size={34} className={cn(!depth(b).total && 'opacity-50')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-serif text-[16px] group-hover:underline">{b.title}</span>
                    <span className="block truncate text-[12px] text-muted-foreground">{b.author}</span>
                  </span>
                  <span className="text-right text-[11.5px] text-muted-foreground tabular-nums">
                    {fmtMonth(b.end)}
                    {!!depth(b).quotes && <span className="block">{plural(depth(b).quotes, 'quote')}</span>}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </section>
      </main>
      <Fab />
    </>
  )
}

function ReadingCard({ book: b, onOpen }: { book: Book; onOpen: () => void }) {
  const d = depth(b)
  const quote = lastQuote(b)
  const note = firstNote(b)
  return (
    <Card className="gap-0 p-0 ring-border">
      <div className="flex gap-4 p-4 md:gap-6 md:p-5">
        <Contour seed={b.title} rings={d.total + 1} size={84} className="md:size-[120px]" />
        <div className="min-w-0 flex-1">
          <Eyebrow>Since {fmtMonth(b.start)}</Eyebrow>
          <h2 className="mt-1 font-serif text-[22px] leading-tight text-balance md:text-[28px]">{b.title}</h2>
          <div className="mt-0.5 text-[13px] text-muted-foreground">{b.author}</div>
          <div className="mt-1.5 text-[11.5px] text-muted-foreground tabular-nums">
            {[d.quotes && plural(d.quotes, 'quote'), d.notes && plural(d.notes, 'note')].filter(Boolean).join(' · ')}
          </div>
        </div>
      </div>
      {(quote || note) && (
        <div className="mx-4 mb-4 rounded-md bg-[var(--olive-soft)] px-4 py-3 md:mx-5">
          <Eyebrow className="text-primary">{quote ? 'Your last quote' : 'Your take, so far'}</Eyebrow>
          <p className={cn('mt-1 text-[15px] leading-relaxed text-pretty', quote && 'font-serif italic')}>{quote ?? note}</p>
        </div>
      )}
      <div className="flex items-center gap-2 border-t px-4 py-2.5 md:px-5">
        <Button size="sm" onClick={onOpen}>
          Open notes
        </Button>
        <Button size="sm" variant="ghost">
          Finished it
        </Button>
        <span className="flex-1" />
        <span className="text-[11.5px] text-muted-foreground tabular-nums">{dateRange(b)}</span>
      </div>
    </Card>
  )
}
