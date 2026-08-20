'use client'

import React from 'react'
import { BookOpen, SquarePlus } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { docsHelpEnabled } from '@repo/dally/ai'
import { useDocsHelpNavigate } from '@/components/shared/docs-help/docs-help-context'
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
  ['Relationships', 'System details, assets, vendors'],
]

// the worked example is deliberately fictional, do not swap in real customer or internal system names
const SYSTEM_DETAILS = ['Web application', 'API', 'Transactional email delivery', 'Data storage']
const ASSETS = ['Core API', 'CloudSQL DB', 'Production cluster', 'api.northwind.com']
const OUTSIDE = ['Customers', 'Internal staff', 'Identity provider']
const VENDORS = ['Cloud provider', 'Payment processor', 'Email delivery', 'CDN', 'DNS provider']

const ROW_HEIGHT = 28
const ROW_GAP = 34

const BoundaryDiagram: React.FC = () => (
  <svg
    className="w-full h-[330px] overflow-visible"
    viewBox="0 0 840 346"
    role="img"
    aria-label="A dashed trust boundary containing the platform's system details and assets, with outside actors on the left and vendor dependencies on the right, each connected by a data flow arrow."
  >
    <defs>
      <marker id="platforms-empty-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" className="fill-diagram-accent" />
      </marker>
    </defs>

    {/* trust boundary */}
    <rect x="190" y="26" width="454" height="306" rx="14" className="fill-diagram-accent/5 stroke-diagram-accent" strokeWidth="1.5" strokeDasharray="7 6" />
    <text x="206" y="18" className="fill-diagram-accent font-mono text-[11.5px] tracking-[0.06em]">
      TRUST BOUNDARY · THE SYSTEM DESCRIPTION
    </text>
    <text x="206" y="52" className="fill-foreground text-[15px] font-medium">
      Northwind Cloud
    </text>
    <text x="322" y="52" className="fill-muted-foreground text-xs">
      the platform
    </text>
    <text x="206" y="71" className="fill-muted-foreground font-mono text-[10.5px] tracking-[0.05em]">
      ACTIVE · PRODUCTION · CONTAINS PII
    </text>

    {/* system details */}
    <rect x="206" y="88" width="212" height="226" rx="10" className="fill-foreground/[0.02] stroke-border" />
    <text x="222" y="110" className="fill-card-foreground text-[13px] font-medium">
      System details
    </text>
    <text x="222" y="127" className="fill-muted-foreground text-[11.5px]">
      The parts of the system
    </text>
    {SYSTEM_DETAILS.map((label, i) => (
      <g key={label}>
        <rect x="222" y={138 + i * ROW_GAP} width="180" height={ROW_HEIGHT} rx="7" className="fill-popover stroke-border" />
        <text x="234" y={156 + i * ROW_GAP} className="fill-card-foreground text-xs">
          {label}
        </text>
      </g>
    ))}
    <rect x="222" y="274" width="180" height="26" rx="7" className="fill-background stroke-border" strokeDasharray="5 4" />
    <text x="234" y="291" className="fill-muted-foreground text-[11.5px]">
      + 6 more
    </text>

    {/* assets */}
    <rect x="430" y="88" width="198" height="226" rx="10" className="fill-foreground/[0.02] stroke-border" />
    <text x="446" y="110" className="fill-card-foreground text-[13px] font-medium">
      Assets
    </text>
    <text x="446" y="127" className="fill-muted-foreground text-[11.5px]">
      The resources that make it up
    </text>
    {ASSETS.map((label, i) => (
      <g key={label}>
        <rect x="446" y={138 + i * ROW_GAP} width="166" height={ROW_HEIGHT} rx="7" className="fill-popover stroke-border" />
        <text x="458" y={156 + i * ROW_GAP} className={`fill-card-foreground ${label.includes('.') ? 'font-mono text-[11.5px]' : 'text-xs'}`}>
          {label}
        </text>
      </g>
    ))}
    <rect x="446" y="274" width="166" height="26" rx="7" className="fill-background stroke-border" strokeDasharray="5 4" />
    <text x="458" y="291" className="fill-muted-foreground text-[11.5px]">
      + 12 more
    </text>

    {/* outside actors */}
    <text x="0" y="18" className="fill-muted-foreground font-mono text-[11.5px] tracking-[0.06em]">
      OUTSIDE
    </text>
    {OUTSIDE.map((label, i) => (
      <g key={label}>
        <rect x="0" y={34 + i * 50} width="158" height="38" rx="8" className="fill-popover stroke-border" />
        <text x="16" y={58 + i * 50} className="fill-card-foreground text-xs">
          {label}
        </text>
        <path d={`M 158 ${53 + i * 50} L 190 ${53 + i * 50}`} className="stroke-diagram-accent" strokeWidth="1.5" markerEnd="url(#platforms-empty-arrow)" />
      </g>
    ))}

    {/* vendor dependencies */}
    <text x="682" y="18" className="fill-muted-foreground font-mono text-[11.5px] tracking-[0.06em]">
      VENDORS
    </text>
    {VENDORS.map((label, i) => (
      <g key={label}>
        <rect x="682" y={34 + i * 50} width="158" height="38" rx="8" className="fill-popover stroke-border" />
        <text x="698" y={58 + i * 50} className="fill-card-foreground text-xs">
          {label}
        </text>
        <path d={`M 644 ${53 + i * 50} L 682 ${53 + i * 50}`} className="stroke-diagram-accent" strokeWidth="1.5" markerEnd="url(#platforms-empty-arrow)" />
      </g>
    ))}
  </svg>
)

