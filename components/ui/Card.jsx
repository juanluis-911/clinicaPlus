import { cn } from '@/lib/utils'

export default function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('bg-white rounded-2xl border border-gray-200/80 shadow-sm', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100', className)} {...props}>
      {children}
    </div>
  )
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('px-4 py-3 sm:px-6 sm:py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl', className)} {...props}>
      {children}
    </div>
  )
}
