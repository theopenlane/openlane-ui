'use client'

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@repo/ui/dialog'
import { Button } from '@repo/ui/button'
import { Checkbox } from '@repo/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { Info, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'

type MappedCategory = {
  id: string
  standard: string
  category: string
  avatars?: { name: string; image?: string }[]
}

const mockData: MappedCategory[] = [
  {
    id: '1',
    standard: 'NIST',
    category: 'Risk Review',
    avatars: [
      { name: 'S', image: '' },
      { name: 'John', image: 'https://i.pravatar.cc/40?img=3' },
    ],
  },
  { id: '2', standard: 'CCM v4', category: 'Lorem' },
  { id: '3', standard: 'GDPR', category: 'Ipsum' },
  { id: '4', standard: 'SOC2', category: 'Sit' },
]

export function SetMappedCategoriesDialog() {
  const [selected, setSelected] = useState<Record<string, boolean>>({})

  const toggleSelect = (id: string) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const selectedCount = Object.values(selected).filter(Boolean).length

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="rounded-full px-6 py-2 text-base font-medium">Set mappings</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl p-6">
        <DialogHeader>
          <DialogTitle>Set mapped categories</DialogTitle>
        </DialogHeader>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium">Standards</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="nist">NIST</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1 w-full">
            <label className="text-sm font-medium flex items-center gap-1">
              Domains <Info className="w-4 h-4 text-muted-foreground" />
            </label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="risk">Risk</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="border rounded-md overflow-hidden">
          <div className="grid grid-cols-[60px_1fr_1fr_100px] items-center px-4 py-2 text-sm text-muted-foreground font-medium border-b">
            <div>Standards</div>
            <div>Category</div>
            <div className="col-span-2" />
          </div>
          <div className="max-h-64 overflow-y-auto divide-y divide-border">
            {mockData.map((item) => (
              <div key={item.id} className="grid grid-cols-[60px_1fr_1fr_100px] items-center px-4 py-3 text-sm">
                <Checkbox checked={!!selected[item.id]} onCheckedChange={() => toggleSelect(item.id)} />
                <div>{item.standard}</div>
                <div>{item.category}</div>
                <div className="flex -space-x-2">
                  {item.avatars?.map((av, idx) => (
                    <Avatar key={idx} className="w-6 h-6 border-2 border-background">
                      {av.image ? <AvatarImage src={av.image} alt={av.name} /> : <AvatarFallback>{av.name}</AvatarFallback>}
                    </Avatar>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-3">
          <Button>Cancel</Button>
          <Button onClick={() => console.log('Selected mappings:', selected)}>Save ({selectedCount})</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
