import { Resend } from "resend";

// Thin wrapper around the Resend SDK for transactional email (verification,
// password reset). `resend` has been a dependency since early on but nothing
// in the codebase ever called it until this file.
//
// RESEND_API_KEY is required for real sends. If it's missing (e.g. local dev
// without it configured), we don't throw — we log the link to the console
// instead so the flow is still testable end-to-end without a Resend
// account, and so a missing key never breaks registration/login.
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL =
	process.env.RESEND_FROM_EMAIL || "eStudyou <onboarding@resend.dev>";

async function sendEmail({
	to,
	subject,
	html,
}: {
	to: string;
	subject: string;
	html: string;
}) {
	if (!resend) {
		console.error(
			`RESEND_API_KEY is not set — skipping email send. Would have sent "${subject}" to ${to}:\n${html}`
		);
		return;
	}

	try {
		await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
	} catch (error) {
		// Email sending is always best-effort from the caller's perspective —
		// callers should not fail registration/reset requests just because the
		// notification email couldn't be sent.
		console.error(`Failed to send email ("${subject}") to ${to}:`, error);
	}
}

export async function sendVerificationEmail(to: string, verifyUrl: string) {
	await sendEmail({
		to,
		subject: "Verify your eStudyou email address",
		html: `
			<p>Welcome to eStudyou!</p>
			<p>Please confirm your email address by clicking the link below:</p>
			<p><a href="${verifyUrl}">${verifyUrl}</a></p>
			<p>This link expires in 24 hours. If you didn't create an account, you can ignore this email.</p>
		`,
	});
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
	await sendEmail({
		to,
		subject: "Reset your eStudyou password",
		html: `
			<p>We received a request to reset the password for your eStudyou account.</p>
			<p>Click the link below to choose a new password:</p>
			<p><a href="${resetUrl}">${resetUrl}</a></p>
			<p>This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password will not change.</p>
		`,
	});
}

// Disputes need a human in the Stripe dashboard before the evidence deadline —
// unlike the other webhook events this app just logs for reconciliation, a
// dispute isn't actionable from inside eStudyou at all, so email is the right
// channel rather than an in-app notification.
export async function sendDisputeAlertEmail(
	to: string,
	details: { disputeId: string; paymentIntentId: string; reason: string; amount: number },
) {
	await sendEmail({
		to,
		subject: `Stripe dispute opened (${details.reason})`,
		html: `
			<p>A payment dispute was opened on a Stripe charge linked to eStudyou.</p>
			<ul>
				<li>Dispute ID: ${details.disputeId}</li>
				<li>Payment intent: ${details.paymentIntentId}</li>
				<li>Reason: ${details.reason}</li>
				<li>Amount: ${(details.amount / 100).toFixed(2)}</li>
			</ul>
			<p>Respond to it in the <a href="https://dashboard.stripe.com/disputes">Stripe dashboard</a> before the evidence deadline.</p>
		`,
	});
}
