interface StatBlockProps {
  value: string | number
  label: string
  accent?: boolean
  className?: string
}

export default function StatBlock({ value, label, accent = false, className = '' }: StatBlockProps) {
  return (
    <div className={`flex flex-col gap-2 items-center justify-center text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center mb-2">
        <span className={[
          'font-display font-bold text-lg',
          accent ? 'text-brand-600' : 'text-ink-600',
        ].join(' ')}>
          ⚡
        </span>
      </div>
      <span
        className={[
          'font-display font-bold text-3xl md:text-4xl leading-none tabular-nums',
          accent ? 'text-brand-600' : 'text-ink-900',
        ].join(' ')}
      >
        {value}
      </span>
      <span className="text-sm uppercase tracking-wide text-ink-400 font-sans">
        {label}
      </span>
    </div>
  )
}
