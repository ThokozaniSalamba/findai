@'
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "FindAI <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function send(to: string, subject: string, html: string) {
  try {
    return await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
  } catch (err) {
    console.error("Failed to send email:", err);
    return null;
  }
}

export async function sendWelcomeEmail(to: string, name: string | null) {
  const displayName = name || "there";
  return send(
    to,
    "Welcome to FindAI!",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Welcome to FindAI, ${displayName}!</h1>
      <p>Your account has been created successfully. You can now search for businesses, save favorites, and leave reviews.</p>
      <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">If you didn't create this account, you can ignore this email.</p>
    </div>
    `
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const resetLink = `${APP_URL}/reset-password?token=${token}`;
  return send(
    to,
    "Reset your FindAI password",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Reset your password</h1>
      <p>Click the button below to reset your FindAI password. This link expires in 1 hour.</p>
      <a href="${resetLink}" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin-top: 16px;">Reset Password</a>
      <p style="margin-top: 24px; color: #6b7280; font-size: 13px;">If you didn't request this, you can ignore this email.</p>
    </div>
    `
  );
}

export async function sendReviewNotification(
  to: string,
  businessName: string,
  businessId: string,
  rating: number,
  comment: string | null
) {
  return send(
    to,
    `New review on ${businessName}`,
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="color: #2563eb;">New review on ${businessName}</h1>
      <p>Rating: ${"⭐".repeat(rating)}</p>
      ${comment ? `<p style="color: #374151;">"${comment}"</p>` : ""}
      <p style="margin-top: 24px;"><a href="${APP_URL}/business/${businessId}" style="color: #2563eb;">View on FindAI</a></p>
    </div>
    `
  );
}

export async function sendClaimApprovedEmail(to: string, businessName: string, businessId: string) {
  return send(
    to,
    "Your business claim was approved",
    `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Your claim was approved</h1>
      <p>You now manage <strong>${businessName}</strong> on FindAI. You can edit its details, view analytics, and respond to reviews from your dashboard.</p>
      <p style="margin-top: 24px;"><a href="${APP_URL}/dashboard/business/${businessId}" style="color: #2563eb;">Go to your dashboard</a></p>
    </div>
    `
  );
}
'@ | Set-Content -Path "app\lib\email.ts" -Encoding utf8