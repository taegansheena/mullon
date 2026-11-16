import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Plus, Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { DepthMark } from '@/components/depth-mark'
import { Eyebrow } from '@/components/eyebrow'
import { Spine } from '@/components/spine'
import { TopBar } from '@/components/top-bar'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUser } from '@/lib/auth'
import { type Book, dateRange, depth, lastEntry, quotes, sanitize, status, type Status, today } from '@/lib/books'
import { saveBook, saveBooks, useBooks } from '@/lib/queries'

type Show = Status | 'all'
const shows: [Show, string][] = [
  ['all', 'All'],
  ['reading', 'Reading'],
  ['tbr', 'To read'],
  ['read', 'Read'],
]

export const Route = createFileRoute('/_authed/')({
  validateSearch: (s: Record<string, unknown>): { q?: string; show?: Status } => ({
    ...(typeof s.q === 'string' && s.q ? { q: s.q } : {}),
    ...(s.show === 'reading' || s.show === 'tbr' || s.show === 'read' ? { show: s.show } : {}),
  }),
  component: List,
})

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/** What's written on a book's page, such as "3 quotes · 2 notes", one part per item. */
const writtenParts = (b: Book) => {
  const d = depth(b.page)
  return [d.quotes && plural(d.quotes, 'quote', 'quotes'), d.notes && plural(d.notes, 'note', 'notes')].filter((x): x is string => !!x)
}

function groupBooks(books: Book[]) {
  const reading = books.filter((b) => status(b) === 'reading').sort((a, b) => b.start.localeCompare(a.start))
  const tbr = books.filter((b) => status(b) === 'tbr')
  const done = books.filter((b) => b.end).sort((a, b) => b.end.localeCompare(a.end))
  const groups: [string, Book[]][] = []
  if (reading.length) groups.push(['Reading now', reading])
  for (const [name, owned] of [['To read · On shelf', true], ['To read · Not on shelf', false]] as const) {
    const bs = tbr.filter((b) => !!b.owned === owned)
    if (bs.length) groups.push([name, bs])
  }
  for (const b of done) {
    const y = `Read in ${b.end.slice(0, 4)}`
    const g = groups.find((x) => x[0] === y)
    if (g) g[1].push(b)
    else groups.push([y, [b]])
  }
  return groups
}

