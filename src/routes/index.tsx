import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { fetchRegionSummary } from '~/server/regions'
import { ModeToggle } from '~/components/mode-toggle'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const regionSummary = useSuspenseQuery({
    queryKey: ['region-summary'],
    queryFn: () => fetchRegionSummary(),
  })

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
              KTP Generator
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-foreground sm:text-4xl">
              Indonesian region data is ready.
            </h1>
          </div>
          <div className="flex items-start gap-3">
            <div className="hidden rounded-md border border-border bg-card px-4 py-3 text-right shadow-sm sm:block">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Source
              </p>
              <p className="mt-1 text-sm font-semibold text-card-foreground">
                cahyadsn/wilayah
              </p>
            </div>
            <ModeToggle />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-md border border-border bg-card p-6 shadow-sm">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-card-foreground">
                Database integration
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                This page reads the seeded Cloudflare D1 region tables through a
                TanStack Start server function and caches the result with
                TanStack Query.
              </p>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              <Metric
                label="Provinces"
                value={regionSummary.data.counts.provinces}
              />
              <Metric
                label="Regencies"
                value={regionSummary.data.counts.regencies}
              />
              <Metric
                label="Districts"
                value={regionSummary.data.counts.districts}
              />
              <Metric
                label="Villages"
                value={regionSummary.data.counts.villages}
              />
            </div>
          </div>

          <aside className="rounded-md border border-zinc-800 bg-zinc-950 p-5 text-white shadow-sm dark:border-zinc-200 dark:bg-zinc-100 dark:text-zinc-950">
            <h2 className="text-base font-semibold">Sample provinces</h2>
            <div className="mt-5 divide-y divide-white/10 dark:divide-zinc-300">
              {regionSummary.data.sampleProvinces.map((province) => (
                    <div className="py-3" key={province.id}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{province.name}</p>
                        <span className="rounded bg-white/10 px-2 py-1 text-xs text-zinc-200 dark:bg-zinc-900/10 dark:text-zinc-700">
                          {province.id}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
                        {province.regencyCount.toLocaleString('id-ID')} regencies
                      </p>
                    </div>
                  ))}
            </div>
          </aside>
        </section>
      </section>
    </main>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-border bg-muted p-4">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-foreground">
        {value.toLocaleString('id-ID')}
      </p>
    </div>
  )
}
