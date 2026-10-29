import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

// UX only. Private data is protected by requireUser on each server fn.
export const Route = createFileRoute('/_authed')({
  beforeLoad: ({ context, location }) => {
    if (!context.session) throw redirect({ to: '/login', search: { redirect: location.href } })
    return { session: context.session }
  },
  component: Outlet,
})
