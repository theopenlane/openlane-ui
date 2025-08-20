import { ButtonSkeleton } from '@/components/shared/skeleton/button-skeleton'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { TitleSkeleton } from '@/components/shared/skeleton/title-skeleton'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardTitle } from '@repo/ui/cardpanel'
import { Tabs, TabsList, TabsTrigger } from '@repo/ui/tabs'

export const EvidenceDetailsSheetSkeleton = () => {
  return (
    <div className="flex flex-col mt-2 gap-2">
      <div className="flex flex-col mb-1">
        <TitleSkeleton />
      </div>
      <Skeleton height={50} width={500} />
      <Skeleton height={50} width={200} />
      <Skeleton height={50} width={200} />
      <div className="flex gap-7">
        <ButtonSkeleton />
        <ButtonSkeleton />
      </div>
      <div className="flex w-full">
        <Card className="p-8 w-full">
          <div className="flex flex-col gap-3 p-5">
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
          </div>
        </Card>
        <Card className="p-8 w-full">
          <div className="flex flex-col gap-3 p-5">
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
            <div className="flex gap-2">
              <Skeleton height={10} width="50%" />
              <Skeleton height={10} width="50%" />
            </div>
          </div>
        </Card>
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
              <Button variant="outline" className="mt-2">
                <Skeleton width={100} height={10} />
              </Button>
            </div>
          </CardContent>
        </div>
      </Card>
    </div>
  )
}
