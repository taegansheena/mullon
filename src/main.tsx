import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { useUser } from './lib/auth'
import { persistOptions, queryClient } from './lib/queries'
import { routeTree } from './routeTree.gen'
import './index.css'

// Hash URLs (#/book/…) work on GitHub Pages without a server rewrite, and match the prototype's links.
const router = createRouter({
  routeTree,
  history: createHashHistory(),
  scrollRestoration: true,
  defaultPreload: 'intent',
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

function App() {
  const user = useUser()
  // Re-run route guards when someone signs in or out.
  useEffect(() => void router.invalidate(), [user])
  return <RouterProvider router={router} />
}

// The prototype's service worker cache; the new worker keeps its own.
void globalThis.caches?.delete('reading-log-v2')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
      // Send edits made offline in an earlier session, then re-read the books.
      onSuccess={() => queryClient.resumePausedMutations().then(() => queryClient.invalidateQueries())}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
)
