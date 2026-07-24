import Link from "next/link";

export const metadata = {
	title: "Terms of Service | The Learning Nexus",
};

export default function TermsOfServicePage() {
	return (
		<div className="max-w-3xl mx-auto px-4 py-12">
			<h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
			<p className="text-sm text-base-content/60 mb-6">Last updated: July 24, 2026</p>

			<div role="alert" className="alert alert-warning mb-8 text-sm">
				<i className="fa-solid fa-triangle-exclamation" />
				<span>
					This is a draft template, not final legal copy. Have a lawyer review and adapt it
					to your jurisdiction before relying on it in production.
				</span>
			</div>

			<div className="flex flex-col gap-6 text-sm leading-relaxed">
				<section>
					<h2 className="text-lg font-semibold mb-2">1. Who we are</h2>
					<p>
						The Learning Nexus (&quot;we&quot;, &quot;us&quot;, &quot;the platform&quot;) operates an online
						marketplace connecting students with independent tutors (&quot;teachers&quot;) for
						one-on-one tutoring sessions (&quot;classes&quot;). By creating an account, you agree
						to these Terms of Service and our{" "}
						<Link href="/privacy-policy" className="link link-primary">
							Privacy Policy
						</Link>
						.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">2. Accounts</h2>
					<p>
						You must provide accurate information when registering and are responsible for
						keeping your login credentials secure. Teachers are independent contractors, not
						employees or agents of the platform — we do not control how a teacher conducts a
						class, only facilitate booking, payment, and communication.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">3. Booking and payment</h2>
					<p>
						When a student books a class, payment is authorized upfront and processed by our
						payment provider, Stripe. Funds are captured once a teacher accepts the booking.
						We do not store your card details — Stripe handles all payment card data directly.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">4. Teacher payouts</h2>
					<p>
						Teachers receive their share of each completed class&apos;s price via Stripe Connect,
						minus a platform commission (currently 15%) that covers payment processing,
						hosting, and platform operations. Payouts are sent to the bank account a teacher
						connects through Stripe&apos;s onboarding flow, subject to Stripe&apos;s own
						verification requirements.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">5. Cancellations and refunds</h2>
					<p>
						Cancellation eligibility depends on how far in advance a class is cancelled relative
						to its scheduled start time. Full details are provided at the time of booking and in
						your class management screens.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">6. Prohibited conduct</h2>
					<p>
						You may not use the platform to harass other users, circumvent payment (e.g.
						arranging payment outside the platform to avoid fees), share another user&apos;s
						personal information without consent, or violate any applicable law.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">7. Disclaimers and liability</h2>
					<p>
						The platform is provided &quot;as is&quot;. We are not responsible for the quality of
						instruction provided by teachers, who operate independently. To the maximum extent
						permitted by law, our liability for any claim arising from your use of the platform
						is limited to the amount you paid us in the twelve months preceding the claim.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">8. Changes to these terms</h2>
					<p>
						We may update these terms from time to time. Continued use of the platform after an
						update constitutes acceptance of the revised terms.
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">9. Contact</h2>
					<p>Questions about these terms can be sent to the platform&apos;s support contact.</p>
				</section>
			</div>
		</div>
	);
}
