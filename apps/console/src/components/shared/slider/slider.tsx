type SliderProps =
  | { value: number; onChange?: (value: number) => void; range?: false; min?: number; max?: number }
  | { value: [number, number]; onChange?: (value: [number, number]) => void; range: true; min?: number; max?: number }

const Slider = ({ value, onChange, range, min = 0, max = 100 }: SliderProps) => {
  if (range) {
    const [minVal, maxVal] = value as [number, number]
    const onChangeRange = onChange as (value: [number, number]) => void

    const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.min(Number(e.target.value), maxVal)
      onChangeRange?.([val, maxVal])
    }

    const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = Math.max(Number(e.target.value), minVal)
      onChangeRange?.([minVal, val])
    }

    return (
      <div className="w-full flex items-center gap-4">
        <div className="relative w-full h-2">
          <input
            type="range"
            min={min}
            max={max}
            value={minVal}
            onChange={handleMinChange}
            className="accent-brand absolute inset-0 w-full h-2 bg-input-slider rounded-lg appearance-none cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          />
          <input
            type="range"
            min={min}
            max={max}
            value={maxVal}
            onChange={handleMaxChange}
            className="accent-brand absolute inset-0 w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
          />
        </div>
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value)
    ;(onChange as (value: number) => void)?.(val)
  }

  return (
    <div className="w-full flex items-center gap-4">
      <input type="range" min={min} max={max} value={value as number} onChange={handleChange} className="accent-brand w-full h-2 bg-input-slider rounded-lg appearance-none cursor-pointer" />
      <span className="text-sm w-8 text-right">{value as number}</span>
    </div>
  )
}

export default Slider
