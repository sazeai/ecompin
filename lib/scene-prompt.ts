import { Type } from "@google/genai"

/**
 * Single-pass product photo planner.
 *
 * Replaces the old three-stage pipeline (Showcase Resolver + Scene Angle + Art Director)
 * with one structured Gemini call. The LLM identifies the product from the image,
 * the deterministic code builds the fal.ai prompt from those structured fields —
 * guaranteeing physical anchors (support, surface, scale) in every prompt.
 *
 * No taxonomy, no "viable modes" rotation, no LLM "think first" step.
 * The image is the source of truth.
 */

export type PhysicalScale = "tiny" | "palm" | "handheld" | "tabletop" | "furniture" | "room"

export const PHYSICAL_SCALES: readonly PhysicalScale[] = [
  "tiny",
  "palm",
  "handheld",
  "tabletop",
  "furniture",
  "room",
] as const

export type PresentationMode =
  | "worn-on-body"
  | "held-in-hand"
  | "resting-on-surface"
  | "in-use"
  | "flat-arrangement"

export const PRESENTATION_MODES: readonly PresentationMode[] = [
  "worn-on-body",
  "held-in-hand",
  "resting-on-surface",
  "in-use",
  "flat-arrangement",
] as const

/**
 * Structured output the LLM fills. Every field is required, no empty strings.
 * These fields become the fal.ai prompt via buildImagePrompt().
 */
export interface SceneFields {
  productIdentity: string
  naturalRestingPlace: string
  physicalScale: PhysicalScale
  supportRule: string
  presentationMode: PresentationMode
  sceneLocation: string
  lighting: string
  forbiddenContexts: string[]
  seoTitle: string
  seoDescription: string
}

/**
 * Camera framing tied to product physical scale. Tiny jewelry gets a macro close-up;
 * furniture gets a wide three-quarter. The LLM doesn't pick this — scale does.
 */
const SCALE_CAMERA: Record<PhysicalScale, string> = {
  tiny: "extreme close-up macro",
  palm: "close-up detail",
  handheld: "close-up detail",
  tabletop: "three-quarter angle with tabletop framing",
  furniture: "wide three-quarter showing room context",
  room: "wide room shot with the product as the focal point",
}

/**
 * Short style anchors used as the closing phrase of the fal.ai prompt.
 * Mirrors AESTHETIC_DEFINITIONS but stripped to the visuals only (no fluff).
 */
export const AESTHETIC_STYLE_ANCHORS: Record<string, string> = {
  "Modern & Minimalist":
    "Clean editorial composition, cool-neutral palette, even diffused light, sharp focus.",
  "Warm & Cozy":
    "Golden-hour warmth, soft directional light, gentle warm shadows, layered textures.",
  "Bold & Vibrant":
    "Saturated color pops, punchy lighting, strong contrast, vivid color grading.",
  "Earthy & Natural":
    "Organic palette of sage, sand and warm brown, soft natural daylight, matte textures.",
  "Authentic & Handmade":
    "Believable small-business realism, uneven natural window light, mild grain.",
  "Luxury & Premium":
    "Deep jewel-tone palette, dramatic directional light, controlled shadows, polished feel.",
  "Playful & Fun":
    "Pastel palette, flat even lighting, almost no shadows, light and joyful mood.",
  "Scandinavian":
    "Pale neutral palette, cool even northern daylight, clean and serene.",
  "Industrial":
    "Charcoal and rust palette, harsh directional light, strong moody shadows.",
  "Bohemian":
    "Burnt orange and dusty rose palette, golden-hour warmth, dappled light, warm grading.",
  "Coastal":
    "Ocean blue and sandy beige palette, bright overcast light, soft and airy.",
}

const FALLBACK_STYLE_ANCHOR =
  "Clean editorial composition, soft natural light, neutral palette, sharp focus."

/**
 * The single Gemini prompt that replaces three old LLM calls.
 * Direct, image-grounded, no "think first" step.
 */
