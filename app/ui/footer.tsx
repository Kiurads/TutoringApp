import Link from "next/link";

export default function Footer() {
	return (
		<footer className="bg-base-300 py-8">
			<div className="container mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
				{/* Company Information */}
				<div>
					<h3 className="text-lg font-bold mb-4">About Us</h3>
					<p>
						We provide a wide range of online classes to help you
						upskill in various fields.
					</p>
					<p className="mt-4">&copy; 2024 Kiurads</p>
				</div>

				{/* Course Links */}
				<div>
					<h3 className="text-lg font-bold mb-4">Classes</h3>
					<ul>
						<li>
							<Link
								href="/instructor-portal"
								className="hover:text-base-content"
							>
								Instructor Portal
							</Link>
						</li>
						<li>
							<Link
								href="/student-portal"
								className="hover:text-base-content"
							>
								Student Portal
							</Link>
						</li>
					</ul>
				</div>

				{/* Support and Resources */}
				<div>
					<h3 className="text-lg font-bold mb-4">Support</h3>
					<ul>
						<li>
							<Link
								href="/help-center"
								className="hover:text-base-content"
							>
								Help Center
							</Link>
						</li>
						<li>
							<Link href="/faq" className="hover:text-base-content">
								FAQ
							</Link>
						</li>
						<li>
							<Link href="/contact" className="hover:text-base-content">
								Contact Us
							</Link>
						</li>
						<li>
							<Link
								href="/refund-policy"
								className="hover:text-base-content"
							>
								Refund Policy
							</Link>
						</li>
					</ul>
				</div>

				{/* Social Media & Newsletter */}
				<div>
					<h3 className="text-lg font-bold mb-4">Follow Us</h3>
					<div className="flex space-x-4">
						<Link href="/facebook" className="hover:text-base-content">
							<i className="fab fa-facebook"></i> Facebook
						</Link>
						<Link href="/twitter" className="hover:text-base-content">
							<i className="fab fa-twitter"></i> Twitter
						</Link>
						<Link href="/linkedin" className="hover:text-base-content">
							<i className="fab fa-linkedin"></i> LinkedIn
						</Link>
					</div>
					<div className="mt-6">
						<h3 className="text-lg font-bold mb-2">
							Subscribe to our Newsletter
						</h3>
						<form>
							<input
								type="email"
								placeholder="Enter your email"
								className="w-full px-4 py-2 mb-4 rounded border-none"
							/>
							<button
								type="submit"
								className="w-full btn btn-primary py-2 rounded"
							>
								Subscribe
							</button>
						</form>
					</div>
				</div>
			</div>

			<div className="container mx-auto mt-8 text-center">
				<Link href="/privacy-policy">Privacy Policy</Link> |
				<Link href="/terms-of-service" className="ml-4">
					Terms of Service
				</Link>{" "}
				|
				<Link href="/cookie-policy" className="ml-4">
					Cookie Policy
				</Link>
			</div>
		</footer>
	);
}
