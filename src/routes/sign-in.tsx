import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { Title, TopBar } from '@/components/top-bar'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { getUser } from '@/lib/auth'
import { IS_LIVE, supabase } from '@/lib/supabase'

export const Route = createFileRoute('/sign-in')({
  beforeLoad: () => {
    if (getUser()) throw redirect({ to: '/' })
  },
  component: SignIn,
})

const friendly: Record<string, string> = {
  'Invalid login credentials': 'That email and password don’t match. New here? Tap Create an account below.',
  'Email not confirmed': 'Confirm your email first: tap the link in the email we sent, then sign in.',
  'User already registered': 'There’s already an account for this email. Sign in instead.',
  'Signups not allowed for this instance': 'New accounts aren’t open yet. If you already have an account, sign in instead.',
}

// Someone who used the prototype on this device probably has an account already.
const hadPrototype = () => !!JSON.parse(localStorage.getItem('reading-log:v1') ?? 'null')?.sync

function SignIn() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>(hadPrototype() ? 'signin' : 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)
  const signup = mode === 'signup'

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    setInfo('')
    const addr = email.trim()
    let failure
    if (signup) {
      const { data, error } = await supabase.auth.signUp({ email: addr, password })
      failure = error
      // With email confirmation on, there is no session until the link in the email is tapped.
      if (!error && !data.session) {
        setMode('signin')
        setInfo(`We’ve emailed a confirmation link to ${addr}. Tap it, then come back here and sign in.`)
      }
    } else {
      failure = (await supabase.auth.signInWithPassword({ email: addr, password })).error
    }
    setBusy(false)
    if (failure) return setError(friendly[failure.message] ?? failure.message)
    if (getUser()) navigate({ to: '/', replace: true })
  }

  return (
    <>
      <TopBar>
        <Title>Reading log</Title>
      </TopBar>
      <p className="mt-2 mb-5 text-pretty">
        {signup ? 'Create an account to keep your books the same on your phone and computer.' : 'Sign in to keep your books the same on your phone and computer.'}
      </p>
      <form className="grid gap-4" onSubmit={submit}>
        <Field>
          <FieldLabel htmlFor="email" className="font-normal text-muted-foreground">Email</FieldLabel>
          <Input id="email" type="email" autoComplete="username" required className="h-11 rounded-[10px] px-3 text-base md:text-base" value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password" className="font-normal text-muted-foreground">Password</FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete={signup ? 'new-password' : 'current-password'}
            minLength={6}
            required
            className="h-11 rounded-[10px] px-3 text-base md:text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {info && <p className="text-[13px] text-muted-foreground">{info}</p>}
        <p role="alert" className="-my-1 min-h-5 text-sm text-destructive">
          {error}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="link"
            className="-ml-2.5 text-muted-foreground"
            onClick={() => {
              setMode(signup ? 'signin' : 'signup')
              setError('')
              setInfo('')
            }}
          >
            {signup ? 'Sign in instead' : 'Create an account'}
          </Button>
          <span className="flex-1" />
          <Button type="submit" size="lg" className="rounded-full px-4" disabled={busy}>
            {busy ? 'One moment…' : signup ? 'Create account' : 'Sign in'}
          </Button>
        </div>
      </form>
      {!IS_LIVE && <p className="mt-8 text-[13px] text-muted-foreground">This is a preview. Books here are kept separately from your real books.</p>}
    </>
  )
}
