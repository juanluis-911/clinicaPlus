import { cn } from '@/lib/utils'

export default function Input({
  label,
  error,
  helper,
  className,
  containerClassName,
  required,
  ...props
}) {
  return (
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        className={cn(
          'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900',
          'placeholder:text-gray-400 bg-white',
          'focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  )
}

export function Textarea({ label, error, helper, className, containerClassName, required, ...props }) {
  return (
    <div className={cn('flex flex-col gap-1', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <textarea
        rows={3}
        className={cn(
          'w-full rounded-xl border border-gray-300 px-3 py-2 text-sm text-gray-900',
          'placeholder:text-gray-400 bg-white resize-y',
          'focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] focus:border-transparent',
          'disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed',
          error && 'border-red-400 focus:ring-red-400',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-gray-500">{helper}</p>}
    </div>
  )
}
