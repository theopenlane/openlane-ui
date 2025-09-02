'use client'

import { DataTable } from '@repo/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@repo/ui/button'
import { Copy, Download } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@repo/ui/sheet'
import { DnsVerificationDnsVerificationStatus, GetTrustCenterQuery } from '@repo/codegen/src/schema'

type DnsRecord = {
  type: string
  name: string
  value: string
  status: DnsVerificationDnsVerificationStatus | null | undefined
}

const dnsColumns: ColumnDef<DnsRecord>[] = [
  {
    header: 'Type',
    accessorKey: 'type',
  },
  {
    header: 'Name',
    accessorKey: 'name',
    cell: ({ row }) => (
      <div className="flex items-center gap-1">
        <span>{row.original.name}</span>
        <Copy className="cursor-pointer" onClick={() => navigator.clipboard.writeText(row.original.name)} size={14} />
      </div>
    ),
  },
  {
    header: 'Value',
    accessorKey: 'value',
    cell: ({ row }) => (
      <div className="flex items-center gap-1 max-w-[300px] truncate">
        <span>{row.original.value}</span>
        <Copy className="cursor-pointer" onClick={() => navigator.clipboard.writeText(row.original.value)} size={14} />
      </div>
    ),
  },
  {
    header: 'Status',
    accessorKey: 'status',
    cell: ({ row }) => {
      const status = row.original.status === DnsVerificationDnsVerificationStatus.active ? 'Verified' : 'Pending'
      let dotColor = 'bg-gray-400'
      if (row.original.status === DnsVerificationDnsVerificationStatus.active) {
        dotColor = 'bg-green-500'
      } else {
        dotColor = 'bg-yellow-500'
      }

      return (
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
          <span>{status}</span>
        </div>
      )
    },
  },
]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  trustCenter: NonNullable<NonNullable<GetTrustCenterQuery['trustCenters']>['edges']>[number] | undefined
}

export const DnsRecordsSheet = ({ open, onOpenChange, trustCenter }: Props) => {
  const dnsVerification = trustCenter?.node?.customDomain?.dnsVerification

  const cnameRecord = trustCenter?.node?.customDomain?.cnameRecord
  const cnameName = cnameRecord ? cnameRecord.split('.')[0] : ''

  const tableData: DnsRecord[] = [
    {
      type: 'CNAME',
      name: cnameName,
      value: 'cname.theopenlane-dns.io',
      status: dnsVerification?.dnsVerificationStatus,
    },
    ...(dnsVerification
      ? [
          {
            type: 'TXT',
            name: dnsVerification.dnsTxtRecord ?? '',
            value: dnsVerification.dnsTxtValue ?? '',
            status: dnsVerification.dnsVerificationStatus,
          },
        ]
      : []),
  ]

  const handleDownload = () => {
    const lines = tableData.map((r) => `${r.name}\t${r.type}\t${r.value}`)
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'dns-records.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-4xl">
        <SheetHeader className="flex flex-row justify-between items-start">
          <SheetTitle className="text-lg font-semibold">DNS records</SheetTitle>
          <Button icon={<Download />} iconPosition="left" className="h-8 p-2" variant="outline" onClick={handleDownload}>
            Download settings
          </Button>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-10 text-sm text-text-informational mt-6">
          <div>
            <h3 className="font-medium mb-2">CNAME</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Go to your domain&apos;s DNS records.</li>
              <li>Add a new record, selecting &quot;CNAME&quot; as the type.</li>
              <li>
                In the &quot;Host&quot; or &quot;Name&quot; field, enter <span className="font-mono">{cnameName}</span>
              </li>
              <li>
                In the &quot;Value&quot; field, enter <span className="font-mono">cname.theopenlane-dns.io</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-medium mb-2">TXT</h3>
            <ul className="list-disc list-inside space-y-1">
              <li>Go to your domain&apos;s DNS records.</li>
              <li>Add a new record, selecting &quot;TXT&quot; as the type.</li>
              <li>
                In the &quot;Host&quot; or &quot;Name&quot; field, enter <span className="font-mono">{dnsVerification?.dnsTxtRecord}</span>
              </li>
              <li>
                In the &quot;Value&quot; field, enter <span className="font-mono">{dnsVerification?.dnsTxtValue}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Table */}
        <div className="mt-8">
          <DataTable columns={dnsColumns} data={tableData} pagination={undefined} />
        </div>
      </SheetContent>
    </Sheet>
  )
}
