import React from 'react'
import { motion } from 'framer-motion'

type Variant = 'default' | 'interactive' | 'stat'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant
  children: React.ReactNode
  className?: string
}

export default function Card({
  variant = 'default',
  className = '',
  children,
  ...props
}: CardProps) {
  const baseClasses = 'bg-bg-surface rounded-2xl border border-border shadow-card'
  
  const variantClasses: Record<Variant, string> = {
    default: '',
    interactive: 'cursor-pointer transition-all duration-300 hover:shadow-card-hover hover:border-brand-300',
    stat: 'flex flex-col items-center justify-center text-center p-8',
  }

  const content = (
    <div
      className={[baseClasses, variantClasses[variant], 'p-6', className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  )

  if (variant === 'interactive') {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.3 }}
      >
        {content}
      </motion.div>
    )
  }

  return content
}
