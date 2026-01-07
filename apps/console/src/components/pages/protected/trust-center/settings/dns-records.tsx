import { DnsVerificationDnsVerificationStatus } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Check, Copy } from 'lucide-react'
import React from 'react'

type TDnsRecordsProps = {
  cnameName: string
  dnsVerification?: {
    __typename?: 'DNSVerification'
    dnsVerificationStatus: DnsVerificationDnsVerificationStatus
    dnsTxtRecord: string
    dnsTxtValue: string
  } | null
  onVerify?: () => void
}

export const DnsRecords: React.FC<TDnsRecordsProps> = ({ cnameName, dnsVerification, onVerify }: TDnsRecordsProps) => {
  const cnameValue = process.env.NEXT_PUBLIC_CUSTOMDOMAIN_CNAME || ''
  const handleCopy = async () => {
    await navigator.clipboard.writeText(cnameValue)
  }

  return (
    <>
      <Card>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-base font-medium leading-6">Add a CNAME record</p>
            {dnsVerification && dnsVerification.dnsVerificationStatus === DnsVerificationDnsVerificationStatus.PENDING && (
              <>
                <div className="flex items-center gap-2">
                  <div className="flex items-center rounded-3xl h-6 px-3 border border-[#FF842C3D] bg-[#FF842C14] text-warning">Pending</div>
                  <Button variant="secondary" className="h-10 flex items-center justify-center gap-2 px-4" icon={<Check size={16} />} onClick={onVerify} iconPosition="left">
                    Verify
                  </Button>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 text-sm font-normal leading-5 mt-6">
            <div>
              <ol className="list-decimal list-inside space-y-5">
                <li>Go to your domain&apos;s DNS records.</li>
                <li>Add a new record, selecting &quot;CNAME&quot; as the type.</li>
                <li>
                  <span>In the &quot;Host&quot; or &quot;Name&quot; field, enter</span>
                  <div className="mt-2 flex items-stretch gap-2">
                    <div className="bg-secondary flex-1 flex items-center px-4 py-3 border rounded-md min-w-[280px] h-9">
                      <span className="font-normal text-inverted-muted-foreground text-sm">{cnameName}</span>
                    </div>
                    <Button variant="secondary" onClick={() => navigator.clipboard.writeText(cnameName)} className="rounded-md hover:bg-muted transition h-9 px-3" type="button">
                      <Copy size={16} />
                    </Button>
                  </div>
                </li>
                <li>
                  <span>In the &quot;Value&quot; field, enter</span>
                  <div className="mt-2 flex items-stretch gap-2">
                    <div className="bg-secondary flex-1 flex items-center px-4 py-3 border rounded-md min-w-[280px] h-9">
                      <span className="font-normal text-inverted-muted-foreground text-sm">{cnameValue}</span>
                    </div>
                    <Button variant="secondary" onClick={handleCopy} className="rounded-md hover:bg-muted transition h-9 px-3" type="button">
                      <Copy size={16} />
                    </Button>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <p className="text-base font-medium leading-6">Add a TXT record</p>
          <div className="grid grid-cols-2 text-sm font-normal leading-5 mt-6">
            <div>
              <ol className="list-decimal list-inside space-y-5">
                <li>Go to your domain&apos;s DNS records.</li>
                <li>Add a new record, selecting &quot;TXT&quot; as the type.</li>
                <li>
                  <span>In the &quot;Host&quot; or &quot;Name&quot; field, enter</span>
                  <div className="mt-2 flex items-stretch gap-2">
                    <div className="bg-secondary flex-1 flex items-center px-4 py-3 border rounded-md min-w-[280px] h-9">
                      <span className="font-normal text-inverted-muted-foreground text-sm">{dnsVerification?.dnsTxtRecord}</span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => navigator.clipboard.writeText(dnsVerification?.dnsTxtRecord ?? '')}
                      className="rounded-md hover:bg-muted transition h-9 px-3"
                      type="button"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </li>
                <li>
                  <span>In the &quot;Value&quot; field, enter</span>
                  <div className="mt-2 flex items-stretch gap-2">
                    <div className="bg-secondary flex-1 flex items-center px-4 py-3 border rounded-md min-w-[280px] h-9">
                      <span className="font-normal text-inverted-muted-foreground text-sm">{dnsVerification?.dnsTxtValue}</span>
                    </div>
                    <Button
                      variant="secondary"
                      onClick={() => navigator.clipboard.writeText(dnsVerification?.dnsTxtValue ?? '')}
                      className="rounded-md hover:bg-muted transition h-9 px-3"
                      type="button"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
