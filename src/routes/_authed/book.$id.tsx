import { createFileRoute, Link, Navigate } from '@tanstack/react-router'
import { useEffect, useRef, useState } from 'react'
import { Segmented } from '@/components/segmented'
import { Spine } from '@/components/spine'
import { TopBar } from '@/components/top-bar'
import { Button, buttonVariants } from '@/components/ui/button'
import { useUser } from '@/lib/auth'
import { type Book, dateRange, hasCover, sanitize, status, today } from '@/lib/books'
import { saveBook, useBook } from '@/lib/queries'

export const Route = createFileRoute('/_authed/book/$id')({ component: BookPage })

function BookPage() {
  const { id } = Route.useParams()
  const user = useUser()!
  const { book, isPending } = useBook(id)
  if (isPending) return null
  if (!book) return <Navigate to="/" replace />
  const tbr = status(book) === 'tbr'

  return (
    <>
      <TopBar back={{ to: '/' }} backLabel="All books">
        <span className="flex-1" />
        <Link to="/book/$id/edit" params={{ id }} className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
          Edit
        </Link>
      </TopBar>
      <div className="flow-root border-b pt-1 pb-4">
        {hasCover(book.cover) && (
          <Spine cover={book.cover} seed={book.title + book.author} className="float-right mt-1 mb-2 ml-4 h-auto w-[76px] shadow-[0_2px_8px_-2px_rgb(0_0_0/0.3)]" />
        )}
        <h2 className="mb-1 font-serif text-[28px] leading-tight font-medium text-balance">{book.title}</h2>
        <div className="text-muted-foreground">{book.author}</div>
        <div className="mt-2 text-[13px] text-muted-foreground tabular-nums">{dateRange(book) || 'To be read'}</div>
        {tbr && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="lg" className="rounded-full px-4" onClick={() => saveBook(user.id, { ...book, start: today() })}>
              Start reading
            </Button>
            <Segmented
              label="Shelf"
              value={book.owned ? 'yes' : 'no'}
              onSelect={(v) => (v === 'yes') !== book.owned && saveBook(user.id, { ...book, owned: v === 'yes' })}
              options={[
                { value: 'yes', label: 'On shelf' },
                { value: 'no', label: 'Not on shelf' },
              ]}
            />
          </div>
        )}
      </div>
      <NotesEditor key={id} book={book} userId={user.id} />
    </>
  )
}

/**
 * The book's page of notes and quotes. React renders the element once and the browser owns its content after
 * that, so typing never re-renders under the cursor. A newer copy from another device replaces the content only
 * while the page isn't being written on.
 */
