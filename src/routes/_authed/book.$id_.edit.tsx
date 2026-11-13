import { createFileRoute, Navigate, useNavigate } from '@tanstack/react-router'
import { BookForm } from '@/components/book-form'
import { Title, TopBar } from '@/components/top-bar'
import { useUser } from '@/lib/auth'
import { saveBook, useBook } from '@/lib/queries'

export const Route = createFileRoute('/_authed/book/$id_/edit')({ component: EditBook })

function EditBook() {
  const { id } = Route.useParams()
  const user = useUser()!
  const navigate = useNavigate()
  const { book, isPending } = useBook(id)
  if (isPending) return null
  if (!book) return <Navigate to="/" replace />
  return (
    <>
      <TopBar back={{ to: '/book/$id', params: { id } }}>
        <Title>Edit book</Title>
      </TopBar>
      <BookForm
        initial={book}
        submitLabel="Save"
        onSubmit={(d) => {
          saveBook(user.id, { ...book, ...d })
          navigate({ to: '/book/$id', params: { id }, replace: true })
        }}
        onDelete={() => {
          navigate({ to: '/', replace: true })
          saveBook(user.id, { ...book, page: '', deleted: true })
        }}
      />
    </>
  )
}
