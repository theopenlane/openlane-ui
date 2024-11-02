'use client'

import {
  GetAllTemplatesQuery,
  useFilterTemplatesQuery,
  TemplateDocumentType,
  TemplateWhereInput,
} from '@repo/codegen/src/schema'
import { useSession } from 'next-auth/react'
import { pageStyles } from './page.styles'
import { useState, useEffect } from 'react'
import { Input } from '@repo/ui/input'
import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { useCopyToClipboard } from '@uidotdev/usehooks'
import { useToast } from '@repo/ui/use-toast'
import { Actions } from './actions/actions'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { CreateDropdown } from './create'

const ICON_SIZE = 14

type TemplateEdge = NonNullable<
  NonNullable<GetAllTemplatesQuery['templates']>['edges']
>[number]

type Template = NonNullable<TemplateEdge>['node']

export const QuestionnairesTable = () => {
  const router = useRouter()

  const {
    searchRow,
    searchField,
  } = pageStyles()

  const { data: session } = useSession()
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const whereFilter: TemplateWhereInput = {
    templateType: TemplateDocumentType.DOCUMENT,
  }

  const [{ data, fetching, error }, refetch] = useFilterTemplatesQuery({
    variables: { where: whereFilter },
    pause: !session,
  })

  useEffect(() => {
    if (data?.templates?.edges) {
      const templates = data.templates.edges.map(edge => edge?.node).filter(node => node !== null) as Template[]
      setFilteredTemplates(templates)
    }
  }, [data])

  if (error || fetching) return null

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchValue = e.target.value.toLowerCase()
    setSearchTerm(searchValue)

    if (data?.templates?.edges) {
      const filtered = data.templates.edges.filter(
        (edge) => {
          const email = edge?.node?.name.toLowerCase() || ''
          return email.includes(searchValue)
        },
      )
      const filteredSubscribers = filtered.map(edge => edge?.node).filter(node => node !== null) as Template[]
      setFilteredTemplates(filteredSubscribers)
    }
  }

  const columns: ColumnDef<Template>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'description',
      header: 'Description',
    },
    {
      accessorKey: 'updatedAt',
      header: 'Updated At',
      cell: ({ cell }) =>
        format(new Date(cell.getValue() as string), 'dd MMM yyyy'),
    },
    {
      accessorKey: 'createdAt',
      header: 'Created At',
      cell: ({ cell }) =>
        format(new Date(cell.getValue() as string), 'dd MMM yyyy'),
    },
    {
      accessorKey: 'id',
      header: '',
      cell: ({ cell }) => (
         <Actions
          templateId={cell.getValue() as string}
          refetchTemplates={refetch}
        />
      ),
      size: 40,
    },
  ]

  return (
    <div>
      <div className={searchRow()}>
        <div className={searchField()}>
          <Input
            placeholder="search"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      
       < CreateDropdown />

      </div>
      <DataTable columns={columns} data={filteredTemplates} />
    </div>
  )
}
