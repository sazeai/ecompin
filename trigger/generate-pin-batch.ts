import { schedules, logger } from "@trigger.dev/sdk/v3"
import { createAdminClient } from "@/utils/supabase/admin"
import { putR2Object } from "@/lib/r2"
import { GoogleGenAI } from "@google/genai"
import { fal } from "@fal-ai/client"
import {
  normalizeAestheticTag,
  pickAestheticForPin,
  aestheticIndexForProduct,
  AESTHETIC_DEFINITIONS,
} from "@/lib/context-matrix"
import { isDigitalProduct } from "@/lib/product-showcase"
import {
  buildScenePrompt,
  buildImagePrompt,
  buildAngleText,
  parseSceneFields,
  SCENE_RESPONSE_SCHEMA,
  AESTHETIC_STYLE_ANCHORS,
  type SceneFields,
} from "@/lib/scene-prompt"
import { validatePrompt, rewritePrompt } from "@/lib/prompt-critic"
import { adminHasCredits, adminDeductCredits } from "@/lib/credits"
import { generateEmbedding } from "@/lib/gemini-embedding"

const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY })
fal.config({ credentials: process.env.FAL_KEY || "" })

const AUTHENTIC_HANDMADE_TAG = "Authentic & Handmade"

// Fisher-Yates shuffle — ensures the Approval Inbox feels like a curated magazine, not a bulk generator
function shuffleArray<T>(array: T[]): T[] {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * Single-pass scene planner.
 *
 * Replaces the old three-stage Showcase + Angle + Art Director pipeline with:
 *   1. pickAestheticForPin (free, no API)
 *   2. ONE Gemini call that returns structured scene fields + SEO copy
 *   3. ONE embedding call for dedup
 *   4. Deterministic prompt build (no LLM)
 *   5. Critic pre-flight (rule-based, no LLM); deterministic rewrite on fail
 *
 * The image is passed in once. The LLM is called once. The result is ready for fal.ai.
 */
async function planScene(args: {
  supabase: any
  product: { id: string; title: string; description?: string }
  productImageBase64: string | null
  productImageMimeType: string | null
  brand: { id: string; user_id: string; aesthetic_boundaries: string[] }
  pastAngles: string[]
  prodPins: any[]
  aestheticWeights?: Record<string, number>
  forceAestheticTag?: string
}): Promise<{
  fields: SceneFields
  imagePrompt: string
  angleText: string
  embedding: number[]
  pickedAesthetic: { tag: string; definition: string; styleAnchor: string }
  targetAngle: string
} | null> {
  const prodPinCount = args.prodPins.length
  const indexKey = args.forceAestheticTag
    ? 0
    : aestheticIndexForProduct(args.product.id, prodPinCount)

  const pickedAesthetic = args.forceAestheticTag
    ? {
        tag: args.forceAestheticTag,
        definition: AESTHETIC_DEFINITIONS[args.forceAestheticTag] || args.forceAestheticTag,
        styleAnchor: AESTHETIC_STYLE_ANCHORS[args.forceAestheticTag] || "",
      }
    : (() => {
        const p = pickAestheticForPin(args.brand.aesthetic_boundaries || [], indexKey, args.aestheticWeights)
        return { ...p, styleAnchor: AESTHETIC_STYLE_ANCHORS[p.tag] || "" }
      })()

  // ONE Gemini call. Returns structured fields + SEO copy.
  const promptText = buildScenePrompt({
    title: args.product.title,
    description: args.product.description,
    aestheticTag: pickedAesthetic.tag,
    aestheticDefinition: pickedAesthetic.definition,
    pastAngles: args.pastAngles,
  })

  const promptParts: any[] = [{ text: promptText }]
  if (args.productImageBase64 && args.productImageMimeType) {
    promptParts.push({
      inlineData: { data: args.productImageBase64, mimeType: args.productImageMimeType },
    })
  }

  let fields: SceneFields | null = null
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptParts,
      config: {
        temperature: 0.6,
        responseMimeType: "application/json",
        responseSchema: SCENE_RESPONSE_SCHEMA,
      },
    })
    fields = parseSceneFields(JSON.parse(response.text?.trim() || "{}"))
  } catch (err) {
    logger.error(`Scene plan call failed for ${args.product.title}: ${(err as Error).message}`)
    return null
  }

  if (!fields) {
    logger.error(`Scene plan returned malformed fields for ${args.product.title}`)
    return null
  }

  // Deterministic prompt build from the structured fields.
  let imagePrompt = buildImagePrompt(fields, pickedAesthetic)
  let workingFields = fields

  // Critic pre-flight. Rule-based. NO LLM retry.
  const criticContext = {
    physicalScale: fields.physicalScale,
    presentationMode: fields.presentationMode,
    forbiddenContexts: fields.forbiddenContexts,
    isKidsProduct: /\b(kid|baby|nursery|toddler|infant|newborn|playmat|teether|onesie)\b/i.test(
      `${args.product.title} ${args.product.description || ""}`,
    ),
    isWeddingProduct: /\b(wax seal|groomsmen|bridesmaid|wedding favor|place card|table number|wedding|bridal|engagement|proposal)\b/i.test(
      `${args.product.title} ${args.product.description || ""}`,
    ),
    isWallArtProduct: /\b(wall art|art print|poster|canvas print|framed art|gallery print|typography print|nursery print)\b/i.test(
      `${args.product.title} ${args.product.description || ""}`,
    ),
  }
  const criticResult = validatePrompt(imagePrompt, criticContext)
  if (!criticResult.valid) {
    logger.warn(`Critic flagged: ${criticResult.issues.join("; ")} — applying deterministic rewrite`)
    const rewritten = rewritePrompt(imagePrompt, criticResult.issues, fields, pickedAesthetic)
    imagePrompt = rewritten.prompt
    workingFields = rewritten.correctedFields
  }

  // ONE embedding for dedup. No retry loop.
  const angleText = buildAngleText(workingFields)
  let embedding: number[] = []
  try {
    embedding = await generateEmbedding(angleText)
  } catch (err) {
    logger.warn(`Embedding failed for ${args.product.title}, continuing without dedup: ${(err as Error).message}`)
  }

  // The target_angle stored on pins is the human-readable scene+lighting phrase.
  const targetAngle = angleText

  return {
    fields: workingFields,
    imagePrompt,
    angleText,
    embedding,
    pickedAesthetic,
    targetAngle,
  }
}

