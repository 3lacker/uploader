"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Loader2, Key, ExternalLink, Copy, CheckCircle } from "lucide-react"

interface User {
  id: string
  username: string
  email: string
}

interface ApiKey {
  id: string
  key: string
  createdAt: string
  lastUsed: string | null
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [newApiKey, setNewApiKey] = useState("")
  const [postContent, setPostContent] = useState("")
  const [copiedKey, setCopiedKey] = useState("")
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userData = localStorage.getItem("user")

    if (!token || !userData) {
      router.push("/login")
      return
    }

    setUser(JSON.parse(userData))
    fetchApiKeys(token)
  }, [router])

  const fetchApiKeys = async (token: string) => {
    try {
      const response = await fetch("/api/auth/apikey", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.apiKeys)
      }
    } catch (err) {
      console.error("Failed to fetch API keys:", err)
    }
  }

  const generateApiKey = async () => {
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/auth/apikey", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate API key")
      }

      setNewApiKey(data.apiKey)
      setSuccess("API key generated successfully! Make sure to copy it now.")
      fetchApiKeys(token!)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const linkTikTok = async () => {
    setIsLoading(true)
    setError("")

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/tiktok/oauth", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate TikTok linking")
      }

      // Redirect to TikTok OAuth
      window.location.href = data.authUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const postToTikTok = async () => {
    if (!postContent.trim()) {
      setError("Please enter content to post")
      return
    }

    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      // Use the first available API key for posting
      if (apiKeys.length === 0) {
        throw new Error("No API key available. Please generate one first.")
      }

      const response = await fetch("/api/tiktok/post", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKeys[0].key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: postContent }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to post to TikTok")
      }

      setSuccess(`Content posted successfully! Post ID: ${data.postId}`)
      setPostContent("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(keyId)
      setTimeout(() => setCopiedKey(""), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600">Welcome back, {user.username}!</p>
            </div>
            <Button variant="outline" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Key Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  API Key Management
                </CardTitle>
                <CardDescription>Generate and manage your API keys for secure access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={generateApiKey} disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Generate New API Key
                </Button>

                {newApiKey && (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">Your new API key:</p>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 p-2 bg-gray-100 rounded text-sm break-all">{newApiKey}</code>
                          <Button size="sm" variant="outline" onClick={() => copyToClipboard(newApiKey, "new")}>
                            {copiedKey === "new" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>
                        <p className="text-sm text-amber-600">
                          ⚠️ Save this key now! You won't be able to see it again.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {apiKeys.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Your API Keys</h4>
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <code className="text-sm">{key.key.substring(0, 12)}...</code>
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(key.key, key.id)}>
                              {copiedKey === key.id ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500">
                            Created: {new Date(key.createdAt).toLocaleDateString()}
                            {key.lastUsed && <> • Last used: {new Date(key.lastUsed).toLocaleDateString()}</>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* TikTok Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ExternalLink className="h-5 w-5" />
                  TikTok Integration
                </CardTitle>
                <CardDescription>Link your TikTok account and post content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={linkTikTok} disabled={isLoading} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Link TikTok Account
                </Button>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="post-content">Post Content</Label>
                  <Textarea
                    id="post-content"
                    placeholder="Enter content to post to TikTok..."
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button onClick={postToTikTok} disabled={isLoading || !postContent.trim()} className="w-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Post to TikTok
                </Button>

                <Alert>
                  <AlertDescription className="text-sm">
                    <strong>Note:</strong> TikTok's API requires video content for posting. This demo shows the
                    authentication flow and API structure.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mt-6">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </div>
      </main>
    </div>
  )
}
