import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-3 mb-4">
            <Image
              src="/images/artispreneur-20logo.png"
              alt="Artispreneur Logo"
              width={56}
              height={56}
              className="rounded-lg"
            />
          </Link>
        </div>

        <Card className="border-border bg-card text-center">
          <CardHeader className="space-y-1">
            <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <CardTitle className="text-xl">Authentication Error</CardTitle>
            <CardDescription>Something went wrong during the authentication process</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please try signing in again. If the problem persists, contact support.
            </p>
            <Button asChild className="w-full">
              <Link href="/auth/sign-in">Try again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
