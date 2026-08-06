import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

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

export default withNextIntl(nextConfig);
