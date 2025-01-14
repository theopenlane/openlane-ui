export interface SupportedFramework {
  name: string
  shortname: string
  maintainer?: string
  description: string
  version?: string
}

// TODO: (sfunk) pull this from the API or a shared config
export var supportedFrameworks: SupportedFramework[] = [
  {
    name: 'AICPA TSC 2017 (with 2022 revised POF)',
    shortname: 'SOC2',
    maintainer: 'AICPA',
    description: 'Service Organization Control - Trust Services Criteria (TSC) - SOC2 (2022 points of focus)',
    version: '2021',
  },
  {
    name: 'ISO 27001 v2022',
    shortname: 'ISO 27001',
    maintainer: 'NIST',
    description: '27001 - Information Security Management Systems (ISMS) - Requirements',
    version: '2022',
  },
  {
    name: 'NIST SP 800-53 Rev. 5',
    shortname: 'NIST 800-53 v5',
    maintainer: 'ISO',
    description: 'NIST Special Publication 800-53 Revision 5',
    version: '5.1.1',
  },
  {
    name: 'Custom Framework',
    shortname: 'Custom',
    description: 'Build your own framework',
  },
]
