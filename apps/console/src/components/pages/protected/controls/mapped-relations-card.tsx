import { MappedControlMappingType, MappedControlsFragmentFragment, MappedSubcontrolsFragmentFragment } from '@repo/codegen/src/schema'
import { usePathname } from 'next/navigation'
import { MappingIconMapper } from '@/components/shared/enum-mapper/map-control-enum'
import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useDeleteMappedControl } from '@/lib/graphql-hooks/mapped-control'
import { ConfirmationDialog } from '@repo/ui/confirmation-dialog'
import { useNotification } from '@/hooks/useNotification'
import { Button } from '@repo/ui/button'
import StandardChip from '../standards/shared/standard-chip'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import ControlChip from './map-controls/shared/control-chip'

type RelationCardProps = {
  data: {
    from: Record<string, (MappedControlsFragmentFragment | MappedSubcontrolsFragmentFragment)[]>
    to: Record<string, (MappedControlsFragmentFragment | MappedSubcontrolsFragmentFragment)[]>
    type: MappedControlMappingType
    confidence: number
    relation: string
    id: string
  }
  controlHrefMap: Record<string, string>
  subcontrolHrefMap: Record<string, string>
}

const RelationCard = ({ data, controlHrefMap, subcontrolHrefMap }: RelationCardProps) => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const { mutateAsync: deleteMappedControl } = useDeleteMappedControl()
  const { successNotification, errorNotification } = useNotification()

  const handleDelete = async () => {
    try {
      await deleteMappedControl({ deleteMappedControlId: data.id })
      setOpen(false)
      successNotification({
        title: 'Mapping deleted',
        description: 'The mapped control was successfully removed.',
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <>
      <div className="border rounded-md p-4 mt-5">
        <div>
          <div className=" border-b">
            <div className="flex gap-2 justify-end">
              <Link href={`${pathname}/edit-map-control?mappedControlId=${data.id}`} className="text-brand cursor-pointer text-xs">
                <Button className="h-8 p-2" icon={<Pencil />} iconPosition="left" variant="outline">
                  Edit
                </Button>
              </Link>
              <Button onClick={() => setOpen(true)} className="h-8 p-2" icon={<Trash2 />} iconPosition="left" variant="outline">
                Delete
              </Button>
            </div>
            <div className="flex items-center">
              <div className="flex gap-4 w-40 shrink-0 self-start items-center">
                <label className="text-sm">From</label>
              </div>
              <div className="flex flex-col gap-2">
                {Object.entries(data.from).map(([framework, controls], index, array) => (
                  <div key={framework} className={`flex gap-2 w-full pb-2 ${index < array.length - 1 ? 'border-b border-dotted' : ''}`}>
                    <StandardChip referenceFramework={framework ?? ''} />
                    <div className="flex flex-wrap gap-2">
                      {controls.map((control) => (
                        <ControlChip key={control.id} control={control} hideStandard hideHexagon />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-2 border-b">
            <div className="flex items-center">
              <div className="flex gap-4 w-40 shrink-0 self-start items-center">
                <label className="text-sm">To</label>
              </div>
              <div className="flex flex-col gap-2">
                {Object.entries(data.to).map(([framework, controls], index, array) => (
                  <div key={framework} className={`flex gap-2 w-full pb-2 ${index < array.length - 1 ? 'border-b border-dotted' : ''}`}>
                    <StandardChip referenceFramework={framework ?? ''} />
                    <div className="flex flex-wrap gap-2">
                      {controls.map((control) => {
                        const href = control.__typename === 'Subcontrol' ? subcontrolHrefMap[control.refCode] || '' : controlHrefMap[control.refCode] || ''
                        console.log(href)
                        return <ControlChip key={control.id} forceHref={href} control={control} hideStandard hideHexagon />
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="">
          <div className="flex items-center border-b py-2">
            <p className="flex gap-4 w-40 shrink-0 self-start items-center text-sm">Type</p>
            {data.type && (
              <div className={`flex items-center justify-center rounded-full bg-card ${data.type === MappedControlMappingType.SUPERSET ? 'h-5 w-5' : 'h-2.5 w-2.5'}`}>
                {MappingIconMapper[data.type]}
              </div>
            )}
            <p className="capitalize ml-2 text-sm">{data.type.toLowerCase()}</p>
          </div>
          <div className="flex items-center border-b py-2">
            <p className="flex gap-4 w-40 shrink-0 self-start items-center text-sm">Confidence</p>
            <p className="text-sm">{data.confidence}%</p>
          </div>
          <div className="flex pt-2">
            <p className="flex gap-4 w-40 shrink-0 self-start items-center text-sm">Relation</p>
            <p className="text-sm whitespace-pre-wrap">{data.relation}</p>
          </div>
        </div>
      </div>
      <ConfirmationDialog
        open={open}
        onOpenChange={setOpen}
        onConfirm={handleDelete}
        confirmationText="Delete mapping"
        confirmationTextVariant="destructive"
        showInput
        description="This will permanently delete the mapped control relationship. This action cannot be undone."
      />
    </>
  )
}

export default RelationCard