function NotesEditor({ book, userId }: { book: Book; userId: string }) {
  const page = useRef<HTMLDivElement>(null)
  // The newest copy of the book, for saves made from event handlers.
  const latest = useRef(book)
  useEffect(() => {
    latest.current = book
  })
  const [empty, setEmpty] = useState(!book.page)
  const [block, setBlock] = useState<'note' | 'quote'>('note')
  const [saved, setSaved] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const isEmpty = (el = page.current!) => !el.textContent!.trim() && !el.querySelector('blockquote')
  const save = (el = page.current!) => {
    clearTimeout(timer.current)
    timer.current = undefined
    const html = isEmpty(el) ? '' : sanitize(el.innerHTML)
    if (html !== (latest.current.page || '')) saveBook(userId, { ...latest.current, page: html })
    setSaved(true)
  }
  const saveSoon = () => {
    setSaved(false)
    clearTimeout(timer.current)
    timer.current = setTimeout(save, 400)
  }

  // Show the stored page on open, and newer copies from elsewhere when not being edited.
  useEffect(() => {
    const el = page.current!
    if (document.activeElement === el) return
    if (sanitize(el.innerHTML) === (book.page || '') && el.innerHTML) return
    el.innerHTML = sanitize(book.page || '') || '<p><br></p>'
    setEmpty(isEmpty())
  }, [book.page])

  useEffect(() => {
    document.execCommand('defaultParagraphSeparator', false, 'p')
    // Save anything still waiting when leaving the page. The ref is already cleared by then, so keep the element.
    const el = page.current!
    return () => {
      if (timer.current) save(el)
    }
    // Runs once per book: the editor is keyed by book ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const currentBlock = () => {
    const sel = getSelection()
    if (!sel?.rangeCount) return null
    let n = sel.anchorNode
    if (!n || !page.current!.contains(n)) return null
    while (n && n !== page.current) {
      if (n.nodeName === 'BLOCKQUOTE') return 'quote'
      n = n.parentNode
    }
    return 'note'
  }

  useEffect(() => {
    const onSel = () => {
      const k = currentBlock()
      if (k) setBlock(k)
    }
    document.addEventListener('selectionchange', onSel)
    return () => document.removeEventListener('selectionchange', onSel)
  }, [])

  const format = (k: 'note' | 'quote') => {
    const el = page.current!
    if (!currentBlock()) {
      // Nothing selected in the page: add to the end.
      el.focus()
      const r = document.createRange()
      r.selectNodeContents(el)
      r.collapse(false)
      const s = getSelection()!
      s.removeAllRanges()
      s.addRange(r)
    }
    document.execCommand('formatBlock', false, k === 'quote' ? 'blockquote' : 'p')
    setBlock(currentBlock() ?? k)
    setEmpty(isEmpty())
    saveSoon()
  }

  // Enter ends a quote and starts a note paragraph below it. Shift+Enter adds a line inside the quote.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || currentBlock() !== 'quote') return
    e.preventDefault()
    let bq = getSelection()!.anchorNode!
    while (bq.nodeName !== 'BLOCKQUOTE') bq = bq.parentNode!
    const p = document.createElement('p')
    p.append(document.createElement('br'))
    ;(bq as Element).after(p)
    const r = document.createRange()
    r.setStart(p, 0)
    r.collapse(true)
    const s = getSelection()!
    s.removeAllRanges()
    s.addRange(r)
    setBlock('note')
    saveSoon()
  }

  // Keep the Note/Quote bar above the on-screen keyboard.
  const [keyboard, setKeyboard] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => setKeyboard(Math.max(0, innerHeight - vv.height - vv.offsetTop))
    vv.addEventListener('resize', onResize)
    return () => vv.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <div className="relative">
        {empty && (
          <p className="pointer-events-none absolute top-5 whitespace-pre-line text-[17px] leading-[1.65] text-muted-foreground">
            {'Write anything about this book here.\nTo save a passage, write or paste it, then tap Quote.'}
          </p>
        )}
        <div
          ref={page}
          contentEditable
          suppressContentEditableWarning
          spellCheck
          role="textbox"
          aria-multiline
          aria-label="Notes and quotes"
          className="notes min-h-[55vh] pt-5 pb-10 text-[17px] leading-[1.65] outline-none [overflow-wrap:anywhere]"
          onInput={() => {
            setEmpty(isEmpty())
            saveSoon()
          }}
          onBlur={() => save()}
          onKeyDown={onKeyDown}
          onPaste={(e) => {
            e.preventDefault()
            document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
          }}
        />
      </div>
      <div className="fixed inset-x-0 z-20 border-t bg-background px-3 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]" style={{ bottom: keyboard }}>
        <div className="mx-auto flex max-w-[680px] items-center gap-2">
          <Segmented
            label="Paragraph style"
            keepFocus
            value={block}
            onSelect={format}
            options={[
              { value: 'note', label: 'Note' },
              { value: 'quote', label: 'Quote', className: 'font-serif italic' },
            ]}
          />
          <span className="flex-1 text-right text-[13px] text-muted-foreground">{saved ? 'Saved' : ''}</span>
        </div>
      </div>
    </>
  )
}
