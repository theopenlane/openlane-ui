import React from 'react'
import { Card, CardContent } from '@repo/ui/cardpanel'
import MapControlsFormFilters from './map-controls-form-filters'
import MatchedControls from './matched-controls'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown, Expand } from 'lucide-react'

interface Props {
  title: string
}

const MapControlsCard = ({ title }: Props) => {
  return (
    <Card className="p-4">
      <Accordion type="single" collapsible className="w-full" defaultValue="map-controls">
        <AccordionItem value="map-controls">
          <AccordionTrigger asChild>
            <button className="group flex w-full justify-between items-center">
              <div className="flex justify-between items-center gap-2 w-full">
                <h3 className="text-base font-medium text-xl">{title}</h3>
                <ChevronDown
                  size={22}
                  className="
                    transform
                    -rotate-90
                    transition-transform
                    group-data-[state=open]:rotate-0
                    text-brand
                  "
                />
              </div>
            </button>
          </AccordionTrigger>
          <AccordionContent>
            <CardContent className="grid grid-cols-[2fr_325px] gap-x-8 p-0 mt-5">
              <div>
                <MapControlsFormFilters />
                <MatchedControls />
              </div>
              <div
                className="border-2 border-dashed rounded-lg h-80 flex items-center justify-center flex-col gap-2"
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  const data = e.dataTransfer.getData('text/plain')
                  alert(`Dropped: ${data}`)
                }}
              >
                <Expand size={42} strokeWidth={1} />
                <p>Drag controls here</p>
              </div>
            </CardContent>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

export default MapControlsCard
