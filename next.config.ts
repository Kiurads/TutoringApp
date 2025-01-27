import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		dangerouslyAllowSVG: true,
		domains: ["api.dicebear.com", "img.daisyui.com", "images.unsplash.com"],
	},
};

export default nextConfig;
