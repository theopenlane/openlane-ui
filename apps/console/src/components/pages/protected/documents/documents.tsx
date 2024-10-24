'use client'

import { useRouter } from 'next/navigation'
import {
  useFilterTemplatesQuery,
  TemplateWhereInput,
  TemplateDocumentType,
} from '@repo/codegen/src/schema'

export const DocumentList = () => {
  // setup the query to get the organization document data
  const orgFilter: TemplateWhereInput = {
    templateType: TemplateDocumentType.DOCUMENT,
  }
  const [allDocuments] = useFilterTemplatesQuery({
    variables: { where: orgFilter },
  })

  if (allDocuments.error) {
    console.log(allDocuments.error)
    return <div>failed to load</div>
  }

  // Wait for the session and template data
  if (allDocuments.fetching) {
    return <div>loading...</div>
  }

  const router = useRouter()

  const handleSelectChangeForm = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const templateID = event.target.value
    router.push(`/documents/form?id=${templateID}`)
  }

  const handleSelectChangeTemplate = (
    event: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const templateID = event.target.value
    router.push(`/documents/editor?id=${templateID}`)
  }

  return (
    <>
      <p>
        The organization documents that can be used to create documents such as
        invoices, quotes, etc.
      </p>
      <select onChange={handleSelectChangeForm}>
        <option key="0" value="">
          Select...
        </option>
        {[
          allDocuments.data?.templates?.edges?.map((templateEntry) => (
            <option
              key={templateEntry?.node?.id}
              value={templateEntry?.node?.id}
            >
              {templateEntry?.node?.name}
            </option>
          )),
        ]}
      </select>
      <br />
      <br />
      <p>Edit an existing document schema</p>
      <select onChange={handleSelectChangeTemplate}>
        <option key="0" value="">
          Select...
        </option>
        {[
          allDocuments.data?.templates?.edges?.map((templateEntry) => (
            <option
              key={templateEntry?.node?.id}
              value={templateEntry?.node?.id}
            >
              {templateEntry?.node?.name}
            </option>
          )),
        ]}
      </select>
    </>
  )
}
