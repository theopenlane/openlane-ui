import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Grid, GridRow, GridCell } from '@repo/ui/grid'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { InfoIcon } from 'lucide-react'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { Node } from '../nodes'
import MultipleSelector from '@repo/ui/multiple-selector'

export const programInviteSchema = z.object({
  programAdmins: z.array(z.string()).optional(),
  programMembers: z.array(z.string()).optional(),
  groupEditors: z.array(z.string()).optional(),
  groupViewers: z.array(z.string()).optional(),
})

type ProgramInviteValues = zInfer<typeof programInviteSchema>
type ProgramInviteProps = { users: Node[]; groups: Node[] }

export const ProgramInviteComponent: React.FC<ProgramInviteProps> = ({ users, groups }) => {
  return (
    <Panel className="border-none p-2 ">
      <PanelHeader heading="" subheading="Gives read and write access to the program to your team members" noBorder />
      <div>
        <Grid>
          <GridRow columns={1}>
            <GridCell>
              <InviteComponent users={users} groups={groups} />
            </GridCell>
          </GridRow>
        </Grid>
      </div>
    </Panel>
  )
}

// InviteComponent contains the team invite form
export const InviteComponent: React.FC<ProgramInviteProps> = ({ users, groups }) => {
  return (
    <>
      <div className="bg-background-secondary flex flex-col gap-5">
        <h1 className="text-base font-semibold">Program Members</h1>
        <p>Add users in your organization to the program directly. Admins will have read and write access, Members will only have read access</p>
        <div>
          <Grid>
            <GridRow columns={2}>
              <GridCell>
                <AddMemberDropdown values={users} fieldName="programAdmins" fieldType="user" formLabel="Assign Program Admins" />
              </GridCell>
              <GridCell>
                <AddMemberDropdown values={users} fieldName="programMembers" fieldType="user" formLabel="Assign Program Members" />
              </GridCell>
            </GridRow>
          </Grid>
        </div>
      </div>
      <div className="bg-background-secondary mt-10 flex flex-col gap-5">
        <h1 className="text-base font-semibold">Group Permissions</h1>
        <p>Assign permissions to the program based on groups. Groups with editor access can read and write, groups with viewer access can only read objects in the program.</p>
        <div>
          <Grid>
            <GridRow columns={2}>
              <GridCell>
                <AddMemberDropdown values={groups} fieldName="groupEditors" fieldType="group" formLabel="Assign Groups with Edit Access" />
              </GridCell>
              <GridCell>
                <AddMemberDropdown values={groups} fieldName="groupViewers" fieldType="group" formLabel="Assign Groups with Read Only Access" />
              </GridCell>
            </GridRow>
          </Grid>
        </div>
      </div>
    </>
  )
}

const AddMemberDropdown: React.FC<{ values: Node[]; fieldName: keyof ProgramInviteValues; fieldType: 'group' | 'user'; formLabel: string }> = ({ values, fieldName, fieldType, formLabel }) => {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<ProgramInviteValues>()

  const placeholder = `Search ${fieldType}(s) ...`
  const options = values.map((item) => ({ label: item.node.name, value: item.node.id }))

  return (
    <FormField
      control={control}
      name={register(fieldName).name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={field.name}>
            {formLabel}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon size={14} className="mx-1" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p></p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </FormLabel>
          <FormControl>
            <MultipleSelector
              placeholder={placeholder}
              defaultOptions={options}
              value={options.filter((option) => field.value?.includes(option.value))} // Ensure selected values are displayed
              onChange={(selectedOptions) => {
                const selectedIds = selectedOptions.map((option) => option.value) // Extract selected IDs
                field.onChange(selectedIds)
              }}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
