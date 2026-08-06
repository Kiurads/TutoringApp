import { ImageResponse } from "next/og";

// Next.js file convention: generates the default og:image/twitter:image for
// every route that doesn't provide its own. Same 🎓-on-brand-blue motif as
// app/icon.tsx, stretched into a 1200x630 social card with the wordmark and
// tagline alongside it.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					background: "linear-gradient(135deg, #0052cc 0%, #36b37e 100%)",
					fontFamily: "sans-serif",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: 24,
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							width: 140,
							height: 140,
							borderRadius: 28,
							background: "rgba(255, 255, 255, 0.15)",
							fontSize: 84,
						}}
					>
						🎓
					</div>
					<div
						style={{
							display: "flex",
							fontSize: 96,
							fontWeight: 800,
							color: "#ffffff",
							letterSpacing: -2,
						}}
					>
						Ponte
					</div>
				</div>
				<div
					style={{
						display: "flex",
						marginTop: 28,
						fontSize: 34,
						color: "rgba(255, 255, 255, 0.9)",
					}}
				>
					Learn faster with expert tutors
				</div>
			</div>
		),
		{ ...size },
	);
}
