import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { Toaster } from '@/components/ui/sonner'

export const Route = createRootRoute({ component: Root })

function Root() {
  useRegisterSW({ immediate: true })
  return (
    <div className="mx-auto max-w-[680px] px-5 pt-[env(safe-area-inset-top)] pb-[calc(96px+env(safe-area-inset-bottom))]">
      <Outlet />
      <Toaster position="top-center" />
    </div>
  )
}