export function buildScenePrompt(args: {
  title: string
  description?: string
  aestheticTag: string
  aestheticDefinition: string
  pastAngles?: string[]
}): string {
  const pastAngleBlock = args.pastAngles && args.pastAngles.length > 0
    ? `\nAlready used scenes for this product — pick a DIFFERENT real-world moment:\n${args.pastAngles
        .slice(0, 10)
        .map(a => `• ${a}`)
        .join("\n")}\n`
    : ""

  return `You are planning a single product photo. The product image is attached. Look at it carefully before answering.

PRODUCT TITLE: "${args.title}"
${args.description ? `PRODUCT DETAILS: "${args.description}"\n` : ""}AESTHETIC STYLE: "${args.aestheticTag}" — ${args.aestheticDefinition}
${pastAngleBlock}
Return a JSON object with these exact fields. Every field must be filled. No empty strings. No "unknown".

1. productIdentity (4-10 words): What this product actually is, in concrete terms. Name visible materials, colors, distinguishing features.
   Good: "small sterling silver signet ring with engraved sunburst"
   Bad: "jewelry" / "ring" / "product"

2. naturalRestingPlace (4-10 words): The specific surface or body part this product naturally sits on, rests against, or is worn on in real life.
   Good: "vanity tray lined with soft linen" / "a bare ring finger near a window"
   Bad: "table" / "surface" / "background"

3. physicalScale: ONE of: tiny | palm | handheld | tabletop | furniture | room
   - tiny: fits on a fingertip (rings, earrings, small studs, ear cuffs)
   - palm: fits in an open palm (small jewelry, lip balm, single keycap, ring box)
   - handheld: held in a hand (mug, bottle, phone, book, journal)
   - tabletop: sits on a table, larger than a hand (shoe, candle, vase, folded shirt, food jar)
   - furniture: the product IS a piece of furniture or large furnishing (chair, bench, table, lamp, large planter, cushion sized for a seat)
   - room: the product dominates a room (large bookshelf, full sofa, large rug)

4. supportRule (4-12 words): How the product is physically supported in your proposed scene. Must describe the actual physical contact between the product and a surface or body part.
   Good: "lies flat on the seat of a wooden bench"
   Good: "worn on the ring finger of a relaxed hand"
   Good: "rests upright on a stone windowsill"
   Bad: "is displayed" / "is shown" / "is presented" (no physical contact)
   Bad: "floats in the scene" (no support)

5. presentationMode: ONE of: worn-on-body | held-in-hand | resting-on-surface | in-use | flat-arrangement
   Pick based on the most natural way this product actually appears in real life.
   - worn-on-body: product is on a real body part (ring on finger, sneaker on foot, collar on dog)
   - held-in-hand: a person is holding or handling the product (mug being lifted, serum bottle in palm)
   - resting-on-surface: product sits on a surface from its natural world (candle on a windowsill, planter on a shelf)
   - in-use: product is actively being used in its real context (shoe mid-stride, food being served, journal being written in)
   - flat-arrangement: overhead spread — only for kits, sets, or multi-piece products where seeing all items together is the point

6. sceneLocation (4-10 words): A specific real-world place where this product naturally exists. Not a generic "indoor setting". Name the room, surface, lighting condition.
   Good: "sunlit entryway with a wooden bench and a folded throw"
   Good: "minimalist kitchen counter near a window with morning light"
   Good: "rustic wooden desk with a single brass lamp"
   Bad: "indoor setting" / "nice background" / "lifestyle scene"

7. lighting (4-8 words): A short description of the natural light in this scene, matching the aesthetic style. The style controls MOOD, the light is concrete.
   Good: "soft window light from the left, warm cast"
   Good: "overcast bright light, no harsh shadows"
   Good: "dappled afternoon light through a leafy plant"

8. forbiddenContexts: 0-5 short phrases. Specific contexts that would look WRONG for this product and must never appear in the final image. Empty array if none.
   Good examples: "on a dining table", "next to a kitchen sink", "in a gym", "worn by a child", "floating without a surface", "in a room with a sofa"

9. seoTitle (max 100 chars): A Pinterest pin title that sounds like what a real shopper would type into search. Lead with the most specific product term (what it IS), include 1-2 searchable modifiers (material, use-case, occasion, size, room). No generic filler words: NEVER use "Aesthetic", "Lifestyle", "Collection", "Essential", "Home Decor Finds", "Must-Have", "Vibes". No em-dashes (—) or en-dashes (–) bolting on generic suffixes. No hashtags.
   Good: "Custom Genuine Leather Bench Cushion for Entryway Seating"
   Good: "Sterling Silver Sunrise Signet Ring — Handmade Unisex Jewelry"
   Bad: "Aesthetic Lifestyle: Bench Cushion — Minimalist Home Decor"

10. seoDescription (150-300 chars): Open with what the product IS and who it's for. Include 2-3 natural long-tail keyword phrases a shopper would actually search. Mention a specific benefit, ingredient, material, or use-case. End with ONE call-to-action: "Shop now", "Get yours", "See more", "Save for later". No hashtags. Write like a product copywriter, not a poet.

CRITICAL RULES — these are non-negotiable:
- productIdentity, naturalRestingPlace, supportRule, sceneLocation, lighting must describe the product as it ACTUALLY appears in the attached image. Do not invent a different product. If the image shows a leather cushion, the product IS a leather cushion — not a bench, not a sofa.
- supportRule MUST describe real physical contact between the product and a surface or body part. NEVER vague.
- The aesthetic style controls COLOR PALETTE, LIGHTING CHARACTER, and MOOD. It does NOT change what the product is, what it sits on, or where it lives.
- The product in the final image must keep its original colors, materials, shape, and design from the source image. Do not recolor, restyle, or reshape the product.
- For digital products (PDFs, digital prints, downloads, instant downloads) where there is no physical object to composite, set productIdentity to describe the digital artifact and sceneLocation to a screen, monitor, or printed sheet on a flat surface. The orchestrator will skip these via a separate digital-product check before this call.

Return ONLY the JSON object. No prose, no markdown fences.`
}

