import { ColumnDef } from '@tanstack/react-table'
import { ControlListFieldsFragment, Subcontrol } from '@repo/codegen/src/schema'
import { Checkbox } from '@repo/ui/checkbox'
import { CreateEvidenceFormMethods } from '@/components/pages/protected/evidence/hooks/use-form-schema'
import { AccordionEnum } from './object-association-control-dialog'
import { CustomEvidenceControl } from '@/components/pages/protected/evidence/evidence-sheet-config'

type TColumnOptions = {
  selectedObject: AccordionEnum.Control | AccordionEnum.Subcontrol
  convertToReadOnly: (data: string, padding?: number, style?: React.CSSProperties) => React.JSX.Element
  form: CreateEvidenceFormMethods
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
      id: 'select',
      header: ({ table }) => {
        const currentPageRows = table.getRowModel().rows.map((row) => row.original)

        const allSelected = currentPageRows.every((row) =>
          selectedObject === AccordionEnum.Control
            ? evidenceControls?.some((c) => c.refCode === row.refCode && c.referenceFramework === row.referenceFramework)
            : evidenceSubcontrols?.some((c) => c.refCode === row.refCode && c.referenceFramework === row.referenceFramework),
        )

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(checked) => {
                currentPageRows.forEach((row) => {
                  toggleChecked(row.id, row.refCode, checked === true, row.referenceFramework || undefined)
                })
              }}
            />
          </div>
        )
      },
      cell: ({ row }) => {
        const { id, refCode, referenceFramework } = row.original

        const checked =
          selectedObject === AccordionEnum.Control
            ? !!evidenceControls?.find((c) => c.refCode === refCode && c.referenceFramework === referenceFramework)
            : !!evidenceSubcontrols?.find((c) => c.refCode === refCode && c.referenceFramework === referenceFramework)

        return (
          <div onClick={(e) => e.stopPropagation()}>
            <Checkbox checked={checked} onCheckedChange={(val) => toggleChecked(id, refCode, val === true, referenceFramework || undefined)} />
          </div>
        )
      },
      size: 50,
      maxSize: 50,
      enableResizing: false,
    },

    {
      accessorKey: 'name',
      header: selectedObject === AccordionEnum.Control ? AccordionEnum.Control : AccordionEnum.Subcontrol,
      meta: {
        className: 'max-w-[40%] w-[30%]',
      },
      cell: ({ row }) => {
        const { refCode } = row.original
        return <span className="block truncate whitespace-nowrap">{refCode}</span>
      },
    },
    {
      accessorKey: 'description',
      header: 'Description',
      size: 0,
      enableResizing: false,
      cell: ({ row }) => <div className="line-clamp-2 overflow-hidden">{convertToReadOnly(row.original.description ?? '', 0)}</div>,
    },
  ]
}
