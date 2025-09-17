'use client'

import React from 'react'
import { NavHeading, NavItem, Separator } from '@/types'
import Link from 'next/link'
import { LogIn, Plus, Search, Home, PanelLeftOpen, PanelLeftClose } from 'lucide-react'
import { Logo } from '@repo/ui/logo'
import { Separator as Hr } from '@repo/ui/separator'

export type PanelKey = 'compliance' | 'trust' | null

interface SideNavProps {
  navItems: (NavItem | Separator | NavHeading)[]
  openPanel: PanelKey
  expanded: boolean
  onToggle: (panel: PanelKey) => void
  onExpandToggle: () => void
}

const PANEL_WIDTH = 240
const COLLAPSED_WIDTH = 48

export const PANEL_WIDTH_PX = PANEL_WIDTH

export default function SideNav({ navItems, openPanel, expanded, onToggle, onExpandToggle }: SideNavProps) {
  const panelWidth = expanded ? PANEL_WIDTH : null

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 h-screen w-[50px] flex flex-col justify-between items-center py-3">
        <div className="flex flex-col items-center gap-3">
          <Logo asIcon width={28} />

          {navItems.map((item, idx) => {
            if ('type' in item && (item.type === 'separator' || item.type === 'heading')) return <Hr />
            if ('icon' in item && item.icon) {
              const Icon = item.icon
              const isExpandable = !!item.children
              const isActive = openPanel === (item.title?.toLowerCase() as PanelKey)

              return (
                <button
                  key={idx}
                  onClick={() => isExpandable && onToggle(isActive ? openPanel : (item.title.toLowerCase() as PanelKey))}
                  className={`p-1 rounded hover:bg-slate-700 ${isActive ? 'bg-slate-700' : ''}`}
                >
                  <Icon size={18} />
                </button>
              )
            }
            return null
          })}
        </div>

        <div className="flex flex-col items-center gap-3">
          <LogIn size={18} />
          <Plus size={18} />
          <Search size={18} />
          <Home size={18} />
        </div>
      </aside>

      {openPanel && (
        <div className="fixed top-0 left-[50px] z-30 h-screen flex flex-col transition-all duration-200" style={panelWidth ? { width: panelWidth } : undefined}>
          <div className="flex-1 flex flex-col bg-secondary rounded-xl" style={{ margin: '8px 0' }}>
            <div className="flex items-center justify-between px-4 py-3 ">
              {expanded && <h3 className="text-sm font-medium capitalize">{openPanel}</h3>}
              <button onClick={onExpandToggle} className="p-1 rounded hover:bg-slate-700">
                {expanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
              </button>
            </div>

            <div className="p-2 space-y-1">
              {navItems
                .filter((item): item is NavItem => 'title' in item)
                .filter((item) => item.title.toLowerCase() === openPanel)
                .map((item) =>
                  item.children ? (
                    <div key={item.title} className="flex flex-col">
                      {item.children.map((child) => (
                        <Link key={child.title} href={child.href ?? '#'} className="flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-800 transition-colors">
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
