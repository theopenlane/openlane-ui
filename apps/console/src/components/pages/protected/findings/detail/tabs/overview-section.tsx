import React from 'react'

export const OverviewSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="min-w-0 space-y-2">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>
)
