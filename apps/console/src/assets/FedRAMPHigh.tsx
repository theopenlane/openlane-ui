interface FedRAMPHighProps {
  width?: number
  height?: number
}

const FedRAMPHigh = ({ height = 75, width = 68 }: FedRAMPHighProps) => {
  return (
    <svg width={width} height={height} viewBox="0 0 68 75" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M29.375 2.03613C32.1474 0.435529 35.5431 0.38531 38.3545 1.88574L38.625 2.03613L62.4004 15.7627C65.2622 17.4151 67.0254 20.4689 67.0254 23.7734V51.2266C67.0254 54.5311 65.2622 57.5849 62.4004 59.2373L38.625 72.9639C35.8526 74.5645 32.4569 74.6147 29.6455 73.1143L29.375 72.9639L5.59961 59.2373C2.73783 57.5849 0.974632 54.5311 0.974609 51.2266V23.7734C0.974632 20.4689 2.73783 17.4151 5.59961 15.7627L29.375 2.03613Z"
        stroke="#30A800"
        strokeWidth="1.5"
      />
    </svg>
  )
}

export default FedRAMPHigh
