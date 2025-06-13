'use client'
import React, { Fragment, useState } from 'react'

import { Input } from '@repo/ui/input'
import { Textarea } from '@repo/ui/textarea'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/cardpanel'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select'
import { Badge } from '@repo/ui/badge'
import { ChevronDown } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@radix-ui/react-accordion'
import Drag from '@/assets/Drag'

const frameworks = ['ISO 27001', 'NIST 800-53', 'NIST CSF', 'SOC 2']
const categories = ['Security', 'Privacy', 'Risk']

const SectionTrigger = ({ label, count }: { label: string; count: number }) => (
  <AccordionTrigger asChild>
    <button className="group flex items-center py-2 text-left gap-3 w-full">
      <div className="flex items-center gap-2">
        <ChevronDown size={22} className=" text-primary transform rotate-[-90deg] transition-transform group-data-[state=open]:rotate-0 text-brand" />
        <span className="text-base font-medium">{label}</span>
      </div>
      <span className="rounded-full border border-border text-xs text-muted-foreground flex justify-center items-center h-[26px] w-[26px]">{count}</span>
    </button>
  </AccordionTrigger>
)

const Page: React.FC = () => {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Map Controls</h1>
        <p className="text-muted-foreground mt-1">
          Define how controls relate across frameworks or custom sets—whether they’re equivalent, overlapping, or one is a subset of another. Use these mappings to reduce duplication, surface gaps,
          and create a unified view of your compliance posture.
        </p>
      </div>

      <div className="grid grid-cols-[2fr_1fr] gap-6">
        {/* Left Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="p-0">From</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-[2fr_325px] gap-x-8">
            {/* Form grid */}
            <div>
              <div className="grid grid-cols-[150px_1fr] gap-x-4 gap-y-2 items-center mb-4">
                <label className="text-sm font-medium">Framework</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {frameworks.map((fw) => (
                      <SelectItem key={fw} value={fw.toLowerCase()}>
                        {fw}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="text-sm font-medium">Category</label>
                <Select>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Security" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat.toLowerCase()}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <label className="text-sm font-medium">Keyword</label>
                <Input />
              </div>
              <div>
                {' '}
                <div className="flex items-center justify-between mb-2">
                  <span className=" font-medium">Matched controls</span>
                </div>
                {frameworks.map((fw) => {
                  const count = Math.floor(Math.random() * 5) + 1
                  return (
                    <Accordion key={fw} type="single" collapsible className="w-full">
                      <AccordionItem value={fw}>
                        <SectionTrigger label={fw} count={count} />
                        <AccordionContent className="my-3 flex flex-wrap gap-2">
                          {[`${fw} • A.8.2.1`, 'SOC 2 • CC2.3', 'SOC 2 • CC1.1'].map((item) => (
                            <Badge key={item} variant="outline" className="bg-background-secondary cursor-grab flex gap-1" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', item)}>
                              <Drag strokeWidth={1} className="text-border" />
                              {item}
                            </Badge>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  )
                })}
              </div>
            </div>
            {/* Dropzone */}
            <div
              className="border-2 border-dashed border-muted rounded-lg h-80 flex items-center justify-center text-muted-foreground"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                const data = e.dataTransfer.getData('text/plain')
                alert(`Dropped: ${data}`)
              }}
            >
              Drag controls here
            </div>
          </CardContent>
        </Card>

        {/* Right Panel */}
        <div className="flex flex-col space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium">Relation type</label>
            <Select>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Intersection" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="intersection">Intersection</SelectItem>
                <SelectItem value="equivalent">Equivalent</SelectItem>
                <SelectItem value="subset">Subset</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Confidence (0-100%)</label>
            <div className="flex items-center space-x-4">
              <Slider />
            </div>
            <p className="text-blue-500 cursor-pointer">Clear</p>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">Relation</label>
            <Textarea placeholder="Add description..." rows={4} />
          </div>

          <div className="flex justify-end space-x-2">
            <Button>Set</Button>
            <Button variant="back">Cancel</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Page

const Slider = ({ onChange }: { onChange?: (value: number) => void }) => {
  const [score, setScore] = useState(0)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    setScore(val)
    onChange?.(val)
  }

  return (
    <div className="w-full flex items-center gap-4">
      <input type="range" min={0} max={100} value={score} onChange={handleChange} className="accent-brand w-full h-2 bg-input-slider rounded-lg appearance-none cursor-pointer" />
      <span className="text-sm w-8 text-right">{score}</span>
    </div>
  )
}
