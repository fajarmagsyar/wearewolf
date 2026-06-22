'use client'

import { useState, useCallback, ReactElement } from 'react'

interface ConfirmOptions {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

interface UseConfirmReturn {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  ConfirmModal: () => ReactElement | null
}

export function useConfirm(): UseConfirmReturn {
  const [pending, setPending] = useState<ConfirmOptions & { resolve: (value: boolean) => void } | null>(null)

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise(resolve => {
      setPending({ ...options, resolve })
    })
  }, [])

  const handleResponse = useCallback((value: boolean) => {
    if (pending) {
      pending.resolve(value)
      setPending(null)
    }
  }, [pending])

  const ConfirmModal = useCallback(() => {
    if (!pending) return null

    return (
      <div className="modal-back">
        <div className="modal">
          <h3 className="mb">{pending.title}</h3>
          <p>{pending.message}</p>
          <div className="row mt">
            <button className="btn red" onClick={() => handleResponse(true)}>
              {pending.confirmLabel || 'Yes'}
            </button>
            <button className="btn paper" onClick={() => handleResponse(false)}>
              {pending.cancelLabel || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    )
  }, [pending, handleResponse])

  return { confirm, ConfirmModal }
}
