'use client'
import React, { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { useTrackedExports } from '@/components/shared/export/use-tracked-export.ts'
import { useSSENotifications } from '@/hooks/useSSENotifications'
import { NotificationRow } from './notification-row'
import useClickOutside from '@/hooks/useClickOutside'
import { BellButton } from './export-row'

export default function SystemNotificationTracker() {
  const { jobs } = useTrackedExports()
  const { notifications } = useSSENotifications()
  const [open, setOpen] = useState(false)

  const bellRef = useRef<HTMLDivElement>(null)

  const dropdownRef = useClickOutside(() => setOpen(false))

  const counts = useMemo(() => {
    const unreadNotifications = notifications.filter((n) => !n.readAt).length
    const total = jobs.length + unreadNotifications
    return {
      total,
      hasUnread: unreadNotifications > 0,
    }
  }, [jobs, notifications])

  return (
    <div className="mx-auto max-w-3xl">
      <div className="relative" ref={bellRef}>
        <BellButton count={counts.total} onClick={() => setOpen((v) => !v)} isOpen={open} />

        {open &&
          createPortal(
            <div ref={dropdownRef} className="fixed top-14 right-6 w-[400px] max-w-[92vw] rounded-2xl border bg-card shadow-xl z-10000">
              <div className="flex flex-col max-h-[70vh]">
                <div className="flex items-center justify-between p-4 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-md font-semibold">Notifications</span>
                    {counts.total > 0 && <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-bold">{counts.total}</span>}
                  </div>

                  <button className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors">
                    <CheckCheck className="w-3.5 h-3.5" />
                    Mark all as read
                  </button>
                </div>

                <div className="overflow-y-auto p-2 custom-scrollbar">
                  <div className="flex flex-col gap-1">
                    {/* {jobs.length > 0 && (
                      <>
                        <div className="my-2 flex items-center gap-2 px-2">
                          <div className="h-px flex-1 bg-border" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">Exports</span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        {jobs.map((j) => (
                          <ExportRow key={j.id} job={j} />
                        ))}
                        <div className="h-px bg-border w-full" />
                      </>
                    )} */}

                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                        <div className="mb-3 rounded-full bg-muted p-3">
                          <Bell className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium">All caught up!</p>
                        <p className="text-xs text-muted-foreground">No new notifications at the moment.</p>
                      </div>
                    ) : (
                      <>
                        {notifications.map((n) => (
                          <NotificationRow key={n.id} notification={n} />
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </div>
  )
}
