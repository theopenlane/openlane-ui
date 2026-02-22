import type { Meta } from '@storybook/react-vite'
import { DataTable } from './data-table'
import { columns, mockData } from './mocks/data-table.mock'
import { TableKeyEnum } from '../data-table/table-key.ts'

const meta = {
  title: 'Data/DataTable',
  component: DataTable,
  parameters: {
    docs: {
      description: {
        component: 'A data table component',
      },
    },
  },
} satisfies Meta

export default meta

export const Default = {
  render: () => (
    <div className="p-8 rounded-lg">
      <DataTable columns={columns} data={mockData} tableKey={TableKeyEnum.TABLE_STORIES} />
    </div>
  ),
}
