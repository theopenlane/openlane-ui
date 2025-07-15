export const StandardsColorSpan = ({ shortName, children }: { shortName: string; children: React.ReactNode }) => {
  const classes: Record<string, string> = {
    'ISO 27001': 'text-standard-iso27001',
    'NIST 800-53': 'text-standard-nist80053',
    'NIST CSF': 'text-standard-nistcsf',
    'SOC 2': 'text-standard-soc2',
    'NIST SSDF': 'text-standard-nistssdf',
    GDPR: 'text-standard-gdpr',
    'CIS Benchmarks': 'text-standard-cis',
    CCM: 'text-standard-ccm',
    HIPPA: 'text-standard-hippa',
    SOX: 'text-standard-sox',
  }
  const className = classes[shortName] || 'text-standard-custom'
  return <span className={className}>{children}</span>
}
