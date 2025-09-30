'use client'

import React from 'react'
import { NavHeading, NavItem, Separator } from '@/types'
import Link from 'next/link'
import { PanelLeftOpen, PanelLeftClose, BookText, MessageSquareText } from 'lucide-react'
import { Logo } from '@repo/ui/logo'
import { Separator as Hr } from '@repo/ui/separator'
import { GlobalSearch } from '@/components/shared/search/search.tsx'
import { usePathname, useRouter } from 'next/navigation'
import { OrganizationSelector } from '@/components/shared/organization-selector/organization-selector.tsx'
import Github from '@/assets/Github.tsx'
import { CreateBtnIcon } from '@/components/shared/enum-mapper/common-enum.tsx'
import { ProgramCreate } from '@/components/pages/protected/program/program-create.tsx'
import { ProgramCreatePrefixIconBtn } from '@/components/shared/enum-mapper/program-enum.tsx'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog.tsx'
import { TaskIconPrefixBtn } from '@/components/shared/enum-mapper/task-enum.tsx'
import Menu from '@/components/shared/menu/menu.tsx'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { CONTRIBUTE_URL, DOCS_URL, OPENLANE_WEBSITE_URL, SUPPORT_EMAIL } from '@/constants'

export type PanelKey = 'compliance' | 'trust' | null

type TSidebarChildLinkProps = {
  child: NavItem
  expanded: boolean
}

type TSideNavProps = {
  navItems: (NavItem | Separator | NavHeading)[]
  footerNavItems: (NavItem | Separator | NavHeading)[]
  openPanel: PanelKey
  expanded: boolean
  onToggleAction: (panel: PanelKey) => void
  onExpandToggleAction: () => void
  isOrganizationSelected: boolean
}

const PANEL_WIDTH = 240

export const PANEL_WIDTH_PX = PANEL_WIDTH

