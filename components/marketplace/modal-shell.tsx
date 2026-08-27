"use client"

import { useEffect, type ReactNode } from "react"
import { X } from "lucide-react"
import { createPortal } from "react-dom"

export function ModalShell({ open, onClose, children, labelledBy }: {
  open: boolean
  onClose: () => void
  children: ReactNode
  labelledBy: string
}) {
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKeyDown = (event: KeyboardEvent) => event.key === "Escape" && onClose()
    window.addEventListener("keydown", onKeyDown)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener("keydown", onKeyDown)
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#111]/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="max-h-[100dvh] w-full overflow-y-auto border border-[rgba(55,50,47,0.12)] bg-[#fafafa] text-left shadow-2xl sm:max-h-[92vh] sm:max-w-[580px]">
        <div className="sticky top-0 z-10 flex justify-end border-b border-[rgba(55,50,47,0.12)] bg-[#fafafa]/95 px-4 py-2.5 backdrop-blur">
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-9 place-items-center rounded-full text-[#999] transition-colors hover:bg-[rgba(55,50,47,.06)] hover:text-[#111]">
            <X size={18} />
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  )
}
