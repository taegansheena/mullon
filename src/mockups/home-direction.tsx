import { cn } from 'cn'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Spine } from '@/components/spine'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { type Book, dateRange, status } from '@/lib/books'
import { Contour } from './contour'
import { Eyebrow, Fab, fmtMonth, groupBooks, MockHeader, type Nav } from './parts'
import { depth, lastEntry, sampleBooks } from './sample'

const filters = { All: () => true, Reading: (b: Book) => status(b) === 'reading', 'To read': (b: Book) => status(b) === 'tbr', Read: (b: Book) => status(b) === 'read' }
type Filter = keyof typeof filters

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : one + 's'}`
const writtenParts = (b: Book) => {
  const d = depth(b)
  return [d.quotes && plural(d.quotes, 'quote'), d.notes && plural(d.notes, 'note')].filter((x): x is string => !!x)
}
const written = (b: Book) => writtenParts(b).join(' · ')
/** The counts under a depth mark, one per line so they never wrap mid-phrase. */
const Counts = ({ book, className }: { book: Book; className?: string }) => (
  <span className={cn('text-center text-[10.5px] leading-tight whitespace-nowrap text-muted-foreground tabular-nums', className)}>
    {writtenParts(book).map((p) => (
      <span key={p} className="block">{p}</span>
    ))}
  </span>
)

/**
 * A book's depth mark: a dashed outline before it's started, one line once started, and one more line inside it
 * for each note or quote.
 */
export function DepthMark({ book, size = 40, className }: { book: Book; size?: number; className?: string }) {
  const tbr = status(book) === 'tbr'
  return <Contour seed={book.title + book.author} rings={tbr ? 1 : 1 + depth(book).total} dashed={tbr} size={size} className={cn(tbr && 'text-muted-foreground/60', className)} />
}

/** The new look for the home screen: the explored type and olive palette, with covers kept and a depth mark per book. */
export function HomeList({ nav }: { nav: Nav }) {
  const [tab, setTab] = useState<Filter>('All')
  const groups = groupBooks(sampleBooks.filter(filters[tab]))

  return (
    <>
      <MockHeader tabs={Object.keys(filters)} tab={tab} onTab={(t) => setTab(t as Filter)} />
      <main className="mx-auto max-w-4xl px-5 pt-4 pb-28 md:pt-8">
        {groups.map((g) =>
          g.kind === 'reading' ? (
            <section key={g.name} className="pt-2">
              <div className="flex items-baseline justify-between pb-1.5">
                <Eyebrow className="text-primary">{g.name}</Eyebrow>
                <span className="text-[11px] text-muted-foreground tabular-nums">{g.books.length}</span>
              </div>
              <div className="mt-2 grid gap-4">
                {g.books.map((b) => (
                  <ReadingCard key={b.id} book={b} onOpen={() => nav.open(b.id)} />
                ))}
              </div>
            </section>
          ) : (
            <Section key={tab + g.name} name={g.kind === 'read' ? `Read in ${g.name}` : g.name} books={g.books} onOpen={nav.open} />
          ),
        )}
      </main>
      <Fab />
    </>
  )
}

const TOP = 3

/** A section whose heading folds it away, showing its first three books with a button for the rest. */
function Section({ name, books, onOpen }: { name: string; books: Book[]; onOpen: (id: string) => void }) {
  const [all, setAll] = useState(false)
  const shown = all ? books : books.slice(0, TOP)
  const hidden = books.length - TOP
  return (
    <Collapsible defaultOpen className="pt-7">
      <CollapsibleTrigger className="group flex min-h-11 w-full items-center gap-2 text-left">
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-not-data-[panel-open]:-rotate-90" />
        <Eyebrow className="flex-1 text-foreground/80">{name}</Eyebrow>
        <span className="text-[11px] text-muted-foreground tabular-nums">{books.length}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">
          {shown.map((b) => (
            <BookRow key={b.id} book={b} onOpen={() => onOpen(b.id)} />
          ))}
        </div>
        {hidden > 0 && (
          <Button variant="ghost" size="sm" className="mt-1 -ml-2 text-muted-foreground" onClick={() => setAll(!all)}>
            {all ? 'Show fewer' : `Show ${hidden} more`}
            <ChevronDown className={cn('transition-transform', all && 'rotate-180')} />
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function ReadingCard({ book: b, onOpen }: { book: Book; onOpen: () => void }) {
  const last = lastEntry(b)
  return (
    <Card className="gap-0 p-0 ring-border">
      <button onClick={onOpen} className="group flex gap-4 p-4 text-left md:gap-5 md:p-5">
        <Spine cover={b.cover} seed={b.title + b.author} className="h-[96px] w-[64px] shadow-[0_2px_8px_-2px_rgb(0_0_0/0.3)] md:h-[120px] md:w-[80px]" />
        <span className="min-w-0 flex-1">
          <Eyebrow>Since {fmtMonth(b.start)}</Eyebrow>
          <span className="mt-1 block font-serif text-[21px] leading-tight text-balance group-hover:underline md:text-[26px]">{b.title}</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">{b.author}</span>
        </span>
        <span className="flex w-[64px] flex-none flex-col items-center gap-1 md:w-[84px]">
          <DepthMark book={b} size={56} className="md:size-[72px]" />
          <Counts book={b} />
        </span>
      </button>
      {last && (
        <div className="mx-4 mb-4 rounded-md bg-[var(--olive-soft)] px-4 py-3 md:mx-5">
          <Eyebrow className="text-primary">Your last {last.kind}</Eyebrow>
          <p className={cn('mt-1 text-[15px] leading-relaxed text-pretty', last.kind === 'quote' && 'font-serif italic')}>{last.text}</p>
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
        <span className="hidden text-[11.5px] text-muted-foreground tabular-nums sm:inline">{dateRange(b)}</span>
      </div>
    </Card>
  )
}

function BookRow({ book: b, onOpen }: { book: Book; onOpen: () => void }) {
  const last = lastEntry(b)
  const when = dateRange(b) || (b.owned ? 'On shelf' : 'Not on shelf')
  return (
    <button
      onClick={onOpen}
      className="group grid w-full grid-cols-[40px_minmax(0,1fr)_48px] items-center gap-x-3.5 border-b py-3 text-left md:grid-cols-[44px_minmax(0,1.1fr)_minmax(0,1fr)_64px] md:gap-x-6"
    >
      <Spine cover={b.cover} seed={b.title + b.author} className="h-[60px] w-[40px] md:h-[66px] md:w-[44px]" />
      <span className="min-w-0">
        <span className="block font-serif text-[17px] leading-snug group-hover:underline">{b.title}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{b.author}</span>
        <span className="mt-0.5 block text-[11.5px] text-muted-foreground tabular-nums">
          {when}
          {written(b) && <span className="md:hidden"> · {written(b)}</span>}
        </span>
      </span>
      <span className="hidden min-w-0 text-[13px] leading-snug md:block">
        {last && <span className={cn('line-clamp-2', last.kind === 'quote' ? 'font-serif italic' : 'text-muted-foreground')}>{last.text}</span>}
      </span>
      <span className="flex flex-col items-center gap-0.5">
        <DepthMark book={b} size={40} className="md:size-[44px]" />
        <Counts book={b} className="hidden md:block" />
      </span>
    </button>
  )
}
