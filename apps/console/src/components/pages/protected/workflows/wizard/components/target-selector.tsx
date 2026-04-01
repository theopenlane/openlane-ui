import { useMemo, useState } from 'react'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Badge } from '@repo/ui/badge'
import { Label } from '@repo/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Plus, X } from 'lucide-react'
import type { Target, TargetSelectorProps } from '../types'
import { buildTargetKey, formatResolverLabel } from '../utils'

const RECIPIENT_BADGE_CLASSES = [
  'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
  'border-sky-500/30 bg-sky-500/10 text-sky-700',
  'border-amber-500/30 bg-amber-500/10 text-amber-700',
  'border-rose-500/30 bg-rose-500/10 text-rose-700',
  'border-violet-500/30 bg-violet-500/10 text-violet-700',
  'border-teal-500/30 bg-teal-500/10 text-teal-700',
  'border-orange-500/30 bg-orange-500/10 text-orange-700',
  'border-lime-500/30 bg-lime-500/10 text-lime-700',
  'border-cyan-500/30 bg-cyan-500/10 text-cyan-700',
  'border-fuchsia-500/30 bg-fuchsia-500/10 text-fuchsia-700',
]

export const TargetSelector = ({ targets, onAdd, onRemove, resolverKeys, userOptions, groupOptions, getTargetLabel, isLoading = false }: TargetSelectorProps) => {
  const [targetType, setTargetType] = useState<Target['type']>('USER')
  const [targetValue, setTargetValue] = useState('')

  const options = useMemo(() => {
    if (targetType === 'USER') return userOptions
    if (targetType === 'GROUP') return groupOptions
    return resolverKeys.map((key) => ({ label: formatResolverLabel(key), value: key }))
  }, [groupOptions, resolverKeys, targetType, userOptions])

  const showManualInput = options.length === 0
  const manualPlaceholder = targetType === 'USER' ? 'Paste a user ID' : targetType === 'GROUP' ? 'Paste a group ID' : 'Enter resolver key'

  const handleTargetTypeChange = (value: string) => {
    setTargetType(value as Target['type'])
    setTargetValue('')
  }

  const handleAdd = () => {
    if (!targetValue) return
    if (targetType === 'RESOLVER') {
      onAdd({ type: 'RESOLVER', resolver_key: targetValue })
    } else {
      onAdd({ type: targetType, id: targetValue })
    }
    setTargetValue('')
  }

  const handleSelectTarget = (value: string) => {
    setTargetValue(value)
    if (!value) return
    if (targetType === 'RESOLVER') {
      onAdd({ type: 'RESOLVER', resolver_key: value })
    } else {
      onAdd({ type: targetType, id: value })
    }
    setTargetValue('')
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-muted/10 p-4">
        <div className="mb-3">
          <p className="text-sm font-medium">Add a recipient</p>
          <p className="text-xs text-muted-foreground">Select a target type, then pick a recipient to add it.</p>
        </div>

        {resolverKeys.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground">Suggested resolvers</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {resolverKeys.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onAdd({ type: 'RESOLVER', resolver_key: key })}
                  className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-foreground hover:border-primary/60"
                >
                  {formatResolverLabel(key)}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(220px,1fr)_auto] gap-3 items-end">
          <Select value={targetType} onValueChange={handleTargetTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Target type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="GROUP">Group</SelectItem>
              <SelectItem value="RESOLVER">Resolver</SelectItem>
            </SelectContent>
          </Select>

          {showManualInput ? (
            <Input value={targetValue} onChange={(e) => setTargetValue(e.target.value)} placeholder={manualPlaceholder} />
          ) : (
            <Select value={targetValue} onValueChange={handleSelectTarget}>
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? 'Loading...' : 'Select target'} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button type="button" variant="primary" onClick={handleAdd} disabled={!targetValue} className="whitespace-nowrap">
            <Plus className="h-4 w-4 mr-1" />
            Add recipient
          </Button>
        </div>

        {showManualInput && (
          <p className="mt-2 text-xs text-muted-foreground">No {targetType === 'USER' ? 'users' : targetType === 'GROUP' ? 'groups' : 'resolvers'} found. Paste an ID or switch the target type.</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Selected recipients</Label>
          <span className="text-xs text-muted-foreground">{targets.length} added</span>
        </div>
        {targets.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {targets.map((target, index) => (
              <Badge key={buildTargetKey(target)} variant="outline" className={`flex items-center gap-1 px-2.5 py-1 text-sm ${RECIPIENT_BADGE_CLASSES[index % RECIPIENT_BADGE_CLASSES.length]}`}>
                {getTargetLabel(target)}
                <button type="button" onClick={() => onRemove(target)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No recipients yet. Add one above to continue.</p>
        )}
      </div>
    </div>
  )
}
