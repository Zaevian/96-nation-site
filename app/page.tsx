export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-6 text-center">
      <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
        Ticketing hub
      </p>
      <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
        96 Nation
      </h1>
      <p className="mt-4 max-w-md text-lg text-zinc-400">
        Next.js App Router + TypeScript + Tailwind CSS v4 scaffold. Replace this
        hello page as product routes land.
      </p>
      <div className="mt-8 rounded-full bg-emerald-500 px-6 py-2 text-sm font-semibold text-zinc-950 shadow-lg shadow-emerald-500/30">
        Tailwind utilities active
      </div>
    </main>
  );
}
