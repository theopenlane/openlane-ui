import { Card } from '@repo/ui/cardpanel'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import { ChevronDown } from 'lucide-react'
import ObjectsChip from '@/components/shared/objects-chip/objects-chip'
import { getAssociationItemKey, type TAssociationItem } from '@/components/shared/object-association/association-items'
import { getSectionDisplayName } from '@/components/shared/object-association/object-association-config'

type THeadsUpDisplayProps = {
  items: TAssociationItem[]
  subject: string
  descriptionText: string
  title?: string
  onRemove?: (item: TAssociationItem) => void
}

const buildAccordionLabel = (items: TAssociationItem[], subject: string): string => {
  const kinds = new Set(items.map((item) => item.kind))
  const [onlyKind] = kinds
  const kindLabel = kinds.size === 1 && onlyKind ? getSectionDisplayName(onlyKind).toLowerCase() : 'objects'

  return `Show ${kindLabel} linked to this ${subject}`
}

const HeadsUpDisplay = ({ items, subject, descriptionText, title = 'Heads up!', onRemove }: THeadsUpDisplayProps) => {
  return (
    <Card className="p-4 flex gap-3 bg-note">
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm ">{descriptionText}</p>
        <div className="w-3/5 pt-3">
          <Accordion type="single" collapsible defaultValue="objects" className="w-full">
            <AccordionItem value="objects">
              <AccordionTrigger className="py-2 w-full flex justify-between items-center gap-2 group border p-3 bg-background-secondary">
                <span className="text-sm">{buildAccordionLabel(items, subject)}</span>
                <ChevronDown className="h-4 w-4 group-data-[state=open]:rotate-180" />
              </AccordionTrigger>
              <AccordionContent className="my-3">
                <div className="flex flex-wrap gap-1">
                  {items.map((item) => (
                    <ObjectsChip key={getAssociationItemKey(item)} name={item.name} objectType={item.kind} removable={!!onRemove} onRemove={() => onRemove?.(item)} />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </Card>
  )
}

export default HeadsUpDisplay
