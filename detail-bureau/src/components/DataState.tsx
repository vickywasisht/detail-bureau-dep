import type { ReactNode } from 'react'

type DataStateKind = 'loading' | 'empty' | 'error'

interface DataStateProps {
  kind: DataStateKind
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export default function DataState({
  kind,
  title,
  description,
  action,
  className = '',
}: DataStateProps) {
  const isError = kind === 'error'

  return (
    <div
      className={`${isError ? 'ui-alert ui-alert--error' : 'dashboard-empty'} ${className}`.trim()}
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? undefined : 'polite'}
    >
      <div className="flex items-center justify-center gap-3">
        {kind === 'loading' && <span className="ui-spinner" aria-hidden="true" />}
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          {description && <p className="mt-1 text-sm text-text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
