import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Grid, GridRow, GridCell } from '@repo/ui/grid'
import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import MultipleSelector from '@repo/ui/multiple-selector'
import { useUserSelect } from '@/lib/graphql-hooks/members'
import { useGroupSelect } from '@/lib/graphql-hooks/groups'

export const programInviteSchema = z.object({
  programAdmins: z.array(z.string()).optional(),
  programMembers: z.array(z.string()).optional(),
  groupEditors: z.array(z.string()).optional(),
  groupViewers: z.array(z.string()).optional(),
})

type ProgramInviteValues = zInfer<typeof programInviteSchema>

export const ProgramInviteComponent: React.FC = () => {
  return (
    <Panel className="border-none p-2 ">
      <PanelHeader heading="" subheading="Gives read and write access to the program to your team members" noBorder />
      <div>
        <Grid>
          <GridRow columns={1}>
            <GridCell>
              <InviteComponent />
            </GridCell>
          </GridRow>
        </Grid>
      </div>
    </Panel>
  )
}

// InviteComponent contains the team invite form
export const InviteComponent: React.FC = () => {
  const { userOptions } = useUserSelect()
  const { groupOptions } = useGroupSelect()

  return (
    <>
      <div className="bg-background-secondary flex flex-col gap-5">
        <h1 className="text-base font-semibold">Program Members</h1>
        <p>Add users in your organization to the program directly. Admins will have read and write access, Members will only have read access</p>
        <Grid>
          <GridRow columns={2}>
            <GridCell>
              <AddSelectDropdown fieldName="programAdmins" formLabel="Assign Program Admins" placeholder="Search users..." options={userOptions} />
            </GridCell>
            <GridCell>
              <AddSelectDropdown fieldName="programMembers" formLabel="Assign Program Members" placeholder="Search users..." options={userOptions} />
            </GridCell>
          </GridRow>
        </Grid>
      </div>

      <div className="bg-background-secondary mt-10 flex flex-col gap-5">
        <h1 className="text-base font-semibold">Group Permissions</h1>
        <p>Assign permissions to the program based on groups. Groups with editor access can read and write, groups with viewer access can only read objects in the program.</p>
        <Grid>
          <GridRow columns={2}>
            <GridCell>
              <AddSelectDropdown fieldName="groupEditors" formLabel="Assign Groups with Edit Access" placeholder="Search groups..." options={groupOptions} />
            </GridCell>
            <GridCell>
              <AddSelectDropdown fieldName="groupViewers" formLabel="Assign Groups with Read Only Access" placeholder="Search groups..." options={groupOptions} />
            </GridCell>
          </GridRow>
        </Grid>
      </div>
    </>
  )
}

type AddSelectDropdownProps = {
  fieldName: keyof ProgramInviteValues
  formLabel: string
  placeholder: string
  options: { label: string; value: string }[]
}

export const AddSelectDropdown = ({ fieldName, formLabel, placeholder, options }: AddSelectDropdownProps) => {
  const { register, control } = useFormContext<ProgramInviteValues>()

  return (
    <FormField
      control={control}
      name={register(fieldName).name}
      render={({ field }) => (
        <FormItem>
          <FormLabel htmlFor={field.name}>{formLabel}</FormLabel>
          <FormControl>
            <MultipleSelector
              placeholder={placeholder}
              options={options}
              value={options.filter((option) => field.value?.includes(option.value))}
              onChange={(selected) => field.onChange(selected.map((o) => o.value))}
            />
          </FormControl>
        </FormItem>
      )}
    />
  )
}
