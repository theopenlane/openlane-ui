import React from 'react'

type DashboardPageShellProps = {
  header: React.ReactNode
  overview: React.ReactNode
  main: React.ReactNode
  aside: React.ReactNode
}

export const DashboardPageShell = ({ header, overview, main, aside }: DashboardPageShellProps) => (
  <div className="max-w-[1476px] mx-auto w-full px-4 flex flex-col gap-4">
    <div>{header}</div>

    {overview}

    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1 min-w-0">{main}</div>
      <div className="w-full lg:w-[350px] shrink-0 flex flex-col gap-4">{aside}</div>
    </div>
  </div>
)
