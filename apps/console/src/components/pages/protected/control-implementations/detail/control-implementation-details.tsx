import React, { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { isPlateValueEmpty } from '@/components/shared/plate/plate-utils'
import { ControlImplementationDetailsField } from '../../controls/tabs/implementation/control-implementation-components/form/control-implementation-fields'
import { type TFormData } from '../../controls/tabs/implementation/control-implementation-components/form/use-form-schema'
import { ReadOnlyRichText } from '../../exposure/detail/read-only-rich-text'

type TControlImplementationDetailsProps = {
  details?: string | null
  isEditing: boolean
}

const EditableDetails: React.FC<{ details?: string | null }> = ({ details }) => {
  const form = useFormContext<TFormData>()
  const [initialDetails] = useState(details ?? undefined)

  return <ControlImplementationDetailsField form={form} detailsInitialValue={initialDetails} />
}

const ControlImplementationDetails: React.FC<TControlImplementationDetailsProps> = ({ details, isEditing }) => {
  if (isEditing) {
    return <EditableDetails details={details} />
  }

  if (!details || isPlateValueEmpty(details)) {
    return <p className="text-sm text-muted-foreground italic">No implementation details yet</p>
  }

  return <ReadOnlyRichText label="Implementation details" value={details} />
}

export default ControlImplementationDetails
