'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { ChevronRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const DetailsCard = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <Card className="p-4 bg-muted rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Details</h3>
      <div className=" flex flex-col gap-2">
        <div className="flex justify-between pb-2.5  border-b items-center">
          <span className="text-sm ">Control objectives</span>
          <Link href={`/controls/${id}/control-objectives`}>
            <Button className="h-8 !p-2 size-fit" variant="outline" icon={<ChevronRight size={16} />}>
              View
            </Button>
          </Link>
        </div>
        <div className="flex justify-between p-0 items-center">
          <span className="text-sm ">Implementation details</span>
          <Button className="h-8 !p-2 size-fit" variant="outline" icon={<ChevronRight size={16} />}>
            View
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default DetailsCard
