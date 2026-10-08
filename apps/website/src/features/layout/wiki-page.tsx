type WikiPageProps = { eyebrow: string; title: string; description: string };

export function WikiPage({ eyebrow, title, description }: WikiPageProps) {
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-8">
      <section className="space-y-2">
        <p className="text-sm font-medium text-primary">{eyebrow}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="max-w-2xl text-muted-foreground">{description}</p>
      </section>
      <section className="grid flex-1 gap-4 md:grid-cols-3">
        <div className="min-h-36 rounded-xl bg-muted/50" />
        <div className="min-h-36 rounded-xl bg-muted/50" />
        <div className="min-h-36 rounded-xl bg-muted/50" />
      </section>
    </main>
  );
}
