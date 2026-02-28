import type { Meta, StoryObj } from '@storybook/react-vite'
import type { AssociationSectionKey } from '@/components/shared/object-association/object-association-config'
import { ASSOCIATION_SECTION_CONFIG } from '@/components/shared/object-association/object-association-config'
import ObjectsChip from './objects-chip'

const objectChipObjectTypes = Object.keys(ASSOCIATION_SECTION_CONFIG) as AssociationSectionKey[]

const meta: Meta<typeof ObjectsChip> = {
  title: 'Display/ObjectsChip',
  component: ObjectsChip,
  parameters: {
    docs: {
      description: {
        component: 'A badge chip representing a related object. Border color is keyed to the objectType. Optionally removable.',
      },
    },
  },
  argTypes: {
    name: { control: 'text', description: 'Display label for the chip' },
    objectType: {
      control: 'select',
      options: objectChipObjectTypes,
      description: 'Object type — determines border color',
    },
    removable: { control: 'boolean' },
  },
} satisfies Meta<typeof ObjectsChip>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    name: 'SOC 2 Audit',
    objectType: 'programs',
  },
}

export const Removable: Story = {
  args: {
    name: 'Access Control',
    objectType: 'controls',
    removable: true,
    onRemove: () => {},
  },
}

export const AllTypes: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {objectChipObjectTypes.map((type) => (
        <ObjectsChip key={type} name={type} objectType={type} />
      ))}
    </div>
  ),
}
