# Contract Agent - Quick Reference

**Last Updated:** 2026-03-15

---

## 🚀 Common Tasks

### Generate a Contract
```typescript
POST /api/generate-contract
Body: { templateId, fieldValues }
Returns: { contract, pdf }
```

### Analyze Document
```typescript
POST /api/analyze-file
Body: { file, userId }
Returns: { analysis, extractedData }
```

### Check Subscription
```typescript
GET /api/check-subscription?userId=xxx
Returns: { active, plan, credits }
```

---

## 📁 File Locations Cheat Sheet

| Need to... | Look in... |
|------------|-----------|
| Add new contract template | `lib/contracts.ts` |
| Modify AI behavior | `lib/ai.ts` |
| Update pricing | `lib/stripe.ts` |
| Change auth flow | `lib/auth/` or `app/api/auth/` |
| Add UI component | `components/` |
| Create new page | `app/[page-name]/page.tsx` |
| Add API endpoint | `app/api/[endpoint]/route.ts` |
| Update database queries | `lib/supabase/` or `lib/cosmos/` |

---

## 🔧 Development Workflow

### Start Development
```bash
cd /Users/patmini/Desktop/apps/contract_agent
npm run dev
# Opens http://localhost:3000
```

### Build for Production
```bash
npm run build
npm run start
```

### Deploy
- **Vercel:** Auto-deploys from v0.app
- **Azure:** Push to main branch (GitHub Actions)

---

## 🎯 Contract Template Structure

Each template has:
```typescript
{
  id: string              // Unique ID
  slug: string            // URL-friendly name
  name: string            // Display name
  description: string     // What it's for
  category: string        // Category (Marketing, Production, etc.)
  fields: ContractField[] // Form fields
  pdfUrl: string          // PDF template path
}
```

### Categories:
- Marketing
- Production
- Recording
- Management
- Sponsorship
- Performance
- Collaboration
- Licensing
- Representation
- Release
- Business

---

## 🔑 Environment Variables

Required:
```bash
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
GEMINI_API_KEY
```

Optional:
```bash
OPENAI_API_KEY           # Fallback AI
RESEND_API_KEY           # Email
```

---

## 🤖 AI Models Used

1. **gemini-2.0-flash-exp** (Primary)
2. **gemini-1.5-flash** (Fallback 1)
3. **gemini-1.5-pro** (Fallback 2)
4. **OpenAI** (Optional fallback)

All handled automatically in `lib/ai.ts`

---

## 💰 Pricing

| Plan | Price | Credits |
|------|-------|---------|
| Per Contract | $19.99 | 1 contract |
| Unlimited Pro | $9.99/mo | Unlimited |

---

## 📊 Database Schema (Simplified)

### Supabase Tables (inferred):
- `users` - User accounts
- `contracts` - Generated contracts
- `files` - Uploaded documents
- `subscriptions` - Stripe subscriptions
- `folders` - File organization

### Cosmos DB:
- Used for additional data storage
- Details in `lib/cosmos/store.ts`

---

## 🐛 Common Issues & Solutions

### "AI Generation Failed"
- Check GEMINI_API_KEY is set
- Verify API quota not exceeded
- Check error logs for specific model failure

### "Authentication Error"
- Verify Supabase credentials
- Check session cookies
- Ensure callback URLs configured

### "Payment Failed"
- Verify Stripe webhook endpoint
- Check STRIPE_SECRET_KEY
- Test mode vs live mode

### "PDF Generation Error"
- Check template exists at pdfUrl
- Verify field data complete
- Check server memory/timeout

---

## 📚 Important Constants

```typescript
// App ID
APP_ID = "contract_agent"

// App Name
APP_NAME = "Artispreneur Contracts"

// App Version
APP_VERSION = "1.0.0"

// Stripe Product IDs
SINGLE_CONTRACT = "prod_TaBqQcgKUGl22A"
UNLIMITED_PRO = "prod_TZS3I9e38MLwr1"
```

---

## 🎨 UI Component Patterns

Using shadcn/ui:
```typescript
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog } from "@/components/ui/dialog"

// All components in /components/ui/
```

Custom components:
```typescript
import { ContractForm } from "@/components/contract-form"
import { PaymentModal } from "@/components/payment-modal"
import { Header } from "@/components/header"
```

---

## 📞 Key API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/generate-contract` | POST | Create contract |
| `/api/generate-pdf` | POST | Generate PDF |
| `/api/analyze-file` | POST | Analyze document |
| `/api/chat-about-file` | POST | Chat about document |
| `/api/check-subscription` | GET | Check user plan |
| `/api/checkout` | POST | Start payment |
| `/api/stripe-webhook` | POST | Handle Stripe events |

---

## 🔒 Authentication Flow

```
User Sign In
    ↓
Supabase Auth (or Azure OAuth)
    ↓
Session Created (Cookies)
    ↓
Server Components (createClient from server.ts)
Client Components (createBrowserClient from client.ts)
    ↓
Authenticated Requests
```

---

## 📝 Adding a New Contract Template

1. Add to `lib/contracts.ts` array
2. Define fields with proper types
3. Create PDF template file
4. Update category if new
5. Test in `/generate/[slug]`

---

## 🎭 Component Architecture

```
Server Components (default)
├── Use async/await
├── Access DB directly
└── No useState/useEffect

Client Components ('use client')
├── Interactive UI
├── React hooks
└── Browser APIs
```

---

**Need more details?** Check `CODEBASE_OVERVIEW.md`
