# Contract Agent - Codebase Overview

**Generated:** 2026-03-15
**Project:** Artispreneur Contracts (contract_agent)
**Location:** `/Users/patmini/Desktop/apps/contract_agent`

---

## Project Summary

A Next.js 16 application for generating and managing legal contracts using AI. Built with v0.app, deployed on Vercel, with Supabase for data storage and Stripe for payments.

**Key Features:**
- AI-powered contract generation (21 different contract types)
- Document upload and analysis
- PDF generation
- User authentication (Supabase + Azure OAuth)
- Subscription-based pricing (Stripe)
- File management and organization

---

## Tech Stack

### Framework & Core
- **Next.js 16.0.10** (App Router, React 19.2.0)
- **TypeScript 5**
- **Tailwind CSS 4.1.9** with shadcn/ui components

### AI & APIs
- **Google Gemini AI** (@ai-sdk/google) - Primary AI provider
  - Models: gemini-2.0-flash-exp, gemini-1.5-flash, gemini-1.5-pro
- **OpenAI** (@ai-sdk/openai) - Fallback option
- **Vercel AI SDK** (ai 5.0.108)

### Backend Services
- **Supabase** - Authentication & Database
  - User management
  - Session handling
  - Data storage
- **Stripe** - Payment processing
  - Per-contract: $19.99
  - Unlimited Pro: $9.99/month
- **Azure Cosmos DB** (@azure/cosmos) - Additional data storage
- **Resend** - Email service

### UI Components (Radix UI + shadcn/ui)
- Dialog, Dropdown, Select, Tabs, Toast, etc.
- Custom components in `/components` directory

---

## Project Structure

```
contract_agent/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── analyze-file/         # File analysis endpoint
│   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── azure/            # Azure OAuth
│   │   │   ├── logout/
│   │   │   └── session/
│   │   ├── chat-about-file/      # AI chat for documents
│   │   ├── check-subscription/   # Stripe subscription check
│   │   ├── checkout/             # Stripe checkout
│   │   ├── create-checkout-session/
│   │   ├── generate-contract/    # Main contract generation
│   │   ├── generate-pdf/         # PDF creation
│   │   ├── process-document/     # Document processing
│   │   ├── stripe-webhook/       # Stripe events
│   │   └── webhook/              # General webhooks
│   ├── auth/                     # Auth pages
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   └── callback/
│   ├── checkout/                 # Payment pages
│   ├── dashboard/                # User dashboard
│   │   ├── insights/
│   │   └── profile/
│   ├── files/                    # File viewer
│   ├── generate/                 # Contract generation UI
│   ├── payment/                  # Payment success
│   ├── preview/                  # Contract preview
│   ├── pricing/                  # Pricing page
│   ├── templates/                # Template browser
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Home page
│   └── globals.css               # Global styles
│
├── components/                   # React Components
│   ├── auth/
│   │   └── oauth-buttons.tsx
│   ├── ui/                       # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   └── ... (30+ components)
│   ├── contract-card.tsx
│   ├── contract-form.tsx
│   ├── contract-preview-client.tsx
│   ├── contract-upload.tsx
│   ├── dashboard-client.tsx
│   ├── dashboard-header.tsx
│   ├── folder-manager.tsx
│   ├── header.tsx
│   ├── payment-modal.tsx
│   └── ... (more feature components)
│
├── lib/                          # Utilities & Business Logic
│   ├── ai.ts                     # AI integration (Gemini/OpenAI)
│   ├── auth/                     # Auth utilities
│   │   ├── current-user.ts
│   │   ├── session.ts
│   │   └── types.ts
│   ├── azure/
│   │   └── oidc.ts               # Azure OAuth
│   ├── supabase/                 # Supabase clients
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── proxy.ts
│   ├── cosmos/
│   │   └── store.ts              # Cosmos DB integration
│   ├── constants.ts              # App constants
│   ├── contracts.ts              # Contract templates (21 types!)
│   ├── contract-store.ts         # Contract storage
│   ├── stripe.ts                 # Stripe configuration
│   ├── get-stripe.ts             # Stripe client
│   └── utils.ts                  # General utilities
│
├── hooks/                        # React Hooks
│   ├── use-auth-user.ts
│   └── use-toast.ts
│
├── .github/workflows/            # CI/CD
│   └── azure-webapp.yml          # Azure deployment
│
├── .env.example                  # Environment variables template
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
└── next.config.mjs               # Next.js config
```

