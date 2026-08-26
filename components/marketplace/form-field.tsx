import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react"

const inputClass = "min-h-12 w-full rounded-[10px] border border-black/14 bg-white px-3.5 text-[15px] text-[#151412] outline-none transition placeholder:text-[#aaa59d] focus:border-black focus:ring-2 focus:ring-black/8"

export function FormField({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-[#272521]">{label}</span>
      {children}
      {helper ? <span className="mt-2 block text-xs leading-5 text-[#77726a]">{helper}</span> : null}
    </label>
  )
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className || ""}`} />
}

export function TextArea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-28 resize-none py-3 ${props.className || ""}`} />
}
