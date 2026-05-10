import { GoogleGenAI } from "@google/genai"

const ai = new GoogleGenAI({ apiKey: process.env.MYGEMINI_API_KEY })

/**
 * Finite taxonomy of product presentation modes.
 * The Showcase Resolver MUST pick from this list — no hallucinated modes.
 */
export const PRESENTATION_MODES = [
  "worn-on-model",
  "held-in-hand",
  "styled-on-surface",
  "in-use-action",
  "flat-lay-arrangement",
] as const

export type PresentationMode = (typeof PRESENTATION_MODES)[number]
export type ProductFamily =
  | "jewelry-small"
  | "box-case-small"
  | "apparel"
  | "pet-accessory"
  | "beauty-small"
  | "furniture-large"
  | "home-decor"
  | "food-drink"
  | "tech-desk"
  | "stationery"
  | "ceramics-tableware"
  | "kids-baby"
  | "wedding-event"
  | "wall-art"
  | "carried-accessory"
  | "general"

type ShowcaseMode = {
  presentationMode: PresentationMode
  cameraAngle: string
  heroAction: string
  naturalEnvironment: string
}

type FamilyRules = {
  sceneScope: string
  scaleGuidance: string
  forbiddenElements: string
  defaultProps: Partial<Record<PresentationMode, string>>
  defaultEnvironments: Partial<Record<PresentationMode, string>>
  defaultCameras: Partial<Record<PresentationMode, string>>
}

