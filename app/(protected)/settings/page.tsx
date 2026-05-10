'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Loader2, Check, Store, Palette, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { motion } from 'motion/react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AutomationControl } from '@/components/dashboard/automation-control'
import { SurfaceHeader } from '@/components/ui/surface-header'
import { AESTHETIC_OPTIONS, type BrandSettingsData } from '@/lib/constants/brand'

const EMPTY_BOARD_VALUE = '__no_board__'

export default function BrandSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [settingsId, setSettingsId] = useState<string | null>(null)
  const [form, setForm] = useState<BrandSettingsData>({
    brand_name: '',
    brand_description: '',
    store_url: '',
    logo_url: '',
    aesthetic_boundaries: [],
    default_board_id: '',
    account_age_type: '',
    show_brand_url: true,
  })
  const [boards, setBoards] = useState<{ id: string; name: string }[]>([])
  const [loadingBoards, setLoadingBoards] = useState(false)

  // Refs for debounced auto-save (avoids stale closures)
  const hasLoaded = useRef(false)
  const settingsIdRef = useRef<string | null>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => { settingsIdRef.current = settingsId }, [settingsId])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userIdRef.current = user.id

      const { data } = await supabase
        .from('brand_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (data) {
        setSettingsId(data.id)
        settingsIdRef.current = data.id
        setForm({
          brand_name: data.brand_name || '',
          brand_description: data.brand_description || '',
          store_url: data.store_url || '',
          logo_url: data.logo_url || '',
          aesthetic_boundaries: (data.aesthetic_boundaries as string[]) || [],
          default_board_id: data.default_board_id || '',
          account_age_type: data.account_age_type || '',
          show_brand_url: data.show_brand_url ?? true,
        })
      }

      // Fetch user's Pinterest boards
      try {
        setLoadingBoards(true)
        const res = await fetch('/api/pinterest/boards')
        if (res.ok) {
          const bData = await res.json()
          setBoards(bData.boards || [])
        }
      } catch (err) {
        console.error('Failed to fetch boards', err)
      } finally {
        setLoadingBoards(false)
      }

      setLoading(false)
      // Allow auto-save only after initial load completes
      setTimeout(() => { hasLoaded.current = true }, 50)
    }
    load()
  }, [])

  const toggleAesthetic = (tag: string) => {
    setForm(prev => ({
      ...prev,
      aesthetic_boundaries: prev.aesthetic_boundaries.includes(tag)
        ? prev.aesthetic_boundaries.filter(t => t !== tag)
        : prev.aesthetic_boundaries.length < 3
          ? [...prev.aesthetic_boundaries, tag]
          : prev.aesthetic_boundaries,
    }))
  }

  // Debounced auto-save — fires 800ms after any form change
  useEffect(() => {
    if (!hasLoaded.current) return

    const timer = setTimeout(async () => {
      const userId = userIdRef.current
      if (!userId || !form.brand_name) return

      const supabase = createClient()
      const payload = {
        user_id: userId,
        brand_name: form.brand_name,
        brand_description: form.brand_description,
        store_url: form.store_url,
        logo_url: form.logo_url,
        aesthetic_boundaries: form.aesthetic_boundaries,
        default_board_id: form.default_board_id,
        account_age_type: form.account_age_type,
        show_brand_url: form.show_brand_url,
      }

      try {
        if (settingsIdRef.current) {
          const { error } = await supabase.from('brand_settings').update(payload).eq('id', settingsIdRef.current)
          if (error) throw error
        } else {
          const { data, error } = await supabase.from('brand_settings').insert(payload).select('id').single()
          if (error) throw error
          if (data) { setSettingsId(data.id); settingsIdRef.current = data.id }
        }

        if (form.account_age_type) {
          const warmupPhase = form.account_age_type === 'brand_new' ? 'warmup_partial' : 'full'
          await supabase.from('pinterest_connections').update({ warmup_phase: warmupPhase }).eq('user_id', userId)
        }

        toast.success('Changes saved', { duration: 1500 })
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Failed to save')
      }
    }, 800)

    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-muted rounded w-64" />
        <div className="h-96 bg-muted rounded-xl" />
      </div>
    )
  }

  const surfaceClass = 'bg-white border border-[#e2e4e7] rounded-xl p-4 relative z-10'

  return (
    <div className="pb-16">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-950">Brand Settings</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Refine how EcomPin looks, publishes, and behaves for your brand.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-500">
          <Check className="h-3.5 w-3.5" />
          Changes save automatically
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)] xl:gap-10">
        <div className="space-y-6">
          <AutomationControl variant="panel" />

          <section className={surfaceClass}>
            <div className="mb-6">
              <SurfaceHeader
                icon={Zap}
                eyebrow="Publishing"
                title="Destination and safety"
                description="Choose where approved pins go and how cautiously EcomPin should ramp up activity."
              />
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[15px] font-semibold text-[#1a1a1a]">Default Pinterest Board</label>
                <p className="text-[13px] text-[#666666]">Where approved pins should publish by default.</p>
                {loadingBoards ? (
                  <div className="flex items-center gap-2 text-[13px] text-[#666666]">
                    <Loader2 className="h-4 w-4 animate-spin" /> Fetching your boards...
                  </div>
                ) : (
                  <Select
                    value={form.default_board_id || EMPTY_BOARD_VALUE}
                    onValueChange={value => setForm(p => ({
                      ...p,
                      default_board_id: value === EMPTY_BOARD_VALUE ? '' : value,
                    }))}
                    disabled={!boards.length}
                  >
                    <SelectTrigger className="h-[46px] w-full rounded-xl border border-[#e2e4e7] bg-[#f2f3f5] px-4 text-[15px] text-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:bg-white focus:ring-2 focus:ring-[#1a1a1a]/20 transition-colors">
                      <SelectValue placeholder="Select a board" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-neutral-200 bg-white shadow-lg">
                      <SelectItem value={EMPTY_BOARD_VALUE} className="rounded-lg py-2.5 text-sm">
                        No default board
                      </SelectItem>
                      {boards.map(b => (
                        <SelectItem key={b.id} value={b.id} className="rounded-lg py-2.5 text-sm">
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="rounded-xl border border-[#e2e4e7]/80 bg-[#f2f3f5]/50 p-5 mt-2">
                <SurfaceHeader
                  icon={ShieldCheck}
                  eyebrow="Account protection"
                  title="Warm-up profile"
                  titleTag="h3"
                  titleClassName="text-[15px] font-bold text-[#1a1a1a]"
                  description="This sets how cautiously EcomPin increases publishing volume to keep your Pinterest account healthy."
                />

                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {[
                    {
                      id: 'brand_new' as const,
                      title: 'Brand new',
                      subtitle: 'Created within the last 3 months',
                      detail: 'Starts gently and ramps up over time to avoid early spam signals.',
                      Icon: Sparkles,
                    },
                    {
                      id: 'established' as const,
                      title: 'Established',
                      subtitle: 'Already has account history and activity',
                      detail: 'Begins publishing at full safe velocity from day one.',
                      Icon: Zap,
                    },
                  ].map(option => {
                    const selected = form.account_age_type === option.id

                    return (
                      <motion.button
                        key={option.id}
                        type="button"
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setForm(p => ({ ...p, account_age_type: option.id }))}
                        className={`cursor-pointer rounded-xl p-5 text-left transition-all outline-none focus:outline-none ${selected
                          ? 'bg-white border-2 border-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.1)]'
                          : 'bg-white border border-[#e2e4e7] hover:bg-[#f9fafb]'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-[16px] border transition-colors ${selected ? 'bg-[#1a1a1a] border-[#1a1a1a] text-white' : 'bg-white border-[#e2e4e7] text-[#1a1a1a]'
                              }`}>
                              <option.Icon className="h-5 w-5" strokeWidth={selected ? 2.2 : 2} />
                            </span>
                            <div className="min-w-0">
                              <div className={`text-[15px] font-bold ${selected ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]'}`}>{option.title}</div>
                              <div className="mt-1 text-[13px] leading-5 text-[#666666]">{option.subtitle}</div>
                            </div>
                          </div>
                          <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all ${selected
                            ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                            : 'border-[#e2e4e7] bg-[#f2f3f5] text-transparent'
                            }`}>
                            <Check className="h-3.5 w-3.5" strokeWidth={3} />
                          </span>
                        </div>
                        <p className="mt-4 text-[13px] leading-6 text-[#666666]">{option.detail}</p>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>

          <section className={surfaceClass}>
            <div className="mb-6">
              <SurfaceHeader
                icon={Store}
                eyebrow="Brand identity"
                title="Core brand profile"
                description="Name your brand clearly so EcomPin can write, render, and label pins consistently."
              />
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[15px] font-semibold text-[#1a1a1a]">Brand Name</label>
                <Input
                  value={form.brand_name}
                  onChange={e => setForm(p => ({ ...p, brand_name: e.target.value }))}
                  placeholder="e.g., Artisan Home Co."
                  className="h-[46px] rounded-xl border border-[#e2e4e7] bg-[#f2f3f5] px-4 text-[15px] text-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:bg-white focus:ring-2 focus:ring-[#1a1a1a]/20 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[15px] font-semibold text-[#1a1a1a]">Brand Description</label>
                <Textarea
                  value={form.brand_description}
                  onChange={e => setForm(p => ({ ...p, brand_description: e.target.value }))}
                  placeholder="A concise description of your brand, products, and taste."
                  rows={4}
                  className="rounded-xl border border-[#e2e4e7] bg-[#f2f3f5] px-4 py-3 resize-none text-[15px] text-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:bg-white focus:ring-2 focus:ring-[#1a1a1a]/20 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[15px] font-semibold text-[#1a1a1a]">Pin Label</label>
                <Input
                  type="text"
                  value={form.store_url}
                  onChange={e => setForm(p => ({ ...p, store_url: e.target.value }))}
                  placeholder="yourshop.com"
                  maxLength={40}
                  className="h-[46px] rounded-xl border border-[#e2e4e7] bg-[#f2f3f5] px-4 text-[15px] text-[#1a1a1a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] focus:bg-white focus:ring-2 focus:ring-[#1a1a1a]/20 transition-colors"
                />
                <p className="text-[13px] text-[#666666]">Printed on your pin images when the badge is on. Keep it short — use your domain (yourshop.com) or store name (My Shop).</p>
              </div>

              <div className="pt-2">
                <div className="flex items-center justify-between bg-[#f2f3f5] p-3 rounded-xl border border-[#e2e4e7]/80">
                  <div className="pl-2">
                    <label className="text-[15px] font-semibold text-[#1a1a1a]">Show Pin Label on Pins</label>
                    <p className="mt-0.5 text-[13px] text-[#666666]">Overlay your store label as a CTA badge on generated pin images.</p>
                  </div>
                  <div className="bg-white px-1 pt-1 rounded-xl border border-[#e2e4e7]">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={form.show_brand_url}
                      onClick={() => setForm(p => ({ ...p, show_brand_url: !p.show_brand_url }))}
                      className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${form.show_brand_url ? 'bg-[#1a1a1a]' : 'bg-[#e5e7eb]'
                        }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] ring-0 transition-transform ${form.show_brand_url ? 'translate-x-4' : 'translate-x-0'
                          }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section className={surfaceClass}>
          <div className="mb-6">
            <SurfaceHeader
              icon={Palette}
              eyebrow="Visual style"
              title="Creative direction"
              description="Define the visual system EcomPin should follow when composing pins for your feed."
            />
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <label className="text-[15px] font-semibold text-[#1a1a1a]">Aesthetic Boundaries</label>
                  <p className="mt-1 text-[13px] text-[#666666]">Tell the AI Art Director what visual styles to aim for. It will avoid anything outside these boundaries.</p>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#9ca3af]">Up to 3</span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {AESTHETIC_OPTIONS.map(opt => {
                  const selected = form.aesthetic_boundaries.includes(opt.name)

                  return (
                    <motion.button
                      key={opt.name}
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleAesthetic(opt.name)}
                      className={`cursor-pointer overflow-hidden rounded-xl text-left transition-all outline-none focus:outline-none ${selected
                        ? 'border-2 border-[#1a1a1a] bg-white '
                        : 'border border-[#e2e4e7] bg-white  '
                        }`}
                    >
                      <div className={`h-[72px] w-full bg-gradient-to-br ${opt.gradient} ${selected ? 'opacity-100' : 'opacity-80'}`} />
                      <div className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="block text-[15px] font-bold text-[#1a1a1a]">{opt.name}</span>
                            <span className="mt-1 block text-[13px] text-[#666666]">{opt.desc}</span>
                          </div>
                          {selected && (
                            <span className="rounded-[12px] bg-[#1a1a1a] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-white">
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
