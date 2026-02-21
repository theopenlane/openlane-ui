import React from 'react'

type IntegrationTagPillProps = {
  tag: string
}

const IntegrationTagPill = ({ tag }: IntegrationTagPillProps) => {
  const token = tag.trim().toLowerCase()
  const palette = tagPalette(token)

  return (
    <span
      className={`inline-flex h-5 max-w-[120px] items-center truncate rounded-sm border px-2 text-[10px] font-medium tracking-[0.01em] transition-all duration-150 ${palette.text} ${palette.background} ${palette.border} ${palette.hover}`}
      title={tag}
    >
      {tag}
    </span>
  )
}

export default IntegrationTagPill

function tagPalette(tag: string): { text: string; background: string; border: string; hover: string } {
  const palettes = [
    { text: 'text-sky-900/65', background: 'bg-sky-100/45', border: 'border-sky-100/45', hover: 'hover:bg-sky-100/65 hover:shadow-sm' },
    { text: 'text-slate-900/60', background: 'bg-slate-100/65', border: 'border-slate-100/65', hover: 'hover:bg-slate-100/85 hover:shadow-sm' },
    { text: 'text-emerald-900/65', background: 'bg-emerald-100/45', border: 'border-emerald-100/45', hover: 'hover:bg-emerald-100/65 hover:shadow-sm' },
    { text: 'text-violet-900/65', background: 'bg-violet-100/45', border: 'border-violet-100/45', hover: 'hover:bg-violet-100/65 hover:shadow-sm' },
    { text: 'text-amber-900/65', background: 'bg-amber-100/45', border: 'border-amber-100/45', hover: 'hover:bg-amber-100/65 hover:shadow-sm' },
    { text: 'text-rose-900/60', background: 'bg-rose-100/45', border: 'border-rose-100/45', hover: 'hover:bg-rose-100/65 hover:shadow-sm' },
    { text: 'text-indigo-900/60', background: 'bg-indigo-100/45', border: 'border-indigo-100/45', hover: 'hover:bg-indigo-100/65 hover:shadow-sm' },
    { text: 'text-teal-900/65', background: 'bg-teal-100/45', border: 'border-teal-100/45', hover: 'hover:bg-teal-100/65 hover:shadow-sm' },
    { text: 'text-cyan-900/60', background: 'bg-cyan-100/45', border: 'border-cyan-100/45', hover: 'hover:bg-cyan-100/65 hover:shadow-sm' },
    { text: 'text-fuchsia-900/60', background: 'bg-fuchsia-100/45', border: 'border-fuchsia-100/45', hover: 'hover:bg-fuchsia-100/65 hover:shadow-sm' },
    { text: 'text-lime-900/65', background: 'bg-lime-100/50', border: 'border-lime-100/50', hover: 'hover:bg-lime-100/70 hover:shadow-sm' },
    { text: 'text-orange-900/60', background: 'bg-orange-100/45', border: 'border-orange-100/45', hover: 'hover:bg-orange-100/65 hover:shadow-sm' },
    { text: 'text-stone-900/60', background: 'bg-stone-100/65', border: 'border-stone-100/65', hover: 'hover:bg-stone-100/85 hover:shadow-sm' },
    { text: 'text-blue-900/60', background: 'bg-blue-100/45', border: 'border-blue-100/45', hover: 'hover:bg-blue-100/65 hover:shadow-sm' },
    { text: 'text-green-900/65', background: 'bg-green-100/45', border: 'border-green-100/45', hover: 'hover:bg-green-100/65 hover:shadow-sm' },
    { text: 'text-purple-900/60', background: 'bg-purple-100/45', border: 'border-purple-100/45', hover: 'hover:bg-purple-100/65 hover:shadow-sm' },
    { text: 'text-red-900/60', background: 'bg-red-100/45', border: 'border-red-100/45', hover: 'hover:bg-red-100/65 hover:shadow-sm' },
    { text: 'text-zinc-900/60', background: 'bg-zinc-100/65', border: 'border-zinc-100/65', hover: 'hover:bg-zinc-100/85 hover:shadow-sm' },
  ] as const

  const idx = hashTag(tag) % palettes.length
  return palettes[idx] ?? palettes[0]
}

function hashTag(tag: string): number {
  let hash = 0x811c9dc5
  for (let i = 0; i < tag.length; i += 1) {
    hash ^= tag.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0
}
