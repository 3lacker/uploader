import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")

    if (!code || !state) {
      return NextResponse.json({ error: "Missing authorization code or state parameter" }, { status: 400 })
    }

    // Verify CSRF token
    const cookieStore = await cookies()
    const csrfToken = cookieStore.get("tiktok_csrf")?.value

    if (!csrfToken || csrfToken !== state) {
      return NextResponse.json({ error: "Invalid CSRF token" }, { status: 400 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_key: process.env.TIKTOK_CLIENT_KEY!,
        client_secret: process.env.TIKTOK_CLIENT_SECRET!,
        code,
        grant_type: "authorization_code",
        redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error("TikTok token exchange failed:", errorData)
      return NextResponse.json({ error: "Failed to exchange authorization code for access token" }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    console.log("TikTok token data:", tokenData)
    if (!tokenData.access_token) {
      return NextResponse.json({ error: "No access token received from TikTok" }, { status: 400 })
    }

    // Get user info from TikTok to verify the token
    const userInfoResponse = await fetch("https://open.tiktokapis.com/v2/user/info/", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    })

    if (!userInfoResponse.ok) {
      return NextResponse.json({ error: "Failed to verify TikTok access token" }, { status: 400 })
    }

    // For now, we'll store the token without associating it to a specific user
    // In a real implementation, you'd need to maintain the user session through the OAuth flow

    // Clear CSRF cookie
    cookieStore.delete("tiktok_csrf")

    // Redirect to success page
    return NextResponse.redirect(new URL("/dashboard?tiktok=success", req.url))
  } catch (error) {
    console.error("TikTok callback error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
