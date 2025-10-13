'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Card } from '@repo/ui/cardpanel'
import { Sheet, SheetContent } from '@repo/ui/sheet'
import { PanelRightOpen } from 'lucide-react'
import ControlCommentsSheet from './controls-comments-sheet'

const ControlCommentsCard = () => {
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-5">
        <p className="text-lg">Comments</p>
        <Button type="button" className="h-8 p-2" variant="outline" icon={<PanelRightOpen />} onClick={() => setSheetOpen(true)}>
          Open
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <ControlCommentsSheet onClose={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>
    </Card>
  )
}

export default ControlCommentsCard
