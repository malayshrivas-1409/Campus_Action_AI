
import { LucideIcon } from 'lucide-react'
import Button from '@/components/primitives/Button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center gap-4">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
          <Icon size={24} className="text-text-muted" />
        </div>
      )}
      <div className="flex flex-col gap-1.5 max-w-xs">
        <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
        {description && <p className="text-xs text-text-muted leading-relaxed">{description}</p>}
      </div>
      {action && (
        <Button variant="secondary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
