import React, { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { SimpleForm } from '@repo/ui/simple-form'
import {
  TemplateDocumentType,
  useCreateTemplateMutation,
  useGetTemplateQuery,
  OrganizationWhereInput,
  TemplateWhereInput,
  useFilterTemplatesQuery,
  useUpdateTemplateMutation,
} from '@repo/codegen/src/schema'
import { Generate } from '@jsonforms/core'

function isJsonString(str: string) {
  try {
    var json = JSON.parse(str)
    return typeof json === 'object'
  } catch (e) {
    return false
  }
}

export const TemplateEditor = ({ id }: { id: string }) => {
  const router = useRouter()

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

  const handleChange = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = evt.target?.value

    setSchemaData(val)
  }

  const [, createTemplateData] = useCreateTemplateMutation()
  const [, updateTemplateData] = useUpdateTemplateMutation()

  // See if document is already saved
  const orgFilter: OrganizationWhereInput[] = [
    {
      id: session?.user?.organization,
    },
  ]
  const whereFilter: TemplateWhereInput = {
    templateType: TemplateDocumentType.DOCUMENT,
    name: templateData.data?.template.name + ' Document',
    hasOwnerWith: orgFilter,
  }

  const [templateDocument] = useFilterTemplatesQuery({
    variables: { where: whereFilter },
  })

  function saveTemplateData(data: string) {
    let schema: {} = JSON.parse(data)
    const variables = {
      input: {
        name: templateData.data?.template.name + ' Document' || '',
        type: TemplateDocumentType.DOCUMENT,
        jsonconfig: schema,
        description: templateData.data?.template.description,
        uischema: uischema,
        ownerID: session?.user?.organization || '',
      },
    }

    if (templateDocument.data?.templates.edges?.length == 1) {
      const updateId = templateDocument.data.templates.edges[0]?.node?.id || ''
      // template already exists, update it
      updateTemplateData({
        updateTemplateId: updateId,
        input: { ...variables.input },
      }).then((result) => {
        // TODO(hannah or sfunk): this should be a toast or something better with error handling
        if (result.error) {
          alert(result.error)
          return
        }

        if (result.data) {
          alert('Document Updated')

          router.push(
            `/documents/form?id=${result.data?.updateTemplate?.template?.id}`,
          )
        }
      })
    } else {
      createTemplateData(variables).then((result) => {
        // TODO(hannah or sfunk): this should be a toast or something better with error handling
        if (result.error) {
          alert(result.error)
          return
        }

        if (result.data) {
          alert('Document Saved')

          router.push(
            `/documents/form?id=${result.data?.createTemplate?.template?.id}`,
          )
        }
      })
    }
  }

  // set the default tab
  const defaultTab = 'schema'

  // Wait for the session and template data
  if (isSessionLoading || templateData.fetching) {
    return <div>loading...</div>
  }

  if (templateData.error) {
    return <div>failed to load</div>
  }

  return (
    <>
      <SimpleForm>
        <textarea
          name="jsonconfig"
          className="relative rounded-lg flex-col mx-auto my-auto py-2 px-5 w-full min-h-max"
          onChange={handleChange}
          ref={textAreaRef}
          style={{ height: '100vw' }}
          defaultValue={JSON.stringify(
            templateData?.data?.template.jsonconfig,
            null,
            2,
          )}
        />
      </SimpleForm>
      <Button
        icon={<ArrowUpRight />}
        iconAnimated
        type="button"
        size="md"
        variant="aquamarine"
        onClick={() => {
          // saves the initial template schema
          if (Object.keys(schemaData).length === 0) {
            saveTemplateData(
              JSON.stringify(templateData?.data?.template.jsonconfig),
            )
          } else {
            saveTemplateData(JSON.stringify(schemaData))
          }
        }}
      >
        Save Template Schema
      </Button>
      &nbsp;&nbsp;&nbsp;
      <Button
        icon={<ArrowUpRight />}
        iconAnimated
        type="button"
        size="md"
        variant="aquamarine"
        onClick={() => {
          // TODO: this should be a toast or something better with error handling
          isJsonString(JSON.stringify(schemaData))
            ? alert('Valid JSON')
            : alert('Invalid JSON')
        }}
      >
        Validate JSON
      </Button>
    </>
  )
}
