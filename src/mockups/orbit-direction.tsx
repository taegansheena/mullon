import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { type Book } from '@/lib/books'
import { Contour } from './contour'
import { IndexRow } from './index-direction'
import { Eyebrow, Fab, groupBooks, MockHeader, type Nav } from './parts'
import { depth, sampleBooks } from './sample'

const short = (s: string, n = 22) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

/** Direction 3, from "Orbits": what you're reading at the centre, what's waiting around it. */
export function OrbitList({ nav }: { nav: Nav }) {
  const [tab, setTab] = useState('Orbit')
  const groups = groupBooks(sampleBooks)
  const reading = groups.find((g) => g.kind === 'reading')?.books ?? []
  const shelf = groups.find((g) => g.name.endsWith('On shelf'))?.books ?? []
  const away = groups.find((g) => g.name.endsWith('Not on shelf'))?.books ?? []
  const thisYear = groups.find((g) => g.name === '2026')?.books ?? []

  return (
    <>
      <MockHeader tabs={['Orbit', 'Archive']} tab={tab} onTab={setTab} />
      {tab === 'Orbit' ? (
        <main className="mx-auto max-w-6xl px-5 pt-6 pb-28 md:grid md:grid-cols-[minmax(0,1fr)_340px] md:gap-12 md:pt-8">
          <section>
            <Eyebrow>In orbit</Eyebrow>
            <p className="mt-1 max-w-[46ch] text-[12.5px] text-muted-foreground">What you’re reading sits in the middle. Books on your shelf orbit close; ones you’d need to find sit further out.</p>
            <OrbitMap reading={reading} near={shelf} far={away} past={thisYear} onOpen={nav.open} />
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-foreground" />On shelf</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full border border-foreground" />Not on shelf</span>
              <span className="flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-muted-foreground/60" />Read this year</span>
            </div>
          </section>
          <aside className="mt-8 md:mt-0 md:border-l md:pl-8">
            <Eyebrow>Up next, nearest first</Eyebrow>
            <div className="mt-3 grid gap-3">
              {[...shelf.map((b) => ['Near · On shelf', b] as const), ...away.map((b) => ['Far · Not on shelf', b] as const)].map(([where, b]) => (
                <Card key={b.id} size="sm" className="gap-1.5 bg-card px-4 ring-border">
                  <div className="flex justify-between">
                    <Eyebrow className={where.startsWith('Near') ? 'text-primary' : ''}>{where}</Eyebrow>
                    <span className="text-[11px] text-muted-foreground">Not started</span>
                  </div>
                  <button onClick={() => nav.open(b.id)} className="text-left font-serif text-[17px] leading-snug hover:underline">
                    {b.title}
                  </button>
                  <div className="text-[12px] text-muted-foreground">{b.author}</div>
                  <div className="pt-1">
                    <Button size="xs" variant="outline">Start reading</Button>
                  </div>
                </Card>
              ))}
            </div>
          </aside>
        </main>
      ) : (
        <main className="mx-auto max-w-3xl px-5 pt-4 pb-28">
          {groups
            .filter((g) => g.kind === 'read')
            .map((g) => (
              <div key={g.name}>
                <div className="flex items-baseline justify-between pt-6 pb-1.5">
                  <Eyebrow>{g.name}</Eyebrow>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{g.books.length}</span>
                </div>
                {g.books.map((b) => (
                  <IndexRow key={b.id} book={b} onOpen={() => nav.open(b.id)} />
                ))}
              </div>
            ))}
        </main>
      )}
      <Fab />
    </>
  )
}

const C = 210
// Angles in degrees, picked so labels don't collide; extra books spread evenly after them.
const ring = (books: Book[], r: number, angles: number[]) =>
  books.map((b, i) => {
    const a = ((angles[i] ?? angles[0] + (i * 360) / books.length) * Math.PI) / 180
    return { b, x: C + r * Math.cos(a), y: C + r * Math.sin(a) }
  })

function OrbitMap({ reading, near, far, past, onOpen }: { reading: Book[]; near: Book[]; far: Book[]; past: Book[]; onOpen: (id: string) => void }) {
  const rings = [
    { r: 92, label: 'Close' },
    { r: 150, label: 'Far' },
    { r: 196, label: '' },
  ]
  const label = (x: number, y: number, text: string, sub: string, onClick: () => void, strong = false) => {
    const right = x >= C
    return (
      <g className="cursor-pointer" onClick={onClick}>
        <text x={x + (right ? 9 : -9)} y={y + 1} textAnchor={right ? 'start' : 'end'} className="fill-foreground font-serif" fontSize={strong ? 13 : 11.5}>
          {short(text)}
        </text>
        <text x={x + (right ? 9 : -9)} y={y + 13} textAnchor={right ? 'start' : 'end'} className="fill-muted-foreground" fontSize={9}>
          {sub}
        </text>
      </g>
    )
  }
  return (
    <svg viewBox="-100 0 620 420" className="mx-auto my-4 block w-full max-w-[720px]">
      {rings.map((r) => (
        <g key={r.r}>
          <circle cx={C} cy={C} r={r.r} fill="none" className="stroke-border" strokeWidth={1} strokeDasharray={r.label ? undefined : '2 4'} />
          {r.label && (
            <text x={C} y={C - r.r - 5} textAnchor="middle" className="fill-muted-foreground" fontSize={8} letterSpacing={1.6}>
              {r.label.toUpperCase()}
            </text>
          )}
        </g>
      ))}
      {ring(past, 196, [-60, 70, 120, 250]).map(({ b, x, y }) => (
        <circle key={b.id} cx={x} cy={y} r={2.5} className="fill-muted-foreground/60 cursor-pointer" onClick={() => onOpen(b.id)}>
          <title>{b.title}</title>
        </circle>
      ))}
      {reading.map((b, i) => {
        const d = depth(b)
        const s = 84 - i * 30
        return (
          <g key={b.id} transform={`translate(${C - s / 2 + (i ? 44 : -8)} ${C - s / 2 + (i ? -40 : 4)})`} className="cursor-pointer" onClick={() => onOpen(b.id)}>
            <Contour seed={b.title} rings={d.total + 2} size={s} />
          </g>
        )
      })}
      <text x={C} y={C + 64} textAnchor="middle" className="fill-primary font-serif" fontSize={15}>
        {short(reading[0]?.title ?? '', 30)}
      </text>
      <text x={C} y={C + 78} textAnchor="middle" className="fill-muted-foreground" fontSize={9}>
        {reading.length > 1 ? `and ${short(reading[1].title, 26)}` : ''}
      </text>
      {ring(near, 92, [-125, -20, 200]).map(({ b, x, y }) => (
        <g key={b.id}>
          <circle cx={x} cy={y} r={4.5} className="fill-foreground" />
          {label(x, y, b.title, 'On shelf', () => onOpen(b.id))}
        </g>
      ))}
      {ring(far, 150, [35, 145]).map(({ b, x, y }) => (
        <g key={b.id}>
          <circle cx={x} cy={y} r={4.5} className="fill-background stroke-foreground" strokeWidth={1.2} />
          {label(x, y, b.title, 'Not on shelf', () => onOpen(b.id))}
        </g>
      ))}
    </svg>
  )
}
