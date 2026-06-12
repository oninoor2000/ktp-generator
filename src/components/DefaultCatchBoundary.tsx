import {
  ErrorComponent,
  Link,
  useLocation,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useLocation({
    select: (location) => location.pathname === '/',
  })

  console.error('DefaultCatchBoundary Error:', error)

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 text-zinc-950">
      <section className="w-full max-w-xl rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-red-700">
          Application error
        </p>
        <div className="mt-4 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm">
          <ErrorComponent error={error} />
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            router.invalidate()
          }}
          className="rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
          Try again
        </button>
        {isRoot ? (
          <Link
            to="/"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800"
          >
            Home
          </Link>
        ) : (
          <Link
            to="/"
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800"
            onClick={(e) => {
              e.preventDefault()
              window.history.back()
            }}
          >
            Go back
          </Link>
        )}
      </div>
      </section>
    </main>
  )
}
