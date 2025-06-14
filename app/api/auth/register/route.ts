import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { hashPassword, signJWT } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
})

export async function POST(req: NextRequest) {
  // Rate limiting
  const rateLimitResult = rateLimit(req, 3, 15 * 60 * 1000) // 3 attempts per 15 minutes
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { email, username, password } = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      return NextResponse.json({ error: "User with this email or username already exists" }, { status: 409 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    })

    // Generate JWT
    const token = signJWT({
      userId: user.id,
      email: user.email,
      username: user.username,
    })

    return NextResponse.json(
      {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: error.errors }, { status: 400 })
    }

    console.error("Registration error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
