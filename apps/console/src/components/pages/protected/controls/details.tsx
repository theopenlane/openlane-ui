'use client'

import React from 'react'
import { Card } from '@repo/ui/cardpanel'
import { ChevronRight } from 'lucide-react'
import { Button } from '@repo/ui/button'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const DetailsCard = () => {
  const params = useParams()
  const id = params?.id as string
  const subcontrolId = params?.subcontrolId as string | undefined

  const controlObjectivesPath = subcontrolId ? `/controls/${id}/${subcontrolId}/control-objectives` : `/controls/${id}/control-objectives`
  const controlImplementationPath = subcontrolId ? `/controls/${id}/${subcontrolId}/control-implementation` : `/controls/${id}/control-implementation`

  return (
    <Card className="p-4 bg-muted rounded-xl shadow-sm">
      <h3 className="text-lg font-medium mb-4">Details</h3>
      <div className=" flex flex-col gap-2">
        <div className="flex justify-between pb-2.5  border-b items-center">
          <span className="text-sm ">Control objectives</span>
          <Link href={controlObjectivesPath}>
            <Button className="h-8 !p-2 size-fit" variant="outline" icon={<ChevronRight size={16} />}>
              View
            </Button>
          </Link>
        </div>
        <div className="flex justify-between p-0 items-center">
          <span className="text-sm ">Implementation details</span>
          <Link href={controlImplementationPath}>
            <Button className="h-8 !p-2 size-fit" variant="outline" icon={<ChevronRight size={16} />}>
              View
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  )
}

export default DetailsCard