function List() {
  const { q = '', show = 'all' } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: all, isPending, isError } = useBooks()
  const [searching, setSearching] = useState(!!q)
  const needle = q.toLowerCase()
  const books = (all ?? []).filter((b) => (show === 'all' || status(b) === show) && `${b.title} ${b.author}`.toLowerCase().includes(needle))
  const groups = groupBooks(books)

  const setQ = (v: string) => navigate({ search: (s) => ({ ...s, q: v || undefined }), replace: true })

  return (
    <>
      <TopBar
        below={
          <>
            {searching && (
              <label className="mb-1 flex h-10 items-center gap-2 rounded-[10px] bg-muted px-3 text-muted-foreground">
                <Search className="size-[18px]" />
                <input
                  type="search"
                  autoFocus
                  placeholder="Search title or author"
                  aria-label="Search title or author"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                />
              </label>
            )}
            <Tabs value={show} onValueChange={(v) => navigate({ search: (s) => ({ ...s, show: v === 'all' ? undefined : (v as Status) }), replace: true })}>
              <TabsList variant="line" className="h-10 gap-5 p-0">
                {shows.map(([value, label]) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex-none px-0 text-[11px] tracking-[0.16em] uppercase after:!bg-primary data-active:text-foreground group-data-[variant=line]/tabs-list:after:bottom-[-1px]"
                  >
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </>
        }
      >
        <h1 className="flex-1 font-serif text-[24px] tracking-tight text-primary">Mullon</h1>
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label="Search"
          aria-pressed={searching}
          onClick={() => {
            if (searching) setQ('')
            setSearching(!searching)
          }}
        >
          <Search className="size-[18px]" />
        </Button>
        <Menu books={all ?? []} />
        <Link to="/new" className={cn(buttonVariants({ size: 'lg' }), 'hidden rounded-md px-3.5 text-[11px] tracking-[0.16em] uppercase md:inline-flex')}>
          <Plus /> Add a book
        </Link>
      </TopBar>

      {show === 'all' && !q && all && <QuoteOfTheDay books={all} />}

      {isPending ? (
        <div className="pt-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3.5 border-b py-3">
              <Skeleton className="h-[60px] w-[40px]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : isError && !all ? (
        <p className="py-12 text-center text-muted-foreground">Couldn’t load your books. Check your connection and try again.</p>
      ) : groups.length ? (
        groups.map(([name, bs]) =>
          name === 'Reading now' ? (
            <section key={name} className="pt-3">
              <div className="flex items-baseline justify-between pb-1.5">
                <Eyebrow className="text-primary">{name}</Eyebrow>
                <span className="text-[11px] text-muted-foreground tabular-nums">{bs.length}</span>
              </div>
              <div className="mt-2 grid gap-4">
                {bs.map((b) => (
                  <ReadingCard key={b.id} book={b} />
                ))}
              </div>
            </section>
          ) : (
            // Searching shows every match; otherwise each section starts with its first three books.
            <Section key={name} name={name} books={bs} limit={q ? Infinity : 3} />
          ),
        )
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {q ? (
            'No books match.'
          ) : all?.length ? (
            'No books here yet.'
          ) : (
            <>
              No books yet.
              <br />
              Tap + to add the first one.
            </>
          )}
        </p>
      )}

      <Link
        to="/new"
        aria-label="Add book"
        className={cn(
          buttonVariants(),
          'fixed right-[max(20px,calc(50vw-320px))] bottom-[calc(20px+env(safe-area-inset-bottom))] size-14 rounded-full shadow-[0_6px_20px_-6px_rgb(0_0_0/0.35)] md:hidden',
        )}
      >
        <Plus className="size-6" />
      </Link>
    </>
  )
}

// A well-mixed 32-bit hash (FNV-1a, then MurmurHash3's finalizer), so each day's order is a fresh shuffle.
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b)
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35)
  return (h ^ (h >>> 16)) >>> 0
}

const QUOTE_KEY = 'mullon:quote-of-the-day'
type Picked = { day: string; key: string }

/**
 * A quote from a book not being read, the same all day. Each day shuffles every quote by date; the day's quote is
 * the first, and Previous and Next step through the rest. The quote showing is kept on the device until the next day,
 * so reopening the app shows it again, and quotes added during the day don't change it.
 */
function QuoteOfTheDay({ books }: { books: Book[] }) {
  const day = today()
  const order = books
    .filter((b) => status(b) !== 'reading')
    .flatMap((b) => quotes(b.page).map((text) => ({ book: b, text, key: `${b.id}\n${text}` })))
    .map((x) => ({ ...x, rank: hash(`${day}\n${x.key}`) }))
    .sort((x, y) => x.rank - y.rank)
  const [picked, setPicked] = useState<Picked | null>(() => {
    try {
      return JSON.parse(localStorage.getItem(QUOTE_KEY) ?? 'null')
    } catch {
      return null
    }
  })
  const i = Math.max(picked?.day === day ? order.findIndex((x) => x.key === picked.key) : -1, 0)
  const quote = order[i]
  const key = quote?.key

  useEffect(() => {
    if (key) localStorage.setItem(QUOTE_KEY, JSON.stringify({ day, key } satisfies Picked))
  }, [day, key])

  if (!quote) return null
  const go = (d: number) => setPicked({ day, key: order[(i + d + order.length) % order.length].key })
  return (
    <section className="pt-3 pb-3">
      <div className="flex min-h-9 items-center justify-between">
        <Eyebrow className="text-primary">Quote of the day</Eyebrow>
        {order.length > 1 && (
          <span className="-mr-2 flex">
            <Button variant="ghost" size="icon-lg" aria-label="Previous quote" onClick={() => go(-1)}>
              <ChevronLeft className="size-5" />
            </Button>
            <Button variant="ghost" size="icon-lg" aria-label="Next quote" onClick={() => go(1)}>
              <ChevronRight className="size-5" />
            </Button>
          </span>
        )}
      </div>
      <blockquote aria-live="polite" className="mt-1 border-l-2 border-primary py-0.5 pl-[18px] font-serif text-[19px] leading-[1.55] whitespace-pre-line text-pretty italic">
        {quote.text}
      </blockquote>
      <Link to="/book/$id" params={{ id: quote.book.id }} className="group mt-2.5 ml-5 inline-block text-[13px]">
        <span className="font-serif text-[15px] group-hover:underline">{quote.book.title}</span> <span className="text-muted-foreground">{quote.book.author}</span>
      </Link>
    </section>
  )
}

