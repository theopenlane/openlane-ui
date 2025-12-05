// components/AIAssistButton.tsx
import { Sparkles, Loader2 } from 'lucide-react'

interface AIAssistButtonProps {
  onGetSuggestions: () => void
  loading?: boolean
  label?: string
  variant?: 'primary' | 'secondary' | 'inline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AIAssistButton({ onGetSuggestions, loading = false, label = 'Get AI Help', variant = 'primary', size = 'md', className = '' }: AIAssistButtonProps) {
  const baseStyles = 'flex items-center gap-2 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50'

  const variantStyles = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
    inline: 'text-purple-400 hover:text-purple-300 hover:bg-gray-700',
  }

  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  }

  return (
    <button type="button" onClick={onGetSuggestions} disabled={loading} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {loading ? <Loader2 size={iconSizes[size]} className="animate-spin" /> : <Sparkles size={iconSizes[size]} />}
      {label}
    </button>
  )
}
