import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		dangerouslyAllowSVG: true,
		domains: ["api.dicebear.com", "img.daisyui.com"],
	},
};

export default nextConfig;
