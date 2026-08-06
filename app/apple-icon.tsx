import { ImageResponse } from "next/og";

// Apple applies its own rounded-square mask to touch icons, so this stays
// a plain square (no borderRadius) at the larger size iOS expects — see
// app/icon.tsx for the browser-favicon version and shared design rationale.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
					fontSize: 110,
				}}
			>
				🎓
			</div>
		),
		{ ...size },
	);
}
