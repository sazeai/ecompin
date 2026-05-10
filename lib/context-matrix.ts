import { GoogleGenAI, Type } from "@google/genai"
import { createAdminClient } from "@/utils/supabase/admin"
import type { ShowcaseStrategy } from "@/lib/product-showcase"

const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY })

const AUTHENTIC_HANDMADE_TAG = "Authentic & Handmade"
const LEGACY_AESTHETIC_ALIASES: Record<string, string> = {
  "Indie DIY Setup": AUTHENTIC_HANDMADE_TAG,
}

export function normalizeAestheticTag(tag?: string | null) {
  if (!tag) return ""
  return LEGACY_AESTHETIC_ALIASES[tag] || tag
}

/**
 * Aesthetic Definition Map — universal mood guides for Gemini.
 *
 * DESIGN PRINCIPLE: Each definition describes MOOD, LIGHTING, COLOR TEMPERATURE,
 * CONTRAST, COMPOSITION, and CAMERA FEEL only — never specific props, surfaces,
 * or environments. The product's own category determines WHERE the scene takes
 * place; the aesthetic determines HOW it looks and feels.
 *
 * Must work equally well across all target categories: artisan food, tech accessories,
 * wedding, stationery, spiritual/crystals, digital art, home decor, apparel,
 * jewelry, bath/skincare, kids/baby, and pet accessories.
 */
export const AESTHETIC_DEFINITIONS: Record<string, string> = {
  'Modern & Minimalist': 'Clean, bright, generous negative space. Cool-neutral palette (whites, pale greys, soft blacks). Even diffused lighting with almost no shadows. Sharp focus, editorial stillness.',
  'Warm & Cozy': 'Inviting golden-hour warmth. Amber, cream, caramel, and burnt-orange palette. Soft directional lighting with gentle, warm shadows. Slightly shallow depth of field. Layered textures feel touchable.',
  'Bold & Vibrant': 'High-energy, saturated color pops. Punchy lighting with strong contrast and hard shadows allowed. Vivid color grading pushed past neutral. The scene should feel alive and loud.',
  'Earthy & Natural': 'Organic, grounded, tactile. Sage, sand, olive, warm-brown palette. Soft natural daylight — dappled if possible. Matte textures, warm muted tones.',
  'Authentic & Handmade': 'Believable small-business feel — shot-on-phone energy. Uneven natural window light or cheap ring-light catch. Mild grain, muted naturals, nothing over-styled.',
  'Luxury & Premium': 'Elevated, aspirational, rich. Deep jewel-tone or dark neutral palette (emerald, burgundy, gold, ivory, black). Dramatic directional lighting with controlled shadows. Rich contrast, polished feel.',
  'Playful & Fun': 'Bright, cheerful, youthful energy. Pastel or candy-colored palette (pink, sky blue, lemon, lavender, mint). Flat even lighting with almost no shadows. The scene should feel light and joyful.',
  'Scandinavian': 'Airy, calm, breathing room. Pale neutral palette (white, light wood, soft grey, muted blue). Cool even northern daylight — clean and soft. Serene and unhurried feel.',
  'Industrial': 'Raw, textural, gritty character. Charcoal, rust, slate, gunmetal palette. Harsh directional lighting with strong moody shadows. The scene should feel like it has weight and history.',
  'Bohemian': 'Layered, warm, effortlessly relaxed. Burnt orange, rust, dusty rose, olive, cream palette. Golden-hour warmth with dappled light. Warm color grading.',
  'Coastal': 'Breezy, light-filled, airy calm. Ocean blue, sandy beige, white, aqua palette. Bright overcast lighting — soft, even, no harsh shadows. Slightly washed-out highlights.',
}

/**
 * Pick ONE aesthetic from the user's selected boundaries for this specific pin.
 *
 * Two modes:
 * 1. COLD START (no weights): round-robin through boundaries (original behavior)
 * 2. OPTIMIZED (weights available): 70% weighted random (exploit winners),
 *    30% pure random (explore for new data). Prevents getting stuck on local maxima.
 *
 * @param boundaries  The user's selected aesthetic tags
 * @param indexKey    Round-robin index (used for cold start fallback)
 * @param weights     Optional map of { aestheticTag: weight } from prompt_weights table
 */
