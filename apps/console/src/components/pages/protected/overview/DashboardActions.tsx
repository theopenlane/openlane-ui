import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import React from 'react'
import { BookOpenCheck, ListChecks, SlidersHorizontal, SquarePlus } from 'lucide-react'
import { useRouter } from 'next/navigation'

const DashboardActions = () => {
  const router = useRouter()

  const handleViewControls = () => {
    router.push('/controls')
  }

  const handleViewMyTasks = () => {
    router.push('/tasks?showMyTasks=true')
  }

  const handleCreateRisk = () => {
    router.push('/risks/create')
  }

  const handleViewPolicies = () => {
    router.push('/policies')
  }

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card onClick={handleViewControls} className="bg-homepage-card border-homepage-card-border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <CardTitle className="p-[24px] pb-0">
          <div className="p-2 rounded-md bg-success/12 inline-flex items-center justify-center">
            <SlidersHorizontal size={20} className="text-success" />
          </div>
        </CardTitle>
        <CardContent className="pt-[12px]">
          <p className="leading-6 text-base font-medium">View All Controls</p>
        </CardContent>
      </Card>

      <Card onClick={handleCreateRisk} className="bg-homepage-card border-homepage-card-border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <CardTitle className="p-[24px] pb-0">
          <div className="p-2 rounded-md bg-danger/12 inline-flex items-center justify-center">
            <SquarePlus size={20} className="text-danger" />
          </div>
        </CardTitle>
        <CardContent className="pt-[12px]">
          <p className="leading-6 text-base font-medium">Create New Risk</p>
        </CardContent>
      </Card>

      <Card onClick={handleViewMyTasks} className="bg-homepage-card border-homepage-card-border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <CardTitle className="p-[24px] pb-0">
          <div className="p-2 rounded-md bg-info/12 inline-flex items-center justify-center">
            <ListChecks size={20} className="text-info" />
          </div>
        </CardTitle>
        <CardContent className="pt-[12px]">
          <p className="leading-6 text-base font-medium">View My Tasks</p>
        </CardContent>
      </Card>

      <Card onClick={handleViewPolicies} className="bg-homepage-card border-homepage-card-border transition-all duration-300 hover:scale-[1.03] hover:shadow-xl hover:-translate-y-1 cursor-pointer">
        <CardTitle className="p-[24px] pb-0">
          <div className="p-2 rounded-md bg-warning/12 inline-flex items-center justify-center">
            <BookOpenCheck size={20} className="text-warning" />
          </div>
        </CardTitle>
        <CardContent className="pt-[12px]">
          <p className="leading-6 text-base font-medium">Review / Edit Policies</p>
        </CardContent>
      </Card>
    </div>
  )
}

export default DashboardActions
