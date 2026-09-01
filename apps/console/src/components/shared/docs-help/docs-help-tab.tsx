'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname } from 'next/navigation'
import { BookText } from 'lucide-react'
import { motion } from 'motion/react'
import { InfoSlideOut } from '@repo/ui/info-slide-out'
import { docsHelpAvailable } from '@repo/dally/ai'
import { DocsHelpContent } from './docs-help-content'
import { docsHelpQuery } from './docs-help-query'
import { useDocsHelpDrawer, useDocsHelpEphemeralTopic, useDocsHelpTopic, type DocsHelpTopic } from './docs-help-context'
import type { DocsSection } from '@/types/docs-help'

const INTROS = {
  dashboard: 'This is your Compliance Home dashboard. Use it to get a snapshot of your compliance posture and quickly access your most important work.',
  programs:
    'Programs are a centerpiece for managing compliance and regulatory requirements. Think of a program as a large, high-level grouping of work; it represents a significant body of work that can be broken down into smaller, more manageable tasks — a big picture initiative that can span months or a year+, and can encompass work across different teams.',
  controls:
    'Controls are the foundation of your compliance program. Each control defines a specific security, privacy, or operational requirement that your organization follows to protect systems and data.\n\nControls serve as the bridge between high-level compliance frameworks (like SOC 2 or ISO 27001) and the actual policies, procedures, and evidence your team manages day-to-day.',
  policies:
    'Policies set the rules for how your organization operates securely and responsibly. They define expectations for behavior, outline required practices, and form the foundation for your compliance program.\n\nCommon examples include:\n\n* **Information Security Policy** – defines how data is protected\n* **Access Control Policy** – governs who can access systems and data\n* **Incident Response Policy** – outlines how to respond to security events\n* **Acceptable Use Policy** – sets expectations for using company systems',
}

const ROUTE_TOPICS: [string, DocsHelpTopic][] = [
  ['/dashboard', { title: 'Home', query: docsHelpQuery('list', 'the dashboard'), intro: INTROS.dashboard, prefer: 'Platform Overview' }],
  ['/controls', { title: 'Controls', query: docsHelpQuery('list', 'controls'), prefer: 'Controls Overview', intro: INTROS.controls }],
  ['/controls/create-control', { title: 'Create a Control', query: docsHelpQuery('create', 'a control'), prefer: 'Writing Controls', intro: INTROS.controls }],
  ['/controls/create-subcontrol', { title: 'Create a Subcontrol', query: docsHelpQuery('create', 'a subcontrol'), prefer: 'Writing Controls', intro: INTROS.controls }],
  ['/programs', { title: 'Programs', query: docsHelpQuery('list', 'compliance programs'), intro: INTROS.programs }],
  ['/programs/create', { title: 'Create a program', query: docsHelpQuery('create', 'a compliance program') }],
  ['/policies', { title: 'Internal Policies', query: docsHelpQuery('list', 'internal policies'), intro: INTROS.policies }],
  ['/policies/create', { title: 'Create a policy', query: docsHelpQuery('create', 'an internal policy') }],
  ['/procedures/create', { title: 'Create a procedure', query: docsHelpQuery('create', 'a procedure') }],
  ['/evidence', { title: 'Evidence Center', query: docsHelpQuery('list', 'evidence collection') }],
  ['/standards', { title: 'Standards Catalog', query: docsHelpQuery('list', 'standards and frameworks') }],
  ['/exposure/reviews', { title: 'Reviews', query: docsHelpQuery('list', 'risk review'), prefer: 'reviews' }],
  ['/exposure/triage', { title: 'Triage Queue', query: docsHelpQuery('list', 'vulnerabilities'), prefer: 'vulnerabilities' }],
  ['/trust-center/frameworks', { title: 'Trust Center - Frameworks', query: docsHelpQuery('list', 'trust center frameworks') }],
  ['/organization-settings/authentication', { title: 'Authentication', query: docsHelpQuery('list', 'authentication and single sign-on') }],
  ['/user-management', { title: 'User Management', query: docsHelpQuery('list', 'members groups and roles') }],
]

const ROUTE_TOPICS_BY_SPECIFICITY = [...ROUTE_TOPICS].sort(([a], [b]) => b.length - a.length)

const ID_SEGMENT = /^(?:[a-z]+_)?[0-9a-z]{16,}$/i
const NUMERIC_SEGMENT = /^\d+$/