/**
 * Deterministic prompt builder. Runs AFTER Gemini returns structured fields.
 * Guarantees physical anchors (support, surface, scale) appear in every prompt.
 */
export function buildImagePrompt(
  fields: SceneFields,
  aesthetic: { tag: string; styleAnchor?: string }
): string {
  const camera = SCALE_CAMERA[fields.physicalScale] || "eye-level three-quarter"
  const styleAnchor =
    aesthetic.styleAnchor ||
    AESTHETIC_STYLE_ANCHORS[aesthetic.tag] ||
    FALLBACK_STYLE_ANCHOR

  const parts = [
    `A ${fields.productIdentity}, exactly as shown, ${fields.supportRule} on ${fields.naturalRestingPlace}.`,
    `The setting is ${fields.sceneLocation}.`,
    fields.lighting ? `${fields.lighting}.` : "",
    `Photographed at ${camera}.`,
    styleAnchor,
    "Editorial product photography, soft natural light, 8k.",
  ]

  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
}

/**
 * Text used to dedup against past pins. Combines scene + lighting in one short
 * phrase so semantically similar scenes cluster together.
 */
export function buildAngleText(fields: SceneFields): string {
  return `${fields.sceneLocation} | ${fields.lighting}`
}

/**
 * Validate one structured-output field by field. Used to fail fast on a malformed
 * Gemini response before we commit to building a prompt.
 */
export function parseSceneFields(raw: unknown): SceneFields | null {
  if (!raw || typeof raw !== "object") return null
  const r = raw as Record<string, any>

  const physicalScale = PHYSICAL_SCALES.includes(r.physicalScale) ? r.physicalScale : null
  const presentationMode = PRESENTATION_MODES.includes(r.presentationMode) ? r.presentationMode : null

  if (!physicalScale || !presentationMode) return null

  const productIdentity = typeof r.productIdentity === "string" ? r.productIdentity.trim() : ""
  const naturalRestingPlace = typeof r.naturalRestingPlace === "string" ? r.naturalRestingPlace.trim() : ""
  const supportRule = typeof r.supportRule === "string" ? r.supportRule.trim() : ""
  const sceneLocation = typeof r.sceneLocation === "string" ? r.sceneLocation.trim() : ""
  const lighting = typeof r.lighting === "string" ? r.lighting.trim() : ""
  const seoTitle = typeof r.seoTitle === "string" ? r.seoTitle.trim().slice(0, 100) : ""
  const seoDescription = typeof r.seoDescription === "string" ? r.seoDescription.trim().slice(0, 500) : ""
  const forbiddenContexts = Array.isArray(r.forbiddenContexts)
    ? r.forbiddenContexts.filter((c: any) => typeof c === "string").map((c: string) => c.slice(0, 60)).slice(0, 5)
    : []

  if (!productIdentity || !naturalRestingPlace || !supportRule || !sceneLocation || !lighting) {
    return null
  }

  return {
    productIdentity,
    naturalRestingPlace,
    physicalScale,
    supportRule,
    presentationMode,
    sceneLocation,
    lighting,
    forbiddenContexts,
    seoTitle,
    seoDescription,
  }
}