export default function SideNav({ navItems, footerNavItems, openPanel, expanded, onToggleAction, onExpandToggleAction, isOrganizationSelected }: TSideNavProps) {
  const panelWidth = expanded ? PANEL_WIDTH : null
  const pathname = usePathname()
  const router = useRouter()
  const sidebarItems = [...navItems, ...footerNavItems]

  const handleNavigate = (href: string) => {
    router.push(href)
    onToggleAction(null)
  }

  const handleToggle = (isActive: boolean, item: NavItem) => {
    onToggleAction(isActive ? openPanel : (item.title.toLowerCase() as PanelKey))
  }

  const findActiveNavItem = (items: (NavItem | Separator | NavHeading)[], pathname: string): NavItem | undefined => {
    for (const item of items) {
      if (!('title' in item)) continue // skip separators/headings

      if (item.href && pathname === item.href) {
        return item
      }

      if (item.children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`))) {
        return item
      }
    }

    return undefined
  }

  const displayMenu = (navItems: (NavItem | Separator | NavHeading)[]) => {
    const activeNav = findActiveNavItem(navItems, pathname)
    return navItems.map((item, idx) => {
      if ('type' in item && (item.type === 'separator' || item.type === 'heading')) {
        return <Hr key={idx} />
      }

      if ('icon' in item && item.icon) {
        const Icon = item.icon
        const isExpandable = !!item.children
        const isActive = openPanel === (item.title?.toLowerCase() as PanelKey) || pathname === item.href
        const isFullActive = activeNav?.title === item.title
        const url = item.params ? item.href + item.params : item.href

        return (
          <TooltipProvider delayDuration={100} key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative flex items-center">
                  {isFullActive && <span className="absolute -left-[11.2px] w-[2px] h-full bg-foreground dark:bg-primary rounded-r-md" />}

                  <button
                    onClick={() => (isExpandable ? handleToggle(isActive, item) : handleNavigate(url))}
                    className={`btn-card text-muted-foreground p-1 ${isActive ? 'is-active text-paragraph' : ''}`}
                  >
                    <Icon size={18} />
                  </button>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{item.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }

      return null
    })
  }

  const SidebarChildLink: React.FC<TSidebarChildLinkProps> = ({ child, expanded }) => {
    const pathname = usePathname()
    const isActive = pathname === child.href || pathname.startsWith(`${child.href}/`)

    const link = (
      <Link
        href={child.href ?? '#'}
        className={`flex items-center gap-2 p-1 mb-2 rounded-md hover:bg-card text-muted-foreground transition-colors duration-500 ${isActive ? 'bg-card text-paragraph' : ''}`}
      >
        {child.icon && <child.icon size={20} />}
        {expanded && <span className="text-sm font-medium">{child.title}</span>}
      </Link>
    )

    return !expanded ? (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{child.title}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : (
      link
    )
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-[50px] flex flex-col justify-between items-center py-3">
        <div className="flex flex-col items-center gap-3">
          <a href={OPENLANE_WEBSITE_URL} target="_blank" rel="noreferrer">
            <Logo asIcon width={28} />
          </a>
          {isOrganizationSelected && (
            <>
              <Hr />
              <Menu
                trigger={CreateBtnIcon}
                side="right"
                align="start"
                content={
                  <>
                    <ProgramCreate trigger={ProgramCreatePrefixIconBtn} className="bg-transparent px-1" />
                    <CreateTaskDialog trigger={TaskIconPrefixBtn} className="bg-transparent px-1" />
                  </>
                }
              />
              <GlobalSearch />
            </>
          )}

          {displayMenu(navItems)}
        </div>

        <div className="flex flex-col items-center gap-3">
          {displayMenu(footerNavItems)}

          <Hr />

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="btn-card text-muted-foreground p-1">
                  <Link href={DOCS_URL} target="_blank" rel="noopener noreferrer">
                    <BookText size={18} className={`btn-card text-muted-foreground`} />
                  </Link>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Documentation</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="btn-card text-muted-foreground p-1">
                  <Link href={SUPPORT_EMAIL}>
                    <MessageSquareText size={18} className={`btn-card text-muted-foreground`} />
                  </Link>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Feedback</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="btn-card text-muted-foreground p-1">
                  <Link href={CONTRIBUTE_URL} target="_blank" rel="noopener noreferrer">
                    <Github size={18} className="btn-card text-muted-foreground" />
                  </Link>
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Github</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Hr />

          <OrganizationSelector />
        </div>
      </aside>

      {openPanel && (
        <div className="fixed top-0 left-[50px] z-30 h-screen flex flex-col transition-all duration-300 ease-in-out" style={panelWidth ? { width: panelWidth } : undefined}>
          <div className="flex-1 flex flex-col bg-secondary rounded-xl" style={{ margin: '8px 0' }}>
            <div className="p-2 space-y-1 h-[40px]">
              <div className="flex items-center justify-between gap-2 p-1 mb-1 rounded-md transition-colors duration-500 w-full ">
                {expanded ? (
                  <>
                    <span className="text-sm font-medium capitalize">{openPanel}</span>
                    <button onClick={onExpandToggleAction} className="bg-transparent text-muted-foreground hover:bg-card">
                      <PanelLeftClose size={18} />
                    </button>
                  </>
                ) : (
                  <button onClick={onExpandToggleAction} className="bg-transparent text-muted-foreground hover:bg-card">
                    <PanelLeftOpen size={18} />
                  </button>
                )}
              </div>

              {!expanded && <Hr className="m-0 mt-1" />}
            </div>

            <div className="p-2 space-y-1 mt-3">
              {sidebarItems
                .filter((item): item is NavItem => 'title' in item)
                .filter((item) => item.title.toLowerCase() === openPanel)
                .map((item) =>
                  item.children ? (
                    <div key={item.title} className="flex flex-col">
                      {item.children.map((child, index) => (
                        <SidebarChildLink key={index} child={child} expanded={expanded} />
                      ))}
                    </div>
                  ) : null,
                )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
