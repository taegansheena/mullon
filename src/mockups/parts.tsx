import { cn } from 'cn'
import { ChevronLeft, MoreHorizontal, Plus, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Book, status } from '@/lib/books'

export type Nav = { open: (id: string) => void; back: () => void }

/** The small tracked capitals the references use for every label. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-[10px] font-medium tracking-[0.18em] text-muted-foreground uppercase', className)}>{children}</div>
}

export function MockHeader({ tabs, tab, onTab, back }: { tabs?: string[]; tab?: string; onTab?: (t: string) => void; back?: () => void }) {
  const tabList = (className: string) =>
    tabs && (
      <Tabs value={tab} onValueChange={(v) => onTab?.(v as string)} className={className}>
        <TabsList variant="line" className="h-9 gap-4 p-0">
          {tabs.map((t) => (
            <TabsTrigger key={t} value={t} className="flex-none px-0 text-[10.5px] tracking-[0.16em] uppercase data-active:text-foreground group-data-[variant=line]/tabs-list:after:bottom-[-3px] after:!bg-primary">
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    )
  return (
    <header className="sticky top-0 z-10 border-b bg-background">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-5 md:gap-8">
        {back ? (
          <Button variant="ghost" size="icon-lg" className="-ml-2" aria-label="All books" onClick={back}>
            <ChevronLeft className="size-5" />
          </Button>
        ) : null}
        <span className="font-serif text-[21px] tracking-tight text-primary">Mullon</span>
        {tabList('hidden md:flex')}
        <span className="flex-1" />
        <Button variant="ghost" size="icon-lg" aria-label="Search">
          <Search className="size-[18px]" />
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="icon-lg" aria-label="Menu" />}>
            <MoreHorizontal className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>Account</DropdownMenuItem>
            <DropdownMenuItem>Export backup</DropdownMenuItem>
            <DropdownMenuItem>Import backup</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button className="hidden h-9 rounded-md px-3.5 text-[10.5px] tracking-[0.16em] uppercase md:inline-flex">
          <Plus /> Add a book
        </Button>
      </div>
      {tabs && <div className="-mt-1 px-5 md:hidden">{tabList('')}</div>}
    </header>
  )
}

/** The add button on phones, in the accent colour. */
export function Fab() {
  return (
    <Button aria-label="Add book" className="fixed right-5 bottom-5 size-14 rounded-full shadow-[0_6px_20px_-6px_rgb(0_0_0/0.35)] md:hidden">
      <Plus className="size-6" />
    </Button>
  )
}

/** The same groups as the live list: reading now, to be read by shelf, then each year finished. */
export function groupBooks(books: Book[]) {
  const reading = books.filter((b) => status(b) === 'reading').sort((a, b) => b.start.localeCompare(a.start))
  const tbr = books.filter((b) => status(b) === 'tbr')
  const done = books.filter((b) => b.end).sort((a, b) => b.end.localeCompare(a.end))
  const groups: { name: string; kind: 'reading' | 'tbr' | 'read'; books: Book[] }[] = []
  if (reading.length) groups.push({ name: 'Reading now', kind: 'reading', books: reading })
  for (const [name, owned] of [['To read · On shelf', true], ['To read · Not on shelf', false]] as const) {
    const bs = tbr.filter((b) => !!b.owned === owned)
    if (bs.length) groups.push({ name, kind: 'tbr', books: bs })
  }
  for (const b of done) {
    const y = b.end.slice(0, 4)
    const g = groups.find((x) => x.name === y)
    if (g) g.books.push(b)
    else groups.push({ name: y, kind: 'read', books: [b] })
  }
  return groups
}

export const fmtMonth = (d: string) => (d ? new Date(d + 'T00:00').toLocaleDateString('en-NZ', { day: 'numeric', month: 'short' }) : '')
