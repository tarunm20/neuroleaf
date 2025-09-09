
export function BlogHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-primary/3">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="relative container mx-auto px-4 py-16 max-w-5xl">
        <div className="text-center space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              <span className="text-foreground">Study</span>{' '}
              <span className="text-primary">Smarter</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-light max-w-3xl mx-auto leading-relaxed">
              Evidence-based learning strategies and study techniques to help you achieve academic excellence
            </p>
          </div>

        </div>
      </div>
    </section>
  );
}