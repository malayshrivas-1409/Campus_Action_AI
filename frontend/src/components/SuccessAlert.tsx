

interface SuccessAlertProps {
  message: string
  className?: string
}

export default function SuccessAlert({ message, className = '' }: SuccessAlertProps) {
  return (
    <div
      role="status"
      className={`flex items-start gap-2 px-4 py-3 rounded-lg bg-brand-accent/10 border border-brand-accent/30 text-brand-accent text-sm ${className}`}
    >
      <span className="shrink-0 mt-0.5" aria-hidden="true">✓</span>
      <span>{message}</span>
    </div>
  )
}
