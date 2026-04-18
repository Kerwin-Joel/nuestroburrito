import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  type: ToastType
  message: string
  action?: { label: string; onClick: () => void }
}

interface UIState {
  toasts: Toast[]
  modalOpen: string | null
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  openModal: (name: string) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  toasts: [],
  modalOpen: null,
  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3200)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  openModal: (name) => set({ modalOpen: name }),
  closeModal: () => set({ modalOpen: null }),
}))
