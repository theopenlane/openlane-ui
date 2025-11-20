import React, { Fragment } from 'react'
import { Card } from '@repo/ui/cardpanel'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@repo/ui/badge'

type THeadsUpDisplayProps = {
  displayIDs: string[]
  descriptionText: string
  accordionLabel: string
  title?: string
}

const HeadsUpDisplay = ({ displayIDs, descriptionText, accordionLabel, title = 'Heads up!' }: THeadsUpDisplayProps) => {
  return (
    <Card className="p-4 flex gap-3 bg-note">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm ">{descriptionText}</p>
        <div className="w-3/5 pt-3">
          <Accordion type="single" collapsible defaultValue="objects" className="w-full">
            <AccordionItem value="objects">
              <AccordionTrigger className="py-2 w-full flex justify-between items-center gap-2 group border p-3 bg-background-secondary">
                <span className="text-sm">{accordionLabel}</span>
                <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180" />
              </AccordionTrigger>
              <AccordionContent className="my-3">
                {displayIDs &&
                  displayIDs.map((item, index) => (
                    <Fragment key={index}>
                      {item && (
                        <Badge className="bg-background-secondary mr-1" variant="outline">
                          {item}
                        </Badge>
                      )}
                    </Fragment>
                  ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </Card>
  )
}

export default HeadsUpDisplay
