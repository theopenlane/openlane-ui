'use client'

import React from 'react'
import { pageStyles } from './page.styles'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { CirclePlusIcon } from 'lucide-react'
import { DataTable } from '@repo/ui/data-table'
import PersonalApiKeyDialog from './personal-access-token-create-dialog'

interface Token {
  name: string
  description: string
  organizations: string
  expires: string
}

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'description',
    header: 'Description',
  },
  {
    accessorKey: 'organizations',
    header: 'Organization(s)',
  },
  {
    accessorKey: 'expires',
    header: 'Expires',
  },
  {
    accessorKey: 'actions',
    header: '',
    cell: () => (
      <button className="text-red-500 hover:text-red-700 transition-colors" aria-label="Delete token">
        🗑️
      </button>
    ),
  },
]

const data: Token[] = [
  {
    name: 'Development',
    description: 'Main computer, full Docker',
    organizations: 'Meowmeow',
    expires: 'Never',
  },
  {
    name: 'Mobile laptop',
    description: 'For writing docs',
    organizations: 'Woofwoof',
    expires: 'January 7, 2024 1:22 PM',
  },
]

const DevelopersPage: React.FC = () => {
  const { wrapper } = pageStyles()

  return (
    <div className={wrapper()}>
      <Panel>
        <div className="flex justify-between items-center mb-4">
          <PanelHeader heading="Personal Access Tokens" noBorder />
          {/* <Button iconPosition="left" icon={<CirclePlusIcon />}>
            Create Token
          </Button> */}
          <PersonalApiKeyDialog />
        </div>
        <DataTable columns={columns} data={data} />
      </Panel>
    </div>
  )
}

export default DevelopersPage
