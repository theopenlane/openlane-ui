'use client'
import React, { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Bell, CheckCheck } from 'lucide-react'
import useClickOutside from '@/hooks/useClickOutside'
import { useWebsocketNotifications } from '@/lib/graphql-hooks/websocket/use-websocket-notifications'
import { NotificationRow } from './notification-row'

export default function SystemNotificationTracker() {
  const { notifications } = useWebsocketNotifications()
  const [open, setOpen] = useState(false)

  const bellRef = useRef<HTMLDivElement>(null)

  const dropdownRef = useClickOutside(() => setOpen(false))

  const counts = useMemo(() => {
    const unreadNotifications = notifications.filter((n) => !n.readAt).length
    return {
      total: unreadNotifications,
      hasUnread: unreadNotifications > 0,
    }
  }, [notifications])

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

export function BellButton({ count, onClick, isOpen }: { count: number; onClick: () => void; isOpen: boolean }) {
  return (
    <button onClick={onClick} className={`bg-transparent text-muted-foreground relative grid h-7 w-7 place-items-center rounded-md ${isOpen ? 'is-active' : ''}`} aria-label="Notifications">
      <span className={'absolute inset-0 rounded-full animate-ping opacity-40'} />
      <Bell className="h-5 w-5 " />
      {count > 0 && <span className="absolute top-[3px] right-[5px] grid h-2 w-2 place-items-center rounded-full px-1 text-[10px] font-semibold bg-orange-500 shadow-sm"></span>}
    </button>
  )
}
