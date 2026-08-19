'use client'

import React, { useEffect, useState } from 'react'
import { useTask, useTaskAssociations } from '@/lib/graphql-hooks/task'
import { useNotification } from '@/hooks/useNotification'
import { useTaskCopyPrefill, type TTaskCopyPrefill } from '../../hooks/use-task-copy-prefill'
import TaskTemplatePickerDialog from './task-template-picker-dialog'
import { CreateTaskDialog } from './create-task-dialog'

type TProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccessWithId?: (id: string) => void
}

const CreateTaskFromTemplateDialog: React.FC<TProps> = ({ open, onOpenChange, onSuccessWithId }) => {
  const [templateId, setTemplateId] = useState<string | undefined>(undefined)
  const [preparedTemplate, setPreparedTemplate] = useState<TTaskCopyPrefill | null>(null)
  const { errorNotification } = useNotification()

  const { data: templateData, isFetching: isTemplateFetching, isError: isTemplateError } = useTask(templateId)
  const { data: associationsData, isFetching: areAssociationsFetching, isError: areAssociationsError } = useTaskAssociations(templateId)

  const prefill = useTaskCopyPrefill(templateData?.task, associationsData, templateId ? 'template' : null)

  useEffect(() => {
    if (!templateId || isTemplateFetching || areAssociationsFetching) {
      return
    }

    if (isTemplateError || areAssociationsError || !prefill.initialValues) {
      setTemplateId(undefined)
      errorNotification({ title: 'Error', description: 'The selected template could not be loaded.' })
      return
    }

    setPreparedTemplate(prefill)
    setTemplateId(undefined)
    onOpenChange(false)
  }, [templateId, isTemplateFetching, areAssociationsFetching, isTemplateError, areAssociationsError, prefill, errorNotification, onOpenChange])

  const closeCreateDialog = (createDialogOpen: boolean) => {
    if (!createDialogOpen) {
      setPreparedTemplate(null)
    }
  }

  const closePicker = (pickerOpen: boolean) => {
    if (!pickerOpen) {
      onOpenChange(false)
      setTemplateId(undefined)
    }
  }

  return (
    <>
      {open && <TaskTemplatePickerDialog onOpenChange={closePicker} onSelect={setTemplateId} loadingTemplateId={templateId ?? null} />}
      {preparedTemplate?.initialValues && (
        <CreateTaskDialog
          open
          fromTemplate
          onOpenChange={closeCreateDialog}
          initialValues={preparedTemplate.initialValues}
          initialData={preparedTemplate.initialData}
          objectAssociationsDisplayIDs={preparedTemplate.objectAssociationsDisplayIDs}
          onSuccessWithId={onSuccessWithId}
        />
      )}
    </>
  )
}

export default CreateTaskFromTemplateDialog
