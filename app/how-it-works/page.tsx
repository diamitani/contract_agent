import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  FileText,
  Sparkles,
  Upload,
  Download,
  Brain,
  MessageSquare,
  PenTool,
  CheckCircle2,
  ArrowRight,
  Zap,
  Shield,
  Clock,
} from "lucide-react"
import Link from "next/link"

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="border-b border-border">
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Simple. Powerful. Professional.</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 text-balance">
            How Artispreneur <span className="text-primary">Works</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
            From contract generation to document analysis, we provide the tools music industry professionals need to
            protect their work and business.
          </p>
        </div>
      </section>

      {/* Main Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <Card className="bg-card border-border hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <CardTitle className="text-xl">AI Contract Generation</CardTitle>
              <CardDescription>Generate complete, professional contracts in minutes using AI</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>21+ industry-specific templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Customized to your specific terms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Legally structured language</span>
                </li>
              </ul>
              <Link href="/generate">
                <Button className="w-full mt-6 bg-primary hover:bg-primary/90">
                  Generate Contract <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-accent/50 transition-colors">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
                <Upload className="w-7 h-7 text-accent" />
              </div>
              <CardTitle className="text-xl">Upload & Analyze</CardTitle>
              <CardDescription>Upload any contract and get AI-powered analysis and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>Support for PDF, DOCX, and more</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>Identify risks and key terms</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span>Chat to ask questions about your contract</span>
                </li>
              </ul>
              <Link href="/dashboard">
                <Button
                  variant="outline"
                  className="w-full mt-6 border-accent text-accent hover:bg-accent/10 bg-transparent"
                >
                  Upload Contract <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-card border-border hover:border-chart-5/50 transition-colors">
            <CardHeader>
              <div className="w-14 h-14 rounded-xl bg-chart-5/10 flex items-center justify-center mb-4">
                <Download className="w-7 h-7 text-chart-5" />
              </div>
              <CardTitle className="text-xl">Free Templates</CardTitle>
              <CardDescription>Download professional contract templates at no cost</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-5 mt-0.5 shrink-0" />
                  <span>Industry-standard formats</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-5 mt-0.5 shrink-0" />
                  <span>Preview before download</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-5 mt-0.5 shrink-0" />
                  <span>Email delivery included</span>
                </li>
              </ul>
              <Link href="/templates">
                <Button
                  variant="outline"
                  className="w-full mt-6 border-chart-5 text-chart-5 hover:bg-chart-5/10 bg-transparent"
                >
                  Browse Templates <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Contract Generation Process */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">AI Contract Generation Process</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create professional, legally-structured contracts in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: FileText,
                title: "Choose Template",
                description: "Select from 21+ contract templates designed for the music industry",
              },
              {
                step: "02",
                icon: PenTool,
                title: "Fill Details",
                description: "Enter your specific terms, parties, and conditions through our guided form",
              },
              {
                step: "03",
                icon: Sparkles,
                title: "AI Generation",
                description: "Our AI generates a complete, professional contract based on your inputs",
              },
              {
                step: "04",
                icon: Download,
                title: "Download & Sign",
                description: "Download your contract as PDF, sign digitally, and send for signatures",
              },
            ].map((item, index) => (
              <div key={index} className="relative">
                <div className="bg-card border border-border rounded-xl p-6 h-full">
                  <div className="text-5xl font-bold text-primary/20 mb-4">{item.step}</div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                {index < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Start Generating <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Upload & Analyze Process */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Upload & Analyze Your Contracts</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get AI-powered insights on any contract you've received or are reviewing
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {[
              {
                icon: Upload,
                title: "Upload Any Document",
                description: "Drag and drop PDF, DOCX, or DOC files. We'll securely store them in your dashboard.",
              },
              {
                icon: Brain,
                title: "AI Extracts & Analyzes",
                description: "Our AI reads the contract, identifies parties, terms, obligations, risks, and key dates.",
              },
              {
                icon: MessageSquare,
                title: "Ask Questions",
                description:
                  "Chat with AI about your contract. Ask about specific clauses, potential issues, or what terms mean.",
              },
              {
                icon: Shield,
                title: "Understand & Protect",
                description: "Get a complete breakdown of what you're agreeing to before you sign anything.",
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-8">
            <div className="bg-secondary/50 rounded-lg p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Recording_Agreement.pdf</p>
                  <p className="text-sm text-muted-foreground">Uploaded 2 minutes ago</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Contract Type:</span>
                  <span className="text-foreground font-medium">Recording Agreement</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Parties Identified:</span>
                  <span className="text-foreground font-medium">2 parties</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Risk Level:</span>
                  <span className="text-amber-500 font-medium">Medium - Review Recommended</span>
                </div>
              </div>
            </div>
            <div className="bg-secondary/30 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-2">AI Summary:</p>
              <p className="text-sm text-foreground">
                "This is a 3-year exclusive recording agreement with Atlantic Records. Key concerns include the 360 deal
                structure which grants the label rights to merchandise and touring revenue..."
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-12">
          <Link href="/dashboard">
            <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 bg-transparent">
              Upload a Contract <Upload className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Free Templates Section */}
      <section className="border-y border-border bg-secondary/30">
        <div className="container mx-auto px-4 py-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Free Contract Templates</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Don't need AI generation? Download our professionally written contract templates for free. Preview the
                full text, enter your email, and get the template delivered to your inbox.
              </p>
              <ul className="space-y-4 mb-8">
                {[
                  "21+ templates covering all music industry needs",
                  "Preview full contract text before downloading",
                  "Instant download + email delivery",
                  "Industry-standard legal language",
                  "No account required for templates",
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-chart-5 mt-0.5 shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/templates">
                <Button size="lg" className="bg-chart-5 hover:bg-chart-5/90 text-white">
                  Browse All Templates <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                "Production Agreement",
                "Artist Management",
                "Recording Contract",
                "Publishing Deal",
                "Split Sheet",
                "Work for Hire",
              ].map((template, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-lg p-4 hover:border-chart-5/50 transition-colors"
                >
                  <FileText className="w-8 h-8 text-chart-5 mb-2" />
                  <p className="font-medium text-foreground text-sm">{template}</p>
                  <p className="text-xs text-muted-foreground">Free Download</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Why Music Professionals Choose Us</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Built specifically for the music industry by people who understand it
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Zap,
              title: "Fast & Efficient",
              description:
                "Generate complete contracts in minutes, not hours. Our AI understands music industry terminology and creates professional documents instantly.",
            },
            {
              icon: Shield,
              title: "Legally Sound",
              description:
                "Every template and generated contract uses industry-standard legal language. Protect yourself with proper documentation.",
            },
            {
              icon: Clock,
              title: "Save Time & Money",
              description:
                "Skip expensive lawyer consultations for standard agreements. Get professional contracts at a fraction of the cost.",
            },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <item.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">Ready to Protect Your Music Business?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of artists, producers, and music professionals who trust Artispreneur for their contract
            needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Generate a Contract <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/templates">
              <Button size="lg" variant="outline">
                Browse Free Templates <Download className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="ghost">
                View Pricing <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Artispreneur. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
