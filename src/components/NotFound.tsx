import { Link } from '@tanstack/react-router'

export function NotFound({ children }: { children?: any }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-50 px-5 text-zinc-950">
      <section className="w-full max-w-md rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
          Not found
        </p>
        <h1 className="mt-3 text-2xl font-semibold">This page is not available.</h1>
        <div className="mt-3 text-sm leading-6 text-zinc-600">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
        <button
          onClick={() => window.history.back()}
          className="mt-6 rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white"
        >
          Go back
        </button>
        <Link
          to="/"
          className="ml-3 inline-flex rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800"
        >
          Home
        </Link>
      </section>
    </main>
  )
}
