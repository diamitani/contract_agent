import { type NextRequest, NextResponse } from "next/server"
import { Resend } from "resend"
import { addAnalyticsEvent, isCosmosConfigured } from "@/lib/cosmos/store"
import { APP_ID } from "@/lib/constants"

const MAKE_WEBHOOK_URL = process.env.TEMPLATE_MAKE_WEBHOOK_URL || "https://hook.us2.make.com/laid4qandumq6ahbce23zfxs820qupg0"

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return null
  return new Resend(apiKey)
}

export async function POST(request: NextRequest) {
  try {
    const { name, email, contractSlug, contractName } = await request.json()

    const timestamp = new Date().toISOString()
    const appId = APP_ID

    // 1. Store event in Cosmos when configured
    if (isCosmosConfigured()) {
      try {
        const analyticsUser = String(email || "guest").toLowerCase()
        await addAnalyticsEvent(analyticsUser, "template_download", {
          name,
          email,
          contract_slug: contractSlug,
          contract_name: contractName,
          downloaded_at: timestamp,
          app_id: appId,
        })
      } catch (error) {
        console.error("Failed to log template download event:", error)
      }
    }

    // 2. Send webhook to make.com
    let webhookSent = false
    try {
      const webhookPayload = {
        contract_name: contractName,
        email,
        name,
        title: contractName,
        time: timestamp,
        app_id: appId,
      }

      const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(webhookPayload),
      })

      webhookSent = webhookResponse.ok
      console.log(`Webhook sent to make.com: ${webhookSent}`)
    } catch (webhookError) {
      console.error("Webhook error:", webhookError)
    }

    // 3. Send email via Resend
    let emailSent = false
    const resend = getResendClient()

    try {
      if (!resend) {
        console.warn("RESEND_API_KEY is not configured; skipping template email send")
      } else {
        const { data: emailData, error: emailError } = await resend.emails.send({
          from: "Artispreneur <pat@artispreneur.com>",
          to: email,
          subject: `Your ${contractName} Template - Artispreneur`,
          html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 40px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Artispreneur</h1>
              <p style="color: #d4af37; margin: 10px 0 0; font-size: 14px; letter-spacing: 1px;">CONTRACT TEMPLATES</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="color: #1a1a1a; margin: 0 0 20px; font-size: 22px;">Hi ${name},</h2>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                Thank you for downloading the <strong>${contractName}</strong> template from Artispreneur.
              </p>
              
              <p style="color: #4a4a4a; font-size: 16px; line-height: 1.6; margin: 0 0 30px;">
                Your template should have downloaded automatically. If it didn't, you can always access it from our website.
              </p>
              
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="https://artispreneur.com/templates" style="display: inline-block; background-color: #dc2626; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Download More Templates
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
              
              <!-- AI Generator Promo -->
              <div style="background-color: #fef3c7; border-radius: 8px; padding: 24px; text-align: center;">
                <h3 style="color: #92400e; margin: 0 0 10px; font-size: 18px;">Need a Customized Contract?</h3>
                <p style="color: #a16207; font-size: 14px; line-height: 1.5; margin: 0 0 15px;">
                  Use our AI-powered contract generator to create contracts tailored to your specific needs.
                </p>
                <a href="https://artispreneur.com" style="display: inline-block; background-color: #d4af37; color: #1a1a1a; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-weight: 600; font-size: 14px;">
                  Generate Custom Contract
                </a>
              </div>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1a1a; padding: 30px; text-align: center;">
              <p style="color: #888888; font-size: 12px; margin: 0 0 10px;">
                © ${new Date().getFullYear()} Artispreneur. All rights reserved.
              </p>
              <p style="color: #666666; font-size: 11px; margin: 0;">
                You received this email because you downloaded a contract template.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `,
        })

        if (emailError) {
          console.error("Resend error:", emailError)
        } else {
          emailSent = true
          console.log("Email sent successfully:", emailData)
        }
      }
    } catch (emailErr) {
      console.error("Email sending error:", emailErr)
    }

    // 4. Record post-processing status in Cosmos
    if (isCosmosConfigured()) {
      try {
        const analyticsUser = String(email || "guest").toLowerCase()
        await addAnalyticsEvent(analyticsUser, "template_download_delivery", {
          contract_slug: contractSlug,
          contract_name: contractName,
          email_sent: emailSent,
          webhook_sent: webhookSent,
          app_id: appId,
          processed_at: new Date().toISOString(),
        })
      } catch (error) {
        console.error("Failed to log template delivery event:", error)
      }
    }

    return NextResponse.json({
      success: true,
      emailSent,
      webhookSent,
    })
  } catch (error) {
    console.error("Error processing template request:", error)
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
