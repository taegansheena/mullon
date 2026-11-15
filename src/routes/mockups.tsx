import { createFileRoute } from '@tanstack/react-router'
import { cn } from 'cn'
import { useEffect } from 'react'
import { BookMock } from '@/mockups/book-mock'
import { HomeList } from '@/mockups/home-direction'
import { IndexList } from '@/mockups/index-direction'
import { OrbitList } from '@/mockups/orbit-direction'
import { TerrainList } from '@/mockups/terrain-direction'
import '@/mockups/mockups.css'

const directions = { home: HomeList, index: IndexList, terrain: TerrainList, orbit: OrbitList }
type Direction = keyof typeof directions
type Search = { d: Direction; theme: 'paper' | 'night'; book?: string; chrome?: boolean }

// Design mockups with sample books, outside sign-in. Nothing here reads or writes real books.
export const Route = createFileRoute('/mockups')({
  validateSearch: (s: Record<string, unknown>): Search => ({
    d: s.d === 'index' || s.d === 'terrain' || s.d === 'orbit' ? s.d : 'home',
    theme: s.theme === 'night' ? 'night' : 'paper',
    ...(typeof s.book === 'string' ? { book: s.book } : {}),
    ...(s.chrome === false || s.chrome === 'false' ? { chrome: false } : {}),
  }),
  component: Mockups,
})

function Mockups() {
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const set = (patch: Partial<Search>) => navigate({ search: (s) => ({ ...s, ...patch }) })
  const nav = { open: (book: string) => set({ book }), back: () => set({ book: undefined }) }
  const List = directions[search.d]

  // The app's root adds padding and a narrow column; the mockups span the window.
  useEffect(() => {
    const root = document.getElementById('root')!.firstElementChild as HTMLElement
    root.dataset.mock = ''
    root.style.cssText = 'max-width:none;padding:0'
    return () => void (root.style.cssText = '')
  }, [])

  return (
    <div className={cn('min-h-dvh font-sans', search.theme === 'night' ? 'mock-night' : 'mock-paper')}>
      {search.chrome !== false && (
        <div className="flex flex-wrap items-center gap-2 bg-neutral-900 px-4 py-2 text-[12px] text-neutral-300">
          <span>Mockup</span>
          {(['home', 'index', 'terrain', 'orbit'] as const).map((d) => (
            <button key={d} onClick={() => set({ d, book: undefined })} className={cn('rounded px-2 py-1', d === search.d && 'bg-neutral-700 text-white')}>
              {d === 'home' ? 'New look' : d}
            </button>
          ))}
          <span className="flex-1" />
          <button onClick={() => set({ theme: search.theme === 'night' ? 'paper' : 'night' })} className="rounded px-2 py-1 hover:bg-neutral-800">
            {search.theme === 'night' ? 'Paper theme' : 'Night theme'}
          </button>
        </div>
      )}
      {search.book ? <BookMock id={search.book} nav={nav} contour={search.d !== 'index'} /> : <List nav={nav} />}
    </div>
  )
}
