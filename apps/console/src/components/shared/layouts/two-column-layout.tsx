import React from 'react'

interface TwoColumnLayoutProps {
  main: React.ReactNode
  aside: React.ReactNode
  asidePosition?: 'left' | 'right' // Optional: default is "right"
}

export const TwoColumnLayout: React.FC<TwoColumnLayoutProps> = ({ main, aside, asidePosition = 'right' }) => {
  return (
    <div className="flex w-full gap-12">
      {asidePosition === 'left' && <aside className="basis-96 shrink-0">{aside}</aside>}
      <main className="grow">{main}</main>
      {asidePosition === 'right' && <aside className="basis-96 shrink-0">{aside}</aside>}
    </div>
  )
}
