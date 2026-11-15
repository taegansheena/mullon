import { cn } from 'cn'
import { type Book, depth, hue, status } from '@/lib/books'

// A small seeded random generator, so each book always gets the same shape.
const rng = (seed: string) => {
  let s = hue(seed) * 7919 + seed.length * 104729
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

/**
 * A topographic mark showing how much is written about a book: a dashed outline before it's started, one line
 * once started, and one more line inside it for each note or quote.
 */
export function DepthMark({ book, size = 40, className }: { book: Pick<Book, 'title' | 'author' | 'start' | 'end' | 'page'>; size?: number; className?: string }) {
  const tbr = status(book) === 'tbr'
  const r = rng(book.title + book.author)
  const n = tbr ? 1 : Math.min(1 + depth(book.page).total, size < 60 ? 9 : 14)
  const waves = [2, 3, 5].map((k) => ({ k, a: 0.05 + r() * 0.09, p: r() * Math.PI * 2 }))
  const drift = { x: (r() - 0.5) * 0.18, y: (r() - 0.5) * 0.18 }
  // Scaled so the widest wobble of the outer line still fits inside the box.
  const outer = 0.47 / (1 + waves.reduce((s, w) => s + w.a, 0) + Math.hypot(drift.x, drift.y))
  const paths = Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n
    const base = outer * (n === 1 ? 1 : 0.14 + 0.86 * t)
    const cx = 0.5 + drift.x * (1 - t)
    const cy = 0.5 + drift.y * (1 - t)
    const pts = Array.from({ length: 73 }, (_, j) => {
      const th = (j / 72) * Math.PI * 2
      const rr = base * (1 + waves.reduce((s, w) => s + w.a * Math.sin(w.k * th + w.p + i * 0.35), 0))
      return `${((cx + rr * Math.cos(th)) * 100).toFixed(2)},${((cy + rr * Math.sin(th)) * 100).toFixed(2)}`
    })
    return `M${pts.join('L')}Z`
  })
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={cn('flex-none', tbr ? 'text-muted-foreground/60' : 'text-contour', className)} aria-hidden>
      {paths.map((d, i) => (
        <path
          key={i}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={size > 80 ? 0.8 : 1}
          vectorEffect="non-scaling-stroke"
          strokeDasharray={tbr ? '3 3' : undefined}
          opacity={n === 1 ? 1 : 0.5 + (0.5 * (i + 1)) / n}
        />
      ))}
    </svg>
  )
}
