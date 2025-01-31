'use client'
import React, { useState } from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import MyGroupsTable from '@/components/pages/protected/groups/my-groups/my-groups-table'
import CreateGroupDialog from './create-group-dialog'
import { CreditCard as CardIcon, Table as TableIcon } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'
import MyGroupsCard from '@/components/pages/protected/groups/my-groups/my-groups-cards'

const Page: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'table' | 'card'>('table')

  return (
    <>
      <PageHeading heading="My Groups" />
      <div className="flex justify-between">
        <div className="flex gap-1 size-fit bg-transparent p-1 border rounded-md">
          <div className={`py-0.5 px-1.5 rounded-md cursor-pointer ${activeTab === 'table' ? 'bg-white' : 'bg-transparent'}`} onClick={() => setActiveTab('table')}>
            <TableIcon />
          </div>
          <div className={`py-0.5 px-1.5 rounded-md cursor-pointer ${activeTab === 'card' ? 'bg-white' : 'bg-transparent'}`} onClick={() => setActiveTab('card')}>
            <CardIcon />
          </div>
        </div>
        <CreateGroupDialog />
      </div>
      {activeTab === 'table' ? <MyGroupsTable /> : <MyGroupsCard />}
    </>
  )
}

export default Page
