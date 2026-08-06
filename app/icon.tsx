import { ImageResponse } from "next/og";

// Next.js file convention: this generates the favicon/app-icon <link> tags
// automatically — replaces the untouched stock Next.js favicon.ico (deleted
// alongside this file). Uses the same visual motif as the in-app navbar
// wordmark (app/ui/logo.tsx): a graduation cap on a rounded primary-blue
// square. Built with ImageResponse (renders JSX to a PNG at request/build
// time) rather than a static image file, since there's no source artwork to
// work from — matches #0052cc, the daisyUI `primary` color from
// tailwind.config.ts's light theme (the theme this app defaults to).
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					background: "#0052cc",
					borderRadius: 6,
					fontSize: 20,
				}}
			>
				🎓
			</div>
		),
		{ ...size },
	);
}
