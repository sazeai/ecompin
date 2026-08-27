import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react"

const inputClass =
  "h-11 w-full border border-[rgba(55,50,47,0.12)] bg-white px-3 text-[14px] text-[#111] outline-none transition placeholder:text-[#bbb] focus:border-[#777]"

export function FormField({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[9px] uppercase tracking-[0.14em] text-[#777]">{label}</span>
      {children}
      {helper ? <span className="mt-2 block text-[11px] leading-5 text-[#999]">{helper}</span> : null}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className || ""}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-24 resize-none py-2.5 ${props.className || ""}`} />
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputClass} ${props.className || ""}`} />
}
