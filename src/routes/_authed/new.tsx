import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { BookForm } from '@/components/book-form'
import { Title, TopBar } from '@/components/top-bar'
import { useUser } from '@/lib/auth'
import { today } from '@/lib/books'
import { saveBook } from '@/lib/queries'

export const Route = createFileRoute('/_authed/new')({ component: NewBook })

function NewBook() {
  const user = useUser()!
  const navigate = useNavigate()
  return (
    <>
      <TopBar back={{ to: '/' }}>
        <Title>New book</Title>
      </TopBar>
      <BookForm
        initial={{ title: '', author: '', start: today(), end: '', cover: '', owned: false }}
        submitLabel="Add book"
        onSubmit={(d) => {
          const id = crypto.randomUUID()
          saveBook(user.id, { id, ...d, page: '', updated: 0 })
          navigate({ to: '/book/$id', params: { id }, replace: true })
        }}
      />
    </>
  )
}