export function pickAestheticForPin(
  boundaries: string[],
  indexKey: number,
  weights?: Record<string, number>,
): { tag: string; definition: string } {
  if (!boundaries || boundaries.length === 0) {
    return { tag: 'Modern & Minimalist', definition: AESTHETIC_DEFINITIONS['Modern & Minimalist'] }
  }

  // Normalize all boundary tags
  const normalizedBoundaries = boundaries.map(b => normalizeAestheticTag(b))

  // If we have learned weights, use explore/exploit selection
  if (weights && Object.keys(weights).length > 0) {
    // Check if any of the user's boundaries have weight data
    const boundariesWithWeights = normalizedBoundaries.filter(b => weights[b] !== undefined)

    if (boundariesWithWeights.length >= 2) {
      const roll = Math.random()

      if (roll < 0.7) {
        // EXPLOIT (70%): Weighted random selection — favor high-CTR aesthetics
        const tag = weightedRandomPick(normalizedBoundaries, weights)
        const definition = AESTHETIC_DEFINITIONS[tag] || tag
        return { tag, definition }
      } else {
        // EXPLORE (30%): Pure random — try any aesthetic equally
        const randomIdx = Math.floor(Math.random() * normalizedBoundaries.length)
        const tag = normalizedBoundaries[randomIdx]
        const definition = AESTHETIC_DEFINITIONS[tag] || tag
        return { tag, definition }
      }
    }
  }

  // COLD START: No weight data yet → original round-robin behavior
  const idx = indexKey % normalizedBoundaries.length
  const tag = normalizedBoundaries[idx]
  const definition = AESTHETIC_DEFINITIONS[tag] || tag
  return { tag, definition }
}

/**
 * Weighted random selection using cumulative distribution.
 * Aesthetics with higher weights are more likely to be picked.
 * Aesthetics without weight data get the minimum observed weight (fair chance).
 */
function weightedRandomPick(tags: string[], weights: Record<string, number>): string {
  // Assign weights — untracked aesthetics get the minimum existing weight
  const existingWeights = Object.values(weights).filter(w => w > 0)
  const minWeight = existingWeights.length > 0 ? Math.min(...existingWeights) : 0.01

  const tagWeights = tags.map(tag => weights[tag] ?? minWeight)
  const totalWeight = tagWeights.reduce((sum, w) => sum + w, 0)

  if (totalWeight === 0) {
    // All weights are zero — fall back to uniform random
    return tags[Math.floor(Math.random() * tags.length)]
  }

  // Cumulative distribution sampling
  const roll = Math.random() * totalWeight
  let cumulative = 0
  for (let i = 0; i < tags.length; i++) {
    cumulative += tagWeights[i]
    if (roll <= cumulative) return tags[i]
  }

  return tags[tags.length - 1]
}

/**
 * FEATURE 4 & 5: Context Matrix & Semantic De-Duplication
 * Generates a highly specific, unique "Angle" (Aesthetic + Season + Trend) for a product.
 * Guarantees programmatic uniqueness by rejecting angles semantically similar to past pins.
 *
 * @param product Title & description to base the angle on
 * @param trends Array of trending keywords from Pinterest API
 * @param brandBoundaries (Optional) Hard constraints on aesthetics
 */
