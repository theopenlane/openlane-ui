'use client'

import React, { useMemo } from 'react'
import { JsonForms } from '@jsonforms/react'
import { vanillaRenderers, vanillaCells } from '@jsonforms/vanilla-renderers'
import type { JsonSchema } from '@jsonforms/core'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'

interface EmailTemplateConfigFormProps {
  schema: JsonSchema
  data: Record<string, unknown>
  onChange: (data: Record<string, unknown>) => void
  readOnly?: boolean
}

const createAjv2020 = () => {
  const ajv = new Ajv2020({ allErrors: true, verbose: true, strict: false, addUsedSchema: false })
  addFormats(ajv)
  return ajv
}

export const EmailTemplateConfigForm: React.FC<EmailTemplateConfigFormProps> = ({ schema, data, onChange, readOnly = false }) => {
  const ajv = useMemo(() => createAjv2020(), [])

  return (
    <div className="email-template-config-form flex flex-col gap-4 [&_label]:text-sm [&_label]:font-medium [&_label]:text-foreground [&_.control]:flex [&_.control]:flex-col [&_.control]:gap-1.5 [&_input]:rounded-md [&_input]:border [&_input]:border-input [&_input]:bg-transparent [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_textarea]:rounded-md [&_textarea]:border [&_textarea]:border-input [&_textarea]:bg-transparent [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_select]:rounded-md [&_select]:border [&_select]:border-input [&_select]:bg-transparent [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_.array-list]:flex [&_.array-list]:flex-col [&_.array-list]:gap-2 [&_.validation]:text-xs [&_.validation]:text-destructive">
      <JsonForms
        schema={schema}
        data={data}
        renderers={vanillaRenderers}
        cells={vanillaCells}
        ajv={ajv}
        readonly={readOnly}
        onChange={({ data: next }) => onChange((next ?? {}) as Record<string, unknown>)}
      />
    </div>
  )
}
