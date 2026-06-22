'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'

interface ConfirmOptions {
  message: string
  yes?: string
  no?: string
}

interface ConfirmContextValue {
  open: (options: ConfirmOptions) => Promise<boolean>
}

export const ConfirmContext = createContext<ConfirmContextValue>({ open: async () => false })

export function useGlobalConfirm() {
  return useContext(ConfirmContext)
}

export function GlobalProviders({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type?: string }>>([])
  const [confirmState, setConfirmState] = useState<{
    show: boolean
    message: string
    yes: string
    no: string
    resolve: ((val: boolean) => void) | null
  }>({ show: false, message: '', yes: 'Yes', no: 'Cancel', resolve: null })

  useEffect(() => {
    const handler = (e: Event) => {
      const { message, type } = (e as CustomEvent).detail
      const id = Date.now() + Math.random()
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800)
    }
    window.addEventListener('toast', handler)
    return () => window.removeEventListener('toast', handler)
  }, [])

  const open = useCallback(({ message, yes = 'Yes', no = 'Cancel' }: ConfirmOptions) => {
    return new Promise<boolean>(resolve => {
      setConfirmState({ show: true, message, yes, no, resolve })
    })
  }, [])

  const accept = () => {
    confirmState.resolve?.(true)
    setConfirmState(s => ({ ...s, show: false, resolve: null }))
  }

  const cancel = () => {
    confirmState.resolve?.(false)
    setConfirmState(s => ({ ...s, show: false, resolve: null }))
  }

  return (
    <ConfirmContext.Provider value={{ open }}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type || ''}`}>{t.message}</div>
        ))}
      </div>
      {confirmState.show && (
        <div className="modal-back">
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 className="mb">{confirmState.message}</h3>
            <div className="row mt">
              <button className="btn red" onClick={accept}>{confirmState.yes}</button>
              <button className="btn paper" onClick={cancel}>{confirmState.no}</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