export async function generateUniqueAngle(
  product: { id: string; title: string; description?: string },
  brandBoundaries?: string[],
  pastAngles?: string[],
  showcase?: ShowcaseStrategy,
  pinCountForProduct?: number,
  aestheticWeights?: Record<string, number>,
): Promise<{ angle: string; embedding: number[]; pickedAesthetic: { tag: string; definition: string } }> {
  const supabase = createAdminClient()

  // Calculate a stable hash for the product ID to offset the aesthetic rotation.
  // This ensures different products get DIFFERENT aesthetics on the same day.
  const hash = product.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const offsetCount = (pinCountForProduct || 0) + hash;

  // Pick ONE aesthetic using per-product count + hash + learned weights from optimizer
  const pickedAesthetic = pickAestheticForPin(brandBoundaries || [], offsetCount, aestheticWeights)
  const authenticHandmadeMode = pickedAesthetic.tag === AUTHENTIC_HANDMADE_TAG

  // Build showcase constraint block (from Stage 1 — Product Showcase Resolver)
  const showcaseBlock = showcase
    ? `
LOCKED SHOWCASE (use as creative context — describe only what fits within these constraints):
- Product: ${showcase.productType}
- Family: ${showcase.productFamily}
- Shot: ${showcase.presentationMode} — ${showcase.heroAction}
- Camera: ${showcase.cameraAngle}
- Setting: ${showcase.naturalEnvironment}
- Scene scope: ${showcase.sceneScope}
- Scale rule: ${showcase.scaleGuidance}`
    : ""

  // Try up to 3 times to find a unique angle
  for (let attempt = 1; attempt <= 3; attempt++) {
    // 1. Ask Gemini to generate a creative Scene Concept
    const generationPrompt = `
Product: "${product.title}"${product.description ? ` — ${product.description}` : ""}
${showcaseBlock}

Aesthetic mood: "${pickedAesthetic.tag}" — ${pickedAesthetic.definition}
${authenticHandmadeMode ? `Keep it modest and believable — small-business realism.` : ""}

THINK FIRST (reasoning only — do not include this in your output):
Given the product and the locked showcase above, ask yourself:
- What specific real-world moment is this shot capturing? (morning routine, beach day, studio shoot, workout, gifting, commute, date night, cooking, etc.)
- Who is present in that moment and what are they doing?
- What surfaces, textures, and light sources naturally exist in that real moment?
Then apply the aesthetic's color palette and lighting character to that real environment — not to a generic surface.

${pastAngles && pastAngles.length > 0 ? `Already done — choose a DIFFERENT real-world moment each time:\n${pastAngles.slice(0, 10).map(a => `• ${a}`).join("\n")}` : ""}

Output a single scene concept grounded in a specific real-world moment, max 20 words. Surface + lighting + atmosphere only.`

    const angleResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ text: generationPrompt }],
      config: { temperature: 1.1 + (attempt * 0.1) }, // Start high (1.2) for maximum brainstorming variance
    })

    const proposedAngle = angleResponse.text?.trim()

    if (!proposedAngle) continue

    // 2. Generate text embedding for semantic comparison
    const embeddingResponse = await ai.models.embedContent({
      model: "gemini-embedding-2-preview",
      contents: proposedAngle,
      config: {
        taskType: "SEMANTIC_SIMILARITY",
        outputDimensionality: 768,
      }
    })

    const embedding = embeddingResponse.embeddings?.[0]?.values

    if (!embedding) continue

    // 3. Check for uniqueness against past pins using pgvector
    const { data: matchesData, error } = await supabase.rpc("match_pin_angles" as any, {
      query_product_id: product.id,
      query_embedding: embedding,
      match_threshold: 0.75, // 75% similarity = genuinely different creative concepts required
      match_count: 1
    })

    const matches = matchesData as any[]

    if (error) {
      console.error("Vector search error:", error)
      // If vector DB fails, just accept the angle
      return { angle: proposedAngle, embedding, pickedAesthetic }
    }

    // If no matches found above 85% similarity, this angle is unique!
    if (!matches || matches.length === 0) {
      return { angle: proposedAngle, embedding, pickedAesthetic }
    }

    console.log(`[De-Dupe] Attempt ${attempt}: Rejected duplicate angle "${proposedAngle}" (Similarity: ${matches[0].similarity})`)
  }

  // Fallback if all 3 attempts hit duplicates (rare)
  const fallbackAngle = `Premium Lifestyle aesthetic for ${product.title}`
  const fallbackEmbedding = await ai.models.embedContent({
    model: "gemini-embedding-2-preview",
    contents: fallbackAngle,
    config: {
      taskType: "SEMANTIC_SIMILARITY",
      outputDimensionality: 768,
    }
  })

  return {
    angle: fallbackAngle,
    embedding: fallbackEmbedding.embeddings?.[0]?.values || Array(768).fill(0),
    pickedAesthetic,
  }
}
