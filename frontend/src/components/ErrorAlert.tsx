

interface ErrorAlertProps {
  message: string
  className?: string
}

export default function ErrorAlert({ message, className = '' }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2 px-4 py-3 rounded-lg bg-status-error/10 border border-status-error/30 text-status-error text-sm ${className}`}
    >
      <span className="shrink-0 mt-0.5" aria-hidden="true">⚠️</span>
      <span>{message}</span>
    </div>
  )
}
