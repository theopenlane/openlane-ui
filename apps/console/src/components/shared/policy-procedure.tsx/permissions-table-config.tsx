import { ColumnDef } from '@tanstack/react-table'
import { MoreVertical, Trash2 } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import { Avatar } from '@/components/shared/avatar/avatar' // adjust if path differs
import { useState } from 'react'
import { Group as TGroup } from './assign-permissions-table-config'
import { Group, User } from '@repo/codegen/src/schema'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'

export const useGroupColumns = ({ onRemoveGroup }: { onRemoveGroup: (group: TGroup) => void }) => {
  const [activeRow, setActiveRow] = useState<string | null>(null)

  const columns: ColumnDef<TGroup>[] = [
    {
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row?.original && <Avatar entity={row?.original as Group} className="w-[24px] h-[24px]" />}
          <span>{row?.original?.displayName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'members',
      header: 'Members',
      cell: ({ row }) => {
        const count = row?.original?.members?.edges?.length ?? 0
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="px-2 cursor-pointer">{count}</span>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs p-2">
                <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto">
                  {row?.original?.members?.edges?.map((edge) => (
                    <div key={edge?.node?.user.id} className="flex items-center gap-2">
                      <Avatar entity={edge?.node?.user as User} className="w-6 h-6" />
                      <span className="text-sm">{edge?.node?.user.displayName}</span>
                    </div>
                  ))}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <DropdownMenu open={activeRow === row?.original?.id} onOpenChange={(open) => setActiveRow(open ? row?.original?.id || '' : null)}>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center justify-center border border-solid rounded-md w-8 h-8 text-brand-100 hover:bg-brand-50 cursor-pointer">
              <MoreVertical size={16} />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[160px] border">
            <DropdownMenuItem
              onClick={() => {
                onRemoveGroup(row.original)
                setActiveRow(null)
              }}
              className="text-red-500 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  return columns
}
