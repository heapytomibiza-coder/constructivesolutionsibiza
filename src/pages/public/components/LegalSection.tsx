import React from 'react';

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}
