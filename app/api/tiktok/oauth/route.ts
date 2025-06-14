import { type NextRequest, NextResponse } from "next/server"
import { verifyJWT } from "@/lib/auth"
import { cookies } from "next/headers"
import crypto from "crypto"

export async function GET(req: NextRequest) {
  try {
    // Verify JWT token
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const payload = verifyJWT(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    // Generate CSRF token
    const csrfToken = crypto.randomBytes(32).toString("hex")

    // Set secure cookie with CSRF token (60 seconds expiration)
    const cookieStore = await cookies()
    cookieStore.set("tiktok_csrf", csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60, // 60 seconds
    })

    // Build TikTok OAuth URL
    const params = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY!,
      scope: "user.info.basic,video.upload,video.publish",
      response_type: "code",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI!,
      state: csrfToken,
    })

    const authUrl = `https://www.tiktok.com/v2/auth/authorize/?${params.toString()}`

    return NextResponse.json({
      authUrl,
      message: "Redirect to this URL to authorize TikTok access",
    })
  } catch (error) {
    console.error("TikTok OAuth initiation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
