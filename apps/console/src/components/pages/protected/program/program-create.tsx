'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { ProgramWizard } from './wizard'
import { InfoIcon, ShieldPlus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { dialogStyles } from './dialog.styles'
import { useRef, useState } from 'react'

const ProgramCreate = () => {
  const [open, setOpen] = useState(false)
  const pendingCloseRef = useRef<() => void>(null)

  const { dialogContent, dialogTrigger, title } = dialogStyles()

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && pendingCloseRef.current) {
      pendingCloseRef.current()
    } else {
      setOpen(nextOpen)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger className={dialogTrigger()}>
          <ShieldPlus size={16} strokeWidth={2} />
          Create Program
        </DialogTrigger>
        <DialogContent className={dialogContent()}>
          <DialogHeader>
            <DialogTitle className={title()}>
              Create a New Program
              <TooltipProvider disableHoverableContent={true}>
                <Tooltip>
                  <TooltipTrigger>
                    <InfoIcon size={14} className="mx-1" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Programs are used to manage an audit for a specific framework over a specified period. This wizard will guide you through the process of creating a new program.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </DialogTitle>
          </DialogHeader>
          <ProgramWizard
            onSuccess={() => {
              setOpen(false)
            }}
            requestClose={() => {
              setOpen(false)
            }}
            blockClose={(callback) => {
              pendingCloseRef.current = callback
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

export { ProgramCreate }