const topicForPath = (pathname: string): DocsHelpTopic => {
  const hit = ROUTE_TOPICS_BY_SPECIFICITY.find(([prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (hit) return hit[1]

  const segments = pathname
    .split('/')
    .filter(Boolean)
    .filter((segment) => !ID_SEGMENT.test(segment) && !NUMERIC_SEGMENT.test(segment))
    .map((segment) => segment.replace(/[-_]/g, ' '))

  const page = segments[segments.length - 1] ?? 'the console'
  const title = page.replace(/\b\w/g, (ch) => ch.toUpperCase())
  return { title, query: docsHelpQuery('list', page), prefer: segments.length > 1 ? page : undefined }
}

const TAB_CLASSES =
  'flex flex-col items-center gap-1.5 rounded-l-md border border-r-0 border-border bg-card px-1.5 py-3 text-xs font-medium text-muted-foreground shadow-sm transition-colors hover:text-foreground'

const CLOSE_ANIMATION_MS = 300

const AnimatedBookText = ({ hovered, size = 14 }: { hovered: boolean; size?: number }) => (
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

const DocsTabButton = ({ onClick, label, className }: { onClick: () => void; label: string; className: string }) => {
  const [hovered, setHovered] = useState(false)
  return (
    <button type="button" data-info-panel="" onClick={onClick} aria-label={label} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} className={className}>
      <AnimatedBookText hovered={hovered} />
      <span style={{ writingMode: 'vertical-rl' }}>Docs</span>
    </button>
  )
}

export const DocsHelpTab = () => {
  // open state lives in context so in-page links can open the drawer too
  const { open, setOpen, modal, pinned, setPinned } = useDocsHelpDrawer()
  const { ephemeralTopic, setEphemeralTopic } = useDocsHelpEphemeralTopic()
  const [showClosedTab, setShowClosedTab] = useState(true)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const override = useDocsHelpTopic()

  // one-off topics don't survive closing the drawer or navigating away
  useEffect(() => {
    if (!open) setEphemeralTopic(null)
  }, [open, setEphemeralTopic])
  useEffect(() => {
    if (pinned) return
    setEphemeralTopic(null)
  }, [pathname, pinned, setEphemeralTopic])

  const [body, setBody] = useState<HTMLElement | null>(null)
  useEffect(() => setBody(document.body), [])

  // in-page links open the drawer through the context, bypassing any close handler
  useEffect(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    if (open) {
      setShowClosedTab(false)
      return
    }
    closeTimerRef.current = setTimeout(() => setShowClosedTab(true), CLOSE_ANIMATION_MS)
  }, [open])

  useEffect(() => () => clearTimeout(closeTimerRef.current ?? undefined), [])

  const routeTopic = useMemo(() => override ?? topicForPath(pathname ?? '/'), [override, pathname])
  const routeSection: DocsSection = pathname?.startsWith('/developers') ? 'developers' : 'platform'

  const [frozen, setFrozen] = useState<{ topic: DocsHelpTopic; section: DocsSection } | null>(null)
  useEffect(() => {
    if (!pinned) {
      setFrozen(null)
      return
    }
    setFrozen((current) => current ?? { topic: routeTopic, section: routeSection })
  }, [pinned, routeTopic, routeSection])

  const topic = ephemeralTopic ?? (pinned ? (frozen?.topic ?? routeTopic) : routeTopic)
  const section = pinned ? (frozen?.section ?? routeSection) : routeSection

  if (!docsHelpAvailable) return null

  return (
    <InfoSlideOut
      title={topic.title}
      open={open}
      onOpenChange={setOpen}
      width={660}
      resizable
      hideClose
      // modal only over a sheet or dialog, where it has to take the scroll lock to
      // be scrollable; the backdrop is transparent so it never dims what's behind
      modal={modal}
      overlayClassName="bg-transparent"
      pinnable
      pinned={pinned}
      onPinnedChange={setPinned}
      icon={<BookText size={20} className="self-center" />}
      trigger={(openPanel) =>
        showClosedTab && body
          ? // above sheets and dialogs (z-50) so the tab stays reachable over any slide-out, and
            // pointer-events-auto keeps it clickable when a modal layer sets body pointer-events: none
            createPortal(
              <DocsTabButton onClick={openPanel} label={`Open docs help for ${topic.title}`} className={`fixed right-0 top-1/2 z-[60] -translate-y-1/2 pointer-events-auto ${TAB_CLASSES}`} />,
              body,
            )
          : null
      }
      edgeHandle={<DocsTabButton onClick={() => setOpen(false)} label="Close docs help" className={TAB_CLASSES} />}
    >
      <DocsHelpContent key={topic.query} query={topic.query} prefer={topic.prefer} intro={topic.intro} section={section} enabled={open} />
    </InfoSlideOut>
  )
}
