import { cn } from 'cn'
import { Link, type LinkProps } from '@tanstack/react-router'
import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { buttonVariants } from '@/components/ui/button'

/** The sticky header of each screen, with an optional back link and an optional row below it, such as tabs. */
export function TopBar({ back, backLabel = 'Back', below, children }: { back?: LinkProps; backLabel?: string; below?: ReactNode; children?: ReactNode }) {
  return (
    <header className="sticky top-0 z-10 -mx-5 mb-3 border-b bg-background px-5">
      <div className="flex min-h-[60px] items-center gap-2 pt-3 pb-2">
        {back && (
          <Link {...back} aria-label={backLabel} className={cn(buttonVariants({ variant: 'ghost', size: 'icon-lg' }), '-ml-2')}>
            <ChevronLeft className="size-5" />
          </Link>
        )}
        {children}
      </div>
      {below}
    </header>
  )
}

export function Title({ children }: { children: ReactNode }) {
  return <h1 className="flex-1 truncate font-serif text-[24px] tracking-tight">{children}</h1>
}
