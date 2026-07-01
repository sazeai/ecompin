/**
 * Product image pre-flight check.
 *
 * The single product-knowledge check we still need before calling Gemini: detect
 * digital/downloadable products so we can skip them in auto-generation. They have
 * no physical object to composite, so the fal.ai image-edit flow doesn't apply.
 *
 * The old 16-family taxonomy (jewelry, apparel, furniture, ...) was removed.
 * The LLM now identifies the product from the image itself in lib/scene-prompt.ts.
 * That was the root cause of the "bench cushion becomes a sofa on a table" bug —
 * a regex matching "bench" was classifying a soft cushion as furniture.
 */
export function isDigitalProduct(
  product: { title: string; description?: string },
  tags?: string[] | null,
): boolean {
  const haystack = `${product.title} ${product.description || ""} ${(tags || []).join(" ")}`.toLowerCase()
  return /(downloadable|digital download|instant download|printable|pdf|digital file|digital print)/.test(haystack)
}
