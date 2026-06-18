const foundationItems = [
  { label: "Next.js App Router", detail: "Application shell" },
  { label: "TypeScript", detail: "Strict project contracts" },
  { label: "Tailwind CSS", detail: "Dark/gold design tokens" },
  { label: "Supabase boundary", detail: "Client and server split" },
  { label: "GitHub Actions", detail: "PR and main checks" },
  { label: "Vercel", detail: "Production deploy path" },
];

export default function Home() {
  return (
    <main className="min-h-svh bg-[#070706] text-[#f4efe2]">
      <section className="mx-auto flex min-h-svh w-full max-w-6xl flex-col justify-center px-6 py-16">
        <div className="max-w-3xl">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#c8a756]">
            CCA-F Exam Prep
          </p>
          <h1 className="mt-5 text-4xl font-semibold tracking-normal text-balance sm:text-5xl">
            A dark scholarly command center for certification study.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#b8b0a0]">
            This first slice establishes the deployable app shell. Auth,
            database migrations, study pages, quizzes, admin tools, and AI
            features are implemented in follow-up plans.
          </p>
        </div>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {foundationItems.map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#2d2a22] bg-[#12110f] px-4 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.28)]"
            >
              <div className="text-sm font-medium text-[#f4efe2]">{item.label}</div>
              <div className="mt-2 text-sm text-[#8f8878]">{item.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
