import { cn } from 'cn'
import type { ReactNode } from 'react'

/** A small label in tracked capitals, for section headings and statuses. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('text-[10.5px] font-medium tracking-[0.16em] text-muted-foreground uppercase', className)}>{children}</div>
}
