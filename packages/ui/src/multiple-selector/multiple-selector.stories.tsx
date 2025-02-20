import type { Meta, StoryObj } from '@storybook/react'
import MultipleSelector, { Option } from './multiple-selector'

const OPTIONS: Option[] = [
  { label: 'nextjs', value: 'Nextjs' },
  { label: 'Vite', value: 'vite' },
  { label: 'Nuxt', value: 'nuxt' },
  { label: 'Vue', value: 'vue' },
  { label: 'Remix', value: 'remix' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'Angular', value: 'angular' },
  { label: 'Ember', value: 'ember' },
  { label: 'React', value: 'react' },
  { label: 'Gatsby', value: 'gatsby' },
  { label: 'Astro', value: 'astro' },
]

const meta: Meta<typeof MultipleSelector> = {
  title: 'UI/Multiple Selector',
  component: MultipleSelector,
  parameters: {
    docs: {
      description: {
        component: 'Multiple Selector component',
      },
    },
    backgrounds: { default: 'white' },
  },
  render: (args: any) => {
    return (
      <div className="flex w-full flex-col gap-5 px-10">
        <MultipleSelector
          defaultOptions={OPTIONS}
          placeholder="Select frameworks you like..."
          emptyIndicator={<p className="text-center text-lg leading-10 text-gray-600 dark:text-gray-400">no results found.</p>}
        />
      </div>
    )
  },
} satisfies Meta<typeof MultipleSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  parameters: {},
}
