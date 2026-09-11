import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  containerClassName?: string
}

export default function Input({
  label,
  error,
  helpText,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  const errorId = error ? `${inputId}-error` : undefined

  return (
    <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-ink-600 mb-1"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          aria-describedby={errorId}
          aria-invalid={!!error}
          className={[
            'w-full rounded-xl bg-white border text-ink-900 placeholder:text-ink-400',
            'px-4 py-3 text-base font-sans outline-none transition-all duration-200',
            'focus:border-brand-500 focus:ring-4 focus:ring-brand-100 focus:outline-none',
            error
              ? 'border-danger focus:ring-danger/20'
              : 'border-border hover:border-border',
            leftIcon ? 'pl-12' : '',
            rightIcon ? 'pr-12' : '',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-sm text-danger flex items-center gap-1.5 mt-1">
          {error}
        </p>
      )}
      {helpText && !error && (
        <p className="text-sm text-ink-400 mt-1">{helpText}</p>
      )}
    </div>
  )
}
