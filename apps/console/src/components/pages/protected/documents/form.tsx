import React, { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { JsonForms } from '@jsonforms/react'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import {
  JsonFormsStyleContext,
  vanillaCells,
} from '@jsonforms/vanilla-renderers'
import {
  useCreateDocumentDataMutation,
  useGetTemplateQuery,
} from '@repo/codegen/src/schema'
import {
  renderers,
  styleContextValue,
} from '@/components/pages/protected/documents/styles'
import { Generate } from '@jsonforms/core'

function printPDF() {
  alert('Coming soon!')
}

export const TemplateEditor = ({ id }: { id: string }) => {
  // get the session
  const { data: session, status } = useSession()
  const isSessionLoading = status === 'loading'

  // setup the state to save the form data
  const [data, setData] = useState({})

  // setup the state to save the jsonschema
  const [schemaData, setSchemaData] = useState({})
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // setup the query to get the template data
  const variables = { getTemplateId: id || '' }
  const [templateData] = useGetTemplateQuery({ variables })
  const uischema =
    templateData?.data?.template.uischema ||
    Generate.uiSchema(templateData.data?.template.jsonconfig)

  // setup the mutation to save the form data
  const [dataResult, createDocumentData] = useCreateDocumentDataMutation()
  function saveDocumentData() {
    const variables = {
      input: {
        data: data,
        templateID: templateData?.data?.template.id || '',
      },
    }

    createDocumentData(variables)
    alert('Form Data Saved')
  }

  // Wait for the session and template data
  if (isSessionLoading || templateData.fetching) {
    return <div>loading...</div>
  }

  if (templateData.error) {
    return <div>failed to load</div>
  }

  return (
    <>
      <JsonFormsStyleContext.Provider value={styleContextValue}>
        <JsonForms
          schema={templateData?.data?.template.jsonconfig}
          data={data}
          renderers={renderers}
          uischema={uischema}
          cells={vanillaCells}
          validationMode="ValidateAndHide"
          onChange={({ data }) => setData(data)}
        />
        <Button
          icon={<ArrowUpRight />}
          iconAnimated
          type="button"
          size="md"
          variant="aquamarine"
          onClick={() => {
            saveDocumentData()
          }}
        >
          Save Form
        </Button>
        &nbsp;&nbsp;&nbsp;
        <Button
          icon={<ArrowUpRight />}
          iconAnimated
          type="button"
          size="md"
          variant="aquamarine"
          onClick={() => {
            printPDF()
          }}
        >
          Print PDF
        </Button>
      </JsonFormsStyleContext.Provider>
    </>
  )
}
