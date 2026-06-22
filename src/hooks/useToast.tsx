'use client'

import { useState, useCallback, ReactElement } from 'react'

interface Toast {
  id: number
  message: string
  type?: '' | 'ok' | 'err'
}

let toastId = 0

interface UseToastReturn {
  toast: (message: string, type?: '' | 'ok' | 'err') => void
  ToastContainer: () => ReactElement | null
}

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type?: '' | 'ok' | 'err') => {
    const id = ++toastId
    setToasts(prev => {
      if (prev.some(t => t.message === message)) return prev
      return [...prev, { id, message, type }]
    })
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 2800)
  }, [])

  const ToastContainer = useCallback(() => {
    if (toasts.length === 0) return null

    return (
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type || ''}`}>
            {t.message}
          </div>
        ))}
      </div>
    )
  }, [toasts])

  return { toast, ToastContainer }
}
