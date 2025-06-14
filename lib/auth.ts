import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { prisma } from "./prisma"

export interface JWTPayload {
  userId: string
  email: string
  username: string
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, process.env.SUPABASE_JWT_SECRET!, {
    expiresIn: "7d",
  })
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, process.env.SUPABASE_JWT_SECRET!) as JWTPayload
  } catch {
    return null
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function generateApiKey(): Promise<{ key: string; hashedKey: string }> {
  const key = `tk_${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`
  const hashedKey = await bcrypt.hash(key, 10)
  return { key, hashedKey }
}

export async function verifyApiKey(apiKey: string): Promise<string | null> {
  const apiKeyRecord = await prisma.apiKey.findFirst({
    where: {
      key: apiKey,
    },
    include: {
      user: true,
    },
  })

  if (!apiKeyRecord) {
    return null
  }

  // Update last used timestamp
  await prisma.apiKey.update({
    where: { id: apiKeyRecord.id },
    data: { lastUsed: new Date() },
  })

  return apiKeyRecord.userId
}
