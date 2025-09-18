'use client'

import React, { useEffect, useState } from 'react'
import { NavHeading, NavItem, Separator } from '@/types'
import Link from 'next/link'
import { PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { Logo } from '@repo/ui/logo'
import { Separator as Hr } from '@repo/ui/separator'
import { GlobalSearch } from '@/components/shared/search/search.tsx'
import { usePathname, useRouter } from 'next/navigation'
import { bottomNavigationItems } from '@/routes/dashboard.tsx'
import { OrganizationSelector } from '@/components/shared/organization-selector/organization-selector.tsx'
import Github from '@/assets/Github.tsx'
import { CreateBtnIcon } from '@/components/shared/enum-mapper/common-enum.tsx'
import { ProgramCreate } from '@/components/pages/protected/program/program-create.tsx'
import { ProgramCreatePrefixIconBtn } from '@/components/shared/enum-mapper/program-enum.tsx'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog.tsx'
import { TaskIconPrefixBtn } from '@/components/shared/enum-mapper/task-enum.tsx'
import Menu from '@/components/shared/menu/menu.tsx'

export type PanelKey = 'compliance' | 'trust' | null

interface SideNavProps {
  navItems: (NavItem | Separator | NavHeading)[]
  footerNavItems: (NavItem | Separator | NavHeading)[]
  openPanel: PanelKey
  expanded: boolean
  onToggle: (panel: PanelKey) => void
  onExpandToggle: () => void
}

const PANEL_WIDTH = 240

export const PANEL_WIDTH_PX = PANEL_WIDTH

export default function SideNav({ navItems, footerNavItems, openPanel, expanded, onToggle, onExpandToggle }: SideNavProps) {
  const panelWidth = expanded ? PANEL_WIDTH : null
  const pathname = usePathname()
  const router = useRouter()
  const sidebarItems = [...navItems, ...footerNavItems]

  const handleNavigate = (href: string) => {
    router.push(href)
    onToggle(null)
  }

  const handleToggle = (isActive: boolean, item: NavItem) => {
    onToggle(isActive ? openPanel : (item.title.toLowerCase() as PanelKey))
  }

  const displayMenu = (navItems: (NavItem | Separator | NavHeading)[]) => {
    return navItems.map((item, idx) => {
      if ('type' in item && (item.type === 'separator' || item.type === 'heading')) {
        return <Hr key={idx} />
      }

      if ('icon' in item && item.icon) {
        const Icon = item.icon
        const isExpandable = !!item.children
        const isActive = openPanel === (item.title?.toLowerCase() as PanelKey) || pathname === item.href

        return (
          <button
            key={idx}
            onClick={() => (isExpandable ? handleToggle(isActive, item) : handleNavigate(item.href))}
            className={`bg-transparent text-muted-foreground p-1 ${isActive ? 'is-active' : ''}`}
          >
            <Icon size={18} />
          </button>
        )
      }

      return null
    })
  }

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-[50px] flex flex-col justify-between items-center py-3">
        <div className="flex flex-col items-center gap-3">
          <a href="https://www.theopenlane.io/" target="_blank" rel="noreferrer">
            <Logo asIcon width={28} />
          </a>
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

          {displayMenu(navItems)}
        </div>

        <div className="flex flex-col items-center gap-3">
          {displayMenu(footerNavItems)}

          <a href="https://github.com/theopenlane" target="_blank" rel="noreferrer">
            <Github size={20} className="cursor-pointer" />
          </a>
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
                    <button onClick={onExpandToggle} className="bg-transparent text-muted-foreground hover:bg-card">
                      <PanelLeftClose size={18} />
                    </button>
                  </>
                ) : (
                  <button onClick={onExpandToggle} className="bg-transparent text-muted-foreground hover:bg-card">
                    <PanelLeftClose size={18} />
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
                      {item.children.map((child) => (
                        <Link
                          key={child.title}
                          href={child.href ?? '#'}
                          className={`flex mb-1 items-center gap-2 p-1 mb-2 rounded-md hover:bg-card text-muted-foreground transition-colors duration-500 ${child.href === pathname ? 'bg-card text-paragraph' : ''}`}
                        >
                          {child.icon && <child.icon size={20} />}
                          {expanded && <span className="text-sm font-medium">{child.title}</span>}
                        </Link>
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
