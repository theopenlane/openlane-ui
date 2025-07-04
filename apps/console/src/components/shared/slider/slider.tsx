const Slider = ({ value, onChange }: { value: number; onChange?: (value: number) => void }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    onChange?.(val)
  }

  return (
    <div className="w-full flex items-center gap-4">
      <input type="range" min={0} max={100} value={value} onChange={handleChange} className="accent-brand w-full h-2 bg-input-slider rounded-lg appearance-none cursor-pointer" />
      <span className="text-sm w-8 text-right">{value}</span>
    </div>
  )
}

export default Slider
