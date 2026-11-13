import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Segmented } from '@/components/segmented'
import { Spine } from '@/components/spine'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { type Book, hasCover, type Status, status as statusOf, today } from '@/lib/books'
import { searchBooksQuery } from '@/lib/openlibrary'

export type BookFields = Pick<Book, 'title' | 'author' | 'start' | 'end' | 'cover' | 'owned'>

const useDebounced = <T,>(value: T, ms: number) => {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

const inputClass = 'h-11 rounded-[10px] bg-background px-3 text-base md:text-base'

/** The form for adding or editing a book. onDelete is set when editing. */
export function BookForm({ initial, submitLabel, onSubmit, onDelete }: { initial: BookFields; submitLabel: string; onSubmit: (b: BookFields) => void; onDelete?: () => void }) {
  const [f, setF] = useState(initial)
  const [st, setSt] = useState<Status>(statusOf(initial))
  const [error, setError] = useState('')
  const set = (patch: Partial<BookFields>) => setF((cur) => ({ ...cur, ...patch }))

  // Suggest books from Open Library once typing in the title pauses; picking one fills in the title, author and cover.
  const [suggesting, setSuggesting] = useState(false)
  const q = useDebounced(f.title.trim(), 350)
  const { data: suggestions } = useQuery({ ...searchBooksQuery(q), enabled: suggesting && q.length >= 3 })
  const showSuggestions = suggesting && q.length >= 3 && q === f.title.trim() && !!suggestions?.length

  const setStatus = (s: Status) => {
    setSt(s)
    if (s !== 'tbr' && !f.start) set({ start: today() })
    if (s === 'read' && !f.end) set({ end: today() })
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const d = { ...f, title: f.title.trim(), author: f.author.trim() }
    if (st === 'tbr') d.start = d.end = ''
    if (st === 'reading') d.end = ''
    if (!d.title || !d.author) return setError('Add a title and an author.')
    if (st === 'reading' && !d.start) return setError('Add the date you started.')
    if (st === 'read' && !d.end) return setError('Add the date you finished.')
    if (d.start && d.end && d.end < d.start) return setError('Finished date is before the start date.')
    onSubmit(d)
  }

  return (
    <form className="grid gap-4 pt-2" autoComplete="off" onSubmit={submit} onFocus={(e) => {
        // Moving to another field hides the suggestions; picking one of them doesn't.
        if (e.target.name !== 'title' && !e.target.closest('[data-suggestions]')) setSuggesting(false)
      }}>
      <Field>
        <FieldLabel htmlFor="title" className="font-normal text-muted-foreground">Title</FieldLabel>
        <Input
          id="title"
          name="title"
          className={inputClass}
          value={f.title}
          autoFocus={!initial.title}
          onChange={(e) => {
            set({ title: e.target.value })
            setSuggesting(true)
          }}
        />
      </Field>
      {showSuggestions && (
        <div data-suggestions className="-mt-2 rounded-[10px] border px-3">
          {suggestions.map((d, i) => (
            <button
              key={i}
              type="button"
              className="flex w-full items-center gap-3.5 border-b py-3 text-left last:border-b-0"
              onClick={() => {
                set({ title: d.title, author: d.author_name[0], cover: d.cover_i ? String(d.cover_i) : '' })
                setSuggesting(false)
              }}
            >
              <Spine cover={d.cover_i} seed={d.title} size="S" />
              <span className="min-w-0 flex-1">
                <span className="block">{d.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {d.author_name[0]}
                  {d.first_publish_year ? ` · ${d.first_publish_year}` : ''}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
      <Field>
        <FieldLabel htmlFor="author" className="font-normal text-muted-foreground">Author</FieldLabel>
        <Input id="author" name="author" className={inputClass} value={f.author} onChange={(e) => set({ author: e.target.value })} />
      </Field>
      {hasCover(f.cover) && (
        <div className="flex items-center gap-2">
          <Spine cover={f.cover} seed={f.title} />
          <Button type="button" variant="link" className="text-muted-foreground" onClick={() => set({ cover: 'none' })}>
            Remove cover
          </Button>
        </div>
      )}
      <Segmented
        label="Status"
        value={st}
        onSelect={setStatus}
        options={[
          { value: 'tbr', label: 'To read' },
          { value: 'reading', label: 'Reading' },
          { value: 'read', label: 'Read' },
        ]}
      />
      {/* Kept when the book moves on from To read, but only shown while it's to be read. */}
      {st === 'tbr' && (
        <Segmented
          label="Shelf"
          value={f.owned ? 'yes' : 'no'}
          onSelect={(v) => set({ owned: v === 'yes' })}
          options={[
            { value: 'yes', label: 'On shelf' },
            { value: 'no', label: 'Not on shelf' },
          ]}
        />
      )}
      {st !== 'tbr' && (
        <div className="grid grid-cols-2 gap-3">
          <Field>
            <FieldLabel htmlFor="start" className="font-normal text-muted-foreground">Started</FieldLabel>
            <Input id="start" type="date" className={inputClass} value={f.start} onChange={(e) => set({ start: e.target.value })} />
          </Field>
          {st === 'read' && (
            <Field>
              <FieldLabel htmlFor="end" className="font-normal text-muted-foreground">Finished</FieldLabel>
              <Input id="end" type="date" className={inputClass} value={f.end} onChange={(e) => set({ end: e.target.value })} />
            </Field>
          )}
        </div>
      )}
      <p role="alert" className="-my-1 min-h-5 text-sm text-destructive">
        {error}
      </p>
      <div className="flex items-center gap-2">
        {onDelete && (
          <AlertDialog>
            <AlertDialogTrigger render={<Button type="button" variant="ghost" size="lg" className="-ml-2.5 text-destructive hover:text-destructive" />}>
              Delete book
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete “{initial.title}”?</AlertDialogTitle>
                <AlertDialogDescription>This also deletes everything written on its page.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <span className="flex-1" />
        <Button type="submit" size="lg" className="rounded-full px-4">
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
