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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-[3px] sm:items-center sm:p-6" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="max-h-[100dvh] w-full overflow-y-auto border border-black/10 bg-[#fbfaf7] text-left shadow-2xl sm:max-h-[92vh] sm:max-w-[580px] sm:rounded-[14px]">
        <div className="sticky top-0 z-10 flex justify-end border-b border-black/8 bg-[#fbfaf7]/95 px-5 py-3 backdrop-blur sm:rounded-t-[14px]">
          <button type="button" onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full text-[#6e6a63] transition hover:bg-black/5 hover:text-black">
            <X size={19} />
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  )
}