const LEARN_MORE_CLASSES = 'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-sm font-medium text-diagram-accent hover:underline underline-offset-4'

/** opens the embedded docs drawer on the platforms topic, falling back to the docs site when docs help is off */
const LearnMoreLink: React.FC = () => {
  const navigateDocs = useDocsHelpNavigate()

  if (!docsHelpEnabled) {
    return (
      <a className={LEARN_MORE_CLASSES} href={`${PLATFORM_DOCS_URL}/registry/platforms`} target="_blank" rel="noreferrer">
        <BookOpen size={14} />
        Learn more
      </a>
    )
  }

  return (
    <button type="button" className={LEARN_MORE_CLASSES} onClick={() => navigateDocs({ title: 'Platforms', query: 'platforms registry system description trust boundary', prefer: 'platforms' })}>
      <BookOpen size={14} />
      Learn more
    </button>
  )
}

const PlatformsEmptyState: React.FC<TPlatformsEmptyStateProps> = ({ onCreate }) => (
  <div className="flex flex-col gap-6">
    <div className="flex items-center justify-between gap-4">
      <h2 className="text-2xl font-semibold">Platforms</h2>
      <LearnMoreLink />
    </div>

    <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground text-pretty">
      A platform is the thing you get audited on. It describes a governed system and the boundary around it: what it is, why it exists, who owns it, whether it handles PII, and what sits inside and
      outside its scope. Every audit is built on that system description, so the boundary narrative is one of the first things an auditor asks for.
    </p>

    <div className="flex flex-col gap-3.5 rounded-xl border border-border bg-accent px-7 pb-5 pt-6">
      <BoundaryDiagram />
      <div className="flex items-center justify-between gap-4 border-t border-border pt-3.5">
        <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
          This drawing is the audited system. Its system details and assets sit inside the boundary, and everything crossing the dashes is a data flow an auditor will ask about.
        </p>
        {onCreate && (
          <Button variant="primary" className="shrink-0" icon={<SquarePlus size={16} />} iconPosition="left" onClick={onCreate}>
            Start the walkthrough
          </Button>
        )}
      </div>
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

    <p className="text-sm leading-relaxed text-muted-foreground text-pretty">
      Not sure where something belongs? If it has its own owners and its own scope, with things inside it, make it a <strong className="font-medium text-card-foreground">platform</strong>. If
      it&rsquo;s something the system does, add it as a <strong className="font-medium text-card-foreground">system detail</strong>. If you can point at the exact resource, it&rsquo;s an{' '}
      <strong className="font-medium text-card-foreground">asset</strong>.
    </p>
  </div>
)

export default PlatformsEmptyState
