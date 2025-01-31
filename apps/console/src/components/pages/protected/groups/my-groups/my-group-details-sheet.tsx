import React, { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { Button } from '@repo/ui/button' // Replace with your actual Button component
import { Copy, GlobeIcon, Link, Pencil, Plus, Tag, Trash2, TrashIcon, User } from 'lucide-react' // Icons from lucide-react
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { Group } from '../../../../../app/(protected)/groups/my-groups/page'
import MyGroupsMembersTable from './my-groups-members-table'

interface Props {
  selectedGroup: Group | null
  setSelectedGroup: (group: null) => void
}
const GroupDetailsSheet = ({ selectedGroup, setSelectedGroup }: Props) => {
  const [activeTab, setActiveTab] = useState<'Members' | 'Permissions'>('Members')
  return (
    <Sheet open={!!selectedGroup} onOpenChange={() => setSelectedGroup(null)}>
      <SheetContent className="bg-card">
        <SheetHeader>
          <div className="flex justify-end gap-2">
            <Button icon={<Link />} iconPosition="left" variant="outline">
              Copy link
            </Button>
            <Button icon={<Pencil />} iconPosition="left" variant="outline">
              Copy link
            </Button>
            <Button icon={<Trash2 />} iconPosition="left" variant="outline">
              Copy link
            </Button>
          </div>
        </SheetHeader>
        <SheetTitle>{selectedGroup?.name}</SheetTitle>
        <SheetDescription>{selectedGroup?.description}</SheetDescription>
        <div>
          {/* Header Section */}

          {/* Info Section */}
          <div className="flex gap-6 mt-5">
            <div className=" flex gap-2 flex-col">
              <div className="flex items-center gap-1">
                <GlobeIcon height={16} width={16} color="#2CCBAB" /> <p className="text-sm">Visibility:</p>
              </div>
              <div className="flex items-center gap-1">
                <User height={16} width={16} color="#2CCBAB" />
                <p className="text-sm">Members:</p>
              </div>
              <div className="flex items-center gap-1">
                <Tag height={16} width={16} color="#2CCBAB" />
                <p className="text-sm">Tags:</p>
              </div>
            </div>
            <div className="flex gap-2 flex-col">
              <p className="capitalize text-sm">{selectedGroup?.visibility.toLowerCase()}</p>
              <p className="text-sm">{selectedGroup?.members.length}</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedGroup?.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-9 flex gap-4">
            <Button variant="outline" icon={<Plus />} iconPosition="left">
              Add members
            </Button>
            <Button variant="outline" icon={<Plus />} iconPosition="left">
              Assign permissions to group
            </Button>
            <Button variant="outline" icon={<Copy />} iconPosition="left">
              Inherit permission
            </Button>
          </div>

          <div className="mt-9 flex">
            <p
              className={`px-4 py-2 text-sm font-semibold w-1/2 text-center  border-b-2 cursor-pointer ${activeTab === 'Members' ? 'border-brand text-brand' : ''}`}
              onClick={() => setActiveTab('Members')}
            >
              Members
            </p>

            <p
              className={`px-4 py-2 text-sm font-semibold w-1/2 text-center  border-b-2 cursor-pointer ${activeTab === 'Permissions' ? 'border-brand text-brand' : ''}`}
              onClick={() => setActiveTab('Permissions')}
            >
              Permissions
            </p>
          </div>

          <div className="mt-7">{selectedGroup && <MyGroupsMembersTable selectedGroup={selectedGroup} />}</div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default GroupDetailsSheet
