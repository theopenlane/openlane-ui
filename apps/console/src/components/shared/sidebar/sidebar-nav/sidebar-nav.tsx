'use client'
import Link from 'next/link'

import { NavHeading, type NavItem, type Separator } from '@/types'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/hooks/useSidebar'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/shared/sidebar/sidebar-accordion/sidebar-accordion'
import { useEffect, useState } from 'react'
import { cn } from '@repo/ui/lib/utils'
import { Separator as Hr } from '@repo/ui/separator'
import { sidebarNavStyles } from './sidebar-nav.styles'
import { Logo } from '@repo/ui/logo'
import { BookText, File, Lightbulb, Milestone, PaperclipIcon } from 'lucide-react'
import clsx from 'clsx'
import { Popover, PopoverContent, PopoverTrigger } from '@radix-ui/react-popover'
import { CONTRIBUTE_URL, DOCS_URL, SUPPORT_EMAIL } from '@/constants'

interface SideNavProps {
  items: (NavItem | Separator | NavHeading)[]
  userTaskCount: number
  setOpen?: (open: boolean) => void
  className?: string
}

export function SideNav({ items, userTaskCount, setOpen, className }: SideNavProps) {
  const path = usePathname()
  const { isOpen: isSidebarOpen, toggle: toggleOpen } = useSidebar()
  const [openItems, setOpenItems] = useState<string[]>([])
  const [lastOpenItems, setLastOpenItems] = useState<string[]>([])
  const [showPopup, setShowPopup] = useState(false)

  const { nav, icon, accordionTrigger, link, linkLabel, accordionItem, separator, heading, badgeCount } = sidebarNavStyles()

  const isSeparator = (item: NavItem | Separator | NavHeading): item is Separator => {
    return (item as Separator).type === 'separator'
  }

  const isNavHeading = (item: NavItem | Separator | NavHeading): item is NavHeading => {
    return (item as NavHeading).type === 'heading'
  }

  const handleValueChange = (value: string[]) => {
    setOpenItems(value)
    if (!isSidebarOpen) {
      toggleOpen()
    }
  }

  useEffect(() => {
    if (isSidebarOpen) {
      setOpenItems(lastOpenItems)
    } else {
      setLastOpenItems(openItems)
      setOpenItems([])
    }
  }, [isSidebarOpen])

  useEffect(() => {
    if (!isSidebarOpen) {
      setOpenItems([])
    }
  }, [isSidebarOpen])

  return (
    <nav className={nav()}>
      {items.map((item, idx) =>
        isSeparator(item) ? (
          <div key={`${idx}_${item.type}`} className={separator()}>
            <Hr />
          </div>
        ) : isNavHeading(item) ? (
          <div key={`${idx}_${item.type}`} className={heading()}>
            {item.heading}
          </div>
        ) : item.isChildren ? (
          <Accordion type="multiple" key={item.title} value={openItems} onValueChange={handleValueChange}>
            <AccordionItem value={item.title} className={accordionItem()}>
              <AccordionTrigger className={accordionTrigger()}>
                <div>{item.icon && <item.icon className={icon()} />}</div>
                <div className={cn(linkLabel(), !isSidebarOpen && className)}>{item.title}</div>
                {item.addCount && isSidebarOpen && <div className={badgeCount({ isCurrent: path === item.href })}>{userTaskCount}</div>}
              </AccordionTrigger>
              <AccordionContent>
                {item.children?.map((child) => (
                  <Link
                    key={child.title}
                    href={child.href}
                    onClick={() => {
                      if (setOpen) setOpen(false)
                    }}
                    className={link({ isCurrent: path === child.href })}
                  >
                    {child.icon && <child.icon className={icon({ isCurrent: path === child.href })} />}
                    <div className={cn(linkLabel(), !isSidebarOpen && className)}>{child.title}</div>
                  </Link>
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ) : (
          <Link
            key={item.title}
            href={item.href}
            onClick={() => {
              if (setOpen) setOpen(false)
            }}
            className={link({ isCurrent: path === item.href })}
          >
            {item.icon && <item.icon className={icon({ isCurrent: path === item.href })} />}
            <div className={cn(linkLabel(), !isSidebarOpen && className)}>{item.title}</div>
          </Link>
        ),
      )}
      <div className={clsx('flex justify-between fixed p-3 bottom-0 border-t bg-panel-bg', isSidebarOpen ? 'w-60' : 'w-[57px]')}>
        {isSidebarOpen ? (
          <>
            <Link href={'/dashboard'} className="">
              <Logo width={87} />
            </Link>
            <div className="flex gap-3.5">
              <Popover open={showPopup} onOpenChange={setOpen}>
                <PopoverTrigger asChild onMouseEnter={() => setShowPopup(true)} onMouseLeave={() => setShowPopup(false)}>
                  <div>
                    <Lightbulb className="cursor-pointer" size={16} />
                  </div>
                </PopoverTrigger>
                <PopoverContent className="w-64 bg-panel-bg border p-4 rounded-md z-1 relative" side="top" onMouseEnter={() => setShowPopup(true)} onMouseLeave={() => setShowPopup(false)}>
                  <Link
                    href={DOCS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 mb-1 hover:bg-muted focus:rounded hover:rounded-sm focus:text-accent-foreground p-1"
                  >
                    <BookText size={16} />
                    <p>Docs</p>
                  </Link>

                  <div className="border-b mb-1" />

                  <a href={SUPPORT_EMAIL} className="flex items-center gap-1 mb-1 hover:bg-muted focus:rounded hover:rounded-sm focus:text-accent-foreground p-1">
                    <File size={16} />
                    <p>Feedback</p>
                  </a>

                  <div className="border-b mb-1" />

                  <a href={CONTRIBUTE_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:bg-muted focus:rounded hover:rounded-sm focus:text-accent-foreground p-1">
                    <File size={16} />
                    <p>Contribute</p>
                  </a>
                </PopoverContent>
              </Popover>
            </div>
          </>
        ) : (
          <Link href={'/dashboard'} className="">
            <Logo asIcon width={25} />
          </Link>
        )}
      </div>
    </nav>
  )
}
