import { RiskRiskDecision, type UpdateRiskInput } from '@repo/codegen/src/schema'
import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { SelectField } from '@/components/shared/crud-base/form-fields/select-field'
import { enumToOptions, getEnumLabel } from '@/components/shared/enum-mapper/common-enum'
import { type InternalEditingType } from '@/components/shared/crud-base/generic-sheet'
import { Loader2 } from 'lucide-react'
import { type EditRisksFormData } from '../view/hooks/use-form-schema'
import { useFormContext } from 'react-hook-form'

interface RiskDecisionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  isLoading?: boolean
  internalEditing: string | null
  setInternalEditing: InternalEditingType
  handleUpdate: (input: UpdateRiskInput) => Promise<void>
}

export const RiskDecisionDialog: React.FC<RiskDecisionDialogProps> = ({ open, onOpenChange, isLoading, internalEditing, setInternalEditing, handleUpdate }) => {
  const [saving, setSaving] = useState(false)
  const { getValues } = useFormContext<EditRisksFormData>()

  const handleSave = async () => {
    setSaving(true)
    try {
      const selectedDecision = getValues('riskDecision')
      await handleUpdate({ riskDecision: selectedDecision as RiskRiskDecision })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Set Risk Decision</DialogTitle>
        </DialogHeader>

        <div className="py-2">
          <SelectField
            name="riskDecision"
            label="Risk Decision"
            options={enumToOptions(RiskRiskDecision)}
            renderValue={getEnumLabel}
            isEditing={true}
            isEditAllowed={true}
            internalEditing={internalEditing}
            setInternalEditing={setInternalEditing}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || isLoading}>
            {saving || isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
