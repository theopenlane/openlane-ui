import { DnsVerificationDnsVerificationStatus } from '@repo/codegen/src/schema'
import { Button } from '@repo/ui/button'
import { Card, CardContent } from '@repo/ui/cardpanel'
import { Copy } from 'lucide-react'
import React from 'react'

type TDnsRecordsProps = {
  cnameName: string
  dnsVerification?: {
    __typename?: 'DNSVerification'
    dnsVerificationStatus: DnsVerificationDnsVerificationStatus
    dnsTxtRecord: string
    dnsTxtValue: string
  } | null
}

export const DnsRecords: React.FC<TDnsRecordsProps> = ({ cnameName, dnsVerification }: TDnsRecordsProps) => {
  const cnameValue = 'cname.theopenlane-dns.io'

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cnameValue)
  }
  return (
    <>
      <Card>
        <CardContent>
          <p className="text-base font-medium leading-6">Add a CNAME record</p>
          <div className="grid grid-cols-2 text-sm font-normal leading-5 mt-6">
            <div>
              <ol className="list-decimal list-inside space-y-5">
                <li>Go to your domain&apos;s DNS records.</li>

                <li>Add a new record, selecting &quot;CNAME&quot; as the type.</li>

                <li>
                  <span>In the &quot;Host&quot; or &quot;Name&quot; field, enter</span>

                  <div className="mt-2 ml-6 bg-secondary flex items-center justify-between px-3 py-2 border rounded-md w-fit min-w-[320px]">
                    <span className="font-normal text-inverted-muted-foreground text-sm">{cnameName}</span>

                    <Button variant="secondary" onClick={() => navigator.clipboard.writeText(cnameName)} className="rounded-md hover:bg-muted transition" type="button">
                      <Copy size={16} />
                    </Button>
                  </div>
                </li>

                <li>
                  <span>In the &quot;Value&quot; field, enter</span>

                  <div className="mt-2 ml-6 bg-secondary flex items-center justify-between px-3 py-2 border rounded-md w-fit min-w-[320px]">
                    <span className="font-normal text-inverted-muted-foreground text-sm">{cnameValue}</span>

                    <Button variant="secondary" onClick={handleCopy} className="rounded-md hover:bg-muted transition" type="button">
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

                  <div className="mt-2 ml-6 bg-secondary flex items-center justify-between px-3 py-2 border rounded-md w-fit min-w-[320px]">
                    <span className="font-normal text-inverted-muted-foreground text-sm">{dnsVerification?.dnsTxtRecord}</span>

                    <Button variant="secondary" onClick={() => navigator.clipboard.writeText(dnsVerification?.dnsTxtRecord ?? '')} className="rounded-md hover:bg-muted transition" type="button">
                      <Copy size={16} />
                    </Button>
                  </div>
                </li>

                <li>
                  <span>In the &quot;Value&quot; field, enter</span>

                  <div className="mt-2 ml-6 bg-secondary flex items-center justify-between px-3 py-2 border rounded-md w-fit min-w-[320px]">
                    <span className="font-normal text-inverted-muted-foreground text-sm">{dnsVerification?.dnsTxtRecord}</span>
                    <Button variant="secondary" onClick={() => navigator.clipboard.writeText(dnsVerification?.dnsTxtRecord ?? '')} className="rounded-md hover:bg-muted transition" type="button">
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
