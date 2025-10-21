'use client'
import TabSwitcher from '@/components/shared/control-switcher/tab-switcher'
import React, { useState } from 'react'
import { PoliciesTable } from './table/policies-table'
import PoliciesDashboard from './policies-dashboard/policies-dashboard'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Bell, ChevronDown, SquarePlus, User } from 'lucide-react'
import { Button } from '@repo/ui/button'
import { canCreate } from '@/lib/authz/utils'
import { AccessEnum } from '@/lib/authz/enums/access-enum'
import Link from 'next/link'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'

const PoliciesPage = () => {
  const [active, setActive] = useState<'dashboard' | 'table'>('dashboard')
  const { data: permission } = useOrganizationRoles()

  return (
    <div>
      <div className="flex justify-between items-center">
        <div className="flex gap-4 items-center">
          <h1 className="text-3xl tracking-[-0.056rem] text-header">Internal Policies</h1>
          <TabSwitcher active={active} setActive={setActive} />
        </div>
        {active === 'dashboard' && (
          <div className="flex items-center gap-3 mt-4 sm:mt-0">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative flex items-center gap-1 border border-slate-700 rounded-md px-3 py-2 hover:bg-slate-800 transition">
                  <Bell size={18} className="text-slate-200" />
                  <ChevronDown size={16} className="text-slate-400" />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-[10px] text-white rounded-full px-[5px] py-[1px] font-medium">2</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1E293B] border-slate-700 text-slate-200 w-56">
                <DropdownMenuItem>5 policies have been in review over 2 weeks</DropdownMenuItem>
                <DropdownMenuItem>3 policies are missing owners</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Owners Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 border border-slate-700 rounded-md px-3 py-2 hover:bg-slate-800 transition">
                  <User size={18} className="text-slate-200" />
                  <span className="text-slate-300 text-sm">All owners</span>
                  <ChevronDown size={16} className="text-slate-400" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-[#1E293B] border-slate-700 text-slate-200 w-48">
                <DropdownMenuItem>All owners</DropdownMenuItem>
                <DropdownMenuItem>My policies</DropdownMenuItem>
                <DropdownMenuItem>Team policies</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Create button */}
            {canCreate(permission?.roles, AccessEnum.CanCreateInternalPolicy) && (
              <Link href="/policies/create">
                <Button variant="outline" className="h-8 !px-2 !pl-3 btn-secondary" icon={<SquarePlus />} iconPosition="left">
                  Create
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
      {active === 'dashboard' ? <PoliciesDashboard /> : <PoliciesTable />}
    </div>
  )
}

export default PoliciesPage
