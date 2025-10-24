import { ColumnDef } from '@tanstack/react-table'
import { ControlListFieldsFragment, Subcontrol } from '@repo/codegen/src/schema'
import { Checkbox } from '@repo/ui/checkbox'
import { CreateEvidenceFormData } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { UseFormReturn } from 'react-hook-form'
import { AccordionEnum } from './object-association-control-dialog'
import { CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-details-sheet'

type TColumnOptions = {
  selectedObject: AccordionEnum.Control | AccordionEnum.Subcontrol
  convertToReadOnly: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  form: UseFormReturn<CreateEvidenceFormData>
  evidenceControls: CustomEvidenceControl[] | null
  setEvidenceControls: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
  evidenceSubcontrols: CustomEvidenceControl[] | null
  setEvidenceSubcontrols: React.Dispatch<React.SetStateAction<CustomEvidenceControl[] | null>>
}

export const getControlsAndSubcontrolsColumns = ({
  selectedObject,
  convertToReadOnly,
  form,
  evidenceControls,
  setEvidenceControls,
  evidenceSubcontrols,
  setEvidenceSubcontrols,
}: TColumnOptions): ColumnDef<ControlListFieldsFragment | Subcontrol>[] => {
  const toggleChecked = (id: string, refCode: string, isChecked: boolean, referenceFramework?: string) => {
    if (selectedObject === AccordionEnum.Control) {
      setEvidenceControls((prev) => {
        let newControls = prev ?? []

        if (isChecked && !newControls.find((c) => c.id === id)) {
          newControls = [...newControls, { id, refCode, referenceFramework: referenceFramework ?? null, __typename: 'Control' }]
        } else if (!isChecked) {
          newControls = newControls.filter((c) => c.id !== id)
        }

        form.setValue(
          'controlIDs',
          newControls.map((c) => c.id),
          { shouldValidate: true, shouldDirty: true },
        )
        return newControls
      })
    } else {
      setEvidenceSubcontrols((prev) => {
        let newSubcontrols = prev ?? []

        if (isChecked && !newSubcontrols.find((c) => c.id === id)) {
          newSubcontrols = [...newSubcontrols, { id, refCode, referenceFramework: referenceFramework ?? null, __typename: 'Subcontrol' }]
        } else if (!isChecked) {
          newSubcontrols = newSubcontrols.filter((c) => c.id !== id)
        }

        form.setValue(
          'subcontrolIDs',
          newSubcontrols.map((c) => c.id),
          { shouldValidate: true, shouldDirty: true },
        )
        return newSubcontrols
      })
    }
  }

  return [
    {
      accessorKey: 'name',
      header: selectedObject === AccordionEnum.Control ? AccordionEnum.Control : AccordionEnum.Subcontrol,
      cell: ({ row }) => {
        const { id, refCode, referenceFramework } = row.original

        const checked = selectedObject === AccordionEnum.Control ? !!evidenceControls?.find((c) => c.id === row.original.id) : !!evidenceSubcontrols?.find((c) => c.id === row.original.id)

        return (
          <div className="flex items-center gap-2">
            <Checkbox checked={checked} onCheckedChange={(val) => toggleChecked(id, refCode, val === true, referenceFramework || undefined)} />
            <span>{refCode}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => <div className="line-clamp-3 text-justify">{convertToReadOnly(row.getValue('description') as string, 0)}</div>,
    },
  ]
}
