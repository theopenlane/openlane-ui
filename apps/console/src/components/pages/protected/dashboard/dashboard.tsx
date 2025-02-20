'use client'

import React from 'react'
import { Grid, GridRow, GridCell } from '@repo/ui/grid'
import { Panel, PanelHeader } from '@repo/ui/panel'
import { Button } from '@repo/ui/button'
import { PageHeading } from '@repo/ui/page-heading'
import { ArrowUpRight, CalendarClock } from 'lucide-react'
import { ProgramCreate } from '@/components/pages/protected/program/program-create'
import { ProgressCircle } from '@repo/ui/progress-circle'
import { Separator } from '@repo/ui/separator'
import { LineChartExample } from '@repo/ui/line-chart-example'
import Link from 'next/link'
import { pageStyles } from './page.style'
import { NavigateOptions } from 'next/dist/shared/lib/app-router-context.shared-runtime'

type DashboardProps = {
  programs?: { edges: any[] }
  tasks?: { edges: any[] }
  push: (href: string, options?: NavigateOptions) => void
}

export const DefaultLanding: React.FC<DashboardProps> = ({ programs, tasks }) => {
  const { dataRow, progressPercent, progressLabel, emptyRowInfo } = pageStyles()

  return (
    <section>
      <PageHeading heading={<>Dashboard</>} />
      <Grid rows={1}>
        <GridRow columns={4}>
          <GridCell className="col-span-2">
            <Panel align="center" justify="start" textAlign="center" className="min-h-[100px] h-full p-6">
              <PanelHeader heading="Active Programs" noBorder />
              {programs && programs.edges?.length > 0 ? (
                programs.edges.slice(0, 2).map((program, i) => (
                  <>
                    <Link href={`/programs//programs/${program.node.id}`} key={program.node.id} className="text-lg font-medium text-gray-900 dark:text-gray-50">
                      {program.node.name}
                    </Link>
                    {/* TODO (sfunk): This are just stubbed progress bars; Update them with data */}
                    <div className={dataRow()}>
                      <div className={dataRow()}>
                        <ProgressCircle variant="default" value={88}>
                          <span className={progressPercent()}>88%</span>
                        </ProgressCircle>
                        <div>
                          <p className={progressPercent()}>70/80</p>
                          <p className={progressLabel()}>Control's Completed</p>
                        </div>
                      </div>
                      <div className={dataRow()}>
                        <ProgressCircle variant="warning" value={29}>
                          <span className={progressPercent()}>29%</span>
                        </ProgressCircle>
                        <div>
                          <p className={progressPercent()}>23/80</p>
                          <p className={progressLabel()}>Tasks Completed</p>
                        </div>
                      </div>
                    </div>
                    {programs.edges.length > 1 && i == 0 ? <Separator /> : null}
                  </>
                ))
              ) : (
                <div className={emptyRowInfo()}>No active programs</div>
              )}
            </Panel>
          </GridCell>
          <GridCell>
            <Panel align="center" justify="start" textAlign="center" className="min-h-[100px] h-full  p-6">
              <PanelHeader heading="Tasks Due Soon" noBorder />
              {tasks && tasks.edges?.length > 0 ? (
                tasks.edges?.map((task) => (
                  <div className="flex">
                    <CalendarClock className="text-red-500 mr-5" />
                    {task?.node?.title}
                  </div>
                ))
              ) : (
                <div className={emptyRowInfo()}>No tasks Assigned</div>
              )}
            </Panel>
          </GridCell>
          <GridCell>
            <Panel align="center" justify="start" textAlign="center" className="min-h-[100px] h-full p-6 flex">
              <PanelHeader heading="Create a new program" subheading="Get ready for your next audit, create a new program or duplicate an existing one." noBorder />
              <div className="flex content-end items-end">
                <ProgramCreate />
              </div>
            </Panel>
          </GridCell>
        </GridRow>
        <GridRow columns={1}>
          <GridCell>
            <Panel align="stretch" justify="start" textAlign="center" className="min-h-[100px]">
              <PanelHeader heading="Program Progress" noBorder />
              {/* TODO (sfunk): This is a line chart example placeholder right now */}
              <LineChartExample />
            </Panel>
          </GridCell>
        </GridRow>
      </Grid>
    </section>
  )
}

export const NewUserLanding: React.FC<DashboardProps> = ({ push }) => {
  return (
    <section>
      <PageHeading heading={<>Dashboard</>} />
      <Grid rows={2}>
        <GridRow columns={2}>
          <GridCell>
            <Panel align="center" justify="center" textAlign="center" className="min-h-[300px]">
              <PanelHeader heading="Create a new program" subheading="Start your compliance journey by creating a new program." />
              <ProgramCreate />
            </Panel>
          </GridCell>
          <GridCell>
            <Panel align="center" justify="center" textAlign="center" className="min-h-[300px]">
              <PanelHeader
                heading="Configure your organization"
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
            <Panel align="center" justify="center" textAlign="center" className="min-h-[300px]">
              <PanelHeader
                heading="Add team members"
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
