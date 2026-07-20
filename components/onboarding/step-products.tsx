'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Upload,
  FileSpreadsheet,
  Store,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
// @ts-ignore
import Papa from 'papaparse'

type Tab = 'url' | 'csv'

interface SyncReport {
  inserted: number
  updated: number
  errors: number
  unchanged?: number
  unavailable?: number
  productsSeen?: number
  extractorUsed?: string | null
  sitemapShortCircuited?: boolean
}

interface StoreStatus {
  id: string
  canonicalUrl: string
  syncStatus: string
  productCount?: number
  platform?: string
  lastError?: string | null
}

export function StepProducts() {
  const [tab, setTab] = useState<Tab>('url')

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-950">
          Import your products
        </h2>
        <p className="mt-2 text-sm text-neutral-600">
          Paste your store URL and EcomPin will pull your public catalog automatically.
          CSV upload is always available as a fallback.
        </p>
      </div>

      <div className="flex rounded-xl border border-neutral-200 bg-neutral-50 p-1">
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            tab === 'url'
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <Store className="h-4 w-4" />
          Store URL
        </button>
        <button
          type="button"
          onClick={() => setTab('csv')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
            tab === 'csv'
              ? 'bg-white text-neutral-950 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          <FileSpreadsheet className="h-4 w-4" />
          CSV Upload
        </button>
      </div>

      {tab === 'url' ? <StoreUrlImport /> : <CsvUpload />}
    </div>
  )
}

/* ─── Store URL Import ─── */

