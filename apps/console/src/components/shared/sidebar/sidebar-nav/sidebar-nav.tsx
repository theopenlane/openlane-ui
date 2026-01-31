'use client'

import React, { useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { PanelLeftOpen, PanelLeftClose, BookText, MessageSquareText, Plus, Lock } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { Separator as Hr } from '@repo/ui/separator'
import { Logo } from '@repo/ui/logo'
import Github from '@/assets/Github.tsx'
import { useSession } from 'next-auth/react'
import { GlobalSearch } from '@/components/shared/search/search'
import { OrganizationSelector } from '@/components/shared/organization-selector/organization-selector'
import Menu from '@/components/shared/menu/menu'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { CreateBtnIcon } from '@/components/shared/enum-mapper/common-enum'
import { ProgramCreatePrefixIconBtn } from '@/components/shared/enum-mapper/program-enum'
import { TaskIconPrefixBtn } from '@/components/shared/enum-mapper/task-enum'
import { CONTRIBUTE_URL, SUPPORT_URL } from '@/constants'
import { featureUtil } from '@/lib/subscription-plan/plans'
import { NavHeading, NavItem, Separator } from '@/types'
import { Button } from '@repo/ui/button'
import { DOCS_URL } from '@/constants/docs'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import { hasNoModules } from '@/lib/auth/utils/modules'

export type PanelKey = 'compliance' | 'trust center' | null

export const PRIMARY_WIDTH = 50
export const PRIMARY_EXPANDED_WIDTH = 248
export const SECONDARY_COLLAPSED_WIDTH = 44
export const SECONDARY_EXPANDED_WIDTH = 240

type TSideNavProps = {
  navItems: (NavItem | Separator | NavHeading)[]
  footerNavItems: (NavItem | Separator | NavHeading)[]
  openPanel: PanelKey
  primaryExpanded: boolean
  secondaryExpanded: boolean
  onPrimaryExpandToggle: () => void
  onSecondaryExpandToggle: () => void
  onToggleAction: (panel: PanelKey) => void
  isOrganizationSelected: boolean
}

export default function SideNav({
  navItems,
  footerNavItems,
  openPanel,
  onToggleAction,
  isOrganizationSelected,
  primaryExpanded,
  secondaryExpanded,
  onPrimaryExpandToggle,
  onSecondaryExpandToggle,
}: TSideNavProps) {
  const { data: session } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const featureEnabled = process.env.NEXT_PUBLIC_ENABLE_PLAN
  const modules = useMemo(() => session?.user?.modules ?? [], [session?.user?.modules])

  const sidebarItems = [...navItems, ...footerNavItems]
  const { data: orgPermission } = useOrganizationRoles()
  const isCreateProgramAllowed = canCreate(orgPermission?.roles, AccessEnum.CanCreateProgram)
  const billingExpired = hasNoModules(session)

  useEffect(() => {
    if (!openPanel) {
      const firstItem = navItems
        .filter((item): item is NavItem => 'title' in item)
        .filter((item) => !(featureEnabled === 'true' && item?.plan && !featureUtil.hasModule(modules, item.plan)))
        .find((item) => item.children && item.children.length > 0)

      onToggleAction(firstItem?.title?.toLowerCase() as PanelKey)
    }
  }, [featureEnabled, modules, navItems, onToggleAction, openPanel])

  const handleNavigate = (href: string) => {
    router.push(href)
    onToggleAction(null)
  }

  const handleTogglePanel = (item: NavItem) => {
    const panelKey = item?.title?.toLowerCase() as PanelKey
    const children = item.children ?? []

    if (openPanel !== panelKey) {
      onToggleAction(panelKey)
    }

    if (children.length > 0) {
      const firstChild = children[0]
      const hasActiveChild = children.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`))
      if (!hasActiveChild && firstChild?.href) {
        router.push(firstChild.href)
      }
    }
  }

  const findActiveNavItem = (items: (NavItem | Separator | NavHeading)[], pathname: string): NavItem | undefined => {
    for (const item of items) {
      if (!('title' in item)) {
        continue
      }

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
      if (item.hidden) {
        return null
      }

      if ('type' in item && (item.type === 'separator' || item.type === 'heading')) {
        return <Hr className="mx-2" key={idx} />
      }

      if ('icon' in item && item.icon) {
        const Icon = item.icon
        const isExpandable = !!item.children
        const isActive = activeNav?.title === item.title
        const url = item.params ? item.href + item.params : item.href

        const button = (
          <div key={idx} className="relative flex w-full items-center justify-center">
            <div className="w-2.5 h-full flex absolute left-0">{isActive && <span className="h-full w-0.5 bg-foreground dark:bg-primary absolute" />}</div>

            {featureEnabled === 'true' && item?.plan && !featureUtil.hasModule(modules, item?.plan) && <Lock className="absolute bottom-6 right-[5px] w-3 h-3 z-90 text-gray-400" />}

            <Button
              variant="sidebar"
              onClick={() => (isExpandable ? handleTogglePanel(item) : handleNavigate(url))}
              className={`relative flex px-2 justify-start gap-1 h-8 ${isActive ? 'is-active' : ''} ${primaryExpanded ? 'w-full mx-2' : 'w-8 justify-center'}`}
            >
              <Icon className={`${primaryExpanded ? 'w-4 h-4' : '!w-5 !h-5'}`} />
              {primaryExpanded && <span className="text-sm font-normal leading-5">{item.title}</span>}
            </Button>
          </div>
        )

        if (primaryExpanded) {
          return button
        }

        return (
          <TooltipProvider delayDuration={100} key={idx}>
            <Tooltip>
              <TooltipTrigger asChild>{button}</TooltipTrigger>
              <TooltipContent side="right" sideOffset={-2}>
                <p>{item.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }

      return null
    })
  }

  const SidebarChildLink: React.FC<{ child: NavItem }> = ({ child }) => {
    const isActive = pathname === child.href || pathname.startsWith(`${child.href}/`)
    if (child.hidden) return null

    const linkContent = (
      <Link
        onClick={(e) => {
          e.preventDefault()
          router.push(child.href ?? '#')
        }}
        href={child.href ?? '#'}
        className={`flex items-center gap-2 mb-2 h-8 rounded-md hover:bg-card text-muted-foreground transition-colors duration-500 ${isActive ? 'bg-card text-paragraph' : ''} ${
          secondaryExpanded ? 'px-2.5' : 'justify-center'
        }`}
      >
        {child.icon && <child.icon size={secondaryExpanded ? 16 : 20} />}
        {secondaryExpanded && <span className="text-sm font-normal leading-5">{child.title}</span>}
      </Link>
    )

    if (secondaryExpanded) {
      return linkContent
    }

    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{child.title}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const renderFooterLinks = () => {
    const links = [
      {
        href: DOCS_URL,
        label: 'Documentation',
        icon: BookText,
        external: true,
      },
      {
        href: SUPPORT_URL,
        label: 'Feedback',
        icon: MessageSquareText,
        external: false,
      },
      {
        href: CONTRIBUTE_URL,
        label: 'Github',
        icon: Github,
        external: true,
      },
    ]

    if (primaryExpanded) {
      return (
        <>
          {links.map(({ href, label, icon: Icon, external }, i) => (
            <Link
              key={i}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="btn-card p-1 flex items-center gap-2 w-full justify-start mx-2 text-muted-foreground hover:text-foreground"
            >
              <Icon size={16} />
              <span className="text-sm font-normal leading-5">{label}</span>
            </Link>
          ))}
        </>
      )
    }

    return (
      <>
        {links.map(({ href, label, icon: Icon, external }, i) => (
          <TooltipProvider delayDuration={100} key={i}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href={href} target={external ? '_blank' : undefined} rel={external ? 'noopener noreferrer' : undefined} className="btn-card p-1">
                  <Icon size={20} className="text-muted-foreground" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{label}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </>
    )
  }

  return (
    <div
      className="fixed top-0 left-0 z-40 h-screen flex"
      style={{
        width: (primaryExpanded ? PRIMARY_EXPANDED_WIDTH : PRIMARY_WIDTH) + (openPanel ? (secondaryExpanded ? SECONDARY_EXPANDED_WIDTH : SECONDARY_COLLAPSED_WIDTH) : 0),
      }}
    >
      <aside
        className={`h-full bg-background flex flex-col justify-between items-center py-3 `}
        style={{
          width: primaryExpanded ? PRIMARY_EXPANDED_WIDTH : PRIMARY_WIDTH,
        }}
      >
        <div className="flex flex-col items-center gap-3 w-full">
          <div className={`flex items-center justify-between w-full px-[11px] ${!primaryExpanded ? 'flex-col gap-3' : ''}`}>
            <Link href="/dashboard" className="flex items-center justify-center relative">
              {primaryExpanded ? (
                <div className="w-[134px]">
                  <Logo width={134} />
                </div>
              ) : (
                <div className="w-7">
                  <Logo asIcon width={28} />
                </div>
              )}
            </Link>
            <button onClick={() => onPrimaryExpandToggle()} className="text-muted-foreground hover:text-foreground bg-unset">
              {primaryExpanded ? <PanelLeftClose size={16} /> : <PanelLeftOpen size={16} />}
            </button>
          </div>
          {isOrganizationSelected && !session?.user?.isOnboarding && !billingExpired && (
            <>
              <Hr className="mx-2" />
              <div className={`flex w-full gap-2 px-2 ${!primaryExpanded ? 'flex-col' : ''}`}>
                <Menu
                  trigger={
                    primaryExpanded ? (
                      <Button variant="primary" className="flex-1">
                        <Plus size={16} />
                        <p>Create</p>
                      </Button>
                    ) : (
                      CreateBtnIcon
                    )
                  }
                  side="right"
                  align="start"
                  content={
                    <>
                      {isCreateProgramAllowed && <Link href="/programs/create/">{ProgramCreatePrefixIconBtn}</Link>}
                      <CreateTaskDialog trigger={TaskIconPrefixBtn} />
                    </>
                  }
                />
                <GlobalSearch />
              </div>
            </>
          )}

          {displayMenu(navItems)}
        </div>
        <div className="flex flex-col items-center gap-3 w-full">
          {displayMenu(footerNavItems)}

          {!primaryExpanded && <Hr className="mx-2" />}
          <div className={`flex flex-col gap-3 ${primaryExpanded ? 'self-start' : 'items-center'}`}>{renderFooterLinks()}</div>
          <Hr className="mx-2" />
          <OrganizationSelector expanded={primaryExpanded} />
        </div>
      </aside>

      {openPanel && (
        <div
          className="bg-secondary rounded-xl flex flex-col  ease-in-out w-full mt-1 mb-1"
          style={{
            width: secondaryExpanded ? SECONDARY_EXPANDED_WIDTH : SECONDARY_COLLAPSED_WIDTH,
          }}
        >
          <div className="p-2 space-y-1 h-[40px]">
            <div className="flex items-center justify-between gap-2 p-1 mb-1 rounded-md transition-colors duration-500 w-full">
              {secondaryExpanded ? (
                <>
                  <span className="text-sm font-medium capitalize">{openPanel}</span>
                  <button onClick={onSecondaryExpandToggle} className="bg-transparent text-muted-foreground hover:bg-card">
                    <PanelLeftClose size={16} />
                  </button>
                </>
              ) : (
                <button onClick={onSecondaryExpandToggle} className="bg-transparent text-muted-foreground hover:bg-card">
                  <PanelLeftOpen size={16} />
                </button>
              )}
            </div>

            {!secondaryExpanded && <Hr className="m-0 mt-1 w-7 mx-auto" />}
          </div>

          <div className="p-2 space-y-1 mt-3 overflow-y-auto flex-1">
            {sidebarItems
              .filter((item): item is NavItem => 'title' in item)
              .filter((item) => item.title.toLowerCase() === openPanel)
              .map((item) =>
                item.children ? (
                  <div key={item.title} className="flex flex-col">
                    {item.children.map((child, index) => (
                      <SidebarChildLink key={index} child={child} />
                    ))}
                  </div>
                ) : null,
              )}
          </div>
        </div>
      )}
    </div>
  )
}