/**
 * Deterministic rule-based fix for structured fields when the rendered prompt
 * fails the critic. NO LLM CALL — uses regex/template swaps only.
 */
export function enforceSceneFields(fields: SceneFields, issues: string[]): SceneFields {
  let { sceneLocation, naturalRestingPlace, supportRule, physicalScale, presentationMode, forbiddenContexts } = fields

  // 1) Small product placed in a room-scale scene → tighten to macro
  const isSmall = physicalScale === "tiny" || physicalScale === "palm" || physicalScale === "handheld"
  const roomTerms = ["full room", "living room", "bedroom", "full venue", "room-scale", "room corner"]
  if (isSmall && roomTerms.some(t => sceneLocation.toLowerCase().includes(t))) {
    sceneLocation = `tight ${physicalScale} close-up on ${naturalRestingPlace}`
  }

  // 2) Body parts in non-worn/held modes → swap to neutral surface
  const allowsBody = presentationMode === "worn-on-body" || presentationMode === "held-in-hand"
  if (!allowsBody) {
    const bodyParts = ["hand", "hands", "finger", "fingers", "wrist", "arm", "foot", "feet", "body part", "leg", "ankle"]
    for (const part of bodyParts) {
      const regex = new RegExp(`\\b${part}\\b`, "gi")
      sceneLocation = sceneLocation.replace(regex, "soft surface")
      naturalRestingPlace = naturalRestingPlace.replace(regex, "soft surface")
      supportRule = supportRule.replace(regex, "soft surface")
    }
  }

  // 3) Forbidden contexts leaking into scene/resting place
  for (const ctx of forbiddenContexts) {
    if (ctx.length < 4) continue
    const words = ctx.split(/\s+/).filter(w => w.length > 3)
    for (const word of words) {
      const regex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi")
      sceneLocation = sceneLocation.replace(regex, "clean setting")
      naturalRestingPlace = naturalRestingPlace.replace(regex, "clean setting")
      supportRule = supportRule.replace(regex, "clean setting")
    }
  }

  // 4) Vague supportRule → force a surface
  const vagueSupports = /(\bdisplayed\b|\bshown\b|\bpresented\b|\bfloats?\b)/i
  if (vagueSupports.test(supportRule)) {
    supportRule = `rests on ${naturalRestingPlace}`
  }

  return {
    ...fields,
    sceneLocation,
    naturalRestingPlace,
    supportRule,
  }
}

/**
 * Gemini response schema for the single structured-output call.
 * Used with responseMimeType: "application/json" + responseSchema.
 */
export const SCENE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    productIdentity: { type: Type.STRING, description: "What the product is, in concrete terms (4-10 words)." },
    naturalRestingPlace: { type: Type.STRING, description: "The specific surface or body part the product sits on (4-10 words)." },
    physicalScale: {
      type: Type.STRING,
      enum: ["tiny", "palm", "handheld", "tabletop", "furniture", "room"],
      description: "Physical scale class of the product.",
    },
    supportRule: { type: Type.STRING, description: "How the product is physically supported (4-12 words, must describe real physical contact)." },
    presentationMode: {
      type: Type.STRING,
      enum: ["worn-on-body", "held-in-hand", "resting-on-surface", "in-use", "flat-arrangement"],
      description: "How the product appears in the scene.",
    },
    sceneLocation: { type: Type.STRING, description: "Specific real-world place where this product naturally exists (4-10 words)." },
    lighting: { type: Type.STRING, description: "Short description of the natural light in the scene (4-8 words)." },
    forbiddenContexts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "0-5 short phrases describing contexts that would look wrong for this product.",
    },
    seoTitle: { type: Type.STRING, description: "Pinterest pin title, max 100 chars, no generic filler." },
    seoDescription: { type: Type.STRING, description: "Pinterest pin description, 150-300 chars, ends with a CTA." },
  },
  required: [
    "productIdentity",
    "naturalRestingPlace",
    "physicalScale",
    "supportRule",
    "presentationMode",
    "sceneLocation",
    "lighting",
    "forbiddenContexts",
    "seoTitle",
    "seoDescription",
  ],
}
