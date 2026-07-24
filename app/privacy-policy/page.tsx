import Link from "next/link";

export const metadata = {
	title: "Privacy Policy | The Learning Nexus",
};

export default function PrivacyPolicyPage() {
	return (
		<div className="max-w-3xl mx-auto px-4 py-12">
			<h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
			<p className="text-sm text-base-content/60 mb-6">Last updated: July 24, 2026</p>

			<div role="alert" className="alert alert-warning mb-8 text-sm">
				<i className="fa-solid fa-triangle-exclamation" />
				<span>
					This is a draft template, not final legal copy. Have a lawyer review and adapt it
					to your jurisdiction (e.g. GDPR, CCPA) before relying on it in production.
				</span>
			</div>

			<div className="flex flex-col gap-6 text-sm leading-relaxed">
				<section>
					<h2 className="text-lg font-semibold mb-2">1. Information we collect</h2>
					<p>
						When you create an account we collect your name, email address, password (stored
						as a salted hash, never in plain text), and optionally a phone number. When you
						book or teach classes we store related scheduling, subject, and review data. We do
						not collect or store payment card details ourselves — see below.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">2. Payment information</h2>
					<p>
						Payments are processed by Stripe. Card details are sent directly to Stripe and never
						pass through or are stored on our servers. Teachers who set up payouts provide bank
						account and identity verification details directly to Stripe through its own
						onboarding flow — we only receive and store Stripe&apos;s account status (e.g. whether
						payouts are enabled), not the underlying documents.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">3. How we use your information</h2>
					<p>
						We use your information to operate the platform: matching students with teachers,
						processing payments and payouts, sending transactional emails (booking
						confirmations, verification, password resets), and improving the service.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">4. Third parties we share data with</h2>
					<p>
						We use Stripe for payment processing and payouts, Resend for transactional email
						delivery, and Jitsi for hosting video class sessions. Each processes only the data
						necessary to provide their service to us.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">5. Cookies and sessions</h2>
					<p>
						We use a session cookie to keep you signed in. We do not use third-party advertising
						or tracking cookies.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">6. Your rights</h2>
					<p>
						You can review and update most of your account information from your profile
						settings. To request a copy or deletion of your data, contact the platform&apos;s
						support contact.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">7. Changes to this policy</h2>
					<p>
						We may update this policy from time to time. Material changes will be reflected here
						with an updated date.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">8. Contact</h2>
					<p>
						Questions about this policy can be sent to the platform&apos;s support contact. See
						also our{" "}
						<Link href="/terms-of-service" className="link link-primary">
							Terms of Service
						</Link>
						.
					</p>
				</section>
			</div>
		</div>
	);
}
