'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { ProgramWizard } from './wizard'
import { ArrowUpRightIcon, InfoIcon } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { dialogStyles } from './dialog.styles'

const ProgramCreate = () => {
  const { dialogContent, dialogTrigger, title } = dialogStyles()
  return (
    <>
      <Dialog>
        <DialogTrigger className={dialogTrigger()}>
          Create Program <ArrowUpRightIcon className="h-4 w-4" />
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
