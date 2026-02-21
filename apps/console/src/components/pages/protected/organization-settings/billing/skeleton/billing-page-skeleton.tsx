'use client'
import React from 'react'
import Skeleton from '@/components/shared/skeleton/skeleton'
import { Card } from '@repo/ui/cardpanel'

const ProductCardSkeleton = () => (
  <Card className="bg-transparent p-4">
    <div className="flex gap-2 w-full">
      <Skeleton width={16} height={16} className="mt-2 rounded" />
      <div className="flex-1">
        <div className="flex justify-between w-full">
          <Skeleton width={140} height={18} />
          <div className="flex gap-5 items-center">
            <Skeleton width={80} height={16} />
            <Skeleton width={90} height={32} className="rounded-md" />
          </div>
        </div>
        <Skeleton width="60%" height={12} className="mt-2" />
        <Skeleton width={100} height={12} className="mt-2" />
      </div>
    </div>
  </Card>
)

const InvoiceRowSkeleton = () => (
  <div className="flex items-center justify-between py-4 px-6 border-b first:border-none">
    <div className="flex flex-col gap-1">
      <Skeleton width={160} height={14} />
      <Skeleton width={80} height={10} />
    </div>
    <div className="flex items-center gap-6">
      <Skeleton width={60} height={14} />
      <Skeleton width={40} height={14} />
      <Skeleton width={16} height={16} className="rounded" />
    </div>
  </div>
)

const BillingPageSkeleton: React.FC = () => {
  return (
    <div className="flex relative">
      {/* Side navigation skeleton */}
      <div className="w-10" />

      <div className="max-w-[1000px] ml-14 w-full">
        {/* Summary section */}
        <Skeleton width={100} height={24} className="mb-2" />
        <div className="border rounded-lg">
          <div className="flex gap-2.5 items-center justify-between p-4 pt-5 border-b">
            <div className="flex gap-2 items-center">
              <Skeleton width={220} height={16} />
              <Skeleton width={60} height={22} className="rounded-full" />
            </div>
            <Skeleton width={180} height={14} />
          </div>
          <div className="flex gap-2 items-center p-4 pt-5 border-b">
            <Skeleton width={70} height={14} />
            <div className="flex gap-2">
              <Skeleton width={80} height={22} className="rounded-full" />
              <Skeleton width={90} height={22} className="rounded-full" />
            </div>
          </div>
          <div className="flex gap-2 items-center p-4 pt-5 border-b">
            <Skeleton width={70} height={14} />
            <Skeleton width={60} height={22} className="rounded-full" />
          </div>
          <div className="flex gap-3 items-center p-4 pt-5">
            <Skeleton width={100} height={14} />
            <Skeleton width={180} height={30} className="rounded-lg" />
          </div>
        </div>

        {/* Modules section */}
        <Skeleton width={80} height={24} className="mt-8 mb-4" />
        <div className="flex flex-col w-full gap-0">
          <ProductCardSkeleton />
          <ProductCardSkeleton />
        </div>

        {/* Add-ons section */}
        <Skeleton width={80} height={24} className="mt-8 mb-4" />
        <div className="flex flex-col w-full">
          <ProductCardSkeleton />
        </div>

        {/* Billing Settings section */}
        <Skeleton width={130} height={24} className="mt-8 mb-4" />
        <div className="border-y py-4">
          <div className="flex justify-between w-full">
            <Skeleton width={60} height={16} />
            <div className="flex-1 ml-8">
              <Skeleton width="80%" height={12} />
              <Skeleton width={200} height={14} className="mt-2" />
            </div>
            <Skeleton width={60} height={32} className="rounded-md" />
          </div>
        </div>
        <div className="py-4">
          <div className="flex justify-between w-full">
            <Skeleton width={50} height={16} />
            <div className="flex-1 ml-8">
              <Skeleton width="80%" height={12} />
              <Skeleton width={180} height={14} className="mt-2" />
            </div>
            <Skeleton width={60} height={32} className="rounded-md" />
          </div>
        </div>

        {/* Payment Method section */}
        <Skeleton width={140} height={24} className="mt-8 mb-4" />
        <Card className="bg-transparent p-4 flex size-fit gap-4">
          <div className="flex gap-5 items-center">
            <Skeleton width={16} height={16} className="rounded" />
            <div className="flex-col gap-1">
              <Skeleton width={200} height={14} />
              <Skeleton width={100} height={12} className="mt-1" />
            </div>
          </div>
          <Skeleton width={80} height={32} className="rounded-md" />
        </Card>

        {/* Recent Invoices section */}
        <div className="mt-10">
          <div className="flex justify-between items-center mb-4">
            <Skeleton width={140} height={24} />
            <Skeleton width={120} height={32} className="rounded-md" />
          </div>
          <Card>
            <InvoiceRowSkeleton />
            <InvoiceRowSkeleton />
            <InvoiceRowSkeleton />
          </Card>
        </div>
      </div>
    </div>
  )
}

export default BillingPageSkeleton
export { ProductCardSkeleton, InvoiceRowSkeleton }
