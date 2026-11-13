import { cn } from 'cn'
import { Link, type LinkProps } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { buttonVariants } from '@/components/ui/button'

/** The sticky header of each screen, with an optional back link. */
export function TopBar({ back, backLabel = 'Back', children }: { back?: LinkProps; backLabel?: string; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 -mx-2 flex min-h-[60px] items-center gap-2 bg-background px-2 pt-3 pb-2">
      {back && (
        <Link {...back} aria-label={backLabel} className={cn(buttonVariants({ variant: 'ghost', size: 'icon-lg' }), '-ml-2')}>
          <ChevronLeft className="size-5" />
        </Link>
      )}
      {children}
    </header>
  )
}

export function Title({ children }: { children: ReactNode }) {
  return <h1 className="flex-1 truncate text-[22px] font-semibold tracking-tight">{children}</h1>
}
