import { cn } from 'cn'
import { hue } from '@/lib/books'

// A small seeded random generator, so each book always gets the same shape.
const rng = (seed: string) => {
  let s = hue(seed) * 7919 + seed.length * 104729
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

/**
 * A topographic mark for a book: one contour ring per note or quote, so books you've written more about look
 * deeper. Unstarted books draw a single dashed ring.
 */
export function Contour({ seed, rings, size = 48, dashed, className }: { seed: string; rings: number; size?: number; dashed?: boolean; className?: string }) {
  const r = rng(seed)
  const n = Math.max(1, Math.min(rings, size < 60 ? 9 : 14))
  const waves = [2, 3, 5].map((k) => ({ k, a: 0.05 + r() * 0.09, p: r() * Math.PI * 2 }))
  const drift = { x: (r() - 0.5) * 0.18, y: (r() - 0.5) * 0.18 }
  const paths = Array.from({ length: n }, (_, i) => {
    const t = (i + 1) / n
    // Scale so the widest wobble of the outer line still fits inside the box.
    const base = (0.47 / (1 + waves.reduce((s, w) => s + w.a, 0) + Math.hypot(drift.x, drift.y))) * (n === 1 ? 1 : 0.14 + 0.86 * t)
    const cx = 0.5 + drift.x * (1 - t)
    const cy = 0.5 + drift.y * (1 - t)
    const pts = Array.from({ length: 73 }, (_, j) => {
      const th = (j / 72) * Math.PI * 2
      const rr = base * (1 + waves.reduce((s, w) => s + w.a * Math.sin(w.k * th + w.p + i * 0.35), 0))
      return `${(cx + rr * Math.cos(th)) * 100},${(cy + rr * Math.sin(th)) * 100}`
    })
    return `M${pts.join('L')}Z`
  })
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={cn('flex-none text-[var(--contour)]', className)} aria-hidden>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="currentColor" strokeWidth={size > 80 ? 0.8 : 1} vectorEffect="non-scaling-stroke" strokeDasharray={dashed ? '3 3' : undefined} opacity={n === 1 ? 1 : 0.5 + (0.5 * (i + 1)) / n} />
      ))}
    </svg>
  )
}
