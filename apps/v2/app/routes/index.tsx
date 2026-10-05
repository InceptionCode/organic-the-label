import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="page-shell">
      <div className="content-container flex flex-col items-center justify-center min-h-screen gap-4">
        <h1 className="text-display-xl text-accent">Organic Sonics</h1>
        <p className="text-body-m text-muted">v2 scaffold — coming soon</p>
      </div>
    </main>
  )
}
