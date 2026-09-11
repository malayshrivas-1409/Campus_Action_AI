import React from 'react'
import { motion } from 'framer-motion'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  fullWidth?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-brand-gradient text-white shadow-card hover:shadow-glow active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'bg-white border border-border text-ink-900 hover:border-brand-300 hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed',
  outline: 'bg-transparent border-2 border-brand-500 text-brand-600 hover:bg-brand-50 disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'bg-transparent text-ink-600 hover:bg-bg-subtle disabled:opacity-50 disabled:cursor-not-allowed',
  danger: 'bg-danger text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  icon,
  children,
  disabled,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 outline-none',
        'focus-visible:ring-2 focus-visible:ring-brand-300 focus-visible:outline-none',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      whileHover={!disabled && !isLoading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.98 } : {}}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading…</span>
        </span>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </motion.button>
  )
}
