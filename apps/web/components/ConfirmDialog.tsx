'use client'

import { Button } from './ui'

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-5 wide:items-center"
      onClick={onCancel}
    >
      <div
        className="animate-rise w-full max-w-sm rounded-sm border border-rule-strong bg-paper-raised p-5 shadow-[0_4px_16px_rgba(25,23,19,0.24)]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-serif text-2xl leading-tight">{title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Button variant="primary" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="quiet" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
