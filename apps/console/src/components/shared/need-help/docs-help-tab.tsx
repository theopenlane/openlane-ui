'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { BookText } from 'lucide-react'
import { motion } from 'motion/react'
import { InfoSlideOut } from '@repo/ui/info-slide-out'
import { docsHelpEnabled } from '@repo/dally/ai'
import { DocsHelpContent } from './need-help'
import { docsHelpQuery } from './docs-help-query'
import { useDocsHelpTopic, type DocsHelpTopic } from './docs-help-context'

// static "what is this page" blurbs shown at the top of the panel — the single
// place to manage the intro texts that used to live in per-page info callouts
const INTROS = {
  dashboard: 'This is your Compliance Home dashboard. Use it to get a snapshot of your compliance posture and quickly access your most important work.',
  programs:
    'Programs are a centerpiece for managing compliance and regulatory requirements. Think of a program as a large, high-level grouping of work; it represents a significant body of work that can be broken down into smaller, more manageable tasks — a big picture initiative that can span months or a year+, and can encompass work across different teams.',
  controls:
    'Controls are the foundation of your compliance program. Each control defines a specific security, privacy, or operational requirement that your organization follows to protect systems and data.\n\nControls serve as the bridge between high-level compliance frameworks (like SOC 2 or ISO 27001) and the actual policies, procedures, and evidence your team manages day-to-day.',
  policies:
    'Policies set the rules for how your organization operates securely and responsibly. They define expectations for behavior, outline required practices, and form the foundation for your compliance program.\n\nCommon examples include:\n\n* **Information Security Policy** – defines how data is protected\n* **Access Control Policy** – governs who can access systems and data\n* **Incident Response Policy** – outlines how to respond to security events\n* **Acceptable Use Policy** – sets expectations for using company systems',
}

// Override of route topics, only needed if the default isn't pulling up a relevant/best doc to start
const ROUTE_TOPICS: [string, DocsHelpTopic][] = [
  ['/dashboard', { title: 'Home', query: docsHelpQuery('list', 'the dashboard'), intro: INTROS.dashboard, prefer: 'Platform Overview' }],
  ['/controls/create-control', { title: 'Create a Control', query: docsHelpQuery('create', 'a control'), prefer: 'Writing Controls', intro: INTROS.controls }],
  ['/controls/create-subcontrol', { title: 'Create a Subcontrol', query: docsHelpQuery('create', 'a subcontrol'), prefer: 'Writing Controls', intro: INTROS.controls }],
  ['/controls', { title: 'Controls', query: docsHelpQuery('list', 'controls'), intro: INTROS.controls }],
  ['/programs/create', { title: 'Create a program', query: docsHelpQuery('create', 'a compliance program') }],
  ['/programs', { title: 'Programs', query: docsHelpQuery('list', 'compliance programs'), intro: INTROS.programs }],
  ['/policies/create', { title: 'Create a policy', query: docsHelpQuery('create', 'an internal policy') }],
  ['/policies', { title: 'Internal Policies', query: docsHelpQuery('list', 'internal policies'), intro: INTROS.policies }],
  ['/procedures/create', { title: 'Create a procedure', query: docsHelpQuery('create', 'a procedure') }],
  ['/evidence', { title: 'Evidence Center', query: docsHelpQuery('list', 'evidence collection') }],
  ['/standards', { title: 'Standards Catalog', query: docsHelpQuery('list', 'standards and frameworks') }],
  ['/exposure/reviews', { title: 'Reviews', query: docsHelpQuery('list', 'risk review'), prefer: 'reviews' }],
  ['/organization-settings/authentication', { title: 'Authentication', query: docsHelpQuery('list', 'authentication and single sign-on') }],
  ['/user-management', { title: 'User Management', query: docsHelpQuery('list', 'members groups and roles') }],
  ['/exposure/triage', { title: 'Triage Queue', query: docsHelpQuery('list', 'vulnerabilities'), prefer: 'vulnerabilities' }],
]

