import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-16">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm sm:p-12">
        <p className="mb-3 text-sm font-semibold tracking-wide text-sky-600 uppercase">
          TanStack Start
        </p>
        <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl">Start building.</h1>
        <p className="mb-6 max-w-xl text-lg leading-8 text-slate-600">
          A minimal TanStack Start page powered by Vite+ and Tailwind CSS.
        </p>
        <a
          className="inline-flex rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700"
          href="https://tanstack.com/start"
          target="_blank"
          rel="noreferrer"
        >
          Read the docs
        </a>
      </section>
    </main>
  );
}
