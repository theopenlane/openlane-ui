import React from 'react'
import { CirclePlus } from 'lucide-react'
import { hasPermission } from '@/lib/authz/utils.ts'
import { AccessEnum } from '@repo/codegen/src/permissions.generated'
import Menu from '@/components/shared/menu/menu.tsx'
import { CreateBtn } from '@/components/shared/enum-mapper/common-enum'
import { CreateTaskDialog } from '@/components/pages/protected/tasks/create-task/dialog/create-task-dialog'
import { type TObjectAssociationMap } from '@/components/shared/object-association/types/TObjectAssociationMap'
import { type TAssociationItem } from '@/components/shared/object-association/association-items'
import { useOrganizationRoles } from '@/lib/query-hooks/permissions'
import { useSession } from 'next-auth/react'
import MenuItem from '@/components/shared/menu/menu-item'

type TCreateItemsFromPolityProps = {
  handleCreateNewPolicy: () => void
  handleCreateNewProcedure: () => void
  initialData?: TObjectAssociationMap
  objectAssociationItems?: TAssociationItem[]
}

const CreateItemsFromPolicyToolbar: React.FC<TCreateItemsFromPolityProps> = ({ handleCreateNewPolicy, handleCreateNewProcedure, initialData, objectAssociationItems }) => {
  const { data: permission } = useOrganizationRoles()
  const { data: session } = useSession()
  return (
    <div className="grow flex flex-row items-center gap-2 justify-end">
      <Menu
        trigger={CreateBtn}
        content={
          <>
            {hasPermission(permission?.roles, AccessEnum.CanCreateInternalPolicy, session) && (
              <MenuItem icon={<CirclePlus size={16} strokeWidth={2} />} onSelect={handleCreateNewPolicy}>
                Policy
              </MenuItem>
            )}
            {hasPermission(permission?.roles, AccessEnum.CanCreateProcedure, session) && (
              <MenuItem icon={<CirclePlus size={16} strokeWidth={2} />} onSelect={handleCreateNewProcedure}>
                Procedure
              </MenuItem>
            )}
            <CreateTaskDialog initialData={initialData} trigger={<MenuItem icon={<CirclePlus size={16} strokeWidth={2} />}>Task</MenuItem>} objectAssociationItems={objectAssociationItems} />
          </>
        }
      />
    </div>
  )
}

export default CreateItemsFromPolicyToolbar
