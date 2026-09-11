import React from 'react'
interface SkeletonProps {
  variant?: 'line' | 'text' | 'card' | 'avatar' | 'rect'
  className?: string
  lines?: number
  height?: string
  width?: string
}

interface SkeletonBaseProps {
  className?: string
  style?: React.CSSProperties
}

function SkeletonBase({ className = '', style }: SkeletonBaseProps) {
  return <div className={`skeleton-shimmer rounded ${className}`} style={style} />
}

export default function Skeleton({
  variant = 'line',
  className = '',
  lines = 3,
  height,
  width,
}: SkeletonProps) {
  const style: React.CSSProperties = {
    ...(height ? { height } : {}),
    ...(width ? { width } : {}),
  }

  if (variant === 'text') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonBase
            key={i}
            className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
          />
        ))}
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={`bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-5 flex flex-col gap-3 ${className}`}
      >
        <SkeletonBase className="h-5 w-1/3" />
        <SkeletonBase className="h-4 w-full" />
        <SkeletonBase className="h-4 w-4/5" />
        <SkeletonBase className="h-4 w-2/3" />
      </div>
    )
  }

  if (variant === 'avatar') {
    return <SkeletonBase className={`rounded-full w-10 h-10 ${className}`} />
  }

  // line / rect
  return <SkeletonBase className={`h-4 w-full ${className}`} style={style} />
}

export function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} variant="card" />
      ))}
    </div>
  )
}
