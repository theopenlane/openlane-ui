'use client'
import React from 'react'
import { PageHeading } from '@repo/ui/page-heading'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import Link from 'next/link'
import { statCardStyles } from '@/components/shared/stats-cards/stats-cards-styles.ts'
import { Button } from '@repo/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'

const DashboardSkeleton: React.FC = () => {
  const { wrapper, content, title: titleClass, percentage: percentageClass, statDetails } = statCardStyles({ color: 'green' })

  return (
    <>
      <PageHeading
        heading={
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              <Skeleton width="120" height="30" />
              <Skeleton width="180" height="30" />
            </div>
          </div>
        }
      />

      <div className="flex flex-col gap-7">
        <div className="flex flex-wrap gap-7">
          <Card>
            <CardTitle className="text-lg font-semibold">
              <Skeleton width={100} height={10} />
            </CardTitle>
            <CardContent>
              <div className="grid grid-cols-2 gap-12 mb-7">
                <div className="flex flex-col items-center justify-center py-4 px-8 border rounded-lg relative">
                  <span className="text-sm text-muted-foreground">
                    <Skeleton width={100} height={10} />
                  </span>
                  <span className="text-2xl font-bold pt-2">
                    <Skeleton width={30} height={20} />
                  </span>
                </div>
                <div className="flex flex-col items-center justify-center py-4 px-8 border rounded-lg">
                  <span className="text-sm text-muted-foreground">
                    <Skeleton width={100} height={10} />
                  </span>
                  <span className="text-2xl font-bold pt-2">
                    <Skeleton width={30} height={20} />
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => {
                  return (
                    <Link href="#" key={index} className="grid grid-cols-[130px_1fr] items-center gap-[20px] size-fit">
                      <div className="flex items-center gap-2">
                        <Skeleton width={30} height={10} />
                        <span className="text-sm font-medium">
                          <Skeleton width={100} height={10} />
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton width={20} height={10} />
                        <span className="text-sm font-medium">
                          <Skeleton width={100} height={10} />
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>

              <div className="mt-7 text-sm text-primary flex items-center cursor-pointer">
                <Skeleton width={110} height={10} /> <Skeleton width={10} height={10} className="ml-1" />
              </div>
            </CardContent>
          </Card>
          <Card className=" rounded-lg border flex-1">
            <CardTitle className="text-lg font-semibold">
              <Skeleton width={110} height={10} />
            </CardTitle>
            <CardContent>
              <div className="flex flex-col items-center justify-center text-center">
                <Skeleton width={110} height={50} />
                <h3 className="mt-4 text-lg font-semibold">
                  <Skeleton width={180} height={10} />
                </h3>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  <Skeleton width={500} height={10} />
                </p>
                <Skeleton width={110} height={30} />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="flex gap-8 justify-center">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className={wrapper()}>
              <CardContent className={content()}>
                <h3 className={titleClass()}>
                  <Skeleton width={130} height={10} />
                </h3>

                <div className="flex justify-between items-center"></div>

                <div className={percentageClass()}>
                  <Skeleton width={40} height={30} />
                </div>

                <div className={statDetails()}>
                  <p className="text-base">
                    <Skeleton width={35} height={10} />
                  </p>
                  <p className="text-base">
                    <Skeleton width={100} height={10} />
                  </p>
                </div>

                <div>
                  <Skeleton className="w-full" height={9} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-md rounded-lg flex-1">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center px-6 pt-6">
              <CardTitle className="text-lg font-semibold">
                <Skeleton width={80} height={15} />
              </CardTitle>
              <Skeleton width={50} height={15} className="flex items-center gap-2" />
            </div>

            <Tabs variant="underline" className="px-6">
              <TabsList>
                <TabsTrigger value="created" className="flex justify-center items-center">
                  <Skeleton width={100} height={10} />
                </TabsTrigger>
                <TabsTrigger value="assigned" className="flex justify-center items-center">
                  <Skeleton width={100} height={10} />
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <CardContent>
              <div className="flex flex-col items-center justify-center text-center py-16">
                <Skeleton width={100} height={50} />
                <h2 className="text-lg font-semibold mt-5">
                  <Skeleton width={140} height={10} />
                </h2>
                <Link href="/risks" className="mt-4">
                  <Button variant="outline">
                    <Skeleton width={100} height={10} />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </div>
        </Card>
        <Card className="shadow-md rounded-lg flex-1">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-semibold">
              <Skeleton width={100} height={10} />
            </CardTitle>
            <Skeleton width={100} height={10} className="mr-5" />
          </div>
          <CardContent>
            <div className="flex flex-col items-center justify-center text-center py-16">
              <Skeleton width={100} height={100} />
              <h2 className="text-lg font-semibold mt-4 mb-4">
                <Skeleton width={160} height={10} />
              </h2>
              <Skeleton width={100} height={30} />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}

export default DashboardSkeleton
