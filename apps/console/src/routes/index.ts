import speedometerIcon from '../../public/icons/speedometer.svg'
import carbonIcon from '../../public/icons/carbon_neutral.svg'
import tasksIcon from '../../public/icons/tasks.svg'
import envelopOpenIcon from '../../public/icons/envelope-open.svg'
import userGroupsIcon from '../../public/icons/users-group.svg'
import assetsIcon from '../../public/icons/window.svg'
import productsIcon from '../../public/icons/tag.svg'
import revenueIcon from '../../public/icons/shopping.svg'
import integrationsIcon from '../../public/icons/code-fork.svg'
import configIcon from '../../public/icons/adjustments-horizontal.svg'
import billingIcon from '../../public/icons/store.svg'

const divider = '_divider'

export const routes = [
  {
    name: 'Dashboard',
    description: '',
    href: '/dashboard',
    icon: speedometerIcon,
    current: true,
    detail: true,
    children: [
      {
        name: 'Home',
        description: '',
        href: '/dashboard',
        current: false,
      },
      {
        name: 'Assets',
        description: '',
        href: '/dashboard/assets',
        current: false,
      },
      {
        name: 'Connected Integrations',
        description: '',
        href: '/dashboard/connected-integrations',
        current: false,
      },
      {
        name: 'Active Sessions',
        description: '',
        href: '/dashboard/active-sessions',
        current: false,
      },
    ],
  },
  {
    name: 'Tasks & Mentions',
    description: '',
    href: '/tasks-and-mentions',
    icon: tasksIcon,
    current: false,
  },
  {
    name: 'Inbox',
    description: '',
    href: '/inbox/all',
    icon: envelopOpenIcon,
    current: false,
    detail: true,
    children: [
      {
        name: 'Unread',
        description: '',
        href: '/inbox/unread',
        current: false,
      },
      {
        name: 'All',
        description: '',
        href: '/inbox/all',
        current: false,
      },
      {
        name: 'Deleted',
        description: '',
        href: '/inbox/deleted',
        current: false,
      },
    ],
  },
  { name: divider },
  {
    name: 'Documents',
    description: '',
    href: '/documents/templates',
    icon: speedometerIcon,
    current: true,
    detail: true,
    children: [
      {
        name: 'Templates',
        description: '',
        href: '/documents/templates',
        current: true,
      },
      {
        name: 'Templates',
        description: '',
        href: '/documents/documents',
        current: true,
      },
      {
        name: 'Editor',
        description: '',
        href: '/documents/editor',
        current: false,
      },
      {
        name: 'Form',
        description: '',
        href: '/documents/form',
        current: false,
      },
    ],
  },
  { name: divider },
  {
    name: 'Assets',
    description: '',
    href: '/assets',
    icon: assetsIcon,
    current: false,
    detail: true,
    children: [
      {
        name: 'Discovery & Reconciliation',
        description: '',
        href: '/assets/discovery-and-reconciliation',
        current: false,
      },
      {
        name: 'Items',
        description: '',
        href: '/assets/items',
        current: false,
      },
      {
        name: 'Applications',
        description: '',
        href: '/assets/applications',
        current: false,
      },
    ],
  },
  {
    name: 'Products',
    description: '',
    href: '/products',
    icon: productsIcon,
    current: false,
    detail: true,
    children: [
      {
        name: 'Catalog',
        description: '',
        href: '/products/catalog',
        current: false,
      },
      {
        name: 'Plans',
        description: '',
        href: '/products/plans',
        current: false,
      },
      {
        name: 'Price Books',
        description: '',
        href: '/products/price-books',
        current: false,
      },
      {
        name: 'Subscriptions',
        description: '',
        href: '/products/subscriptions',
        current: false,
      },
    ],
  },
  {
    name: 'People & Groups',
    description: '',
    href: '/people-and-groups',
    icon: userGroupsIcon,
    current: false,
    detail: true,
    children: [
      {
        name: 'Permissions & Connections',
        description: '',
        href: '/people-and-groups/permissions-and-connections',
        current: false,
      },
      {
        name: 'Users',
        description: '',
        href: '/people-and-groups/users',
        current: false,
      },
      {
        name: 'Companies',
        description: '',
        href: '/people-and-groups/companies',
        current: false,
      },
      {
        name: 'Organizations',
        description: '',
        href: '/people-and-groups/organizations',
        current: false,
      },
      {
        name: 'Root Organizations',
        description: '',
        href: '/people-and-groups/root-organizations',
        current: false,
      },
      {
        name: 'Tags',
        description: '',
        href: '/people-and-groups/tags',
        current: false,
      },
    ],
  },
  { name: divider },
  {
    name: 'Revenue',
    description: '',
    href: '/revenue',
    icon: revenueIcon,
    current: false,
    detail: true,
    children: [
      {
        name: 'Quotes',
        description: '',
        href: '/revenue/quotes',
        current: false,
      },
      {
        name: 'Contracts',
        description: '',
        href: '/revenue/contracts',
        current: false,
      },
      {
        name: 'Invoices',
        description: '',
        href: '/revenue/invoices',
        current: false,
      },
      {
        name: 'Showback',
        description: '',
        href: '/revenue/showback',
        current: false,
      },
      {
        name: 'Chargeback',
        description: '',
        href: '/revenue/chargeback',
        current: false,
      },
    ],
  },
  {
    name: 'Sustainability',
    description: '',
    href: '/sustainability',
    icon: carbonIcon,
    current: false,
    detail: true,
    children: [
      {
        name: 'Track',
        description: '',
        href: '/sustainability/track',
        current: false,
      },
      {
        name: 'Measure',
        description: '',
        href: '/sustainability/measure',
        current: false,
      },
      {
        name: 'Status',
        description: '',
        href: '/sustainability/status',
        current: false,
      },
      {
        name: 'Reports',
        description: '',
        href: '/sustainability/reports',
        current: false,
      },
    ],
  },
  {
    name: 'Integrations',
    description: '',
    href: '/integrations',
    icon: integrationsIcon,
    current: false,
    detail: true,
    children: [
      {
        name: 'Marketplace',
        description: '',
        href: '/integrations/marketplace',
        current: false,
      },
      {
        name: 'Github',
        description: '',
        href: '/integrations/github',
        current: false,
      },
      {
        name: 'Slack',
        description: '',
        href: '/integrations/slack',
        current: false,
      },
      {
        name: 'My Apps',
        description: '',
        href: '/integrations/my-apps',
        current: false,
      },
    ],
  },
  { name: divider },
  {
    name: 'Configuration',
    description: '',
    href: '/configuration',
    icon: configIcon,
    current: false,
    detail: true,
    children: [
      {
        name: 'API Access',
        description: '',
        href: '/configuration/api-access',
        current: false,
      },
      {
        name: 'Personal Settings',
        description: '',
        href: '/configuration/personal-settings',
        current: false,
      },
      {
        name: 'Organization Settings',
        description: '',
        href: '/configuration/organization-settings',
        current: false,
      },
      {
        name: 'Features',
        description: '',
        href: '/configuration/features',
        current: false,
      },
    ],
  },
  {
    name: 'Billing',
    description: '',
    href: '/billing',
    icon: billingIcon,
    current: false,
    detail: true,
    children: [
      {
        name: 'Invoices',
        description: '',
        href: '/billing/invoices',
        current: false,
      },
      {
        name: 'My Plan',
        description: '',
        href: '/billing/my-plan',
        current: false,
      },
      {
        name: 'Payment Methods',
        description: '',
        href: '/billing/payment-methods',
        current: false,
      },
    ],
  },
]

export default routes
