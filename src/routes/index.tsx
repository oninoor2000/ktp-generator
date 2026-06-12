import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { fetchRegionSummary } from '~/server/regions'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const regionSummary = useSuspenseQuery({
    queryKey: ['region-summary'],
    queryFn: () => fetchRegionSummary(),
  })

  return (
    <main className="min-h-screen bg-stone-50 text-zinc-950">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between border-b border-zinc-200 pb-5">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
              KTP Generator
            </p>
            <h1 className="mt-2 text-3xl font-semibold text-zinc-950 sm:text-4xl">
              Indonesian region data is ready.
            </h1>
          </div>
          <div className="hidden rounded-md border border-zinc-200 bg-white px-4 py-3 text-right shadow-sm sm:block">
            <p className="text-xs font-medium uppercase text-zinc-500">
              Source
            </p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">
              cahyadsn/wilayah
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
            <div className="max-w-2xl">
              <h2 className="text-xl font-semibold text-zinc-950">
                Database integration
              </h2>
              <p className="mt-3 text-sm leading-6 text-zinc-600">
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

          <aside className="rounded-md border border-zinc-200 bg-zinc-950 p-5 text-white shadow-sm">
            <h2 className="text-base font-semibold">Sample provinces</h2>
            <div className="mt-5 divide-y divide-white/10">
              {regionSummary.data.sampleProvinces.map((province) => (
                    <div className="py-3" key={province.id}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{province.name}</p>
                        <span className="rounded bg-white/10 px-2 py-1 text-xs text-zinc-200">
                          {province.id}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-400">
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
    <div className="rounded-md border border-zinc-200 bg-stone-50 p-4">
      <p className="text-sm font-medium text-zinc-500">{label}</p>
      <p className="mt-3 text-2xl font-semibold text-zinc-950">
        {value.toLocaleString('id-ID')}
      </p>
    </div>
  )
}
