import { Card } from '@repo/ui/cardpanel'
import Skeleton from '@/components/shared/skeleton/skeleton'

const IntegrationDefinitionSkeleton = () => {
  return (
    <div>
      {/* Back link */}
      <Skeleton height={14} width={110} className="mb-6 rounded" />

      {/* Header */}
      <Card className="mb-8 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <Skeleton height={10} width={90} className="rounded" />
            <div className="flex items-center gap-3">
              <Skeleton height={40} width={40} />
              <Skeleton height={26} width={220} className="rounded" />
            </div>
            <Skeleton height={12} width={360} className="rounded" />
            <Skeleton height={10} width={120} className="rounded" />
          </div>
          <Skeleton height={22} width={70} className="shrink-0" />
        </div>
      </Card>

      {/* Installed instances */}
      <section className="mb-8 flex flex-col gap-3">
        <Skeleton height={14} width={160} className="rounded" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton height={120} />
          <Skeleton height={120} />
        </div>
      </section>

      {/* Connection section */}
      <Card className="mb-8 p-6 flex flex-col gap-4">
        <Skeleton height={20} width="40%" className="rounded" />
        <Skeleton height={44} />
        <Skeleton height={44} />
        <div className="flex justify-end">
          <Skeleton height={36} width={140} />
        </div>
      </Card>

      {/* Operations table */}
      <div className="flex flex-col gap-3">
        <Skeleton height={16} width={140} className="rounded" />
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="flex gap-4">
            <Skeleton height={16} width="30%" className="rounded" />
            <Skeleton height={16} width="50%" className="rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default IntegrationDefinitionSkeleton
