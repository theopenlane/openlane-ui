'use client'

import React, { useState } from 'react'
import { Button } from '@repo/ui/button'
import { Copy, Plus, X } from 'lucide-react'
import { useUpdateEntity } from '@/lib/graphql-hooks/entity'
import { useNotification } from '@/hooks/useNotification'
import { parseErrorMessage } from '@/utils/graphQlErrorMatcher'
import AddDomainDialog from './add-domain-dialog'

interface DomainsSectionProps {
  domains: string[]
  vendorId: string
  canEdit: boolean
}

const DomainsSection: React.FC<DomainsSectionProps> = ({ domains, vendorId, canEdit }) => {
  const [showAddDialog, setShowAddDialog] = useState(false)
  const updateEntityMutation = useUpdateEntity()
  const { successNotification, errorNotification } = useNotification()

  const handleRemoveDomain = async (domainToRemove: string) => {
    try {
      await updateEntityMutation.mutateAsync({
        updateEntityId: vendorId,
        input: {
          domains: domains.filter((d) => d !== domainToRemove),
        },
      })
      successNotification({
        title: 'Domain removed',
        description: `${domainToRemove} has been removed.`,
      })
    } catch (error) {
      const errorMessage = parseErrorMessage(error)
      errorNotification({
        title: 'Error',
        description: errorMessage,
      })
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Domains</h3>
        {canEdit && (
          <Button type="button" variant="secondary" icon={<Plus size={16} strokeWidth={2} />} iconPosition="left" onClick={() => setShowAddDialog(true)}>
            Add Domain
          </Button>
        )}
      </div>
      {domains.length > 0 ? (
        <div className="space-y-3">
          {domains.map((domain) => (
            <div key={domain} className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm">
              {domain}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigator.clipboard.writeText(domain)
                    successNotification({ title: 'Copied', description: `"${domain}" copied to clipboard.` })
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Copy size={13} />
                </button>
                {canEdit && (
                  <button type="button" onClick={() => handleRemoveDomain(domain)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No domains configured</p>
      )}
      {showAddDialog && <AddDomainDialog vendorId={vendorId} existingDomains={domains} onClose={() => setShowAddDialog(false)} />}
    </div>
  )
}

export default DomainsSection
