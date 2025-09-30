import { FormControl, FormField, FormItem, FormLabel } from '@repo/ui/form'
import { useFormContext } from 'react-hook-form'
import { z, infer as zInfer } from 'zod'
import { Panel } from '@repo/ui/panel'
import { wizardStyles } from './wizard.styles'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@repo/ui/tooltip'
import { InfoIcon } from 'lucide-react'
import { Switch } from '@repo/ui/switch'
import { Card } from '@repo/ui/cardpanel'
import { Grid, GridRow, GridCell } from '@repo/ui/grid'
import { Input } from '@repo/ui/input'

export const programDetailSchema = z.object({
  auditorReadComments: z.boolean().optional().default(false),
  auditorWriteComments: z.boolean().optional().default(false),
  auditorReady: z.boolean().optional().default(false),
  auditPartnerName: z.string().optional(),
  auditPartnerEmail: z.string().email({ message: 'Invalid email address' }).optional(),
  auditFirm: z.string().optional(),
})

type ProgramDetailValues = zInfer<typeof programDetailSchema>

export function ProgramDetailsComponent() {
  return (
    <Panel className="border-none p-2">
      <div className="overflow-y-auto">
        <Grid>
          <GridRow className="grid grid-cols-1 2xl:grid-cols-2 gap-10">
            <GridCell>
              <AuditPartner />
            </GridCell>
            <GridCell>
              <AuditorPermissionsComponent />
            </GridCell>
          </GridRow>
        </Grid>
      </div>
    </Panel>
  )
}

// AuditorPermissionsComponent contains the permissions for the auditor role
export const AuditorPermissionsComponent = () => {
  const { switchRow } = wizardStyles()

  const { register, control } = useFormContext<ProgramDetailValues>()

  return (
    <>
      <h2 className="text-lg mb-2">
        Auditor Permissions
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger className="bg-unset">
              <InfoIcon size={14} className="mx-1" />
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-background">
              <p>Permissions for auditor roles, these can be changed at a later date</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </h2>
      <Card className="px-5 py-5 bg-background-secondary">
        <FormField
          control={control}
          name={register('auditorReadComments').name}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Grid className={switchRow()}>
                  <GridRow columns={2}>
                    <GridCell className="text-sm">
                      Read Comments
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="bg-unset">
                            <InfoIcon size={14} className="mx-1" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gives users with the auditor role permissions to read comments in the program</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </GridCell>
                    <GridCell>
                      <Switch className="bg-button-muted" checked={field.value} onCheckedChange={field.onChange} />
                    </GridCell>
                  </GridRow>
                </Grid>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={register('auditorWriteComments').name}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Grid className={switchRow()}>
                  <GridRow columns={2}>
                    <GridCell className="text-sm">
                      Write Comments
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="bg-unset">
                            <InfoIcon size={14} className="mx-1" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Gives users with the auditor role permissions to write comments in the program</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </GridCell>
                    <GridCell>
                      <Switch className="bg-button-muted" checked={field.value} onCheckedChange={field.onChange} />
                    </GridCell>
                  </GridRow>
                </Grid>
              </FormControl>
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={register('auditorReady').name}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Grid className={switchRow()}>
                  <GridRow columns={2}>
                    <GridCell className="text-sm">
                      Auditor Ready
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="bg-unset">
                            <InfoIcon size={14} className="mx-1" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Notifies the auditor the program is ready, allows the auditor to view details</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </GridCell>
                    <GridCell>
                      <Switch className="bg-button-muted" checked={field.value} onCheckedChange={field.onChange} />
                    </GridCell>
                  </GridRow>
                </Grid>
              </FormControl>
            </FormItem>
          )}
        />
      </Card>
    </>
  )
}

const AuditPartner = () => {
  const { register, control, trigger } = useFormContext<ProgramDetailValues>()
  const { inputRow, formRow } = wizardStyles()

  return (
    <>
      <div className={formRow()}>
        <FormField
          control={control}
          name={register('auditPartnerName').name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Audit Partner
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="bg-unset">
                      <InfoIcon size={14} className="mx-1" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Auditor partner that is assigned to the program</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Input
                  onInput={() => {
                    trigger('auditPartnerName')
                  }}
                  className={inputRow()}
                  variant="medium"
                  type="string"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className={formRow()}>
        <FormField
          control={control}
          name={register('auditFirm').name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Audit Firm
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="bg-unset">
                      <InfoIcon size={14} className="mx-1" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>The auditing firm assigned to the program</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Input
                  onInput={() => {
                    trigger('auditFirm')
                  }}
                  className={inputRow()}
                  variant="medium"
                  type="text"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
      <div className={formRow()}>
        <FormField
          control={control}
          name={register('auditPartnerEmail').name}
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Audit Partner Contact Email
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="bg-unset">
                      <InfoIcon size={14} className="mx-1" />
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>Auditor partner that is assigned to the program</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <Input className={inputRow()} variant="medium" type="email" {...field} value={field.value || ''} />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </>
  )
}
