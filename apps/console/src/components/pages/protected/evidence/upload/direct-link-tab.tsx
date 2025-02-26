import React from 'react'
import { TabsContent } from '@repo/ui/tabs'
import { FormItem } from '@repo/ui/form'
import { Input } from '@repo/ui/input'
import { PlusCircle } from 'lucide-react'

const DirectLinkTab: React.FC = () => {
  return (
    <TabsContent value="directLink">
      <FormItem className="w-full">
        <div className="flex w-full items-center">
          <div className="w-4/5">
            <Input variant="medium" className="w-full" placeholder="Paste URL here" />
          </div>
          <div className="w-1/5 flex justify-center">
            <PlusCircle className="w-8 h-8 text-primary cursor-pointer hover:scale-105 transition-transform" />
          </div>
        </div>
      </FormItem>
    </TabsContent>
  )
}

export default DirectLinkTab
