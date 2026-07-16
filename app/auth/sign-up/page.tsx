"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Sparkles, ArrowRight, Check, ChevronLeft, ChevronRight, User, Music, Target } from "lucide-react"

const ARTIST_TYPES = ["Solo Artist", "Producer", "Band", "Songwriter", "DJ", "Beatmaker", "Composer", "Manager", "Other"]
const GENRES = ["Hip-Hop/Rap", "R&B/Soul", "Pop", "Electronic", "Rock", "Alternative", "Jazz", "Gospel", "Latin", "Afrobeats", "Country", "Other"]
const STAGES = ["Just starting out", "Building momentum", "Established & growing", "Full-time professional"]
const GOALS = [
  "Register with a PRO (BMI/ASCAP)",
  "Get my music on playlists",
  "License my music for sync/TV/film",
  "Set up an LLC or business entity",
  "Copyright my music",
  "Handle music business taxes",
  "Build my brand & social presence",
  "Find industry contacts & venues",
  "Learn the business side of music",
  "All of the above — I need everything",
]

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-10">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < current ? "#C9A227" : i === current ? "#CC0000" : "rgba(255,255,255,0.1)",
            transition: "background 300ms",
          }}
        />
      ))}
    </div>
  )
}

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    firstName: "", lastName: "", email: "", password: "",
    stageName: "", artistType: "", genre: "", stage: "",
    goals: [] as string[], notes: "",
  })
  const [generatedBio, setGeneratedBio] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const update = (field: string, value: any) => setForm((f) => ({ ...f, [field]: value }))
  const toggleGoal = (goal: string) => {
    setForm((f) => {
      const goals = f.goals.includes(goal) ? f.goals.filter((g) => g !== goal) : [...f.goals, goal]
      return { ...f, goals }
    })
  }

  const generateBio = () => {
    const name = form.stageName || form.firstName || "Artist"
    const genreMap: Record<string, string> = {
      "Hip-Hop/Rap": `${name} doesn't just make music — ${name} builds worlds.`,
      "R&B/Soul": `${name}'s voice doesn't ask for attention. It commands it.`,
      "Electronic": `${name} creates soundscapes that pull you into another dimension.`,
      "Pop": `${name} writes the kind of hooks that live in your head rent-free.`,
      "Rock": `${name} plugs in and lets the amplifiers do the talking.`,
      "Alternative": `${name} colors outside every line the industry draws.`,
      "Jazz": `${name} speaks the language of improvisation fluently.`,
      "Gospel": `${name}'s music comes from somewhere deeper than the studio.`,
      "Latin": `${name} moves between rhythms like a native of every dance floor.`,
      "Afrobeats": `${name} carries the pulse of the continent in every track.`,
      "Country": `${name} tells stories that feel like they were written on your front porch.`,
    }
    const hook = genreMap[form.genre] || `${name} makes music that refuses to be ignored.`
    const bio = `${hook}\n\n${name} is a ${form.genre || "multi-genre"} ${form.artistType?.toLowerCase() || "artist"}${form.stage ? `, ${form.stage.toLowerCase()}` : ""}. With a focus on creating authentic, impactful work, ${name} is building a music career on their own terms.\n\n${form.notes ? `"${form.notes}"` : ""}\n\n${form.goals.length > 0 ? `Currently focused on: ${form.goals.slice(0, 3).join(", ")}.` : "Ready to take the next step."}`
    return bio
  }

  const handleSubmit = () => {
    const profile = {
      ...form,
      bio: generateBio(),
      created_at: new Date().toISOString(),
    }
    localStorage.setItem("artispreneur_profile", JSON.stringify(profile))
    localStorage.setItem("artispreneur_logged_in", "true")
    setGeneratedBio(profile.bio)
    setSubmitted(true)
    setTimeout(() => router.push("/"), 2500)
  }

  const canNext = () => {
    if (step === 0) return form.firstName && form.email && form.password.length >= 8
    if (step === 1) return form.artistType && form.genre
    return true
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "12px 14px",
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 8, color: "#FAFAFA", fontFamily: "inherit", fontSize: 14,
    outline: "none", transition: "border-color 200ms",
  }
  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12, fontWeight: 600, color: "rgba(250,250,250,0.5)",
    marginBottom: 6, letterSpacing: "0.02em",
  }

  return (
    <div style={{ backgroundColor: "#050505", minHeight: "100vh" }}>
      <Header />

      <section style={{
        minHeight: "calc(100vh - 64px)", display: "flex", alignItems: "center",
        justifyContent: "center", padding: "40px 20px",
        background: "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(201,162,39,0.04), transparent 60%), #050505",
      }}>
        {submitted ? (
          /* Success state */
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%",
              background: "rgba(201,162,39,0.15)", margin: "0 auto 24px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Check className="w-8 h-8" style={{ color: "#C9A227" }} />
            </div>
            <h2 style={{ fontFamily: "var(--font-serif)", fontSize: 28, fontWeight: 700, color: "#FAFAFA", marginBottom: 12 }}>
              Your workspace is ready!
            </h2>
            <p className="text-[14px] leading-relaxed mb-6" style={{ color: "rgba(250,250,250,0.45)" }}>
              We've set up your contract agent workspace. Redirecting you to your dashboard...
            </p>
          </div>
        ) : (
          /* Form */
          <div style={{
            maxWidth: 520, width: "100%",
            background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 12, padding: "32px 36px",
          }}>
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700, color: "#FAFAFA" }}>
                  Rostr<span style={{ color: "#C9A227" }}>Contracts</span>
                </span>
              </div>
              <p className="text-[12px]" style={{ color: "rgba(250,250,250,0.35)" }}>
                Create your free account in 3 steps
              </p>
            </div>

            <StepIndicator current={step} total={3} />

            {/* Step 0: Account */}
            {step === 0 && (
              <div style={{ animation: "fade-in 0.3s ease both" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(204,0,0,0.15)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <User className="w-4 h-4" style={{ color: "#CC0000" }} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-white">Create Your Account</h3>
                    <p className="text-[11px]" style={{ color: "rgba(250,250,250,0.35)" }}>Basic info to get started</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={labelStyle}>First Name</label>
                      <input style={inputStyle} placeholder="Your first name" value={form.firstName}
                        onChange={(e) => update("firstName", e.target.value)}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)" }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                      />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input style={inputStyle} placeholder="Your last name" value={form.lastName}
                        onChange={(e) => update("lastName", e.target.value)}
                        onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)" }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input style={inputStyle} type="email" placeholder="you@example.com" value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Password (8+ characters)</label>
                    <input style={inputStyle} type="password" placeholder="Min 8 characters" value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Artist Profile */}
            {step === 1 && (
              <div style={{ animation: "fade-in 0.3s ease both" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(201,162,39,0.15)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Music className="w-4 h-4" style={{ color: "#C9A227" }} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-white">Your Artist Profile</h3>
                    <p className="text-[11px]" style={{ color: "rgba(250,250,250,0.35)" }}>Tell us about your music</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <div>
                    <label style={labelStyle}>Artist / Stage Name</label>
                    <input style={inputStyle} placeholder="What the world calls you" value={form.stageName}
                      onChange={(e) => update("stageName", e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>I am a...</label>
                    <div className="flex flex-wrap gap-2">
                      {ARTIST_TYPES.map((t) => (
                        <button
                          key={t}
                          onClick={() => update("artistType", t)}
                          style={{
                            padding: "7px 14px", borderRadius: 999, border: "1px solid",
                            borderColor: form.artistType === t ? "#C9A227" : "rgba(255,255,255,0.1)",
                            background: form.artistType === t ? "rgba(201,162,39,0.1)" : "transparent",
                            color: form.artistType === t ? "#C9A227" : "rgba(250,250,250,0.5)",
                            fontFamily: "inherit", fontSize: 12, fontWeight: 500,
                            cursor: "pointer", transition: "all 200ms",
                          }}>
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Primary Genre</label>
                    <div className="flex flex-wrap gap-2">
                      {GENRES.map((g) => (
                        <button
                          key={g}
                          onClick={() => update("genre", g)}
                          style={{
                            padding: "7px 14px", borderRadius: 999, border: "1px solid",
                            borderColor: form.genre === g ? "#C9A227" : "rgba(255,255,255,0.1)",
                            background: form.genre === g ? "rgba(201,162,39,0.1)" : "transparent",
                            color: form.genre === g ? "#C9A227" : "rgba(250,250,250,0.5)",
                            fontFamily: "inherit", fontSize: 12, fontWeight: 500,
                            cursor: "pointer", transition: "all 200ms",
                          }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={labelStyle}>Career Stage</label>
                    <div className="flex flex-col gap-2">
                      {STAGES.map((s) => (
                        <button
                          key={s}
                          onClick={() => update("stage", s)}
                          style={{
                            padding: "10px 14px", borderRadius: 8, border: "1px solid",
                            borderColor: form.stage === s ? "rgba(201,162,39,0.3)" : "rgba(255,255,255,0.08)",
                            background: form.stage === s ? "rgba(201,162,39,0.06)" : "rgba(255,255,255,0.02)",
                            color: form.stage === s ? "#C9A227" : "rgba(250,250,250,0.5)",
                            fontFamily: "inherit", fontSize: 13, fontWeight: 500,
                            cursor: "pointer", textAlign: "left", transition: "all 200ms",
                          }}>
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Goals */}
            {step === 2 && (
              <div style={{ animation: "fade-in 0.3s ease both" }}>
                <div className="flex items-center gap-3 mb-6">
                  <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "rgba(204,0,0,0.15)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Target className="w-4 h-4" style={{ color: "#CC0000" }} />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-white">Your Goals</h3>
                    <p className="text-[11px]" style={{ color: "rgba(250,250,250,0.35)" }}>What do you need contracts for?</p>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <label style={labelStyle}>Select all that apply</label>
                  <div className="flex flex-col gap-2 mb-4">
                    {GOALS.map((goal) => (
                      <button
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        style={{
                          width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid",
                          borderColor: form.goals.includes(goal) ? "rgba(201,162,39,0.3)" : "rgba(255,255,255,0.08)",
                          background: form.goals.includes(goal) ? "rgba(201,162,39,0.06)" : "rgba(255,255,255,0.02)",
                          color: form.goals.includes(goal) ? "#C9A227" : "rgba(250,250,250,0.5)",
                          fontFamily: "inherit", fontSize: 13, fontWeight: 500,
                          cursor: "pointer", textAlign: "left", transition: "all 200ms",
                          display: "flex", alignItems: "center", gap: 10,
                        }}>
                        <div style={{
                          width: 18, height: 18, borderRadius: 4, border: "1.5px solid",
                          borderColor: form.goals.includes(goal) ? "#C9A227" : "rgba(255,255,255,0.2)",
                          background: form.goals.includes(goal) ? "#C9A227" : "transparent",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, transition: "all 200ms",
                        }}>
                          {form.goals.includes(goal) && <Check className="w-3 h-3" style={{ color: "#050505" }} />}
                        </div>
                        {goal}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label style={labelStyle}>Anything else we should know?</label>
                    <textarea
                      rows={3}
                      style={{ ...inputStyle, resize: "none" }}
                      placeholder="Tell us about your specific contract needs, your project, your team..."
                      value={form.notes}
                      onChange={(e) => update("notes", e.target.value)}
                      onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,162,39,0.4)" }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)" }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between mt-8">
              {step > 0 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  style={{
                    background: "transparent", color: "rgba(250,250,250,0.5)", border: "none",
                    padding: "10px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
                  }}>
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              ) : <div />}

              {step < 2 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canNext()}
                  style={{
                    background: canNext() ? "#CC0000" : "rgba(255,255,255,0.05)",
                    color: canNext() ? "#fff" : "rgba(250,250,250,0.2)",
                    border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700,
                    cursor: canNext() ? "pointer" : "not-allowed",
                    fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6,
                    transition: "all 200ms",
                  }}>
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  style={{
                    background: "linear-gradient(135deg, #CC0000, #C9A227)", color: "#fff",
                    border: "none", borderRadius: 8, padding: "10px 24px", fontSize: 13, fontWeight: 700,
                    cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 8,
                    transition: "all 200ms", boxShadow: "0 4px 20px rgba(201,162,39,0.2)",
                  }}>
                  Create My Workspace <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sign in link */}
            <div className="text-center mt-6">
              <p className="text-[12px]" style={{ color: "rgba(250,250,250,0.3)" }}>
                Already have an account?{" "}
                <Link href="/auth/sign-in" style={{ color: "#C9A227", fontWeight: 600 }}>
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
