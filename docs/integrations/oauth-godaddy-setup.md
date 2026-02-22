# OAuth Integration Setup (GoDaddy Domain)

This project now supports OAuth sign-in/sign-up with Google and Apple through Supabase.

## 1) Configure environment

Set these in Vercel (or your hosting platform):

- `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`

If you use `www`, also set the canonical URL consistently (either root or `www`) and redirect the other one.

## 2) GoDaddy domain DNS + SSL

Make sure your custom domain is fully connected and SSL is active before provider setup:

- `yourdomain.com`
- `www.yourdomain.com` (optional)

## 3) Supabase Auth URL settings

In Supabase Dashboard -> Authentication -> URL Configuration:

- Site URL: `https://yourdomain.com`
- Additional Redirect URLs:
  - `https://yourdomain.com/auth/callback`
  - `https://www.yourdomain.com/auth/callback` (if using `www`)
  - `http://localhost:3000/auth/callback` (dev)

## 4) Google OAuth setup

In Google Cloud Console:

1. Create OAuth client credentials (Web Application).
2. Add Authorized Redirect URI from Supabase Google provider settings.
3. Add Authorized JavaScript origins:
   - `https://yourdomain.com`
   - `https://www.yourdomain.com` (if used)
4. Copy Client ID / Client Secret into Supabase -> Authentication -> Providers -> Google.

## 5) Apple OAuth setup

In Apple Developer:

1. Create Service ID for web sign-in.
2. Add return URL from Supabase Apple provider settings.
3. Configure Sign in with Apple and associated domain.
4. Upload Apple domain association file if requested.
5. Add Apple credentials into Supabase -> Authentication -> Providers -> Apple.

## 6) App behavior already wired

The auth pages now include OAuth buttons:

- `app/auth/sign-in/page.tsx`
- `app/auth/sign-up/page.tsx`

Callback handling is already in:

- `app/auth/callback/route.ts`

OAuth preserves checkout routing via the `next` callback query parameter.

## 7) Verify flows

Test these paths end-to-end:

1. Sign in with Google -> lands on `/dashboard`
2. Sign up with Google from plan flow -> lands on `/checkout/{plan}`
3. Sign in with Apple -> lands on `/dashboard`
4. Plan + contract query -> redirects to the same checkout plan and contract context
