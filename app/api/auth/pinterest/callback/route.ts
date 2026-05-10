import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { exchangeCodeForTokens, getAccountInfo } from "@/lib/pinterest-api"
import { encrypt } from "@/utils/encryption"

/**
 * Pinterest OAuth Callback
 * 
 * GET /api/auth/pinterest/callback
 * Receives the authorization code from Pinterest, exchanges for tokens,
 * fetches account info, and stores the connection.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const searchParams = req.nextUrl.searchParams
  const code = searchParams.get("code")
  const state = searchParams.get("state")
  const error = searchParams.get("error")

  // Handle OAuth errors
  if (error) {
    console.error("Pinterest OAuth error:", error)
    return NextResponse.redirect(
      new URL(`/integrations?pinterest_error=${encodeURIComponent(error)}`, req.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/integrations?pinterest_error=invalid_response", req.url)
    )
  }

  // Verify CSRF state
  const storedState = req.cookies.get("pinterest_oauth_state")?.value
  if (!storedState || storedState !== state) {
    return NextResponse.redirect(
      new URL("/integrations?pinterest_error=invalid_state", req.url)
    )
  }

  // Parse redirect target from state
  let redirectTo = "/integrations"
  try {
    const stateData = JSON.parse(Buffer.from(state, "base64").toString())
    if (stateData.redirectTo && typeof stateData.redirectTo === "string" && stateData.redirectTo.startsWith("/")) {
      redirectTo = stateData.redirectTo
    }
  } catch {
    // fallback to /integrations
  }

  try {
    const callbackUrl = new URL("/api/auth/pinterest/callback", req.url).toString()

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code, callbackUrl)

    // Fetch Pinterest account info
    let pinterestUserId = ''
    let accountAge = 0
    try {
      const accountInfo = await getAccountInfo(tokens.access_token)
      pinterestUserId = accountInfo.username || ''
      
      // Calculate account age in days
      if (accountInfo.created_at) {
        const createdDate = new Date(accountInfo.created_at)
        accountAge = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
      }
    } catch (e) {
      console.warn("Could not fetch Pinterest account info:", e)
    }

    // Determine initial warmup phase based on account age
    let warmupPhase: 'warmup_no_url' | 'warmup_partial' | 'full' = 'warmup_no_url'
    let trustScore = 0
    if (accountAge > 30) {
      warmupPhase = 'full'
      trustScore = 80
    } else if (accountAge > 14) {
      warmupPhase = 'warmup_partial'
      trustScore = 50
    } else {
      trustScore = 20
    }

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000)

    // Encrypt tokens at rest — AES-256-GCM via utils/encryption.ts
    // ENCRYPTION_KEY must be set as a 64-hex-char env var.
    const encryptedAccessToken = encrypt(tokens.access_token)
    const encryptedRefreshToken = encrypt(tokens.refresh_token)

    // Upsert connection
    const { error: dbError } = await supabase
      .from("pinterest_connections")
      .upsert({
        user_id: user.id,
        pinterest_user_id: pinterestUserId,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: expiresAt.toISOString(),
        account_age_days: accountAge,
        trust_score: trustScore,
        warmup_phase: warmupPhase,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "user_id",
      })

    if (dbError) {
      console.error("Failed to save Pinterest connection:", dbError)
      return NextResponse.redirect(
        new URL("/integrations?pinterest_error=save_failed", req.url)
      )
    }

    // Clear state cookie and redirect with success
    const successUrl = new URL(redirectTo, req.url)
    successUrl.searchParams.set("pinterest", "connected")
    const response = NextResponse.redirect(successUrl)
    response.cookies.delete("pinterest_oauth_state")

    return response
  } catch (err: any) {
    console.error("Pinterest callback error:", err)
    return NextResponse.redirect(
      new URL(`/integrations?pinterest_error=${encodeURIComponent(err.message || 'unknown')}`, req.url)
    )
  }
}
