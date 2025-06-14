import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Key, ExternalLink, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">TikTok Auth System</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Secure authentication system with TikTok integration, API key management, and content posting capabilities
            built with Next.js and PostgreSQL.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/login">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Secure Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                JWT-based authentication with bcrypt password hashing and rate limiting protection.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Key className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>API Key Management</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate and manage secure API keys for programmatic access to protected endpoints.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <ExternalLink className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>TikTok Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                OAuth 2.0 flow for linking TikTok accounts with CSRF protection and secure token storage.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-orange-600 mb-2" />
              <CardTitle>Content Posting</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Post content to TikTok using authenticated API endpoints with proper error handling.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Authentication & Security</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• JWT token-based authentication</li>
                <li>• Bcrypt password hashing</li>
                <li>• Rate limiting protection</li>
                <li>• CSRF token validation</li>
                <li>• Secure API key generation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">TikTok Integration</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• OAuth 2.0 authorization flow</li>
                <li>• Secure token storage</li>
                <li>• Content posting API</li>
                <li>• Token expiration handling</li>
                <li>• User account linking</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
