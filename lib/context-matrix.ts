/**
 * Aesthetic Definition Map — universal mood guides for Gemini.
 *
 * DESIGN PRINCIPLE: Each definition describes MOOD, LIGHTING, COLOR TEMPERATURE,
 * CONTRAST, COMPOSITION, and CAMERA FEEL only — never specific props, surfaces,
 * or environments. The product's own identity (from the image) determines WHERE
 * the scene takes place; the aesthetic determines HOW it looks and feels.
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

const AUTHENTIC_HANDMADE_TAG = "Authentic & Handmade"
const LEGACY_AESTHETIC_ALIASES: Record<string, string> = {
  "Indie DIY Setup": AUTHENTIC_HANDMADE_TAG,
}

export function normalizeAestheticTag(tag?: string | null) {
  if (!tag) return ""
  return LEGACY_AESTHETIC_ALIASES[tag] || tag
}

export { AUTHENTIC_HANDMADE_TAG }

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
 * Compute a per-product offset into the aesthetic rotation. Mixing the product id
 * hash with the per-product pin count ensures two different products on the same
 * account don't pick the same aesthetic on the same day.
 */
export function aestheticIndexForProduct(productId: string, pinCountForProduct: number): number {
  const hash = productId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return (pinCountForProduct || 0) + hash
}
