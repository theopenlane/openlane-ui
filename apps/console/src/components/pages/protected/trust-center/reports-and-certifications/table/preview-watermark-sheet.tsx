import { Button } from '@repo/ui/button'
import { Eye, PanelRightClose, X } from 'lucide-react'
import { useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'

const PreviewWatermarkSheet = () => {
  const [sheetOpen, setSheetOpen] = useState<boolean>(false)

  return (
    <>
      <Button
        onClick={(e) => {
          e.stopPropagation()
          setSheetOpen(true)
        }}
        variant="secondary"
        icon={<Eye size={16} strokeWidth={2} />}
        iconPosition="left"
      >
        Preview
      </Button>
      <Sheet open={sheetOpen} onOpenChange={(open) => setSheetOpen(open)}>
        <div onClick={(e) => e.stopPropagation()}>
          <SheetContent
            header={
              <SheetHeader>
                <div className="flex items-center justify-between">
                  <PanelRightClose
                    aria-label="Close detail sheet"
                    size={16}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSheetOpen(false)
                    }}
                  />

                  <div className="flex justify-end gap-2">
                    <X
                      aria-label="Close sheet"
                      size={20}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSheetOpen(false)
                      }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-start my-5">
                  <SheetTitle>
                    <p className="text-2xl leading-8 font-medium">Preview watermark</p>
                  </SheetTitle>
                </div>
              </SheetHeader>
            }
          ></SheetContent>
        </div>
      </Sheet>
    </>
  )
}

export default PreviewWatermarkSheet
