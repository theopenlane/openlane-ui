import Skeleton from '@/components/shared/skeleton/skeleton'
export const ObjectWithDetailsSkeleton = () => (
  <>
    <div className="fixed flex items-start space-x-2 z-30 h-full p-4" style={{ width: 'calc(100% - 700px)' }}>
      <div className="flex flex-col gap-8 w-full">
        <Skeleton height={30} width={100} />
        <Skeleton height={10} width="40%" />
        <div className="flex gap-4 w-full">
          <Skeleton height={10} width={50} />
        </div>
        <Skeleton height={100} width="60%" />
        <div className="flex justify-between gap-4 w-full">
          <Skeleton height={10} width={50} />
        </div>
        <Skeleton height={100} width="60%" />
      </div>
    </div>

    <div className="fixed right-0 w-[430px] bottom-0 border-l shadow-xl transition-transform duration-300 z-20 bg-background h-full p-6">
      <div className="flex flex-col gap-4 mt-12">
        <div className="rounded-lg border bg-card shadow-xs p-4 flex flex-col gap-4">
          <div className="flex gap-4">
            <Skeleton height={20} width="50%" />
            <Skeleton height={20} width="50%" />
          </div>
          <Skeleton height={400} />
        </div>
        <div className="rounded-lg border bg-card shadow-xs p-4 flex flex-col gap-4">
          <Skeleton height={30} width="50%" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card shadow-xs p-4 flex flex-col gap-4">
          <Skeleton height={30} width="50%" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card shadow-xs p-4 flex flex-col gap-4">
          <Skeleton height={30} width="50%" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card shadow-xs p-4 flex flex-col gap-4">
          <Skeleton height={30} width="50%" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
          </div>
        </div>
        <div className="rounded-lg border bg-card shadow-xs p-4 flex flex-col gap-4">
          <Skeleton height={30} width="50%" />
          <div className="flex flex-col gap-2">
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
            <div className="flex gap-4">
              <Skeleton height={20} width="50%" />
              <Skeleton height={20} width="50%" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </>
)
