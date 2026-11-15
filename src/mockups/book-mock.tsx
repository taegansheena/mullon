import { cn } from 'cn'
import { Button } from '@/components/ui/button'
import { Segmented } from '@/components/segmented'
import { dateRange, status } from '@/lib/books'
import { Spine } from '@/components/spine'
import { DepthMark } from './home-direction'
import { Eyebrow, MockHeader, type Nav } from './parts'
import { depth, firstNote, quotes, sampleBooks } from './sample'

/**
 * The book page in the new look: the title and your position so far on top, then the notes with each quote
 * numbered as a figure, and an index of those figures beside them on wide screens.
 */
export function BookMock({ id, nav, contour }: { id: string; nav: Nav; contour?: boolean }) {
  const b = sampleBooks.find((x) => x.id === id) ?? sampleBooks[1]
  const d = depth(b)
  const qs = quotes(b)
  // The first note is pinned above the page as your position on the book, and left out of the page below.
  const take = firstNote(b)
  const body = take ? b.page.replace(`<p>${take}</p>`, '') : b.page
  const tbr = status(b) === 'tbr'

  return (
    <>
      <MockHeader back={nav.back} />
      <main className="mx-auto max-w-6xl px-5 pt-6 pb-32 md:grid md:grid-cols-[minmax(0,1fr)_300px] md:gap-12 md:pt-10">
        <article className="min-w-0">
          <div className="flex gap-5">
            <div className="min-w-0 flex-1">
              <Eyebrow className="text-primary">{status(b) === 'reading' ? 'Reading now' : tbr ? (b.owned ? 'To read · On shelf' : 'To read · Not on shelf') : 'Read'}</Eyebrow>
              <h1 className="mt-2 font-serif text-[30px] leading-[1.08] tracking-tight text-balance md:text-[40px]">{b.title}</h1>
              <div className="mt-1.5 text-muted-foreground">{b.author}</div>
              <div className="mt-3 flex items-center gap-2.5 text-[12px] text-muted-foreground tabular-nums">
                {contour && <DepthMark book={b} size={30} />}
                {[dateRange(b) || 'Not started', d.quotes && `${d.quotes} quotes`, d.notes && `${d.notes} notes`].filter(Boolean).join(' · ')}
              </div>
            </div>
            <Spine cover={b.cover} seed={b.title + b.author} className="h-auto min-h-[114px] w-[76px] self-start shadow-[0_2px_8px_-2px_rgb(0_0_0/0.3)] md:min-h-[150px] md:w-[100px]" />
          </div>

          {tbr && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button size="lg" className="rounded-full px-4">Start reading</Button>
              <Segmented label="Shelf" value={b.owned ? 'yes' : 'no'} onSelect={() => {}} options={[{ value: 'yes', label: 'On shelf' }, { value: 'no', label: 'Not on shelf' }]} />
            </div>
          )}

          {take && (
            <div className="mt-5 rounded-md bg-[var(--olive-soft)] px-4 py-3">
              <Eyebrow className="text-primary">Pinned · Your position so far</Eyebrow>
              <p className="mt-1 text-[15px] leading-relaxed text-pretty">{take}</p>
            </div>
          )}

          <div
            className={cn('mock-notes mt-6 border-t pt-5 text-[17px] leading-[1.65]', !b.page && 'text-muted-foreground')}
            dangerouslySetInnerHTML={{ __html: body || '<p>Write anything about this book here.<br>To save a passage, write or paste it, then tap Quote.</p>' }}
          />
        </article>

        <aside className="hidden md:block md:border-l md:pl-8">
          <Eyebrow>Figures</Eyebrow>
          {qs.length ? (
            <ol className="mt-2">
              {qs.map((q, i) => (
                <li key={i} className="flex gap-3 border-b py-2.5 text-[13px] leading-snug">
                  <span className="w-10 flex-none text-[11px] text-primary tabular-nums">Fig. {i + 1}</span>
                  <span className="line-clamp-3 font-serif italic">{q}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-2 text-[12.5px] text-muted-foreground">Quotes you keep are numbered here.</p>
          )}
        </aside>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background px-3 pt-2 pb-2">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-2">
          <Segmented label="Paragraph style" value="note" onSelect={() => {}} options={[{ value: 'note', label: 'Note' }, { value: 'quote', label: 'Quote', className: 'font-serif italic' }]} />
          <span className="flex-1 text-right text-[12px] text-muted-foreground">Saved</span>
        </div>
      </div>
    </>
  )
}
