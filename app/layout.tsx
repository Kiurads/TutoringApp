import type { Metadata } from "next";
import "./globals.css";
import Script from "next/script";

import { poppins } from "@/app/ui/fonts";
import Navbar from "./ui/navbar";

export const metadata: Metadata = {
	title: "The Learning Nexus",
	description: "Book one-on-one tutoring sessions with expert teachers.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html data-theme="light" lang="en" suppressHydrationWarning>
			<body className={`${poppins.className} bg-base-100 text-base-content min-h-screen flex flex-col`}>
				{/* Blocking script — must be first child of body, runs before paint */}
				<script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}}())` }} />
				<Script src="https://kit.fontawesome.com/c0fa11f9f4.js"></Script>
				<Navbar />
				<main className="flex-1 flex flex-col">
					{children}
				</main>
			</body>
		</html>
	);
}
