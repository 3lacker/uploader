import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyApiKey } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { z } from "zod"

const postSchema = z.object({
  content: z.string().min(1, "Content is required").max(2200, "Content too long"),
})

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = rateLimit(req, 10, 60 * 60 * 1000) // 10 posts per hour
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many posting attempts. Please try again later." }, { status: 429 })
  }

  try {
    // Verify API key
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid authorization header" }, { status: 401 })
    }

    const apiKey = authHeader.substring(7)
    const userId = await verifyApiKey(apiKey)
    if (!userId) {
      return NextResponse.json({ error: "Invalid API key" }, { status: 401 })
    }

    // Get user's TikTok token
    const tiktokToken = await prisma.tiktokToken.findUnique({
      where: { userId },
    })

    if (!tiktokToken) {
      return NextResponse.json(
        { error: "TikTok account not linked. Please link your TikTok account first." },
        { status: 400 },
      )
    }

    // Check if token is expired
    if (tiktokToken.expiresAt && tiktokToken.expiresAt < new Date()) {
      return NextResponse.json({ error: "TikTok access token expired. Please re-link your account." }, { status: 400 })
    }

    // Validate request body
    const body = await req.json()
    const { content } = postSchema.parse(body)

    // Note: TikTok's Content Posting API requires video content, not text
    // This is a simplified example - in reality, you'd need to handle video uploads
    const postResponse = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tiktokToken.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        post_info: {
          title: content,
          privacy_level: "SELF_ONLY", // Start with private posts for testing
          disable_duet: false,
          disable_comment: false,
          disable_stitch: false,
          video_cover_timestamp_ms: 1000,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: 0, // This would be the actual video size
          chunk_size: 0,
          total_chunk_count: 1,
        },
      }),
    })

    if (!postResponse.ok) {
      const errorData = await postResponse.text()
      console.error("TikTok post failed:", errorData)
      return NextResponse.json({ error: "Failed to post to TikTok", details: errorData }, { status: 400 })
    }

    const postData = await postResponse.json()

    return NextResponse.json({
      message: "Content posted successfully to TikTok",
      postId: postData.data?.publish_id || "unknown",
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("TikTok post error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
