import { NextResponse } from "next/server"
import { getBidStatus } from "@/lib/marketplace/queries"

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const status = await getBidStatus(id)
  return status ? NextResponse.json(status) : NextResponse.json({ error: "Quote not found." }, { status: 404 })
}
