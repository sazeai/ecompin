import type { PhysicalScale, PresentationMode, SceneFields } from "@/lib/scene-prompt"
import { buildImagePrompt, enforceSceneFields } from "@/lib/scene-prompt"

export interface CriticContext {
  physicalScale: PhysicalScale
  presentationMode: PresentationMode
  forbiddenContexts?: string[]
  isKidsProduct?: boolean
  isWeddingProduct?: boolean
  isWallArtProduct?: boolean
}

export interface CriticResult {
  valid: boolean
  issues: string[]
}

const SMALL_SCALES: ReadonlySet<PhysicalScale> = new Set(["tiny", "palm", "handheld"])

const SURFACE_REQUIRED_MODES: ReadonlySet<PresentationMode> = new Set([
  "resting-on-surface",
  "flat-arrangement",
])

const META_PATTERNS: RegExp[] = [
  /\bdo not\b/i,
  /\bdon'?t\b/i,
  /\bnever\b/i,
  /\bavoid\b/i,
  /\bensure\b/i,
  /\bmake sure\b/i,
  /\bexplicitly\b/i,
  /\bmust not\b/i,
  /\bshould not\b/i,
]

const BODY_PARTS = ["hand", "hands", "finger", "fingers", "wrist", "arm", "foot", "feet", "ankle", "leg", "body part"]
const ROOM_TERMS = ["full room", "living room", "bedroom", "full venue", "room-scale", "room corner"]
const WALL_TERMS = ["wall", "frame", "gallery", "hung", "leaning", "mounted"]
const KIDS_INAPPROPRIATE = ["alcohol", "wine", "beer", "cocktail", "bar", "knife", "industrial", "dark moody"]
const WEDDING_MISMATCH = ["gym", "garage", "industrial warehouse", "pet"]

/**
 * Rule-based prompt validation gate. No LLM call.
 *
 * Runs AFTER the deterministic prompt is built and BEFORE the call to fal.ai.
 * Uses the structured SceneFields (not a free-text prompt) as the source of truth,
 * so the prompt string is just a rendering of those fields.
 */
export function validatePrompt(prompt: string, context: CriticContext): CriticResult {
  const issues: string[] = []
  const lower = prompt.toLowerCase()

  // Rule 1: Small product + room-scale scene
  if (SMALL_SCALES.has(context.physicalScale)) {
    for (const term of ROOM_TERMS) {
      if (lower.includes(term)) {
        issues.push(`Small product (${context.physicalScale}) placed in room-scale scene ("${term}")`)
        break
      }
    }
  }

  // Rule 2: Surface-required mode without any surface word
  if (SURFACE_REQUIRED_MODES.has(context.presentationMode)) {
    const surfaceTerms = ["surface", "bench", "table", "bed", "backdrop", "floor", "mat", "shelf", "desk", "counter", "flat"]
    const hasSurface = surfaceTerms.some(t => lower.includes(t))
    if (!hasSurface) {
      issues.push(`Mode ${context.presentationMode} but no clear support surface mentioned in prompt`)
    }
  }

  // Rule 3: Forbidden contexts leaking
  const forbidden = (context.forbiddenContexts || []).map(f => f.trim().toLowerCase()).filter(Boolean)
  for (const f of forbidden) {
    if (f.length > 4 && lower.includes(f)) {
      issues.push(`Forbidden context "${f}" found in prompt`)
      continue
    }
    const words = f.split(/\s+/).filter(w => w.length > 3)
    for (const word of words) {
      const wordRegex = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i")
      if (wordRegex.test(prompt)) {
        issues.push(`Forbidden word "${word}" (from "${f}") found in prompt`)
        break
      }
    }
  }

  // Rule 4: Meta-instructions leaked
  for (const pattern of META_PATTERNS) {
    if (pattern.test(prompt)) {
      issues.push(`Meta-instruction detected: "${prompt.match(pattern)?.[0]}"`)
      break
    }
  }

  // Rule 5: Body parts in non-worn/held modes
  if (context.presentationMode !== "worn-on-body" && context.presentationMode !== "held-in-hand") {
    for (const part of BODY_PARTS) {
      const partRegex = new RegExp(`\\b${part}\\b`, "i")
      if (partRegex.test(prompt)) {
        issues.push(`Body part "${part}" referenced in ${context.presentationMode} mode prompt`)
        break
      }
    }
  }

  // Rule 6: Wall art not on wall
  if (context.isWallArtProduct) {
    const hasWallContext = WALL_TERMS.some(t => lower.includes(t))
    if (!hasWallContext) {
      issues.push(`Wall art product but no wall/frame/gallery context in prompt`)
    }
  }

  // Rule 7: Kids with adult-inappropriate content
  if (context.isKidsProduct) {
    for (const term of KIDS_INAPPROPRIATE) {
      if (lower.includes(term)) {
        issues.push(`Kids/baby product with inappropriate context: "${term}"`)
        break
      }
    }
  }

  // Rule 8: Wedding with mismatched context
  if (context.isWeddingProduct) {
    for (const term of WEDDING_MISMATCH) {
      if (lower.includes(term)) {
        issues.push(`Wedding/event product with mismatched context: "${term}"`)
        break
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
  }
}

/**
 * Deterministic prompt rebuild. NO LLM CALL.
 *
 * If the critic flags the prompt as invalid, we fix the structured fields via
 * regex/template swaps and re-render the prompt from scratch. The LLM's product
 * identification is preserved — we only correct the rendered output.
 */
export function rewritePrompt(
  originalPrompt: string,
  issues: string[],
  fields: SceneFields,
  aesthetic: { tag: string; styleAnchor?: string },
): { prompt: string; correctedFields: SceneFields } {
  const correctedFields = enforceSceneFields(fields, issues)
  const prompt = buildImagePrompt(correctedFields, aesthetic)
  return { prompt, correctedFields }
}
