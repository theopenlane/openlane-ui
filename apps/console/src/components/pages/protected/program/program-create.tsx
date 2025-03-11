'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { ProgramWizard } from './wizard'
import { ArrowUpRightIcon, InfoIcon, ShieldPlus } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { dialogStyles } from './dialog.styles'

const ProgramCreate = () => {
  const { dialogContent, dialogTrigger, title } = dialogStyles()
  return (
    <>
      <Dialog>
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
          <ProgramWizard />
        </DialogContent>
      </Dialog>
    </>
  )
}

export { ProgramCreate }
