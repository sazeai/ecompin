/**
 * Pinterest API Client — EcomPin
 * 
 * Handles all Pinterest v5 API interactions:
 * - OAuth token management (including refresh)
 * - Pin creation & board listing
 * - Analytics fetching
 * - Account info
 */

import { createClient } from '@supabase/supabase-js'
import { encrypt, decrypt } from '@/utils/encryption'

const PINTEREST_API_BASE = 'https://api-sandbox.pinterest.com/v5'
const PINTEREST_OAUTH_BASE = 'https://www.pinterest.com/oauth'
const PINTEREST_TOKEN_URL = 'https://api-sandbox.pinterest.com/v5/oauth/token'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// --- Types ---

export interface PinterestBoard {
  id: string
  name: string
  description: string | null
  pin_count: number
  privacy: 'PUBLIC' | 'PROTECTED' | 'SECRET'
}

export interface PinterestPin {
  id: string
  title: string
  description: string
  link: string
  board_id: string
  media_source: {
    source_type: string
    url: string
  }
}

export interface PinterestAnalytics {
  pin_id: string
  impressions: number
  saves: number
  outbound_clicks: number
}

export interface PinterestUserInfo {
  username: string
  account_type: string
  created_at: string
}

// --- Token Management ---

/**
 * Get a valid access token for a user's Pinterest connection.
 * Automatically refreshes if expired.
 */
export async function getValidAccessToken(userId: string): Promise<string | null> {
  const { data: connection } = await supabase
    .from('pinterest_connections')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!connection) return null

  // Decrypt the stored token before use
  const decryptedAccessToken = decrypt(connection.access_token)

  // Check if token is expired (with 5-minute buffer)
  const expiresAt = new Date(connection.expires_at)
  const now = new Date()
  const bufferMs = 5 * 60 * 1000

  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    return decryptedAccessToken
  }

  // Token expired — refresh it (pass encrypted refresh token; refreshAccessToken decrypts it internally)
  const newTokens = await refreshAccessToken(connection.refresh_token)
  if (!newTokens) return null

  // Re-encrypt new tokens before writing back to the database
  const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000)
  await supabase
    .from('pinterest_connections')
    .update({
      access_token: encrypt(newTokens.access_token),
      refresh_token: encrypt(newTokens.refresh_token || decrypt(connection.refresh_token)),
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)

  return newTokens.access_token
}

/**
 * Refresh an expired access token.
 */
