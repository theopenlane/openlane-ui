'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { Grid, GridRow, GridCell } from '@repo/ui/grid'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { PageHeading } from '@repo/ui/page-heading'
import { ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProgramCreate } from '@/components/pages/protected/program/program-create'


const DashboardLanding: React.FC = () => {
  const session = useSession()
  const { push } = useRouter()

  return (
    <section>
      <PageHeading heading={<>Dashboard</>} />
      <Grid rows={2}>
        <GridRow columns={2}>
          <GridCell>
            <Panel
              align="center"
              justify="center"
              textAlign="center"
              className="min-h-[400px]"
            >
              <PanelHeader heading="Create a new program"
                subheading="Start your compliance journey by creating a new program."
              />
              <ProgramCreate />
            </Panel>
          </GridCell>
          <GridCell>
            <Panel
              align="center"
              justify="center"
              textAlign="center"
              className="min-h-[400px]"
            >
              <PanelHeader heading="Configure your organization"
                subheading="Define everything from your organization slug to advanced
                authentication settings."
              />
              <Button
                onClick={() => {
                  push('/organization-settings/general-settings')
                }}
                icon={<ArrowUpRight />}
                size="md"
                iconAnimated
              >
                Organization Settings
              </Button>
            </Panel>
          </GridCell>
        </GridRow>
        <GridRow columns={1}>
          <GridCell>
            <Panel
              align="center"
              justify="center"
              textAlign="center"
              className="min-h-[400px]"
            >
              <PanelHeader heading="Add team members"
                subheading="Get your team rocking and rolling by inviting your colleagues to
                join the party."
              />
              <Button
                onClick={() => {
                  push('/organization-settings/members')
                }}
                icon={<ArrowUpRight />}
                size="md"
                iconAnimated
              >
                Team Management
              </Button>
            </Panel>
          </GridCell>
        </GridRow>
      </Grid>
    </section>
  )
}

export default DashboardLanding
