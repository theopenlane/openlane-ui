'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Badge } from '@repo/ui/badge'
import { GlobeIcon, LockIcon } from 'lucide-react'
import { Card } from '@repo/ui/cardpanel'

const data = [
  {
    name: 'CC1.2',
    ref: 'CC1.2',
    description: 'The board of directors demonstrates independence from management and exercises oversight of the development and performance of internal control. (COSO Principle 2)',
    tags: ['Security', 'CC1.2', 'Control Environment'],
    visibility: 'Public',
    updatedBy: 'Sarah Funkhouser',
    updatedAt: 'less than a day',
    createdBy: 'Kelsey Waters',
    createdAt: 'January 7, 2024 1:22 PM',
    members: [{ avatar: '/path/to/avatar1.png', fallback: 'K' }],
  },
  {
    name: 'CC1.3',
    ref: 'CC1.3',
    description: 'Management establishes, with board oversight, structures, reporting lines, and appropriate authorities and responsibilities. (COSO Principle 3)',
    tags: ['Governance', 'CC1.3'],
    visibility: 'Private',
    updatedBy: 'John Doe',
    updatedAt: '2 days ago',
    createdBy: 'Kelsey Waters',
    createdAt: 'January 5, 2024 10:15 AM',
    members: [{ avatar: '/path/to/avatar2.png', fallback: 'S' }],
  },
]

const MyGroupsCard = () => {
  return (
    <div className="space-y-4 mt-5">
      {data.map((group, index) => (
        <Card key={index} className=" w-full max-w-md">
          <div className="flex py-1.5 px-4 justify-between items-center mb-2 border-b">
            <h3 className="font-semibold text-gray-900">{group.name}</h3>
            {group.visibility === 'Public' ? <GlobeIcon className="h-5 w-5 text-gray-500" /> : <LockIcon className="h-5 w-5 text-gray-500" />}
          </div>
          <div className="py-3 px-4 pb-5">
            <p className="text-gray-700 text-sm mb-3">{group.description}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {group.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {group.members.map((member, index) => (
                <Avatar key={index} className="h-8 w-8">
                  <AvatarImage src={member.avatar} alt={member.fallback} />
                  <AvatarFallback>{member.fallback}</AvatarFallback>
                </Avatar>
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default MyGroupsCard
