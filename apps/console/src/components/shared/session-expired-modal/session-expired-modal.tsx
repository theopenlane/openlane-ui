'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Timer } from 'lucide-react'
import { signOut } from 'next-auth/react'

interface SessionExpiredModalProps {
  open: boolean
}

const SessionExpiredModal = ({ open }: SessionExpiredModalProps) => {
  const router = useRouter()

  const handleConfirm = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <Dialog open={open}>
      <DialogContent className="flex flex-col items-center justify-center gap-6 py-7 size-fit" isClosable={false}>
        <Timer className="w-12 h-12" strokeWidth={1} />
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Session expired</h2>
          <p className=" text-sm max-w-xs mx-auto">To keep your account secure, we require users to re-login after 60 minutes of inactivity.</p>
        </div>
        <Button onClick={handleConfirm}>Login</Button>
      </DialogContent>
    </Dialog>
  )
}

export default SessionExpiredModal