async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  refresh_token?: string
  expires_in: number
} | null> {
  const credentials = Buffer.from(
    `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
  ).toString('base64')

  // refreshToken arrives from the DB as an encrypted value — decrypt before sending to Pinterest
  const decryptedRefreshToken = decrypt(refreshToken)

  const res = await fetch(PINTEREST_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: decryptedRefreshToken,
    }),
  })

  if (!res.ok) {
    console.error('Pinterest token refresh failed:', await res.text())
    return null
  }

  return res.json()
}

// --- API Methods ---

/**
 * Make an authenticated request to the Pinterest API.
 */
async function pinterestFetch(
  accessToken: string,
  endpoint: string,
  options: RequestInit = {}
): Promise<any> {
  const res = await fetch(`${PINTEREST_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Pinterest API error (${res.status}): ${errorText}`)
  }

  return res.json()
}

/**
 * Get all boards for the authenticated user.
 */
export async function getBoards(accessToken: string): Promise<PinterestBoard[]> {
  const data = await pinterestFetch(accessToken, '/boards?page_size=100')
  return data.items || []
}

/**
 * Create a new board on the authenticated user's Pinterest account.
 * Used by Feature 11 (Programmatic Board Optimization) to auto-create
 * SEO-optimized boards when no existing board matches a pin's keywords.
 */
export async function createBoard(
  accessToken: string,
  name: string,
  description: string = ''
): Promise<PinterestBoard> {
  return pinterestFetch(accessToken, '/boards', {
    method: 'POST',
    body: JSON.stringify({
      name: name.slice(0, 50),  // Pinterest board name max 50 chars
      description: description.slice(0, 500),
      privacy: 'PUBLIC',
    }),
  })
}

/**
 * Get account info for the authenticated user.
 */
export async function getAccountInfo(accessToken: string): Promise<PinterestUserInfo> {
  return pinterestFetch(accessToken, '/user_account')
}


/**
 * Fetch top trending keywords from Pinterest.
 * Useful for the Autonomous Trends Engine to intercept high-volume searches.
 */
export async function getTrendingKeywords(
  accessToken: string,
  region: string = 'US',
  trendType: string = 'growing'
): Promise<string[]> {
  try {
    const data = await pinterestFetch(accessToken, `/trends/keywords/${region}/top/${trendType}?limit=15`)

    // Check if the response matches what we expect from the API
    if (data && data.trends && Array.isArray(data.trends)) {
      // Map to just the keyword strings
      return data.trends.map((t: any) => t.keyword || t.term || '').filter(Boolean)
    }

    return []
  } catch (err) {
    console.error('Failed to fetch Pinterest trends:', err)
    // Return safe fallback so the batch doesn't crash if Pinterest API changes or fails
    return ['home decor', 'aesthetic lifestyle', 'minimalist style', 'gift ideas', 'seasonal trends']
  }
}


/**
 * Create a pin on Pinterest.
 * Uses an external image URL (our R2 public URL).
 */
export async function createPin(
  accessToken: string,
  params: {
    boardId: string
    title: string
    description: string
    link: string
    imageUrl: string
    altText?: string
  }
): Promise<{ id: string }> {
  const body: Record<string, any> = {
    board_id: params.boardId,
    title: params.title,
    description: params.description,
    alt_text: params.altText || params.title,
    media_source: {
      source_type: 'image_url',
      url: params.imageUrl,
    },
  }

  // Only include link if it's a valid URL — Pinterest rejects empty or invalid links
  if (params.link && params.link.length > 0) {
    body.link = params.link
  }

  return pinterestFetch(accessToken, '/pins', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

/**
 * Get analytics for a specific pin.
 * Returns impressions, saves, and outbound clicks for the last 30 days.
 */
export async function getPinAnalytics(
  accessToken: string,
  pinId: string
): Promise<PinterestAnalytics> {
  const endDate = new Date().toISOString().split('T')[0]
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const data = await pinterestFetch(
    accessToken,
    `/pins/${pinId}/analytics?start_date=${startDate}&end_date=${endDate}&metric_types=OUTBOUND_CLICK,IMPRESSION,PIN_CLICK,SAVE`
  )

  // Aggregate the daily data
  let impressions = 0
  let saves = 0
  let outboundClicks = 0

  if (data.all?.daily_metrics) {
    for (const day of data.all.daily_metrics) {
      impressions += day.data_status === 'READY' ? (day.metrics?.IMPRESSION || 0) : 0
      saves += day.data_status === 'READY' ? (day.metrics?.SAVE || 0) : 0
      outboundClicks += day.data_status === 'READY' ? (day.metrics?.OUTBOUND_CLICK || 0) : 0
    }
  }

  return { pin_id: pinId, impressions, saves, outbound_clicks: outboundClicks }
}

/**
 * Get analytics for multiple pins in batch.
 */
export async function getBatchPinAnalytics(
  accessToken: string,
  pinIds: string[]
): Promise<PinterestAnalytics[]> {
  const results: PinterestAnalytics[] = []

  // Pinterest API doesn't have a true batch analytics endpoint,
  // so we fetch sequentially with a small delay to avoid rate limiting
  for (const pinId of pinIds) {
    try {
      const analytics = await getPinAnalytics(accessToken, pinId)
      results.push(analytics)
      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200))
    } catch (error) {
      console.error(`Failed to fetch analytics for pin ${pinId}:`, error)
      results.push({ pin_id: pinId, impressions: 0, saves: 0, outbound_clicks: 0 })
    }
  }

  return results
}

// --- OAuth Helpers ---

/**
 * Build the Pinterest OAuth authorization URL.
 */
export function buildAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.PINTEREST_APP_ID!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'boards:read,boards:write,pins:read,pins:write,user_accounts:read',
    state,
  })

  return `${PINTEREST_OAUTH_BASE}/?${params.toString()}`
}

/**
 * Exchange an authorization code for tokens.
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const credentials = Buffer.from(
    `${process.env.PINTEREST_APP_ID}:${process.env.PINTEREST_APP_SECRET}`
  ).toString('base64')

  const res = await fetch(PINTEREST_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })

  if (!res.ok) {
    const errorText = await res.text()
    throw new Error(`Pinterest token exchange failed: ${errorText}`)
  }

  return res.json()
}
