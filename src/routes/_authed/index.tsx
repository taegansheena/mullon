import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { cn } from 'cn'
import { MoreHorizontal, Plus, Search } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'
import { Spine } from '@/components/spine'
import { Title, TopBar } from '@/components/top-bar'
import { Button, buttonVariants } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { useUser } from '@/lib/auth'
import { type Book, dateRange, quoteCount, sanitize, status, today } from '@/lib/books'
import { saveBooks, useBooks } from '@/lib/queries'

export const Route = createFileRoute('/_authed/')({
  validateSearch: (s: Record<string, unknown>): { q?: string } => (typeof s.q === 'string' && s.q ? { q: s.q } : {}),
  component: List,
})

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

function groupBooks(books: Book[]) {
  const reading = books.filter((b) => status(b) === 'reading').sort((a, b) => b.start.localeCompare(a.start))
  const tbr = books.filter((b) => status(b) === 'tbr')
  const done = books.filter((b) => b.end).sort((a, b) => b.end.localeCompare(a.end))
  const groups: [string, Book[]][] = []
  if (reading.length) groups.push(['Reading now', reading])
  for (const [name, owned] of [['To be read · On shelf', true], ['To be read · Not on shelf', false]] as const) {
    const bs = tbr.filter((b) => !!b.owned === owned)
    if (bs.length) groups.push([name, bs])
  }
  for (const b of done) {
    const y = b.end.slice(0, 4)
    const g = groups.find((x) => x[0] === y)
    if (g) g[1].push(b)
    else groups.push([y, [b]])
  }
  return groups
}

function List() {
  const { q = '' } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const { data: all, isPending, isError } = useBooks()
  const needle = q.toLowerCase()
  const books = (all ?? []).filter((b) => `${b.title} ${b.author}`.toLowerCase().includes(needle))
  const groups = groupBooks(books)
  const finished = (all ?? []).filter((b) => b.end).length

  return (
    <>
      <TopBar>
        <Title>My books</Title>
        {all && <span className="text-sm text-muted-foreground">{finished} read</span>}
        <Menu books={all ?? []} />
      </TopBar>

      {!!all?.length && (
        <label className="mb-2 flex h-10 items-center gap-2 rounded-[10px] bg-muted px-3 text-muted-foreground">
          <Search className="size-[18px]" />
          <input
            type="search"
            placeholder="Search title or author"
            aria-label="Search title or author"
            value={q}
            onChange={(e) => navigate({ search: e.target.value ? { q: e.target.value } : {}, replace: true })}
            className="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          />
        </label>
      )}

      {isPending ? (
        <div className="pt-5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3.5 border-b py-3">
              <Skeleton className="h-[50px] w-[34px]" />
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
        groups.map(([name, bs]) => (
          <section key={name}>
            <h2 className="flex justify-between pt-5 pb-1 text-[13px] text-muted-foreground">
              <span>{name}</span>
              <span>{plural(bs.length, 'book', 'books')}</span>
            </h2>
            {bs.map((b) => (
              <BookRow key={b.id} book={b} />
            ))}
          </section>
        ))
      ) : (
        <p className="py-12 text-center text-muted-foreground">
          {all?.length ? (
            'No books match.'
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
          'fixed right-[max(20px,calc(50vw-320px))] bottom-[calc(20px+env(safe-area-inset-bottom))] size-14 rounded-full shadow-[0_6px_20px_-6px_rgb(0_0_0/0.35)]',
        )}
      >
        <Plus className="size-6" />
      </Link>
    </>
  )
}

function BookRow({ book: b }: { book: Book }) {
  const n = quoteCount(b.page || '')
  return (
    <Link to="/book/$id" params={{ id: b.id }} className="group flex w-full items-center gap-3.5 border-b py-3 text-left">
      <Spine cover={b.cover} seed={b.title + b.author} />
      <span className="min-w-0 flex-1">
        <span className="block truncate underline-offset-[3px] group-hover:underline">{b.title}</span>
        <span className="block truncate text-sm text-muted-foreground">{b.author}</span>
        <span className="mt-0.5 flex gap-3 text-xs text-muted-foreground tabular-nums">
          <span>{dateRange(b)}</span>
          {n > 0 && <span>{plural(n, 'quote', 'quotes')}</span>}
        </span>
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
