'use client'

import React from 'react'
import { BookOpen, SquarePlus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { DocsLink } from '@/components/shared/docs-help/docs-link'
import { PLATFORM_DOCS_URL } from '@/constants/docs'

type TPlatformsEmptyStateProps = {
  /** Opens the Create Platform wizard. Omitted when the user lacks permission */
  onCreate?: () => void
}

const STEPS: [string, string][] = [
  ['Basics', 'Name, status, description'],
  ['Business purpose', 'Why the system exists'],
  ['Data flow summary', 'How data moves through it'],
  ['Trust boundary', 'Where the boundary sits'],
  ['Scope', 'What is in, and what you left out'],
  ['Ownership', 'Business, technical, security'],
  ['Relationships', 'Assets, vendors'],
]

// the worked example is deliberately fictional, do not swap in real customer or internal system names
const NARRATIVE = ['Business purpose', 'Scope statement', 'Trust boundary', 'Data flow summary']
const OWNERS: [string, string][] = [
  ['BUSINESS', 'Dana Whitfield'],
  ['TECHNICAL', 'Priya Raman'],
  ['SECURITY', 'Marcus Oyelaran'],
  ['PLATFORM', 'Alex Nakamura'],
]

type TInventoryGroup = {
  title: string
  /** the environment lasso and its label, spelled out so tailwind can see the classes */
  lassoClass: string
  labelClass: string
  x: number
  y: number
  height: number
  items: [string, string][]
  more: string
  /** out of scope reads as muted and dashed, the way the record itself does */
  excluded?: boolean
}

// the counts reconcile to the IN SCOPE label: 4 + 7, 2 + 1 and 2 + 4 is 20
const IN_SCOPE: TInventoryGroup[] = [
  {
    title: 'PRODUCTION',
    lassoClass: 'stroke-success',
    labelClass: 'fill-success',
    x: 256,
    y: 100,
    height: 146,
    items: [
      ['Core API', 'ASSET · SERVICE'],
      ['CloudSQL DB', 'ASSET · PII'],
      ['GCP', 'VENDOR · CLOUD'],
      ['Cloudflare', 'VENDOR · CDN & DNS'],
    ],
    more: '+ 7 MORE IN PRODUCTION',
  },
  {
    title: 'DEVELOPMENT',
    lassoClass: 'stroke-info',
    labelClass: 'fill-info',
    x: 256,
    y: 300,
    height: 92,
    items: [
      ['GitHub', 'VENDOR · CHANGE MGMT'],
      ['Buildkite', 'VENDOR · CI'],
    ],
    more: '+ 1 MORE IN DEVELOPMENT',
  },
  {
    title: 'OPERATIONS',
    lassoClass: 'stroke-warning',
    labelClass: 'fill-warning',
    x: 256,
    y: 446,
    height: 92,
    items: [
      ['Google Workspace', 'VENDOR · IDENTITY'],
      ['Endpoint mgmt', 'VENDOR · DEVICE MGMT'],
    ],
    more: '+ 4 MORE IN OPERATIONS',
  },
]

const OUT_OF_SCOPE: TInventoryGroup[] = [
  {
    title: 'OPERATIONS',
    lassoClass: 'stroke-muted-foreground',
    labelClass: 'fill-muted-foreground',
    x: 618,
    y: 100,
    height: 146,
    items: [
      ['HubSpot', 'CRM · SALES'],
      ['QuickBooks', 'ACCOUNTING'],
      ['Marketing automation', 'MARKETING'],
      ['Applicant tracking', 'RECRUITING'],
    ],
    more: '+ 3 MORE EXCLUDED',
    excluded: true,
  },
  {
    title: 'DEVELOPMENT',
    lassoClass: 'stroke-muted-foreground',
    labelClass: 'fill-muted-foreground',
    x: 618,
    y: 300,
    height: 92,
    items: [
      ['Figma', 'DESIGN TOOLING'],
      ['Notion', 'DOCS · INTERNAL'],
    ],
    more: '+ 2 MORE EXCLUDED',
    excluded: true,
  },
]

const CARD_WIDTH = 148
const CARD_HEIGHT = 46
const CARD_GAP_X = 156
const CARD_GAP_Y = 54

/** one environment lasso: its label, the assets and vendors inside it, and the count it stands in for */
const InventoryGroup: React.FC<TInventoryGroup> = ({ title, lassoClass, labelClass, x, y, height, items, more, excluded }) => (
  <g>
    <rect x={x} y={y} width="328" height={height} rx="14" fill="none" className={lassoClass} strokeWidth="1.5" strokeDasharray="7 6" />
    <text x={x + 12} y={y + 16} className={`${labelClass} font-mono text-[11px] tracking-[0.07em]`}>
      {title}
    </text>
    {items.map(([label, meta], i) => {
      const cardX = x + 12 + (i % 2) * CARD_GAP_X
      const cardY = y + 34 + Math.floor(i / 2) * CARD_GAP_Y
      return (
        <g key={label}>
          <rect
            x={cardX}
            y={cardY}
            width={CARD_WIDTH}
            height={CARD_HEIGHT}
            rx="7"
            className={excluded ? 'fill-foreground/[0.03] stroke-border' : 'fill-popover stroke-border'}
            strokeDasharray={excluded ? '5 4' : undefined}
          />
          <text x={cardX + 12} y={cardY + 19} className={excluded ? 'fill-muted-foreground text-[13px]' : 'fill-card-foreground text-[13px]'}>
            {label}
          </text>
          <text x={cardX + 12} y={cardY + 35} className="fill-muted-foreground/70 font-mono text-[9.5px] tracking-[0.05em]">
            {meta}
          </text>
        </g>
      )
    })}
    <rect x={x + 12} y={y + height + 8} width="304" height="26" rx="7" className="fill-foreground/[0.03] stroke-border" strokeDasharray="6 5" />
    <text x={x + 25} y={y + height + 25} className="fill-muted-foreground font-mono text-[9.5px] tracking-[0.05em]">
      {more}
    </text>
  </g>
)

const BoundaryDiagram: React.FC = () => (
  <svg
    className="h-auto w-full min-w-[760px] overflow-visible"
    viewBox="0 32 962 586"
    role="img"
    aria-label="A platform record: the system description and its four owner roles on the left, and the assets and vendors it governs on the right, grouped by environment and split between in scope and out of scope."
  >
    {/* the record itself, everything inside it belongs to one platform */}
    <rect x="0" y="44" width="962" height="544" rx="14" className="fill-diagram-accent/5 stroke-diagram-accent" strokeWidth="1.5" strokeDasharray="7 6" />
    <path d="M 242 60 L 242 572" className="stroke-border" strokeWidth="1" strokeDasharray="4 5" />

    {/* the narrative */}
    <text x="16" y="80" className="fill-foreground text-[15px] font-medium">
      Northwind Cloud
    </text>
    <text x="16" y="97" className="fill-muted-foreground font-mono text-[8.5px] tracking-[0.05em]">
      ACTIVE · CRITICAL · CONTAINS PII
    </text>
    <text x="16" y="120" className="fill-muted-foreground/70 font-mono text-[9px] tracking-[0.07em]">
      SYSTEM DESCRIPTION
    </text>
    {NARRATIVE.map((label, i) => (
      <g key={label}>
        <rect x="16" y={131 + i * 30} width="212" height="26" rx="6" className="fill-popover stroke-border" />
        <path d={`M 27 ${144 + i * 30} l 3 3.5 l 5.5 -7`} fill="none" className="stroke-diagram-accent" strokeWidth="1.6" strokeLinecap="round" />
        <text x="42" y={148 + i * 30} className="fill-card-foreground text-[11px]">
          {label}
        </text>
      </g>
    ))}
    <rect x="16" y="253" width="212" height="24" rx="6" className="fill-foreground/[0.03] stroke-border" strokeDasharray="6 5" />
    <text x="27" y="269" className="fill-muted-foreground font-mono text-[8.5px] tracking-[0.05em]">
      3 DIAGRAMS ATTACHED
    </text>

    {/* ownership */}
    <text x="16" y="301" className="fill-muted-foreground/70 font-mono text-[9px] tracking-[0.07em]">
      OWNERSHIP
    </text>
    {OWNERS.map(([role, name], i) => (
      <g key={role}>
        <rect x="16" y={312 + i * 37} width="212" height="32" rx="6" className="fill-popover stroke-border" />
        <text x="27" y={325 + i * 37} className="fill-muted-foreground/70 font-mono text-[8px] tracking-[0.07em]">
          {role}
        </text>
        <text x="27" y={338 + i * 37} className="fill-card-foreground text-[11px]">
          {name}
        </text>
      </g>
    ))}

    {/* the inventory the record governs */}
    <text x="256" y="80" className="fill-muted-foreground/70 font-mono text-[9px] tracking-[0.07em]">
      IN SCOPE · 20 ASSETS AND VENDORS
    </text>
    <text x="618" y="80" className="fill-muted-foreground/70 font-mono text-[9px] tracking-[0.07em]">
      OUT OF SCOPE
    </text>
    {[...IN_SCOPE, ...OUT_OF_SCOPE].map((group) => (
      <InventoryGroup key={`${group.x}-${group.y}`} {...group} />
    ))}
  </svg>
)

const LEARN_MORE_CLASSES = 'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium text-diagram-accent hover:underline underline-offset-4'

const PLATFORMS_TOPIC = { title: 'Platforms', query: 'platforms registry system description trust boundary', prefer: 'platforms' }

const LearnMoreLink: React.FC = () => (
  <DocsLink topic={PLATFORMS_TOPIC} href={`${PLATFORM_DOCS_URL}/registry/platforms`} className={LEARN_MORE_CLASSES}>
    <BookOpen size={14} />
    Learn more
  </DocsLink>
)

const PlatformsEmptyState: React.FC<TPlatformsEmptyStateProps> = ({ onCreate }) => (
  <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold">Platforms</h2>
      <LearnMoreLink />
    </div>

    <p className="max-w-6xl leading-relaxed text-muted-foreground text-pretty">
      A platform is the thing you get audited on. It describes a governed system and the boundary around it: what it is, why it exists, who owns it, whether it handles PII, and what sits inside and
      outside its scope. Every audit is built on that system description, so the boundary narrative is one of the first things an auditor asks for.
    </p>

    <div className="flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3.5 overflow-x-auto rounded-xl border border-border bg-accent px-7 pb-5 pt-6">
        <div className="flex items-center justify-between gap-4">
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground/70">An example representation of a platform definition</p>
          {onCreate && (
            <Button variant="primary" className="shrink-0" icon={<SquarePlus size={16} />} iconPosition="left" onClick={onCreate}>
              Start the walkthrough
            </Button>
          )}
        </div>
        <BoundaryDiagram />
        <p className="border-t border-border pt-3.5 text-sm leading-relaxed text-muted-foreground text-pretty">
          One record: the narrative and its four owner roles on the left, the inventory it governs on the right, grouped by environment. Anything whose primary purpose is a business function, like
          CRM, accounting or marketing, is excluded with the reason recorded in the scope statement.
        </p>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <div className="flex items-baseline gap-2.5">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">The walkthrough</span>
          <span className="font-mono text-[11.5px] text-muted-foreground">7 STEPS · EVERY FIELD IS EDITABLE LATER</span>
        </div>
        <ol className="grid grid-cols-2 gap-x-5 gap-y-3 xl:grid-cols-4">
          {STEPS.map(([label, sub], i) => (
            <li key={label} className="flex items-start gap-2.5">
              <span className="mt-px flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-border font-mono text-[10px] text-muted-foreground">{i + 1}</span>
              <span className="flex min-w-0 flex-col">
                <span className="text-[13px] text-card-foreground">{label}</span>
                <span className="text-[11.5px] text-muted-foreground">{sub}</span>
              </span>
            </li>
          ))}
          <li className="flex items-start gap-2.5">
            <span className="mt-px flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full border border-dashed border-border font-mono text-[10px] text-muted-foreground">+</span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[13px] text-card-foreground">Diagrams</span>
              <span className="text-[11.5px] text-muted-foreground">Upload later, on the record</span>
            </span>
          </li>
        </ol>
      </div>
    </div>
  </div>
)

export default PlatformsEmptyState
