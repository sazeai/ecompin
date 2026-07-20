'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  ShoppingBag,
  Plus,
  Upload,
  Loader2,
  ExternalLink,
  Trash2,
  Package,
  UploadCloud,
  CheckCircle2,
  Maximize2,
  ZoomIn,
  ZoomOut,
  X,
  Pencil,
  Save,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'
// @ts-ignore
import Papa from 'papaparse'

interface Product {
  id: string
  title: string
  description: string | null
  price: number | null
  currency: string | null
  product_url: string | null
  image_url: string | null
  source: string
  is_active: boolean
  lifecycle_status?: string | null
  created_at: string
}

interface CatalogStoreSummary {
  id: string
  canonical_url: string
  platform: string
  sync_status: string
  last_synced_at: string | null
  last_error: string | null
  product_count: number
  last_extractor_used: string | null
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', price: '', product_url: '' })
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null)

  // CSV State
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isCsvUploading, setIsCsvUploading] = useState(false)
  const [syncReport, setSyncReport] = useState<{ updated: number; inserted: number; errors: number; errorDetails?: string[] } | null>(null)

  // Store URL import
  const [storeUrl, setStoreUrl] = useState('')
  const [storeImporting, setStoreImporting] = useState(false)
  const [catalogStores, setCatalogStores] = useState<CatalogStoreSummary[]>([])
  const [storeImportError, setStoreImportError] = useState<string | null>(null)

  // Image viewer
  const [viewingImage, setViewingImage] = useState<{ url: string; title: string } | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)

  // Inline editing
  const [editingProductId, setEditingProductId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ title: '', price: '', product_url: '' })
  const [editSaving, setEditSaving] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCatalogStores()
  }, [])

  async function fetchProducts() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setProducts((data as Product[]) || [])
    setLoading(false)
  }

  async function fetchCatalogStores() {
    try {
      const res = await fetch('/api/catalog/sync')
      if (!res.ok) return
      const data = await res.json()
      setCatalogStores(data.stores || [])
    } catch {
      /* non-fatal */
    }
  }

  async function handleStoreUrlImport() {
    if (!storeUrl.trim()) return
    setStoreImporting(true)
    setStoreImportError(null)
    try {
      const res = await fetch('/api/catalog/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeUrl: storeUrl.trim(), mode: 'async' }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || body.message || 'Import failed')

      if (body.report) {
        if (body.report.status === 'failed') {
          throw new Error(body.report.errorMessage || 'Import failed')
        }
        toast.success(
          `Imported ${body.report.inserted} new, updated ${body.report.updated}`
        )
        setStoreUrl('')
        await fetchProducts()
        await fetchCatalogStores()
        setStoreImporting(false)
        return
      }

      const storeId = body.store?.id
      toast.success('Catalog import started')
      // Poll until done
      if (storeId) {
        const started = Date.now()
        while (Date.now() - started < 120_000) {
          await new Promise((r) => setTimeout(r, 2000))
          const st = await fetch(`/api/catalog/sync?storeId=${storeId}&runs=1`)
          if (!st.ok) continue
          const payload = await st.json()
          const status = payload.store?.sync_status
          if (status === 'success' || status === 'partial') {
            const run = payload.latestRun
            toast.success(
              run
                ? `Imported ${run.products_inserted || 0} new, updated ${run.products_updated || 0}`
                : 'Catalog imported'
            )
            break
          }
          if (status === 'failed') {
            throw new Error(payload.store?.last_error || 'Import failed')
          }
        }
      }
      setStoreUrl('')
      await fetchProducts()
      await fetchCatalogStores()
    } catch (err: any) {
      setStoreImportError(err.message || 'Import failed')
      toast.error(err.message || 'Import failed')
    } finally {
      setStoreImporting(false)
    }
  }

  async function handleManualUpload() {
    if (!form.title) return
    setUploading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    let imageUrl = null
    if (uploadFile) {
      const formData = new FormData()
      formData.append("file", uploadFile)

      try {
        const upRes = await fetch("/api/images/upload", {
          method: "POST",
          body: formData
        })
        if (!upRes.ok) throw new Error("Image upload failed")
        const upData = await upRes.json()
        imageUrl = upData.url
      } catch (err: any) {
        toast.error(`Failed to upload image: ${err.message}`)
        setUploading(false)
        return
      }
    }

    await supabase.from('products').insert({
      user_id: user.id,
      title: form.title,
      description: form.description || null,
      price: form.price ? parseFloat(form.price) : null,
      product_url: form.product_url || null,
      image_url: imageUrl,
      source: 'manual',
    })

    setForm({ title: '', description: '', price: '', product_url: '' })
    setUploadFile(null)
    setShowUpload(false)
    setUploading(false)
    fetchProducts()
  }

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0])
      setSyncReport(null)
    }
  }

  const handleUploadCsv = async () => {
    if (!csvFile) return
    setIsCsvUploading(true)
    setSyncReport(null)

    Papa.parse(csvFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results: any) => {
        try {
          const res = await fetch("/api/sync/csv", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ rows: results.data }),
          })

          if (!res.ok) {
            const err = await res.json()
            throw new Error(err.message || "Failed to sync products")
          }

          const data = await res.json()
          toast.success("Products synced successfully via CSV!")
          setSyncReport(data.report)
          setCsvFile(null)
          fetchProducts()
        } catch (error: any) {
          toast.error(`Upload error: ${error.message}`)
        } finally {
          setIsCsvUploading(false)
        }
      },
      error: (error: any) => {
        toast.error(`CSV Parsing error: ${error.message}`)
        setIsCsvUploading(false)
      }
    })
  }

  async function handleDelete(productId: string) {
    const supabase = createClient()
    await supabase.from('products').delete().eq('id', productId)
    setProducts(prev => prev.filter(p => p.id !== productId))
    setDeletingProductId(null)
  }

  function startEditing(product: Product) {
    setEditingProductId(product.id)
    setEditForm({
      title: product.title || '',
      price: product.price ? String(product.price) : '',
      product_url: product.product_url || '',
    })
  }

  async function handleSaveEdit(productId: string) {
    setEditSaving(true)
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editForm.title,
          price: editForm.price ? parseFloat(editForm.price) : null,
          product_url: editForm.product_url || null,
        }),
      })
      if (res.ok) {
        setProducts(prev => prev.map(p => {
          if (p.id !== productId) return p
          return {
            ...p,
            title: editForm.title,
            price: editForm.price ? parseFloat(editForm.price) : null,
            product_url: editForm.product_url || null,
          }
        }))
        toast.success('Product updated')
      } else {
        toast.error('Failed to update product')
      }
    } catch (err) {
      toast.error('Update failed')
    }
    setEditSaving(false)
    setEditingProductId(null)
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="h-64 bg-muted rounded-2xl" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {products.length} product{products.length !== 1 ? 's' : ''} in your catalog
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      {/* Catalog stores status */}
      {catalogStores.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 bg-white p-4 space-y-3">
          <p className="text-sm font-medium text-neutral-900">Connected stores</p>
          <div className="space-y-2">
            {catalogStores.map((s) => (
              <div
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-neutral-100 bg-neutral-50 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-neutral-800">{s.canonical_url}</p>
                  <p className="text-xs text-neutral-500">
                    {s.platform} · {s.product_count} products · {s.sync_status}
                    {s.last_extractor_used ? ` · via ${s.last_extractor_used}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={storeImporting || s.sync_status === 'running'}
                  onClick={async () => {
                    setStoreUrl(s.canonical_url)
                    setStoreImporting(true)
                    try {
                      const res = await fetch('/api/catalog/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ storeUrl: s.canonical_url, mode: 'async' }),
                      })
                      if (!res.ok) {
                        const b = await res.json().catch(() => ({}))
                        throw new Error(b.error || 'Re-sync failed')
                      }
                      toast.success('Re-sync queued')
                      setTimeout(() => {
                        fetchProducts()
                        fetchCatalogStores()
                      }, 4000)
                    } catch (e: any) {
                      toast.error(e.message || 'Re-sync failed')
                    } finally {
                      setStoreImporting(false)
                    }
                  }}
                  className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
                >
                  Re-sync
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unified Upload Dashboard */}
      {showUpload && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-white border border-neutral-200 rounded-2xl">

          {/* Store URL */}
          <div className="space-y-5 lg:border-r lg:border-neutral-100 lg:pr-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-neutral-500" /> Store URL
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                Import a public catalog — no Shopify app or API keys.
              </p>
            </div>
            <div className="space-y-3">
              <input
                type="url"
                value={storeUrl}
                onChange={(e) => setStoreUrl(e.target.value)}
                placeholder="https://yourstore.com"
                className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              {storeImportError && (
                <p className="text-xs text-red-600">{storeImportError}</p>
              )}
              <button
                onClick={handleStoreUrlImport}
                disabled={!storeUrl.trim() || storeImporting}
                className="w-full bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {storeImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                {storeImporting ? 'Importing…' : 'Import from URL'}
              </button>
            </div>
          </div>

          {/* Manual Form */}
          <div className="space-y-5 lg:border-r lg:border-neutral-100 lg:pr-6">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-neutral-500" /> Manual Product
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Add a single product to your catalog manually.</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product Name *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g., Ceramic Watering Can"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Price</label>
                <input
                  type="number"
                  value={form.price}
                  onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                  placeholder="49.99"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief product description..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product URL</label>
                <input
                  type="url"
                  value={form.product_url}
                  onChange={e => setForm(p => ({ ...p, product_url: e.target.value }))}
                  placeholder="https://store.com/product/..."
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Product Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-sm file:mr-3 file:px-3 file:py-2 file:rounded-lg file:border-0 file:bg-neutral-100 file:text-sm file:font-medium hover:file:bg-neutral-200"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <button
                onClick={handleManualUpload}
                disabled={!form.title || uploading}
                className="flex-1 bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {uploading ? 'Adding...' : 'Add Manually'}
              </button>
              <button
                onClick={() => setShowUpload(false)}
                className="px-5 py-2.5 rounded-xl text-sm border border-neutral-200 hover:bg-neutral-50"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* CSV Upload */}
          <div className="space-y-5">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-neutral-500" /> Bulk CSV
              </h3>
              <p className="text-xs text-muted-foreground mt-1">Fallback when URL import is blocked. Shopify export format works best.</p>
            </div>

            <div className="space-y-4 pt-1">
              <div className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center bg-neutral-50 transition-colors hover:border-neutral-400/50">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvFileChange}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500">
                    <UploadCloud className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900">Click to upload CSV</span>
                    <p className="text-xs text-neutral-500 mt-0.5">or drag and drop</p>
                  </div>
                </label>
              </div>

              {csvFile && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-50 border border-green-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900 truncate max-w-[200px]">{csvFile.name} ready</span>
                  </div>
                </div>
              )}

              {syncReport && (
                <div className="p-4 bg-neutral-50 rounded-xl text-sm text-neutral-700 space-y-1">
                  <p className="font-semibold">Sync Report</p>
                  <p>Created: <span className="text-green-600 font-semibold">{syncReport.inserted}</span></p>
                  <p>Updated: <span className="text-blue-600 font-semibold">{syncReport.updated}</span></p>
                  <p>Errors: <span className="text-red-600 font-semibold">{syncReport.errors}</span></p>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleUploadCsv}
                  disabled={!csvFile || isCsvUploading}
                  className="w-full bg-neutral-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isCsvUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                  {isCsvUploading ? 'Syncing...' : 'Sync via CSV'}
                </button>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Product Masonry Grid */}
      {products.length === 0 ? (
        <div className="text-center py-16 bg-neutral-50 rounded-2xl border border-dashed border-neutral-200">
          <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <h3 className="font-medium text-neutral-600 mb-1">No products yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add products manually or connect your Shopify/Etsy store.
          </p>
          <button
            onClick={() => setShowUpload(true)}
            className="bg-neutral-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-neutral-800 inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add First Product
          </button>
        </div>
      ) : (
        <div className="columns-2 md:columns-3 lg:columns-4 gap-4">

          {products.map(product => (
            <div
              key={product.id}
              style={{ breakInside: 'avoid' }}
              className="mb-4 bg-[#ffffff] border border-[#e2e4e7] rounded-[24px] overflow-hidden group hover:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)] hover:border-[#d1d5db] transition-all duration-200"
            >
              {/* Image — natural aspect ratio */}
              <div className="relative mx-2 mt-2 sm:mx-3 sm:mt-3 rounded-[16px] bg-[#f2f3f5] overflow-hidden border border-[#e2e4e7]/50">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-auto block"
                    loading="lazy"
                    style={{ minHeight: '120px' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : (
                  <div className="w-full flex items-center justify-center py-16">
                    <ShoppingBag className="w-10 h-10 text-[#d1d5db]" />
                  </div>
                )}
                {/* Source + lifecycle badges */}
                <span className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider text-[#1a1a1a] shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-[#e2e4e7]">
                  {product.source?.startsWith('store_crawl') ? 'crawl' : product.source}
                </span>
                {product.lifecycle_status && product.lifecycle_status !== 'active' && (
                  <span className={`absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider border ${
                    product.lifecycle_status === 'unavailable'
                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                      : product.lifecycle_status === 'updated'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : 'bg-neutral-50 text-neutral-600 border-neutral-200'
                  }`}>
                    {product.lifecycle_status}
                  </span>
                )}
                {/* Expand image — always visible on mobile */}
                {product.image_url && (
                  <button
                    onClick={e => { e.stopPropagation(); setViewingImage({ url: product.image_url!, title: product.title || 'Product Image' }); setZoomLevel(1) }}
                    className="cursor-pointer absolute bottom-2 right-2 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm text-white/80 hover:text-white flex items-center justify-center transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    title="View full image"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Info */}
              <div className="p-3 sm:p-4">
                {editingProductId === product.id ? (
                  /* Inline Edit Form */
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Product name"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                    />
                    <input
                      type="number"
                      value={editForm.price}
                      onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))}
                      placeholder="Price"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                    />
                    <input
                      type="url"
                      value={editForm.product_url}
                      onChange={e => setEditForm(f => ({ ...f, product_url: e.target.value }))}
                      placeholder="https://your-store.com/product/..."
                      className={`w-full px-2.5 py-1.5 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900/10 ${
                        editForm.product_url && !/^https?:\/\/.+/.test(editForm.product_url)
                          ? 'border-red-300 bg-red-50 text-red-600'
                          : 'border-neutral-200'
                      }`}
                    />
                    <div className="flex gap-1.5 pt-1">
                      <button
                        onClick={() => handleSaveEdit(product.id)}
                        disabled={editSaving || !editForm.title}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {editSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingProductId(null)}
                        className="px-2 py-1.5 rounded-lg border border-neutral-200 text-xs text-neutral-500 hover:bg-neutral-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal View */
                  <>
                    <h3 className="font-bold text-[14px] text-[#1a1a1a] line-clamp-2 leading-snug">
                      {product.title}
                    </h3>
                    {product.price && (
                      <p className="text-[13px] text-[#666666] mt-1 font-medium">
                        ${Number(product.price).toFixed(2)} {product.currency}
                      </p>
                    )}
                    {/* URL indicator */}
                    {(!product.product_url || product.product_url === '#' || !/^https?:\/\/.+/.test(product.product_url)) && (
                      <div className="flex items-center gap-1 mt-1.5 text-amber-600">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[10px] font-semibold">Missing valid URL</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#e2e4e7]/50">
                      {/* Edit button */}
                      <button
                        onClick={() => startEditing(product)}
                        className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af] hover:text-neutral-700 flex items-center gap-1 transition-colors"
                      >
                        <Pencil className="w-3 h-3" strokeWidth={2.2} /> Edit
                      </button>
                      <span className="flex-1" />
                      {deletingProductId === product.id ? (
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 mr-1">Confirm?</span>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="text-[10px] font-bold uppercase tracking-wider text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-[6px] transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeletingProductId(null)}
                            className="text-[10px] font-bold uppercase tracking-wider text-[#666666] hover:text-[#1a1a1a] bg-[#f2f3f5] hover:bg-[#e5e7eb] px-2 py-1 rounded-[6px] transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeletingProductId(product.id)}
                          className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af] hover:text-red-500 flex items-center gap-1 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" strokeWidth={2.2} /> Remove
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center"
          onClick={() => setViewingImage(null)}
        >
          {/* Top bar */}
          <div className="absolute top-0 inset-x-0 flex items-center justify-between px-4 py-3 z-10">
            <p className="text-white/70 text-sm font-medium truncate max-w-[60%]">{viewingImage.title}</p>
            <div className="flex items-center gap-2">
              <button
                onClick={e => { e.stopPropagation(); setZoomLevel(z => Math.max(0.5, z - 0.5)) }}
                className="cursor-pointer w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-white/60 text-xs font-mono min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={e => { e.stopPropagation(); setZoomLevel(z => Math.min(5, z + 0.5)) }}
                className="cursor-pointer w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewingImage(null)}
                className="cursor-pointer w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors ml-2"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Image */}
          <div
            className="overflow-auto max-w-full max-h-full flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
            style={{ touchAction: 'pinch-zoom' }}
          >
            <img
              src={viewingImage.url}
              alt={viewingImage.title}
              className="transition-transform duration-200 ease-out rounded-lg select-none"
              style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center', maxHeight: '85vh', maxWidth: '90vw', objectFit: 'contain' }}
              draggable={false}
              onDoubleClick={() => setZoomLevel(z => z === 1 ? 2.5 : 1)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
