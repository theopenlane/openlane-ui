'use client'

import React, { useEffect } from 'react'
import { NavHeading, NavItem, Separator } from '@/types'
import Link from 'next/link'
import { LogIn, Plus, Search, Home, PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { Logo } from '@repo/ui/logo'
import { Separator as Hr } from '@repo/ui/separator'
import { GlobalSearch } from '@/components/shared/search/search.tsx'
import { usePathname, useRouter } from 'next/navigation'
import { bottomNavigationItems } from '@/routes/dashboard.tsx'
import { OrganizationSelector } from '@/components/shared/organization-selector/organization-selector.tsx'
import Github from '@/assets/Github.tsx'

export type PanelKey = 'compliance' | 'trust' | null

interface SideNavProps {
  navItems: (NavItem | Separator | NavHeading)[]
  openPanel: PanelKey
  expanded: boolean
  onToggle: (panel: PanelKey) => void
  onExpandToggle: () => void
}

const PANEL_WIDTH = 240

export const PANEL_WIDTH_PX = PANEL_WIDTH

export default function SideNav({ navItems, openPanel, expanded, onToggle, onExpandToggle }: SideNavProps) {
  const panelWidth = expanded ? PANEL_WIDTH : null
  const pathname = usePathname()
  const router = useRouter()
  const footerNavItems = bottomNavigationItems()
  const sidebarItems = [...navItems, ...footerNavItems]

  function isNavItem(item: NavItem | Separator | NavHeading): item is NavItem {
    return 'title' in item
  }

  const activePanel = navItems
    .filter(isNavItem)
    .find((item) => item.children?.some((child) => child.href === pathname))
    ?.title.toLowerCase() as PanelKey | undefined

  const handleNavigate = (href: string) => {
    router.push(href)
  }

  useEffect(() => {
    if (activePanel) {
      onToggle(activePanel)
    }
  }, [activePanel, onToggle])

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-[50px] flex flex-col justify-between items-center py-3">
        <div className="flex flex-col items-center gap-3">
          <Logo asIcon width={28} />
          <Hr />
          <GlobalSearch />

          {navItems.map((item, idx) => {
            if ('type' in item && (item.type === 'separator' || item.type === 'heading')) return <Hr key={idx} />

            if ('icon' in item && item.icon) {
              const Icon = item.icon
              const isExpandable = !!item.children
              const isActive = openPanel === (item.title?.toLowerCase() as PanelKey) || pathname === item.href

              return (
                <button
                  key={idx}
                  onClick={() => (isExpandable ? onToggle(isActive ? openPanel : (item.title.toLowerCase() as PanelKey)) : handleNavigate(item.href))}
                  className={`bg-transparent text-muted-foreground p-1 ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={18} />
                </button>
              )
            }
            return null
          })}
        </div>

        <div className="flex flex-col items-center gap-3">
          {footerNavItems.map((item, idx) => {
            if ('type' in item && (item.type === 'separator' || item.type === 'heading')) return <Hr key={idx} />

            if ('icon' in item && item.icon) {
              const Icon = item.icon
              const isExpandable = !!item.children
              const isActive = openPanel === (item.title?.toLowerCase() as PanelKey) || pathname === item.href

              return (
                <button
                  key={idx}
                  onClick={() => (isExpandable ? onToggle(isActive ? openPanel : (item.title.toLowerCase() as PanelKey)) : handleNavigate(item.href))}
                  className={`bg-transparent text-muted-foreground p-1 ${isActive ? 'is-active' : ''}`}
                >
                  <Icon size={18} />
                </button>
              )
            }
            return null
          })}
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
            <div className="flex items-center justify-between px-4 py-3 ">
              {expanded && <h3 className="text-sm font-medium capitalize">{openPanel}</h3>}
              <button onClick={onExpandToggle} className="p-1 bg-transparent">
                {expanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              </button>
            </div>

            <div className="p-2 space-y-1">
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
                          className={`flex mb-1 items-center gap-2 px-3 py-2 rounded-md hover:bg-card text-muted-foreground transition-colors duration-500 ${child.href === pathname ? 'bg-card text-paragraph' : ''}`}
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
