import Link from "next/link";
import { getTranslations } from "next-intl/server";

export const metadata = {
	title: "Terms of Service",
};

export default async function TermsOfServicePage() {
	const t = await getTranslations("TermsOfServicePage");

	return (
		<div className="max-w-3xl mx-auto px-4 py-12">
			<h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
			<p className="text-sm text-base-content/60 mb-6">{t("lastUpdated")}</p>

			<div role="alert" className="alert alert-warning mb-8 text-sm">
				<i className="fa-solid fa-triangle-exclamation" />
				<span>{t("disclaimer")}</span>
			</div>

			<div className="flex flex-col gap-6 text-sm leading-relaxed">
				<section>
					<h2 className="text-lg font-semibold mb-2">{t("section1Title")}</h2>
					<p>
						{t.rich("section1Body", {
							privacyLink: (chunks) => (
								<Link href="/privacy-policy" className="link link-primary">
									{chunks}
								</Link>
							),
						})}
					</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">{t("section2Title")}</h2>
					<p>{t("section2Body")}</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">{t("section3Title")}</h2>
					<p>{t("section3Body")}</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">{t("section4Title")}</h2>
					<p>{t("section4Body")}</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">{t("section5Title")}</h2>
					<p>{t("section5Body")}</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">{t("section6Title")}</h2>
					<p>{t("section6Body")}</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">{t("section7Title")}</h2>
					<p>{t("section7Body")}</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">{t("section8Title")}</h2>
					<p>{t("section8Body")}</p>
				</section>

				<section>
					<h2 className="text-lg font-semibold mb-2">{t("section9Title")}</h2>
					<p>{t("section9Body")}</p>
				</section>
			</div>
		</div>
	);
}