function StoreUrlImport() {
  const [storeUrl, setStoreUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [store, setStore] = useState<StoreStatus | null>(null)
  const [report, setReport] = useState<SyncReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  async function pollStore(storeId: string) {
    try {
      const res = await fetch(`/api/catalog/sync?storeId=${storeId}&runs=1`)
      if (!res.ok) return
      const data = await res.json()
      const s = data.store
      if (!s) return

      setStore({
        id: s.id,
        canonicalUrl: s.canonical_url,
        syncStatus: s.sync_status,
        productCount: s.product_count,
        platform: s.platform,
        lastError: s.last_error,
      })

      const run = data.latestRun
      if (run && (s.sync_status === 'success' || s.sync_status === 'partial')) {
        setReport({
          inserted: run.products_inserted || 0,
          updated: run.products_updated || 0,
          unchanged: run.products_unchanged || 0,
          unavailable: run.products_unavailable || 0,
          productsSeen: run.products_seen || 0,
          errors: 0,
          extractorUsed: run.extractor_used,
          sitemapShortCircuited: run.sitemap_short_circuited,
        })
      }

      if (['success', 'partial', 'failed'].includes(s.sync_status)) {
        if (pollRef.current) {
          clearInterval(pollRef.current)
          pollRef.current = null
        }
        setSaving(false)
        if (s.sync_status === 'failed') {
          setError(s.last_error || 'Import failed. Try CSV upload instead.')
        }
      }
    } catch {
      /* keep polling */
    }
  }

  async function handleImport() {
    if (!storeUrl.trim()) return
    setError(null)
    setReport(null)
    setSaving(true)

    try {
      const res = await fetch('/api/catalog/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeUrl: storeUrl.trim(),
          mode: 'async',
          triggerSource: 'onboarding',
        }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(body.error || body.message || 'Import failed')
      }

      // Inline fallback already finished
      if (body.report) {
        setReport({
          inserted: body.report.inserted || 0,
          updated: body.report.updated || 0,
          unchanged: body.report.unchanged || 0,
          unavailable: body.report.unavailable || 0,
          productsSeen: body.report.productsSeen || 0,
          errors: body.report.status === 'failed' ? 1 : 0,
          extractorUsed: body.report.extractorUsed,
          sitemapShortCircuited: body.report.sitemapShortCircuited,
        })
        setStore({
          id: body.store?.id,
          canonicalUrl: body.store?.canonicalUrl || storeUrl,
          syncStatus: body.report.status,
          productCount: body.report.productsSeen,
        })
        if (body.report.status === 'failed') {
          setError(body.report.errorMessage || 'Could not import products from this URL.')
        }
        setSaving(false)
        return
      }

      const storeId = body.store?.id
      if (!storeId) throw new Error('No store id returned')

      setStore({
        id: storeId,
        canonicalUrl: body.store.canonicalUrl || storeUrl,
        syncStatus: body.store.syncStatus || 'queued',
      })

      if (pollRef.current) clearInterval(pollRef.current)
      pollRef.current = setInterval(() => pollStore(storeId), 2000)
      // immediate poll
      void pollStore(storeId)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setSaving(false)
    }
  }

  const isRunning =
    saving ||
    store?.syncStatus === 'queued' ||
    store?.syncStatus === 'running'

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-xs leading-5 text-neutral-600">
          Works with public storefronts (Shopify, WooCommerce, Squarespace, and most custom shops).
          No app install or API keys required. If the store blocks crawlers, use CSV.
        </p>
      </div>

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm font-medium text-neutral-900">
          <LinkIcon className="h-3.5 w-3.5" />
          Store URL
        </label>
        <Input
          value={storeUrl}
          onChange={(e) => setStoreUrl(e.target.value)}
          placeholder="https://yourstore.com or brand.myshopify.com"
          className="h-12 rounded-xl border-neutral-200 bg-white px-4"
          disabled={isRunning}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleImport()
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Import failed</p>
            <p className="mt-1">{error}</p>
            <p className="mt-2 text-xs text-red-700">
              Switch to the CSV tab — export products from your store admin and upload them here.
            </p>
          </div>
        </div>
      )}

      {isRunning && !error && (
        <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-4">
          <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-neutral-500" />
          <div className="text-sm text-neutral-700">
            <p className="font-medium">Importing catalog…</p>
            <p className="mt-1 text-neutral-500">
              Scanning public product pages. This usually takes under a minute for small stores.
            </p>
          </div>
        </div>
      )}

      {report && !error && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div className="text-sm text-green-800">
            <p className="font-medium">Catalog imported</p>
            <p className="mt-1">
              {report.inserted} new, {report.updated} updated
              {typeof report.unchanged === 'number' ? `, ${report.unchanged} unchanged` : ''}
              {report.productsSeen != null ? ` · ${report.productsSeen} seen` : ''}
            </p>
            {report.extractorUsed && (
              <p className="mt-1 text-xs text-green-700">
                Source: {report.extractorUsed.replace(/_/g, ' ')}
                {store?.platform ? ` · ${store.platform}` : ''}
              </p>
            )}
          </div>
        </div>
      )}

      <Button
        onClick={handleImport}
        disabled={isRunning || !storeUrl.trim()}
        className="h-12 w-full rounded-xl bg-neutral-900 text-sm font-medium text-white hover:bg-neutral-800"
      >
        {isRunning ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing…
          </>
        ) : report ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-sync store
          </>
        ) : (
          'Import products'
        )}
      </Button>
    </div>
  )
}

/* ─── CSV Upload ─── */

function CsvUpload() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [report, setReport] = useState<SyncReport | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  async function handleFile(file: File) {
    setError(null)
    setReport(null)
    setFileName(file.name)
    setUploading(true)

    try {
      const text = await file.text()
      const parsed = Papa.parse(text, { header: true, skipEmptyLines: true })

      if (!parsed.data || parsed.data.length === 0) {
        setError('CSV file is empty or could not be parsed.')
        setUploading(false)
        return
      }

      const res = await fetch('/api/sync/csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: parsed.data }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || body.error || 'Import failed')
      }

      const { report: r } = await res.json()
      setReport(r)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="flex w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/50 px-6 py-10 transition-colors hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        ) : (
          <Upload className="h-8 w-8 text-neutral-400" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-neutral-700">
            {uploading ? 'Importing...' : 'Click to upload CSV'}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Shopify product export format recommended. Max 5,000 rows.
          </p>
        </div>
      </button>

      {fileName && !error && !report && !uploading && (
        <p className="text-xs text-neutral-500">Selected: {fileName}</p>
      )}

      {report && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
          <div className="text-sm text-green-800">
            <p className="font-medium">Import complete</p>
            <p className="mt-1">
              {report.inserted} new products added, {report.updated} updated
              {report.errors > 0 && `, ${report.errors} errors`}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
          <div className="text-sm text-red-800">
            <p className="font-medium">Import failed</p>
            <p className="mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
