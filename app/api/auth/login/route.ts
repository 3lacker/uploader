import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { verifyPassword, signJWT } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { z } from "zod"

const loginSchema = z.object({
  identifier: z.string().min(1, "Username or email is required"),
  password: z.string().min(1, "Password is required"),
})

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = rateLimit(req, 5, 15 * 60 * 1000) // 5 attempts per 15 minutes
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { identifier, password } = loginSchema.parse(body)

    // Find user by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    })

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate JWT
    const token = signJWT({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    return NextResponse.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
