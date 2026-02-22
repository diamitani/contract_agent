# contract_agent

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/artispreneur/v0-contract-agent)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/bt4zGr5kEQT)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/artispreneur/v0-contract-agent](https://vercel.com/artispreneur/v0-contract-agent)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/bt4zGr5kEQT](https://v0.app/chat/bt4zGr5kEQT)**

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository

## Integrations

- OAuth + custom domain setup guide: `docs/integrations/oauth-godaddy-setup.md`

## Azure Deployment (GitHub Actions)

The repository includes workflow: `.github/workflows/azure-webapp.yml`.

Add these GitHub repository secrets before deploying:

- `AZURE_WEBAPP_NAME` (your App Service name)
- `AZURE_WEBAPP_PUBLISH_PROFILE` (full XML publish profile from Azure)

Set these Azure App Service environment variables:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `OPENAI_API_KEY` and/or `GEMINI_API_KEY`
- `RESEND_API_KEY`