---

## Key Files Deep Dive

### Contract Templates (`lib/contracts.ts`)
**21 Pre-built Contract Types:**
1. Artist Influencer Agreement
2. Music Production Agreement
3. Artist Management Agreement
4. Artist Recording Contract
5. Sponsorship Agreement
6. Band Booking Agreement
7. Artist/Venue Agreement
8. DJ Booking Agreement
9. Artist-Agent Agreement
10. Music Licensing Agreement
11. Artist Collaboration Agreement
12. Work for Hire Agreement
13. Master Producer-Talent Agreement
14. Studio Time Contract
15. Artist/Label Recording Agreement
16. Split Sheet Agreement
17. LLC Operating Agreement (Music Label)
18. Talent Release Form
19. Producer/Composer Agreement
20. Video Release Form
21. Performance Venue Agreement

Each template includes:
- Field definitions (name, type, validation)
- Categories (Marketing, Production, Performance, etc.)
- PDF template references

### AI Integration (`lib/ai.ts`)
**Functions:**
- `generateWithFallback()` - Smart AI generation with model fallback
- `generateChat()` - Conversational AI for file chat
- `callOpenAI()` - Direct OpenAI API calls
- `callGeminiDirect()` - Direct Gemini API calls

**Model Priority:**
1. gemini-2.0-flash-exp (primary)
2. gemini-1.5-flash (fallback)
3. gemini-1.5-pro (final fallback)

### Stripe Products (`lib/stripe.ts`)
```typescript
PRODUCTS = {
  per_contract: {
    id: "prod_TaBqQcgKUGl22A",
    price: 1999, // $19.99
    description: "Generate one AI-powered contract"
  },
  unlimited: {
    id: "prod_TZS3I9e38MLwr1",
    price: 999, // $9.99/month
    description: "Unlimited contract generation + analysis"
  }
}
```

---

## API Routes Summary

### Contract Generation
- `POST /api/generate-contract` - Generate contract from template
- `POST /api/generate-pdf` - Create PDF from contract data
- `POST /api/generate-template-pdf` - Generate PDF from template

### Document Processing
- `POST /api/analyze-file` - AI analysis of uploaded documents
- `POST /api/process-document` - Process and extract data
- `POST /api/chat-about-file` - Chat interface for documents

### Authentication
- `GET /api/auth/azure/login` - Azure OAuth login
- `GET /api/auth/azure/callback` - OAuth callback
- `GET /api/auth/session` - Get current session
- `POST /api/auth/logout` - Logout user

### Payment & Subscription
- `POST /api/checkout` - Create checkout session
- `POST /api/create-checkout-session` - Alternative checkout
- `GET /api/checkout-status` - Check payment status
- `POST /api/check-subscription` - Verify subscription
- `POST /api/stripe-webhook` - Stripe webhook handler
- `POST /api/use-contract-credit` - Deduct contract credit

### Data
- `GET /api/data` - Fetch user data
- `POST /api/send-template` - Send template via email

---

## Environment Variables Required

```bash
# App
NEXT_PUBLIC_APP_URL=

# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# AI
GEMINI_API_KEY=                    # or GOOGLE_GENERATIVE_AI_API_KEY
OPENAI_API_KEY=                    # Optional fallback

# Email
RESEND_API_KEY=
```

---

## Data Flow Examples

