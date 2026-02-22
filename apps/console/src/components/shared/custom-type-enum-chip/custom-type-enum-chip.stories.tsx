import type { Meta, StoryObj } from '@storybook/react-vite'
import type { CustomTypeEnumOption } from '@/lib/graphql-hooks/custom-type-enum'
import { CustomTypeEnumOptionChip, CustomTypeEnumValue } from './custom-type-enum-chip'

const mockOptions: CustomTypeEnumOption[] = [
  { label: 'Critical', value: 'critical', color: '#ef4444' },
  { label: 'High', value: 'high', color: '#f97316' },
  { label: 'Medium', value: 'medium', color: '#eab308' },
  { label: 'Low', value: 'low', color: '#22c55e' },
  { label: 'Info', value: 'info' },
]

const meta: Meta<typeof CustomTypeEnumOptionChip> = {
  title: 'Display/CustomTypeEnumChip',
  component: CustomTypeEnumOptionChip,
  parameters: {
    docs: {
      description: {
        component: 'Renders a colored dot badge for a custom enum option. Falls back to plain text when no color is set. CustomTypeEnumValue resolves a value string to the matching option chip.',
      },
    },
  },
} satisfies Meta<typeof CustomTypeEnumOptionChip>

export default meta

type Story = StoryObj<typeof meta>

export const WithColor: Story = {
  args: {
    option: mockOptions[0],
  },
}

export const NoColor: Story = {
  args: {
    option: mockOptions[4],
  },
}

export const AllOptions = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {mockOptions.map((option) => (
        <CustomTypeEnumOptionChip key={option.value} option={option} />
      ))}
    </div>
  ),
}

export const ValueResolved = {
  name: 'CustomTypeEnumValue (resolved)',
  render: () => <CustomTypeEnumValue value="high" options={mockOptions} />,
}

export const ValueMissing = {
  name: 'CustomTypeEnumValue (unresolved)',
  render: () => <CustomTypeEnumValue value="unknown" options={mockOptions} placeholder="Not set" />,
}
