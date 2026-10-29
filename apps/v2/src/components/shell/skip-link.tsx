/** First focusable element in <body>: hidden until focused, jumps to #main. */
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:left-4 focus-visible:top-3 focus-visible:z-[60] focus-visible:inline-flex focus-visible:min-h-11 focus-visible:items-center focus-visible:rounded-md focus-visible:bg-surface-2 focus-visible:px-4 focus-visible:text-body-s focus-visible:font-medium focus-visible:text-primary focus-visible:shadow-lg-premium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent-primary)] hover:text-[color:var(--text-secondary)] active:scale-[0.97]"
    >
      Skip to content
    </a>
  )
}
