import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { Input } from '@repo/ui/input'
import { Info } from 'lucide-react'
import { useState } from 'react'

type Evidence = {
  id: string
  name: string
  date: string
}

const dummyData: Evidence[] = Array(4).fill({
  id: 'E123',
  name: 'Evidence lorem ipsum sit amet',
  date: 'Jan 16, 2025',
})

export function SetObjectAssociationDialog() {
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const toggleSelect = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-8 !px-2">Set Association</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl p-6">
        <DialogHeader>
          <DialogTitle>Set object association</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="mb-4 space-y-1">
          <label className="text-sm font-medium flex items-center gap-1">
            Search <Info className="w-4 h-4 text-muted-foreground" />
          </label>
          <Input placeholder="Type ID or name …" className="bg-background border-brand focus-visible:ring-0 focus-visible:ring-offset-0" />
        </div>

        {/* Table */}
        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_140px] items-center px-4 py-2 text-sm text-muted-foreground font-medium border-b">
            <div>ID</div>
            <div>Name</div>
            <div>Date</div>
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {dummyData.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[60px_1fr_140px] items-center px-4 py-3 text-sm">
                <div>
                  <Checkbox checked={!!selected[idx]} onCheckedChange={() => toggleSelect(String(idx))} />
                </div>
                <div>{item.name}</div>
                <div>{item.date}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <Button>Cancel</Button>
          <Button onClick={() => console.log('Save selected:', selected)}>Save ({selectedCount})</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
