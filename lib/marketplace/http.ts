import "server-only"

import { NextResponse } from "next/server"

export function mutationAllowed(request: Request) {
  const origin = request.headers.get("origin")
  if (!origin) return true
  try { return new URL(origin).host === new URL(request.url).host } catch { return false }
}

export function jsonError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

export function diceSimilarity(a: string, b: string) {
  if (a === b) return 1
  if (a.length < 2 || b.length < 2) return 0
  const pairs = new Map<string, number>()
  for (let index = 0; index < a.length - 1; index += 1) {
    const pair = a.slice(index, index + 2); pairs.set(pair, (pairs.get(pair) || 0) + 1)
  }
  let matches = 0
  for (let index = 0; index < b.length - 1; index += 1) {
    const pair = b.slice(index, index + 2); const count = pairs.get(pair) || 0
    if (count > 0) { pairs.set(pair, count - 1); matches += 1 }
  }
  return (2 * matches) / (a.length + b.length - 2)
}