function topicForPath(pathname: string): DocsHelpTopic {
  const hit = ROUTE_TOPICS.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (hit) return hit[1]
  // fallback for unmapped routes: build the topic from the URL segments, skipping object ids,
  // so new pages get sensible docs help without a map entry
  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter((s) => !/^(?:[a-z]+_)?[0-9a-z]{16,}$/i.test(s) && !/^\d+$/.test(s)) // drop id-ish segments, incl. prefixed ids like def_01K0...
    .map((s) => s.replace(/[-_]/g, ' '))
  // the last segment is the actual page — query and prefer on it, or section
  // words like "exposure" drown out the page topic in retrieval
  const last = segments[segments.length - 1] ?? 'the console'
  const title = last.replace(/\b\w/g, (ch) => ch.toUpperCase())
  return { title, query: docsHelpQuery('list', last), prefer: segments.length > 1 ? last : undefined }
}

const TAB_CLASSES =
  'flex flex-col items-center gap-1.5 rounded-l-md border border-r-0 border-border bg-card px-1.5 py-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground'

// lucide book-text, with the text lines drawing in on hover
function AnimatedBookText({ hovered, size = 14 }: { hovered: boolean; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="rotate-90"
      animate={hovered ? 'hover' : 'rest'}
      initial="rest"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      {['M8 7h6', 'M8 11h8'].map((d, i) => (
        <motion.path
          key={d}
          d={d}
          variants={{
            rest: { pathLength: 1, opacity: 1 },
            hover: { pathLength: [0, 1], opacity: [0, 1], transition: { delay: i * 0.15, duration: 0.35 } },
          }}
        />
      ))}
    </motion.svg>
  )
}

function DocsTabButton({ onClick, label, className }: { onClick: () => void; label: string; className: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button type="button" onClick={onClick} aria-label={label} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={className}>
      <AnimatedBookText hovered={hovered} />
      <span style={{ writingMode: 'vertical-rl' }}>Docs</span>
    </button>
  )
}

/** Right-edge "Docs" tab that pulls open the contextual docs drawer for the current page */
export function DocsHelpTab() {
  const [open, setOpen] = useState(false)

  const [showClosedTab, setShowClosedTab] = useState(true)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const override = useDocsHelpTopic()

  const [body, setBody] = useState<HTMLElement | null>(null)
  useEffect(() => setBody(document.body), [])

  useEffect(() => () => clearTimeout(closeTimerRef.current ?? undefined), [])

  if (!docsHelpEnabled) return null

  const topic = override ?? topicForPath(pathname ?? '/')

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    if (next) {
      setShowClosedTab(false)
    } else {
      // matches the sheet's data-[state=closed]:duration-300 slide-out
      closeTimerRef.current = setTimeout(() => setShowClosedTab(true), 300)
    }
  }

  return (
    <InfoSlideOut
      title={topic.title}
      open={open}
      onOpenChange={handleOpenChange}
      width={660}
      resizable
      hideClose
      icon={<BookText size={20} className="self-center" />}
      trigger={(openPanel) =>
        showClosedTab && body
          ? createPortal(<DocsTabButton onClick={openPanel} label={`Open docs help for ${topic.title}`} className={`fixed right-0 top-1/2 z-40 -translate-y-1/2 ${TAB_CLASSES}`} />, body)
          : null
      }
      edgeHandle={<DocsTabButton onClick={() => handleOpenChange(false)} label="Close docs help" className={`absolute left-0 top-1/2 -translate-x-full -translate-y-1/2 ${TAB_CLASSES}`} />}
    >
      {/* key resets follow-up/selection state when the topic changes */}
      <DocsHelpContent
        key={topic.query}
        query={topic.query}
        prefer={topic.prefer}
        intro={topic.intro}
        section={pathname?.startsWith('/developers') ? 'developers' : 'platform'}
        enabled={open}
        closePanel={() => handleOpenChange(false)}
      />
    </InfoSlideOut>
  )
}
