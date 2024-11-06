'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { Grid, GridRow, GridCell } from '@repo/ui/grid'
import { Panel } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { PageHeading } from '@repo/ui/page-heading'
import { ArrowUpRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

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
              <h5 className="text-xl font-sans">Create a new program</h5>
              <p className="max-w-[340px]">
                Start your compliance journey by creating a new program.
              </p>
              <Button
                onClick={() => {
                  alert('Coming soon')
                }}
                icon={<ArrowUpRight />}
                size="md"
                iconAnimated
              >
                Programs
              </Button>
            </Panel>
          </GridCell>
          <GridCell>
            <Panel
              align="center"
              justify="center"
              textAlign="center"
              className="min-h-[400px]"
            >
              <h5 className="text-xl font-sans">Configure your organization</h5>
              <p className="max-w-[340px]">
                Define everything from your organization slug to advanced
                authentication settings.
              </p>
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
              <h5 className="text-xl font-sans">Add team members</h5>
              <p className="max-w-[340px]">
                Get your team rocking and rolling by inviting your colleagues to
                join the party.
              </p>
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