/**
 * PinLoop — Autonomous Pin Generation Batch Task
 * 
 * Runs every 6 hours. For each user with active brand settings:
 * 1. Picks products that need new pins
 * 2. Calls the generate-pin API (Art Director → Image Gen)
 * 3. Calls the render-pin API (text overlay + CTA badge)
 * 4. Uploads final rendered pin to R2
 * 5. Enqueues the pin for publishing
 * 
 * Rate limit: max 3 pins per user per batch to avoid API quota issues.
 */
export const generatePinBatch = schedules.task({
  id: "pinloop-generate-batch",
  cron: "0 */6 * * *",
  run: async () => {
    logger.info("🎨 EcomPin batch generator started")

    const supabase = createAdminClient() as any



    // Get all users with brand settings
    const { data: brands, error } = await supabase
      .from("brand_settings")
      .select("id, user_id, brand_name, store_url, aesthetic_boundaries, automation_paused, show_brand_url")

    if (error || !brands || brands.length === 0) {
      logger.info("No users with brand settings found")
      return { result: "No brands", count: 0 }
    }

    let totalGenerated = 0

    for (const brand of brands) {
      try {
        // Skip users who have paused automation
        if (brand.automation_paused) {
          logger.info(`User ${brand.user_id}: automation paused, skipping generation`)
          continue
        }

        logger.info(`Processing brand: ${brand.brand_name} (user: ${brand.user_id})`)

        // Check if user has a subscription (basic entitlement check)
        const { data: sub } = await supabase
          .from("dodo_subscriptions")
          .select("status")
          .eq("user_id", brand.user_id)
          .eq("status", "active")
          .maybeSingle()

        if (!sub) {
          logger.info(`User ${brand.user_id} has no active subscription, skipping`)
          continue
        }

        // 1. API Safeguards: Check 150-pin monthly generation limit
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

        const { count: cycleGenerations } = await supabase
          .from("pins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", brand.user_id)
          .gte("created_at", thirtyDaysAgo.toISOString())

        if ((cycleGenerations || 0) >= 150) {
          logger.warn(`User ${brand.user_id} hit the 150/mo API Safeguard limit. Pausing automation.`)
          // Auto-pause their automation to protect API costs from going rogue or endless rejections
          await supabase.from("brand_settings").update({ automation_paused: true }).eq("id", brand.id)
          continue
        }

        // Check pending approval cap (> 50 pins waiting = skip generation)
        const { count: pendingCount } = await supabase
          .from("pins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", brand.user_id)
          .eq("status", "pending_approval")

        if ((pendingCount || 0) >= 50) {
          logger.info(`User ${brand.user_id} has >= 50 pins pending approval. Skipping generation to save API costs.`)
          continue
        }

        // Get products that need pins (active + available products that have an image).
        // lifecycle_status unavailable/deleted must never receive new pins (out-of-stock protection).
        const { data: products } = await supabase
          .from("products")
          .select("id, title, description, image_r2_key, image_url, tags, lifecycle_status")
          .eq("user_id", brand.user_id)
          .eq("is_active", true)
          .not("image_url", "is", null)
          .or("lifecycle_status.is.null,lifecycle_status.in.(active,updated)")

        if (!products || products.length === 0) {
          logger.info(`No products with images for user ${brand.user_id}`)
          continue
        }

        // 1. Calculate Monthly Quota (100-Pin Hard Cap)
        const pastThirtyDays = new Date()
        pastThirtyDays.setDate(pastThirtyDays.getDate() - 30)

        const { data: userPins } = await supabase
          .from("pins")
          .select("id, product_id, created_at, status, target_angle")
          .eq("user_id", brand.user_id)

        const monthlyPins = (userPins || []).filter((p: any) => new Date(p.created_at) >= pastThirtyDays)
        if (monthlyPins.length >= 100) {
          logger.info(`User ${brand.user_id} hit the 100-pin monthly quota limit. Skipping generation.`)
          continue
        }

        // 2. Filter Eligible Products
        // Dynamic per-product cap: distribute 100-pin quota evenly across catalog.
        // With 2 products → max 15 each. With 40 products → max 3 each. Hard ceiling of 15.
        const perProductCap = Math.min(15, Math.ceil(100 / products.length))

        const eligibleProducts = products.filter((prod: any) => {
          const prodPins = (userPins || []).filter((p: any) => p.product_id === prod.id)
          // Check pending approval queue limit (max 10 sitting unapproved)
          const pendingCount = prodPins.filter((p: any) => !['published', 'failed'].includes(p.status)).length
          if (pendingCount >= 10) return false
          // Check monthly per-product cap
          const monthlyProdPins = prodPins.filter((p: any) => new Date(p.created_at) >= pastThirtyDays)
          if (monthlyProdPins.length >= perProductCap) return false
          return true
        })

        if (eligibleProducts.length === 0) {
          logger.info(`All products for user ${brand.user_id} have sufficient pins or hit limit`)
          continue
        }

        // 3. Round-Robin Array: Sort products by oldest `last_generated_at`
        const productsWithLastGen = eligibleProducts.map((prod: any) => {
          const prodPins = (userPins || []).filter((p: any) => p.product_id === prod.id)
          let lastGenTime = 0
          if (prodPins.length > 0) {
            const dates = prodPins.map((p: any) => new Date(p.created_at).getTime())
            lastGenTime = Math.max(...dates)
          }
          return { ...prod, last_generated_at: lastGenTime }
        })

        productsWithLastGen.sort((a: any, b: any) => a.last_generated_at - b.last_generated_at)

        // Grab exactly 1 product to generate (4 pins generated a day on 6hr cron interval)
        const batchProducts = productsWithLastGen.slice(0, 1)

        for (const product of batchProducts) {
          try {
            logger.info(`Generating pin for product: ${product.title}`)

            // Skip digital/downloadable products — no physical product to composite
            if (isDigitalProduct({ title: product.title, description: product.description }, product.tags)) {
              logger.info(`Skipping digital product: ${product.title} — flagged for manual pin creation`)
              continue
            }

            // Resolve source image URL first — needed for both Showcase Resolver and Art Director
            const r2Domain = process.env.R2_PUBLIC_DOMAIN?.replace(/\/$/, "")
            const sourceImageUrl = product.image_url || (r2Domain && product.image_r2_key ? `${r2Domain}/${product.image_r2_key}` : "")

            if (!sourceImageUrl) {
              logger.error(`Skipping product ${product.title} because no valid image URL could be resolved`)
              continue
            }

            // Fetch product image once — reused by Showcase Resolver, Art Director, and fal.ai
            let productImageBase64: string | null = null
            let productImageMimeType: string | null = null
            try {
              const imgRes = await fetch(sourceImageUrl)
              if (imgRes.ok) {
                const imgBuffer = await imgRes.arrayBuffer()
                productImageBase64 = Buffer.from(imgBuffer).toString('base64')
                productImageMimeType = imgRes.headers.get('content-type') || 'image/jpeg'
              }
            } catch (err) {
              logger.warn(`Failed to fetch product image for multimodal context`)
            }

            // Compute per-product pin count once — used by aesthetic rotation and dedup.
            const prodPins = (userPins || []).filter((p: any) => p.product_id === product.id)

            // Past scene angles for semantic dedup (most recent first, across all products
            // so we don't repeat the same room/lighting combo for any product).
            const pastAngles = (userPins || [])
              .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((p: any) => p.target_angle)
              .filter(Boolean)

            // Fetch learned aesthetic weights from the feedback loop (aesthetic-optimizer.ts).
            // These weights bias selection toward aesthetics with higher CTR.
            let aestheticWeights: Record<string, number> | undefined
            try {
              const { data: weightRows } = await supabase
                .from("prompt_weights")
                .select("aesthetic_tags, weight")
                .eq("user_id", brand.user_id)
                .eq("brand_settings_id", brand.id)

              if (weightRows && weightRows.length > 0) {
                aestheticWeights = {}
                for (const row of weightRows) {
                  const tags = row.aesthetic_tags as string[]
                  if (tags && tags.length > 0 && row.weight) {
                    aestheticWeights[tags[0]] = Number(row.weight)
                  }
                }
                logger.info(`Loaded ${Object.keys(aestheticWeights).length} aesthetic weights for optimization`)
              }
            } catch {
              // No weights yet (cold start) — pickAestheticForPin falls back to round-robin
            }

            // ─── Stage: Single-pass scene plan ───────────────────────────
            // ONE Gemini call replaces the old Showcase + Angle + Art Director + SEO copy chain.
            // The image is sent in once, the structured fields come back, the fal.ai prompt is
            // built deterministically from those fields. Critic runs as a pre-flight rule check.
            logger.info(`Planning scene for: ${product.title}`)
            const plan = await planScene({
              supabase,
              product: { id: product.id, title: product.title, description: product.description },
              productImageBase64,
              productImageMimeType,
              brand: { id: brand.id, user_id: brand.user_id, aesthetic_boundaries: brand.aesthetic_boundaries || [] },
              pastAngles,
              prodPins,
              aestheticWeights,
            })
            if (!plan) {
              logger.error(`Scene planning failed for ${product.title} — skipping`)
              continue
            }

            const { imagePrompt: dynamicImagePrompt, targetAngle, embedding: angleEmbedding, pickedAesthetic, fields: sceneFields } = plan
            logger.info(`Picked aesthetic: "${pickedAesthetic.tag}" | Angle: "${targetAngle}"`)
            logger.info(`Art Director Prompt: ${dynamicImagePrompt}`)

            // Credit gate: verify the user has at least 1 credit before spending API budget
            const { hasCredits: hasSufficientCredits } = await adminHasCredits(brand.user_id, 1)
            if (!hasSufficientCredits) {
              logger.info(`User ${brand.user_id} has insufficient credits — skipping pin generation`)
              continue
            }

            // Firing Fal.ai Native Polling
            logger.info(`Starting fal.ai generation for ${product.title}...`)
            const result: any = await fal.subscribe("fal-ai/flux-2/edit", {
              input: {
                prompt: dynamicImagePrompt,
                num_inference_steps: 50,
                guidance_scale: 3.5,
                image_size: {
                  width: 1000,
                  height: 1500
                },
                num_images: 1,
                enable_safety_checker: true,
                acceleration: "regular",
                output_format: "png",
                image_urls: [sourceImageUrl],
              },
              logs: true,
              onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                  update.logs.map((log) => log.message).forEach(console.log)
                }
              },
            })

            const falImageUrl = result.data?.images?.[0]?.url
            if (!falImageUrl) {
              logger.error("Fal.ai returned no image URL. Full Result:", result)
              continue
            }
            logger.info(`✅ Fal.ai successfully generated image: ${falImageUrl}`)

            // Save pin record to DB to reserve ID
            const { data: pin } = await supabase.from('pins').insert({
              user_id: brand.user_id,
              product_id: product.id,
              brand_settings_id: brand.id,
              art_director_prompt: dynamicImagePrompt,
              target_angle: targetAngle,
              angle_embedding: angleEmbedding ? `[${Array.from(angleEmbedding).join(",")}]` : null,
              template_id: 'template-5',
              pin_title: product.title,
              aesthetic_tag: pickedAesthetic.tag,
              status: 'generating',
              is_mood_board: Math.random() < 0.1
            }).select('id').single()

            const pinId = pin?.id
            if (!pinId) {
              logger.error(`No pinId returned from DB for ${product.title}`)
              continue
            }

            // Download from Fal and save to R2
            logger.info(`Downloading image from Fal...`)
            const falImageRes = await fetch(falImageUrl)
            const falImageBuffer = Buffer.from(await falImageRes.arrayBuffer())
            const rawR2Key = `pin-images/${brand.user_id}/${pinId}-raw.png`
            await putR2Object(rawR2Key, falImageBuffer, "image/png")

            const rawImageUrl = r2Domain ? `${r2Domain}/${rawR2Key}` : rawR2Key

            // Save the raw image to DB immediately so it's not lost on render failure
            await supabase.from("pins").update({
              generated_image_url: rawImageUrl,
              generated_image_r2_key: rawR2Key
            }).eq("id", pinId)

            // SEO copy is now produced in the same single Gemini call as the scene plan
            // (see planScene → SCENE_RESPONSE_SCHEMA → seoTitle + seoDescription).
            const pinTitle = (sceneFields && sceneFields.seoTitle) || product.title
            const pinDescription = (sceneFields && sceneFields.seoDescription) || `Discover ${product.title}`

            // Save SEO title + description NOW, before render — so they survive render failures
            await supabase.from("pins").update({
              pin_title: pinTitle.slice(0, 100),
              pin_description: pinDescription.slice(0, 500),
            }).eq("id", pinId)
            logger.info(`SEO data saved for pin ${pinId}: "${pinTitle}"`)

            let appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000').replace(/\/$/, '')
            if (!appUrl.startsWith('http')) {
              // Vercel deployment URLs (e.g. ecompin.com) come without protocol
              appUrl = `https://${appUrl}`
            }

            // Render bypass: skip render-pin when brand URL watermark is disabled
            const shouldRender = brand.show_brand_url !== false && !!brand.store_url

            if (shouldRender) {
              // Call render-pin to add CTA badge overlay
              const renderRes = await fetch(`${appUrl}/api/render-pin`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  imageUrl: rawImageUrl,
                  storeUrl: brand.store_url || "",
                }),
              })

              if (!renderRes.ok) {
                const errText = await renderRes.text().catch(() => "Unable to read error text")
                logger.error(`Render failed for pin ${pinId}: STATUS ${renderRes.status} | MSG: ${errText} | Sent Image: ${rawImageUrl}`)
                await supabase.from("pins").update({ status: "failed", error_message: "Render failed" }).eq("id", pinId)
                continue
              }

              // Validate rendered image is not blank/broken (a real 1000x1500 PNG is >50KB)
              const renderedBuffer = Buffer.from(await renderRes.arrayBuffer())
              if (renderedBuffer.length < 10000) {
                logger.error(`Render returned suspiciously small image (${renderedBuffer.length} bytes) for pin ${pinId}. Likely a blank/black render. Marking as failed.`)
                await supabase.from("pins").update({ status: "failed", error_message: `Render produced blank image (${renderedBuffer.length} bytes)` }).eq("id", pinId)
                continue
              }

              const renderedR2Key = `pin-images/${brand.user_id}/${pinId}-final.png`
              await putR2Object(renderedR2Key, renderedBuffer, "image/png")

              const renderedImageUrl = r2Domain ? `${r2Domain}/${renderedR2Key}` : renderedR2Key

              await supabase
                .from("pins")
                .update({
                  rendered_image_url: renderedImageUrl,
                  rendered_image_r2_key: renderedR2Key,
                  status: "pending_approval",
                })
                .eq("id", pinId)
            } else {
              // No watermark — raw fal.ai image IS the final pin
              logger.info(`Skipping render-pin for pin ${pinId} (show_brand_url=false or no store_url)`)
              await supabase
                .from("pins")
                .update({
                  rendered_image_url: rawImageUrl,
                  rendered_image_r2_key: rawR2Key,
                  status: "pending_approval",
                })
                .eq("id", pinId)
            }

            // Pin now waits for user approval before entering publish queue

            // Deduct 1 credit for the successfully generated pin
            const { success: creditDeducted, error: creditError } = await adminDeductCredits(
              brand.user_id,
              1,
              `Pin generated: ${pinId}`
            )
            if (!creditDeducted) {
              logger.warn(`Credit deduction failed for user ${brand.user_id}: ${creditError}`)
            } else {
              logger.info(`💳 1 credit deducted for user ${brand.user_id} (pin ${pinId})`)
            }

            totalGenerated++
            logger.info(`✅ Pin generated → pending approval: ${pinId} for "${product.title}"`)

            // ─── A/B Experiment Triggering ───────────────────────────────
            // Conditions: product has ≥3 published pins, no running experiments,
            // user has ≥2 aesthetics, and 25% random chance per eligible product.
            // When triggered, generate a second pin with a different aesthetic.
            try {
              const publishedProdPins = prodPins.filter((p: any) => p.status === 'published')
              const hasSufficientHistory = publishedProdPins.length >= 3
              const hasMultipleAesthetics = (brand.aesthetic_boundaries || []).length >= 2
              const randomTrigger = Math.random() < 0.25

              if (hasSufficientHistory && hasMultipleAesthetics && randomTrigger) {
                // Check for existing running experiments on this product
                const { count: runningExperiments } = await supabase
                  .from("ab_experiments")
                  .select("id", { count: "exact", head: true })
                  .eq("product_id", product.id)
                  .eq("status", "running")

                if ((runningExperiments || 0) === 0) {
                  logger.info(`🧪 A/B experiment triggered for ${product.title}`)

                  // Pick a DIFFERENT aesthetic for the B variant
                  // Find the aesthetic with least performance data (most under-explored)
                  const usedTag = pickedAesthetic.tag
                  const altBoundaries = (brand.aesthetic_boundaries as string[]).filter(
                    (b: string) => normalizeAestheticTag(b) !== usedTag
                  )

                  if (altBoundaries.length > 0) {
                    // Pick the least-used aesthetic from weights, or random if no data
                    let altTag: string
                    if (aestheticWeights && Object.keys(aestheticWeights).length > 0) {
                      // Pick the aesthetic with least total data (lowest pin count)
                      const sorted = altBoundaries
                        .map(b => ({ tag: normalizeAestheticTag(b), weight: aestheticWeights![normalizeAestheticTag(b)] ?? 0 }))
                        .sort((a, b) => a.weight - b.weight)
                      altTag = sorted[0].tag
                    } else {
                      altTag = normalizeAestheticTag(altBoundaries[Math.floor(Math.random() * altBoundaries.length)])
                    }

                    // Credit gate for the B variant
                    const { hasCredits: hasCreditForB } = await adminHasCredits(brand.user_id, 1)
                    if (hasCreditForB) {
                      // B variant uses the same single-pass planner with the alt aesthetic forced.
                      // Including the A variant's angle in pastAngles forces the B scene to be different.
                      const bPlan = await planScene({
                        supabase,
                        product: { id: product.id, title: product.title, description: product.description },
                        productImageBase64,
                        productImageMimeType,
                        brand: { id: brand.id, user_id: brand.user_id, aesthetic_boundaries: [altTag] },
                        pastAngles: [...pastAngles, targetAngle],
                        prodPins: [...prodPins, { id: "_ab_marker" }],
                        aestheticWeights,
                        forceAestheticTag: altTag,
                      })

                      if (!bPlan) {
                        logger.warn(`B variant scene planning failed for ${product.title} — skipping A/B`)
                      } else {
                        const bImagePrompt = bPlan.imagePrompt
                        const bAltAngle = bPlan.targetAngle
                        const bAltEmbedding = bPlan.embedding

                        // Generate B image via fal.ai
                        const bResult: any = await fal.subscribe("fal-ai/flux-2/edit", {
                          input: {
                            prompt: bImagePrompt,
                            num_inference_steps: 50,
                            guidance_scale: 3.5,
                            image_size: { width: 1000, height: 1500 },
                            num_images: 1,
                            enable_safety_checker: true,
                            acceleration: "regular",
                            output_format: "png",
                            image_urls: [sourceImageUrl],
                          },
                          logs: true,
                          onQueueUpdate: (update) => {
                            if (update.status === "IN_PROGRESS") {
                              update.logs.map((log) => log.message).forEach(console.log)
                            }
                          },
                        })

                        const bFalImageUrl = bResult.data?.images?.[0]?.url
                        if (bFalImageUrl) {
                          // Save B pin to DB
                          const { data: pinB } = await supabase.from('pins').insert({
                            user_id: brand.user_id,
                            product_id: product.id,
                            brand_settings_id: brand.id,
                            art_director_prompt: bImagePrompt,
                            target_angle: bAltAngle,
                            angle_embedding: bAltEmbedding && bAltEmbedding.length > 0 ? `[${Array.from(bAltEmbedding).join(",")}]` : null,
                            template_id: 'template-5',
                            pin_title: (bPlan.fields && bPlan.fields.seoTitle) || product.title,
                            aesthetic_tag: altTag,
                            status: 'generating',
                            is_mood_board: false,
                          }).select('id').single()

                          if (pinB?.id) {
                            // Upload B image to R2
                            const bImgRes = await fetch(bFalImageUrl)
                            const bImgBuffer = Buffer.from(await bImgRes.arrayBuffer())
                            const bRawR2Key = `pin-images/${brand.user_id}/${pinB.id}-raw.png`
                            await putR2Object(bRawR2Key, bImgBuffer, "image/png")
                            const bRawImageUrl = r2Domain ? `${r2Domain}/${bRawR2Key}` : bRawR2Key

                            // Handle render (same logic as main pin)
                            const shouldRenderB = brand.show_brand_url !== false && !!brand.store_url
                            let bFinalUrl = bRawImageUrl
                            let bFinalKey = bRawR2Key

                            if (shouldRenderB) {
                              let appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000').replace(/\/$/, '')
                              if (!appUrl.startsWith('http')) appUrl = `https://${appUrl}`

                              const renderRes = await fetch(`${appUrl}/api/render-pin`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ imageUrl: bRawImageUrl, storeUrl: brand.store_url || "" }),
                              })
                              if (renderRes.ok) {
                                const renderedBuffer = Buffer.from(await renderRes.arrayBuffer())
                                if (renderedBuffer.length >= 10000) {
                                  const renderedKey = `pin-images/${brand.user_id}/${pinB.id}-final.png`
                                  await putR2Object(renderedKey, renderedBuffer, "image/png")
                                  bFinalUrl = r2Domain ? `${r2Domain}/${renderedKey}` : renderedKey
                                  bFinalKey = renderedKey
                                }
                              }
                            }

                            await supabase.from("pins").update({
                              generated_image_url: bRawImageUrl,
                              generated_image_r2_key: bRawR2Key,
                              rendered_image_url: bFinalUrl,
                              rendered_image_r2_key: bFinalKey,
                              status: "pending_approval",
                              // SEO copy was produced in the same planScene call — save it here.
                              pin_title: ((bPlan.fields && bPlan.fields.seoTitle) || product.title).slice(0, 100),
                              pin_description: ((bPlan.fields && bPlan.fields.seoDescription) || `Discover ${product.title}`).slice(0, 500),
                            }).eq("id", pinB.id)

                            // Create the experiment record
                            await supabase.from("ab_experiments").insert({
                              user_id: brand.user_id,
                              product_id: product.id,
                              pin_a_id: pinId,
                              pin_b_id: pinB.id,
                              aesthetic_a: pickedAesthetic.tag,
                              aesthetic_b: altTag,
                              status: "running",
                            })

                            // Deduct credit for B variant
                            await adminDeductCredits(brand.user_id, 1, `A/B test pin: ${pinB.id}`)

                            totalGenerated++
                            logger.info(`🧪 A/B experiment created: Pin A (${pickedAesthetic.tag}) vs Pin B (${altTag}) for "${product.title}"`)
                          }
                        }
                      }
                    } else {
                      logger.info(`Skipping A/B variant — insufficient credits`)
                    }
                  }
                }
              }
            } catch (abError: any) {
              // A/B experiment failure should never block normal pin generation
              logger.warn(`A/B experiment triggering failed (non-fatal): ${abError.message}`)
            }

          } catch (productError: any) {
            logger.error(`Error generating pin for ${product.title}: ${productError.message}`)
          }
        }


      } catch (brandError: any) {
        logger.error(`Error processing brand ${brand.brand_name}: ${brandError.message}`)
      }
    }

    logger.info(`🎨 EcomPin batch complete: ${totalGenerated} pins generated`)
    return { result: "Batch complete", generated: totalGenerated }
  },
})
