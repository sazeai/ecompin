'use client'

import { useState, useRef } from 'react'
import { Store, Upload, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SurfaceHeader } from '@/components/ui/surface-header'
import Image from 'next/image'

interface StepBrandProps {
  data: {
    brand_name: string
    brand_description: string
    store_url: string
    logo_url: string
  }
  onChange: (updates: Partial<StepBrandProps['data']>) => void
}

export function StepBrand({ data, onChange }: StepBrandProps) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleLogoUpload(file: File) {
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) return // 5MB limit

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/images/upload', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json()
      onChange({ logo_url: url })
    } catch {
      // silently fail — user can retry
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
          Tell us about your brand
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          This helps EcomPin write copy, label pins, and match your brand voice across every generated pin.
        </p>
      </div>

      <div className="space-y-6">
        {/* Logo Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-900">Brand Logo</label>
          <p className="text-xs text-neutral-500">Optional. Used on editorial pin layouts.</p>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) handleLogoUpload(f)
            }}
          />
          {data.logo_url ? (
            <div className="relative inline-block">
              <div className="relative h-20 w-20 overflow-hidden rounded-xl border border-neutral-200">
                <Image src={data.logo_url} alt="Logo" fill className="object-contain" />
              </div>
              <button
                type="button"
                onClick={() => onChange({ logo_url: '' })}
                className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-600 shadow-sm hover:bg-neutral-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex h-20 w-20 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 text-neutral-400 transition-colors hover:border-neutral-300 hover:text-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Upload className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {/* Brand Name */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-900">
            Brand Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={data.brand_name}
            onChange={e => onChange({ brand_name: e.target.value })}
            placeholder="e.g., Artisan Home Co."
            className="h-12 rounded-xl border-neutral-200 bg-white px-4 text-base"
            autoFocus
          />
        </div>

        {/* Brand Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-900">Brand Description</label>
          <Textarea
            value={data.brand_description}
            onChange={e => onChange({ brand_description: e.target.value })}
            placeholder="A concise description of your brand, products, and aesthetic taste."
            rows={4}
            className="rounded-xl border-neutral-200 bg-white px-4 py-3 text-base resize-none"
          />
        </div>

        {/* Pin Label */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-neutral-900">Pin Label</label>
          <Input
            type="text"
            value={data.store_url}
            onChange={e => onChange({ store_url: e.target.value })}
            placeholder="yourshop.com"
            maxLength={40}
            className="h-12 rounded-xl border-neutral-200 bg-white px-4 text-base"
          />
          <p className="text-xs text-neutral-500">
            This short label is printed on your pins. Use your domain (yourshop.com) or a short store name. Max ~30 chars.
          </p>
        </div>
      </div>
    </div>
  )
}