const FAMILY_RULES: Record<ProductFamily, FamilyRules> = {
  "jewelry-small": {
    sceneScope: "macro jewelry close-up only; no full-room background story",
    scaleGuidance: "keep jewelry at macro wearable scale. Frame tightly on the jewelry piece itself",
    forbiddenElements: "dressers, dreamcatchers, wall decor, full furniture scenes, oversized props, full room scenes, outdoor wide shots",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "finger close-up near vanity mirror",
      "held-in-hand": "soft linen beside vanity tray",
      "styled-on-surface": "stone slab close-up",
      "in-use-action": "close vanity mirror setup",
      "flat-lay-arrangement": "soft linen flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "close-up detail",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "close-up detail",
      "in-use-action": "close-up detail",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "box-case-small": {
    sceneScope: "tight tabletop close-up only",
    scaleGuidance: "keep the box at believable palm scale anchored on a tabletop close-up",
    forbiddenElements: "journals, pens, coffee cups, full sofa scenes, room decor",
    defaultProps: {},
    defaultEnvironments: {
      "held-in-hand": "soft window-lit interior close-up",
      "styled-on-surface": "linen tabletop close-up",
      "in-use-action": "gift table close-up",
      "flat-lay-arrangement": "gift wrap flat-lay",
      "worn-on-model": "soft tabletop close-up",
    },
    defaultCameras: {
      "held-in-hand": "close-up detail",
      "styled-on-surface": "close-up detail",
      "in-use-action": "close-up detail",
      "flat-lay-arrangement": "overhead flat-lay",
      "worn-on-model": "close-up detail",
    },
  },
  apparel: {
    sceneScope: "full garment laid flat on a real horizontal surface",
    scaleGuidance: "garment must clearly rest flat on a real horizontal surface; no floating, no wall-floor ambiguity",
    forbiddenElements: "floating layouts, vertical-wall ambiguity, vinyl records, skateboards, random decor props, additional clothing items, shoes, other garments",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "studio backdrop with clean floor",
      "held-in-hand": "boutique fitting room",
      "styled-on-surface": "studio paper backdrop",
      "in-use-action": "city sidewalk",
      "flat-lay-arrangement": "studio paper backdrop",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "eye-level three-quarter",
      "styled-on-surface": "overhead flat-lay",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "pet-accessory": {
    sceneScope: "close product scene on a flat surface",
    scaleGuidance: "show believable pet-accessory scale using a leash clip as size reference",
    forbiddenElements: "watches, journals, pens, coffee cups, unrelated decor, chew toys, treat pouches, additional pet accessories",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "park path near grass edge",
      "held-in-hand": "entryway bench close-up",
      "styled-on-surface": "wood bench close-up",
      "in-use-action": "park path close-up",
      "flat-lay-arrangement": "entryway bench flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "close-up detail",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "beauty-small": {
    sceneScope: "close vanity countertop shot only",
    scaleGuidance: "keep the item at believable countertop scale with tight framing",
    forbiddenElements: "room decor stories, oversized props, unrelated objects",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "bathroom mirror close-up",
      "held-in-hand": "bathroom vanity close-up",
      "styled-on-surface": "vanity tray close-up",
      "in-use-action": "bathroom mirror close-up",
      "flat-lay-arrangement": "vanity tray flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "close-up detail",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "close-up detail",
      "in-use-action": "close-up detail",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "furniture-large": {
    sceneScope: "room-scale scene is allowed",
    scaleGuidance: "show the product at believable furniture scale with enough surrounding room context to read size",
    forbiddenElements: "miniature staging that shrinks the product unrealistically",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "living room corner",
      "held-in-hand": "living room corner",
      "styled-on-surface": "living room corner",
      "in-use-action": "living room corner",
      "flat-lay-arrangement": "styled room corner",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "eye-level three-quarter",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "eye-level three-quarter",
    },
  },
  "home-decor": {
    sceneScope: "tabletop vignette only",
    scaleGuidance: "show the item at believable home-decor scale on a table surface",
    forbiddenElements: "random props unrelated to the item's home use",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "tabletop vignette",
      "held-in-hand": "tabletop vignette",
      "styled-on-surface": "tabletop vignette",
      "in-use-action": "tabletop vignette",
      "flat-lay-arrangement": "tabletop flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "food-drink": {
    sceneScope: "close dining table scene only",
    scaleGuidance: "show believable serving scale on a table setting",
    forbiddenElements: "random decor props unrelated to eating or serving",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "kitchen table",
      "held-in-hand": "kitchen counter close-up",
      "styled-on-surface": "dining table close-up",
      "in-use-action": "kitchen table close-up",
      "flat-lay-arrangement": "tabletop flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "close-up detail",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "tech-desk": {
    sceneScope: "desk close-up only; no full-room shots",
    scaleGuidance: "keep the item at believable desk-accessory scale beside a keyboard",
    forbiddenElements: "kitchen props, food, pet items, jewelry, candles, plants unrelated to desk setup",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "desk setup close-up",
      "held-in-hand": "desk setup close-up",
      "styled-on-surface": "wooden desk close-up",
      "in-use-action": "workspace with monitor glow",
      "flat-lay-arrangement": "desk mat flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "close-up detail",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  stationery: {
    sceneScope: "desk vignette close-up only",
    scaleGuidance: "keep the item at believable desk scale with close framing on the writing surface",
    forbiddenElements: "kitchen props, pet items, jewelry, full room scenes, tech monitors",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "dark wood desk close-up",
      "held-in-hand": "leather desk pad close-up",
      "styled-on-surface": "dark wood desk close-up",
      "in-use-action": "writing desk with warm lamp glow",
      "flat-lay-arrangement": "dark wood desk flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "close-up detail",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "ceramics-tableware": {
    sceneScope: "tabletop pottery close-up only",
    scaleGuidance: "keep the item at believable tableware scale on a table surface",
    forbiddenElements: "pet items, tech accessories, jewelry, full room scenes, wall decor",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "dining table close-up",
      "held-in-hand": "kitchen counter close-up with natural light",
      "styled-on-surface": "linen tablecloth close-up",
      "in-use-action": "kitchen table with morning light",
      "flat-lay-arrangement": "linen tablecloth flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "kids-baby": {
    sceneScope: "nursery vignette close-up only",
    scaleGuidance: "show believable child-scale item on a nursery shelf",
    forbiddenElements: "alcohol, sharp objects, candles, adult-only props, dark moody lighting, industrial scenes",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "sunlit nursery corner",
      "held-in-hand": "nursery shelf close-up",
      "styled-on-surface": "nursery shelf close-up",
      "in-use-action": "play mat in bright nursery",
      "flat-lay-arrangement": "soft blanket flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "wedding-event": {
    sceneScope: "elegant tabletop vignette only; no full venue shots",
    scaleGuidance: "keep the item at believable gift scale on a linen surface",
    forbiddenElements: "pet items, tech accessories, kitchen appliances, full room scenes, casual streetwear",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "elegant linen table close-up",
      "held-in-hand": "soft window-lit interior close-up",
      "styled-on-surface": "marble tabletop close-up",
      "in-use-action": "candlelit writing desk close-up",
      "flat-lay-arrangement": "linen tabletop flat-lay with soft light",
    },
    defaultCameras: {
      "worn-on-model": "close-up detail",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "close-up detail",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "wall-art": {
    sceneScope: "wall-mounted display only; art must be on a wall",
    scaleGuidance: "show the art at believable print scale mounted on a real wall",
    forbiddenElements: "random tabletop props, kitchen items, pet items, tech accessories",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "gallery wall close-up",
      "held-in-hand": "bright room with clean wall behind",
      "styled-on-surface": "leaning on shelf against clean wall",
      "in-use-action": "being hung on gallery wall",
      "flat-lay-arrangement": "wrapping paper flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level front",
      "held-in-hand": "eye-level three-quarter",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level front",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  "carried-accessory": {
    sceneScope: "styled surface shot only; no full room backgrounds",
    scaleGuidance: "show the accessory at believable carry scale resting on a styled surface",
    forbiddenElements: "kitchen props, pet items, jewelry trays, candles, full furniture scenes",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "city sidewalk close-up",
      "held-in-hand": "café table close-up",
      "styled-on-surface": "wooden bench close-up",
      "in-use-action": "city street close-up",
      "flat-lay-arrangement": "studio flat-lay",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
  general: {
    sceneScope: "product-world scene only",
    scaleGuidance: "keep size believable on a natural surface",
    forbiddenElements: "random unrelated props, room-scale distractions",
    defaultProps: {},
    defaultEnvironments: {
      "worn-on-model": "natural use setting",
      "held-in-hand": "clean close-up setting",
      "styled-on-surface": "clean tabletop setting",
      "in-use-action": "natural use setting",
      "flat-lay-arrangement": "clean flat-lay setting",
    },
    defaultCameras: {
      "worn-on-model": "eye-level three-quarter",
      "held-in-hand": "close-up detail",
      "styled-on-surface": "eye-level three-quarter",
      "in-use-action": "eye-level three-quarter",
      "flat-lay-arrangement": "overhead flat-lay",
    },
  },
}

function inferProductFamily(product: { title: string; description?: string }, productType?: string) {
  const haystack = `${product.title} ${product.description || ""} ${productType || ""}`.toLowerCase()

  // --- Most specific families first (order matters!) ---

  // Wedding & Event — before box-case-small (velvet ring box in wedding context should stay wedding)
  if (/(wax seal|acrylic sign|groomsmen|bridesmaid|wedding favor|place card|table number|wedding|bridal|engagement gift|proposal gift)/.test(haystack)) {
    return "wedding-event" as ProductFamily
  }
  // Box/Case — after wedding to avoid wedding ring boxes matching here
  if (/(ring box|jewelry box|velvet box|proposal box|gem box|gift box|hinged box|case)/.test(haystack)) {
    return "box-case-small" as ProductFamily
  }
  // Pet — before ceramics (ceramic pet bowl should be pet-accessory)
  if (/(collar|leash|harness|dog|cat|pet|puppy|kitten)/.test(haystack)) {
    return "pet-accessory" as ProductFamily
  }
  // Kids/Baby — before apparel (baby onesie should be kids-baby, not apparel)
  if (/(baby|nursery|montessori|pacifier|toddler|wooden block|crib|onesie|infant|newborn|playmat|teether|silicone clip)/.test(haystack)) {
    return "kids-baby" as ProductFamily
  }
  // Carried accessories — before apparel (tote bag should be carried-accessory, not apparel)
  if (/(tote bag|backpack|wallet|clutch|laptop bag|messenger bag|crossbody bag|purse|handbag|fanny pack|sling bag|duffle)/.test(haystack)) {
    return "carried-accessory" as ProductFamily
  }
  // Apparel
  if (/(hoodie|t-shirt|tee|shirt|sweatshirt|jacket|coat|sweater|cardigan|pants|jeans|dress|apparel|sneaker|custom sneaker)/.test(haystack)) {
    return "apparel" as ProductFamily
  }
  // Jewelry & worn accessories (watches, wallets already handled above in carried-accessory)
  if (/(ring|earring|bracelet|necklace|pendant|anklet|gemstone|turquoise|sterling silver|jewelry|watch|signet|cuff|brooch)/.test(haystack)) {
    return "jewelry-small" as ProductFamily
  }
  // Tech & Desk
  if (/(keycap|keyboard|mousepad|mouse pad|monitor|headphone stand|desk mat|cable organizer|laptop sleeve|laptop stand|webcam|mechanical key|tech accessory)/.test(haystack)) {
    return "tech-desk" as ProductFamily
  }
  // Stationery
  if (/(journal|planner|fountain pen|desk organizer|brass desk|stationery|bookmark|wax seal kit|letter opener|calligraphy|notebook|diary)/.test(haystack)) {
    return "stationery" as ProductFamily
  }
  // Ceramics/Tableware — before food-drink (artisan mug is ceramics, not food)
  if (/(ceramic|pottery|stoneware|porcelain|handcrafted mug|artisan mug|matcha bowl|incense holder|speckled mug|wabi.sabi|earthenware|glazed)/.test(haystack)) {
    return "ceramics-tableware" as ProductFamily
  }
  // Beauty
  if (/(serum|cream|lotion|balm|skincare|perfume|cosmetic|lip|beauty)/.test(haystack)) {
    return "beauty-small" as ProductFamily
  }
  // Wall Art — before home-decor (art print moved here)
  if (/(wall art|art print|poster|canvas print|framed art|gallery print|typography print|nursery print|downloadable print|digital art print)/.test(haystack)) {
    return "wall-art" as ProductFamily
  }
  // Home Decor (art print removed — now in wall-art)
  if (/(candle|vase|decor|frame|planter|ornament|home decor|throw pillow|lamp|rug|tapestry)/.test(haystack)) {
    return "home-decor" as ProductFamily
  }
  // Furniture
  if (/(chair|stool|bench|sofa|table|furniture|bookshelf|cabinet|dresser|nightstand)/.test(haystack)) {
    return "furniture-large" as ProductFamily
  }
  // Food & Drink (after ceramics to avoid artisan mug → food-drink)
  if (/(peanut butter|snack|tea|coffee|food|drink|jar|sauce|honey|chocolate|spice|granola)/.test(haystack)) {
    return "food-drink" as ProductFamily
  }

  return "general" as ProductFamily
}

/**
 * Detect digital/downloadable products that have no physical product to composite.
 * These should be skipped in auto-generation and flagged for manual pin creation.
 */
export function isDigitalProduct(product: { title: string; description?: string }, tags?: string[] | null): boolean {
  const haystack = `${product.title} ${product.description || ""} ${(tags || []).join(" ")}`.toLowerCase()
  return /(downloadable|digital download|instant download|printable|pdf|digital file|digital print)/.test(haystack)
}

const VALID_SIZE_CLASSES = ["tiny", "palm", "handheld", "tabletop", "furniture", "room"] as const
const VALID_SCENE_DEPTHS = ["macro close-up", "tabletop vignette", "room corner", "full room"] as const

function parseConstraints(raw: any): ProductConstraints | undefined {
  if (!raw || typeof raw !== "object") return undefined
  const sizeClass = VALID_SIZE_CLASSES.includes(raw.sizeClass) ? raw.sizeClass : undefined
  if (!sizeClass) return undefined

  return {
    sizeClass,
    scaleAnchor: typeof raw.scaleAnchor === "string" ? raw.scaleAnchor.slice(0, 50) : "",
    supportRule: typeof raw.supportRule === "string" ? raw.supportRule.slice(0, 80) : "",
    maxSceneDepth: VALID_SCENE_DEPTHS.includes(raw.maxSceneDepth) ? raw.maxSceneDepth : "tabletop vignette",
    propWorld: typeof raw.propWorld === "string" ? raw.propWorld.slice(0, 50) : "",
    forbiddenContexts: Array.isArray(raw.forbiddenContexts)
      ? raw.forbiddenContexts.filter((c: any) => typeof c === "string").map((c: string) => c.slice(0, 60)).slice(0, 5)
      : [],
  }
}

function normalizeWhitespace(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || ""
}

function containsAny(value: string, terms: string[]) {
  const lower = value.toLowerCase()
  return terms.some(term => lower.includes(term))
}

function sanitizeEnvironment(rawEnvironment: string, family: ProductFamily, mode: PresentationMode) {
  const normalized = normalizeWhitespace(rawEnvironment)
  const rules = FAMILY_RULES[family]
  const defaultEnvironment = rules.defaultEnvironments[mode] || "clean product setting"

  if (!normalized) return defaultEnvironment

  const familyBlacklists: Partial<Record<ProductFamily, string[]>> = {
    "jewelry-small": ["dresser", "bedroom", "dreamcatcher", "sofa", "couch", "room", "wall"],
    "box-case-small": ["journal", "pen", "sofa", "couch", "room"],
    apparel: ["wall", "floor", "concrete floor", "patio", "sidewalk", "street floor"],
    "pet-accessory": ["watch", "journal", "pen", "office"],
    "tech-desk": ["kitchen", "dining", "bathroom", "nursery", "pet", "garden", "outdoor"],
    stationery: ["kitchen", "bathroom", "nursery", "pet", "garden", "gym"],
    "ceramics-tableware": ["bedroom", "office", "gym", "pet", "tech", "garage"],
    "kids-baby": ["bar", "alcohol", "wine", "industrial", "garage", "office", "dark"],
    "wedding-event": ["gym", "kitchen", "pet", "tech", "garage", "industrial"],
    "wall-art": ["kitchen counter", "dining table", "pet", "tech desk", "bathroom counter"],
    "carried-accessory": ["kitchen", "bathroom", "nursery", "pet", "jewelry tray"],
  }

  if (containsAny(normalized, familyBlacklists[family] || [])) {
    return defaultEnvironment
  }

  return normalized
}

function normalizeModeForFamily(
  mode: ShowcaseMode,
  family: ProductFamily,
  productTitle: string,
): ShowcaseMode {
  const rules = FAMILY_RULES[family]
  const presentationMode = mode.presentationMode

  return {
    presentationMode,
    cameraAngle: rules.defaultCameras[presentationMode] || mode.cameraAngle || "eye-level three-quarter",
    heroAction: normalizeWhitespace(mode.heroAction) || `${productTitle} displayed naturally`,
    naturalEnvironment: sanitizeEnvironment(mode.naturalEnvironment, family, presentationMode),
  }
}

export interface ProductConstraints {
  sizeClass: "tiny" | "palm" | "handheld" | "tabletop" | "furniture" | "room"
  scaleAnchor: string
  supportRule: string
  maxSceneDepth: string
  propWorld: string
  forbiddenContexts: string[]
}

export interface ShowcaseStrategy {
  productFamily: ProductFamily
  productType: string
  presentationMode: PresentationMode
  cameraAngle: string
  heroAction: string
  naturalEnvironment: string
  productAppearance: string
  sceneScope: string
  scaleGuidance: string
  forbiddenElements: string
}

/**
 * Full showcase analysis returned by Gemini — contains ALL viable modes
 * so we can rotate across pins for the same product.
 */
export interface ShowcaseAnalysis {
  productFamily: ProductFamily
  productType: string
  productAppearance: string
  /** AI-inferred per-product constraints (can tighten but not loosen family rules) */
  constraints?: ProductConstraints
  /** Ranked list of viable presentation modes with details for each */
  viableModes: {
    presentationMode: PresentationMode
    cameraAngle: string
    heroAction: string
    naturalEnvironment: string
  }[]
}

const SHOWCASE_PROMPT = `You are a product photographer planning shots. Before deciding HOW to shoot this product, think about WHERE and HOW it exists in the real world.

PRODUCT: "{title}"
{descriptionLine}

STEP 1 — THINK FIRST (reasoning only, not in your output):
Ask yourself:
- Who owns or uses this product, and what are they doing when they use it?
- In what specific daily-life moments does this product appear? (morning routine, beach day, workout, gifting, cooking, commute, studio shoot, date night, etc.)
- Where is it physically found in those moments? (on a body part, in a room, outdoors, on a shelf, in someone's hand, on a display stand, etc.)
- What would a photographer actually point their camera at to capture this product in its real context?

STEP 2 — SHOT OPTIONS:
From those real-world moments, return 2-4 different shot options ranked by buyer appeal. Each shot must come from a distinct real-world moment — not just variations of the same generic setup.

For EACH shot:
presentationMode (choose based on the real-world moment, not a default):
- "worn-on-model": product on a real person or animal body part — for any wearable in its worn context (anklet on bare ankle at the pool, collar on a dog mid-walk, ring on finger near a vanity, sneakers on feet mid-stride)
- "held-in-hand": product being held or handled by a person — for items naturally picked up (serum bottle, small gift box, coffee cup)
- "styled-on-surface": product resting on a surface from its actual world — not a generic table, but a specific surface that belongs to the product's life (candle on a rain-wet windowsill, planter on a bathroom shelf, jar on a kitchen counter between cooking)
- "in-use-action": product actively in use in its real context (shoe mid-stride on wet pavement, serum being massaged in, food being eaten at the table)
- "flat-lay-arrangement": overhead spread — only for kits, sets, or multi-piece products where seeing all items together is the point

Studio display setups (mannequin leg, jewelry bust, display stand, styled studio table) are valid naturalEnvironments — treat them as their own context when they suit the product.

cameraAngle: "eye-level front" | "eye-level three-quarter" | "close-up detail" | "overhead flat-lay" | "low-angle hero" | "over-the-shoulder"

heroAction: the specific real-world action or pose in max 12 words — must be contextually accurate to how this product is actually encountered
- Good: "anklet on bare ankle resting on sun-warmed pool ledge"
- Good: "sneaker sole facing camera, low angle on wet city pavement"
- Bad: "anklet displayed on dark surface" (no real-world context)

naturalEnvironment: 1-2 specific real locations from this product's actual world in max 10 words
- Good: "yoga studio with wooden floor and morning window light"
- Bad: "indoor setting" (too generic)

productAppearance: the product's actual colors, materials, and key design details in max 15 words. Critical for preservation.
- Good: "brown leather collar with turquoise padding, gold buckle, silver conchos"
- Bad: "collar" (no visual detail)

Keep size and support physically believable:
- wearable items (jewelry, shoes, accessories) should default to being worn or on a display stand — not floating on a generic surface
- apparel laid flat must clearly rest on a real horizontal surface, never floating
- small products need close framing — do not place them in full-room scenes where they'd disappear

Return ONLY valid JSON:
{
  "productType": "...",
  "productAppearance": "...",
  "constraints": {
    "sizeClass": "tiny|palm|handheld|tabletop|furniture|room",
    "scaleAnchor": "what object grounds the product's size (e.g. finger, hand, desk surface, table, room corner)",
    "supportRule": "how the product must be physically supported (e.g. must rest on flat surface, must be worn, can hang on wall)",
    "maxSceneDepth": "macro close-up|tabletop vignette|room corner|full room",
    "propWorld": "the product's natural prop universe in max 5 words (e.g. desk office supplies, kitchen dining, pet gear and toys)",
    "forbiddenContexts": ["contexts that would look wrong for this product"]
  },
  "viableModes": [
    {
      "presentationMode": "...",
      "cameraAngle": "...",
      "heroAction": "...",
      "naturalEnvironment": "..."
    }
  ]
}`

/**
 * Stage 1: Product Showcase Resolver
 *
 * Analyzes the product and returns ALL viable presentation modes ranked.
 * Uses multimodal Gemini to see the actual product image.
 * Call pickShowcaseForPin() after to select one mode by rotation.
 */
export async function resolveProductShowcase(
  product: { title: string; description?: string },
  productImageBase64?: string | null,
  productImageMimeType?: string | null,
  productTags?: string[] | null,
): Promise<ShowcaseAnalysis> {
  const descriptionLine = product.description
    ? `PRODUCT DESCRIPTION: "${product.description}"`
    : ""

  const prompt = SHOWCASE_PROMPT
    .replace("{title}", product.title)
    .replace("{descriptionLine}", descriptionLine)

  const parts: any[] = [{ text: prompt }]

  if (productImageBase64 && productImageMimeType) {
    parts.push({
      inlineData: {
        data: productImageBase64,
        mimeType: productImageMimeType,
      },
    })
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: parts,
      config: { temperature: 0.3, responseMimeType: "application/json" },
    })

    const parsed = JSON.parse(response.text?.trim() || "{}")
    const productFamily = inferProductFamily(product, parsed.productType || productTags?.[0])

    // Validate and filter viable modes
    const viableModes = (parsed.viableModes || [])
      .filter((m: any) => PRESENTATION_MODES.includes(m.presentationMode))
      .map((m: any) => normalizeModeForFamily({
        presentationMode: m.presentationMode as PresentationMode,
        cameraAngle: m.cameraAngle || "eye-level three-quarter",
        heroAction: m.heroAction || `${product.title} displayed naturally`,
        naturalEnvironment: m.naturalEnvironment || "clean product setting",
      }, productFamily, product.title))

    // Ensure at least one mode
    if (viableModes.length === 0) {
      viableModes.push(normalizeModeForFamily({
        presentationMode: "styled-on-surface" as PresentationMode,
        cameraAngle: "eye-level three-quarter",
        heroAction: `${product.title} displayed naturally`,
        naturalEnvironment: "clean product setting",
      }, productFamily, product.title))
    }

    // Parse AI-inferred constraints (best-effort — graceful if missing/malformed)
    const rawConstraints = parsed.constraints
    const constraints = parseConstraints(rawConstraints)

    return {
      productFamily,
      productType: parsed.productType || product.title,
      productAppearance: parsed.productAppearance || product.title,
      constraints,
      viableModes,
    }
  } catch (err) {
    // Graceful fallback — never block generation
    console.error("Product Showcase Resolver failed, using fallback:", err)
    const fallbackFamily = inferProductFamily(product, productTags?.[0])
    return {
      productFamily: fallbackFamily,
      productType: product.title,
      productAppearance: product.title,
      viableModes: [normalizeModeForFamily({
        presentationMode: "styled-on-surface",
        cameraAngle: "eye-level three-quarter",
        heroAction: `${product.title} displayed naturally`,
        naturalEnvironment: "clean product setting",
      }, fallbackFamily, product.title)],
    }
  }
}

/**
 * Pick ONE showcase mode by rotating through the product's viable modes.
 * Uses per-product pin count so each new pin gets a different presentation.
 *
 * Pin 0 → viableModes[0] (best mode)
 * Pin 1 → viableModes[1] (second-best)
 * Pin 2 → viableModes[2] (third option)
 * Pin 3 → viableModes[0] (wraps around with fresh scene from Stage 2)
 */
export function pickShowcaseForPin(
  analysis: ShowcaseAnalysis,
  productPinCount: number,
): ShowcaseStrategy {
  const rules = FAMILY_RULES[analysis.productFamily]
  const idx = productPinCount % analysis.viableModes.length
  const picked = analysis.viableModes[idx]

  // Merge AI constraints with family rules (tighten-only, never loosen)
  const c = analysis.constraints
  let sceneScope = rules.sceneScope
  let scaleGuidance = rules.scaleGuidance
  let forbiddenElements = rules.forbiddenElements

  if (c) {
    // AI maxSceneDepth can tighten scene scope (e.g., "macro close-up" is tighter than "tabletop vignette")
    const depthOrder = ["macro close-up", "tabletop vignette", "room corner", "full room"]
    const familyScopeDepth = depthOrder.findIndex(d => rules.sceneScope.toLowerCase().includes(d.split(" ")[0]))
    const aiDepth = depthOrder.indexOf(c.maxSceneDepth)
    if (aiDepth >= 0 && aiDepth < familyScopeDepth) {
      sceneScope = `${c.maxSceneDepth} only; ${rules.sceneScope}`
    }

    // Conflict-aware merge: AI constraints must agree with presentationMode
    const isWorn = picked.presentationMode === "worn-on-model"
    const isSurface = picked.presentationMode === "styled-on-surface" || picked.presentationMode === "flat-lay-arrangement"

    // scaleAnchor: body-part anchors only make sense for worn/held modes
    if (c.scaleAnchor) {
      const bodyAnchors = ["finger", "wrist", "neck", "ear", "ankle", "hand"]
      const isBodyAnchor = bodyAnchors.some(b => c.scaleAnchor!.toLowerCase().includes(b))
      if (isBodyAnchor && isSurface) {
        // Drop body anchor for surface shots — it would contradict "resting on surface"
      } else {
        scaleGuidance = `${rules.scaleGuidance}. Anchor with: ${c.scaleAnchor}`
      }
    }

    // supportRule: filter out clauses that contradict the picked mode
    if (c.supportRule) {
      const clauses = c.supportRule.split(";").map(s => s.trim()).filter(Boolean)
      const filtered = clauses.filter(clause => {
        const cl = clause.toLowerCase()
        if (isWorn && (cl.includes("rest on") || cl.includes("flat surface") || cl.includes("lay on"))) return false
        if (isSurface && (cl.includes("must be worn") || cl.includes("on body"))) return false
        return true
      })
      if (filtered.length > 0) {
        scaleGuidance = `${scaleGuidance}. ${filtered.join("; ")}`
      }
    }

    // AI forbiddenContexts ADD to (never replace) family forbidden elements
    if (c.forbiddenContexts.length > 0) {
      forbiddenElements = `${rules.forbiddenElements}, ${c.forbiddenContexts.join(", ")}`
    }
  }

  // Sanitize any remaining "or" ambiguity from AI-injected constraints
  scaleGuidance = scaleGuidance.replace(/ or /gi, "; ")
  sceneScope = sceneScope.replace(/ or /gi, "; ")

  return {
    productFamily: analysis.productFamily,
    productType: analysis.productType,
    productAppearance: analysis.productAppearance,
    sceneScope,
    scaleGuidance,
    forbiddenElements,
    ...picked,
  }
}
