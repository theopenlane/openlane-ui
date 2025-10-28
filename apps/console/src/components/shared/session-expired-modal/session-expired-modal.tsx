'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Dialog, DialogContent } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Timer } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import { addHours, differenceInMilliseconds } from 'date-fns'
import { signOut } from 'next-auth/react'

interface SessionExpiredModalProps {
  open: boolean
}

const SessionExpiredModal = ({ open }: SessionExpiredModalProps) => {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleSignOut = useCallback(async () => {
    const currentUrl = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
    await signOut({ redirect: true, redirectTo: `/login?redirect=${encodeURIComponent(currentUrl)}` })
  }, [pathname, searchParams])

  useEffect(() => {
    if (!open) return
    signoutNoRedirect()
    const now = new Date()
    const expireAt = addHours(now, 2)
    const timeoutDuration = differenceInMilliseconds(expireAt, now)

    const id = setTimeout(() => {
      handleSignOut()
    }, timeoutDuration)

    return () => clearTimeout(id)
  }, [open, handleSignOut])

  const signoutNoRedirect = async () => {
    await signOut({ redirect: false })
  }
  return (
    <Dialog open={open}>
      <DialogContent className="flex flex-col items-center justify-center gap-6 py-7 size-fit" showCloseButton={false}>
        <Timer className="w-12 h-12" strokeWidth={1} />
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Session expired</h2>
          <p className=" text-sm max-w-xs mx-auto">To keep your account secure, we require users to re-login after 60 minutes of inactivity.</p>
        </div>
        <Button variant="secondary" onClick={handleSignOut}>
          Login
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export default SessionExpiredModal
