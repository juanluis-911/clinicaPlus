import { cn } from '@/lib/utils'

const colors = {
  blue:    'bg-blue-100 text-blue-700',
  green:   'bg-emerald-100 text-emerald-700',
  red:     'bg-red-100 text-red-700',
  gray:    'bg-gray-100 text-gray-600',
  yellow:  'bg-amber-100 text-amber-700',
  purple:  'bg-purple-100 text-purple-700',
  sky:     'bg-sky-100 text-sky-700',
}

export default function Badge({ color = 'gray', className, children }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
      colors[color] || colors.gray,
      className
    )}>
      {children}
    </span>
  )
}
