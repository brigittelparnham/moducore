import { Resend } from 'resend'

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) throw new Error('RESEND_API_KEY is not set')
    resend = new Resend(apiKey)
  }
  return resend
}

const FROM = process.env.EMAIL_FROM ?? 'moducore <noreply@moducore.io>'
const APP_URL = process.env.CMS_URL ?? 'http://localhost:3001'

export async function sendWelcomeEmail(to: string, name: string, tenantName: string): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `Welcome to moducore, ${name}!`,
    html: `
      <h2>Welcome to moducore!</h2>
      <p>Hi ${name},</p>
      <p>Your workspace <strong>${tenantName}</strong> is ready. You can start creating pages, installing apps, and more.</p>
      <p><a href="${APP_URL}">Go to your dashboard →</a></p>
    `,
  })
}

export async function sendPasswordResetEmail(to: string, name: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`
  await getResend().emails.send({
    from: FROM,
    to,
    subject: 'Reset your moducore password',
    html: `
      <h2>Reset your password</h2>
      <p>Hi ${name},</p>
      <p>We received a request to reset your password. Click the link below to set a new one. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">Reset password →</a></p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `,
  })
}
