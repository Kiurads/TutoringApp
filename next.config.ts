import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		dangerouslyAllowSVG: true,
		remotePatterns: [
			{ protocol: "https", hostname: "api.dicebear.com" },
			{ protocol: "https", hostname: "img.daisyui.com" },
			{ protocol: "https", hostname: "images.unsplash.com" },
		],
	},
};

export default nextConfig;
