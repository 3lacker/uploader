import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyJWT, generateApiKey } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = rateLimit(req, 3, 60 * 60 * 1000) // 3 API keys per hour
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many API key generation attempts. Please try again later." },
      { status: 429 },
    )
  }

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

    // Generate new API key
    const { key, hashedKey } = await generateApiKey()

    // Store in database
    await prisma.apiKey.create({
      data: {
        key,
        hashedKey,
        userId: payload.userId,
      },
    })

    return NextResponse.json({
      apiKey: key,
    })
  } catch (error) {
    console.error("API key generation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

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

    // Get user's API keys
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: payload.userId },
      select: {
        id: true,
        key: true,
        createdAt: true,
        lastUsed: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ apiKeys })
  } catch (error) {
    console.error("API key fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
