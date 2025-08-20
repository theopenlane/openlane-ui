const classes: Record<string, string> = {
  'ISO 27001': 'text-standard-iso27001',
  'NIST 800-53': 'text-standard-nist80053',
  'NIST CSF': 'text-standard-nistcsf',
  'SOC 2': 'text-standard-soc2',
  'NIST SSDF': 'text-standard-nistssdf',
  GDPR: 'text-standard-gdpr',
  'CIS Benchmarks': 'text-standard-cis',
  CCM: 'text-standard-ccm',
  HIPAA: 'text-standard-hipaa',
  SOX: 'text-standard-sox',
  'PCI DSS': 'text-standard-pci',
  'NIST 800-171': 'text-standard-nist80053',
}

export const StandardsColorSpan = ({ shortName, children }: { shortName: string; children: React.ReactNode }) => {
  const className = classes[shortName] || 'text-standard-custom'
  return <span className={className}>{children}</span>
}

export const StandardsHexagon = ({ shortName }: { shortName: string }) => {
  const className = classes[shortName] || 'text-standard-custom'

  const hexagonStyle: React.CSSProperties = {
    width: '10px',
    height: '10px',
    backgroundColor: 'currentColor',
    clipPath: 'polygon(50% 0, 95% 25%, 95% 75%, 50% 100%, 5% 75%, 5% 25%)',
  }

  return <span className={className} style={hexagonStyle} />
}
