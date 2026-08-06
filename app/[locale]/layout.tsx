import type { Metadata } from "next";
import "@/app/globals.css";
import Script from "next/script";
import { hasLocale } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { routing } from "@/i18n/routing";
import { poppins } from "@/app/ui/fonts";
import Navbar from "@/app/ui/navbar";
import Providers from "@/app/providers";

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export const metadata: Metadata = {
	metadataBase: new URL(appUrl),
	title: {
		default: "Ponte — Learn Faster with Expert Tutors",
		template: "%s — Ponte",
	},
	description: "Book one-on-one tutoring sessions with expert teachers.",
	openGraph: {
		title: "Ponte — Learn Faster with Expert Tutors",
		description: "Book one-on-one tutoring sessions with expert teachers.",
		url: appUrl,
		siteName: "Ponte",
		locale: "en_US",
		type: "website",
	},
	twitter: {
		card: "summary_large_image",
		title: "Ponte — Learn Faster with Expert Tutors",
		description: "Book one-on-one tutoring sessions with expert teachers.",
	},
};

export function generateStaticParams() {
	return routing.locales.map((locale) => ({ locale }));
}

export default async function RootLayout({
	children,
	params,
}: Readonly<{
	children: React.ReactNode;
	params: Promise<{ locale: string }>;
}>) {
	const { locale } = await params;
	if (!hasLocale(routing.locales, locale)) {
		notFound();
	}

	// Required by next-intl so static rendering + generateStaticParams work
	// correctly for this locale's subtree, not just the request-scoped config.
	setRequestLocale(locale);

	return (
		<html data-theme="light" lang={locale} suppressHydrationWarning>
			<body className={`${poppins.className} bg-base-100 text-base-content min-h-screen flex flex-col`}>
				{/* Blocking script — must be first child of body, runs before paint */}
				<script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}}())` }} />
				<Script src="https://kit.fontawesome.com/c0fa11f9f4.js"></Script>
				<NextIntlClientProvider>
					<Providers>
						<Navbar />
						<main className="flex-1 flex flex-col">
							{children}
						</main>
					</Providers>
				</NextIntlClientProvider>
			</body>
		</html>
	);
}