/** A section whose heading folds it away, showing its first books with a button for the rest. */
function Section({ name, books, limit }: { name: string; books: Book[]; limit: number }) {
  const [all, setAll] = useState(false)
  const hidden = books.length - limit
  return (
    <Collapsible defaultOpen className="pt-6">
      <CollapsibleTrigger className="group flex min-h-11 w-full items-center gap-2 text-left">
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-not-data-[panel-open]:-rotate-90" />
        <Eyebrow className="flex-1 text-foreground/80">{name}</Eyebrow>
        <span className="text-[11px] text-muted-foreground tabular-nums">{books.length}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="border-t">
          {(all ? books : books.slice(0, limit)).map((b) => (
            <BookRow key={b.id} book={b} />
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

function Counts({ book, className }: { book: Book; className?: string }) {
  return (
    <span className={cn('text-center text-[10.5px] leading-tight whitespace-nowrap text-muted-foreground tabular-nums', className)}>
      {writtenParts(book).map((p) => (
        <span key={p} className="block">
          {p}
        </span>
      ))}
    </span>
  )
}

const fmtDay = (d: string) => new Date(d + 'T00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short' })

/** A book being read: its cover and depth, the last thing written about it, and a way to mark it finished. */
function ReadingCard({ book: b }: { book: Book }) {
  const user = useUser()!
  const last = lastEntry(b.page)
  const finish = () => {
    saveBook(user.id, { ...b, end: today() })
    toast.success(`Finished ${b.title}.`, { action: { label: 'Undo', onClick: () => saveBook(user.id, { ...b, end: '' }) } })
  }
  return (
    <Card className="gap-0 p-0 ring-border">
      <Link to="/book/$id" params={{ id: b.id }} className="group flex gap-4 p-4">
        <Spine cover={b.cover} seed={b.title + b.author} className="h-[96px] w-[64px] shadow-[0_2px_8px_-2px_rgb(0_0_0/0.3)]" />
        <span className="min-w-0 flex-1">
          <Eyebrow>Since {fmtDay(b.start)}</Eyebrow>
          <span className="mt-1 block font-serif text-[21px] leading-tight text-balance group-hover:underline">{b.title}</span>
          <span className="mt-0.5 block text-[13px] text-muted-foreground">{b.author}</span>
        </span>
        <span className="flex w-[64px] flex-none flex-col items-center gap-1">
          <DepthMark book={b} size={56} />
          <Counts book={b} />
        </span>
      </Link>
      {last && (
        <div className="mx-4 mb-4 rounded-md bg-olive-soft px-4 py-3">
          <Eyebrow className="text-primary">Your last {last.kind}</Eyebrow>
          <p className={cn('mt-1 line-clamp-4 text-[15px] leading-relaxed text-pretty', last.kind === 'quote' && 'font-serif italic')}>{last.text}</p>
        </div>
      )}
      <div className="flex items-center gap-2 border-t px-4 py-2.5">
        <Link to="/book/$id" params={{ id: b.id }} className={buttonVariants({ size: 'sm' })}>
          Open notes
        </Link>
        <Button size="sm" variant="ghost" onClick={finish}>
          Finished it
        </Button>
        <span className="flex-1" />
        <span className="hidden text-[11.5px] text-muted-foreground tabular-nums sm:inline">{dateRange(b)}</span>
      </div>
    </Card>
  )
}

function BookRow({ book: b }: { book: Book }) {
  const last = lastEntry(b.page)
  const written = writtenParts(b).join(' · ')
  return (
    <Link
      to="/book/$id"
      params={{ id: b.id }}
      className="group grid w-full grid-cols-[40px_minmax(0,1fr)_48px] items-center gap-x-3.5 border-b py-3 text-left md:grid-cols-[40px_minmax(0,1.1fr)_minmax(0,1fr)_56px] md:gap-x-5"
    >
      <Spine cover={b.cover} seed={b.title + b.author} className="h-[60px] w-[40px]" />
      <span className="min-w-0">
        <span className="block font-serif text-[17px] leading-snug group-hover:underline">{b.title}</span>
        <span className="block truncate text-[12.5px] text-muted-foreground">{b.author}</span>
        <span className="mt-0.5 block text-[11.5px] text-muted-foreground tabular-nums">
          {dateRange(b) || (b.owned ? 'On shelf' : 'Not on shelf')}
          {written && <span className="md:hidden"> · {written}</span>}
        </span>
      </span>
      <span className="hidden min-w-0 text-[13px] leading-snug md:block">
        {last && <span className={cn('line-clamp-2', last.kind === 'quote' ? 'font-serif italic' : 'text-muted-foreground')}>{last.text}</span>}
      </span>
      <span className="flex flex-col items-center gap-0.5">
        <DepthMark book={b} size={40} />
        <Counts book={b} className="hidden md:block" />
      </span>
    </Link>
  )
}

function Menu({ books }: { books: Book[] }) {
  const user = useUser()!
  const navigate = useNavigate()
  const file = useRef<HTMLInputElement>(null)

  const exportBackup = () => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(
      new Blob([JSON.stringify({ books: books.map(({ deleted: _d, ...b }) => b) }, null, 2)], { type: 'application/json' }),
    )
    a.download = `reading-log-${today()}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  // Backups from the prototype and from this app share one format: { books: [...] }.
  const importBackup = async (f: File) => {
    try {
      const data = JSON.parse(await f.text())
      if (!Array.isArray(data.books)) throw new Error('not a backup')
      const now = Date.now()
      const incoming: Book[] = data.books
        .filter((b: Partial<Book> | null) => b?.id && b.title)
        .map((b: Partial<Book>) => ({
          id: String(b.id),
          title: String(b.title),
          author: String(b.author || ''),
          start: String(b.start || ''),
          end: String(b.end || ''),
          cover: String(b.cover || ''),
          owned: !!b.owned,
          page: sanitize(String(b.page || '')),
          updated: now,
        }))
      await saveBooks(user.id, incoming)
      toast.success(`Imported ${plural(incoming.length, 'book', 'books')}.`)
    } catch (e) {
      toast.error(e instanceof SyntaxError || (e as Error).message === 'not a backup' ? 'That file is not a reading log backup.' : 'Couldn’t import the backup. Try again when you’re online.')
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Menu" />}>
          <MoreHorizontal className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => navigate({ to: '/account' })}>Account</DropdownMenuItem>
          <DropdownMenuItem onClick={exportBackup}>Export backup</DropdownMenuItem>
          <DropdownMenuItem onClick={() => file.current?.click()}>Import backup</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0]
          e.target.value = ''
          if (f) void importBackup(f)
        }}
      />
    </>
  )
}
