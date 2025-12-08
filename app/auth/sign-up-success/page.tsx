import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function SignUpSuccessPage() {
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
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Check your email</CardTitle>
            <CardDescription>We&apos;ve sent you a confirmation link to verify your account</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the link in your email to complete your registration and access your dashboard.
            </p>
            <Button asChild variant="outline" className="w-full bg-transparent">
              <Link href="/auth/sign-in">Back to sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