### Contract Generation Flow:
```
1. User selects template (/generate/[slug])
2. Fills out form fields (components/contract-form.tsx)
3. POST /api/generate-contract
4. AI generates contract (lib/ai.ts)
5. PDF created (/api/generate-pdf)
6. Saved to Supabase
7. Credit deducted (/api/use-contract-credit)
```

### Document Analysis Flow:
```
1. User uploads file (components/contract-upload.tsx)
2. POST /api/process-document
3. File analyzed with AI (/api/analyze-file)
4. Data extracted and saved
5. Chat interface available (/api/chat-about-file)
```

---

## Authentication Flow

```
Supabase Auth
├── Email/Password
└── OAuth (Azure)
    ├── /api/auth/azure/login
    └── /api/auth/azure/callback
        └── Session created
            └── Stored in cookies (SSR)
```

---

## Deployment

### Vercel (Primary)
- Auto-deploy from v0.app
- Connected to GitHub repo
- Environment variables in Vercel dashboard

### Azure (Alternative)
- GitHub Actions workflow: `.github/workflows/azure-webapp.yml`
- Requires secrets:
  - `AZURE_WEBAPP_NAME`
  - `AZURE_WEBAPP_PUBLISH_PROFILE`

---

## Development Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Common Patterns

### Server Components
- Use `createClient()` from `lib/supabase/server.ts`
- Async by default in Next.js 16

### Client Components
- Use `'use client'` directive
- Use `createBrowserClient()` from `lib/supabase/client.ts`

### API Routes
- Use `NextRequest`/`NextResponse`
- Authentication via session cookies
- Error handling with try/catch

---

## Key Dependencies Version Notes

- **Next.js 16.0.10** - Latest with App Router
- **React 19.2.0** - Latest stable
- **Stripe 20.0.0** - Latest API version
- **Tailwind CSS 4.1.9** - v4 syntax

---

## Gotchas & Important Notes

1. **AI Provider:** Primary is Gemini, OpenAI is optional
2. **Webpack Mode:** Using `--webpack` flag in scripts
3. **Auth:** Hybrid Supabase + Azure OAuth
4. **File Storage:** Not specified in code (likely Supabase Storage)
5. **Database:** Both Supabase (primary) and Cosmos DB (secondary)
6. **PDF Generation:** Custom implementation in `/api/generate-pdf`

---

## Next Steps for Development

When working on this codebase:
1. Check contract templates in `lib/contracts.ts`
2. API routes are well-organized by feature
3. Components use shadcn/ui patterns
4. Authentication is handled server-side
5. AI calls have automatic fallback logic

---

## Recent Updates (2026-03-15)

### New Features Added
1. **PDF Watermarking System** (`/api/generate-pdf-watermarked/`)
   - Professional PDFs using pdf-lib
   - Watermarks for unpaid users
   - Base64 encoding

2. **AI Field Explanations** (`/api/explain-field/`)
   - Plain-language legal term explanations
   - Lightbox tooltips
   - Context-aware help

3. **Intelligent Chat Assistant** (`/api/chat-assistant/`)
   - Real AI-powered form assistance
   - Contextual guidance
   - Professional tone

4. **Watermarked Previews** (`/components/watermarked-contract-preview.tsx`)
   - Try-before-buy UX
   - Freemium conversion funnel
   - Clear upgrade paths

5. **Enhanced Components**
   - Field explanation tooltips in forms
   - Improved chat mode
   - Better PDF generation modal

### Dependencies Added
```json
{
  "jspdf": "latest",
  "html2canvas": "latest",
  "@react-pdf/renderer": "latest",
  "pdf-lib": "latest"
}
```

---

**Cache Version:** 1.1
**Accuracy:** High - based on direct codebase analysis + 2026-03-15 improvements
**Coverage:** ~95% of codebase structure documented
**Last Major Update:** 2026-03-15 (SaaS improvements)
