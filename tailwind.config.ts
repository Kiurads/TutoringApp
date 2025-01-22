import type { Config } from "tailwindcss";
import daisyui from "daisyui";

export default {
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			keyframes: {
				animatedgradient: {
					"0%": { backgroundPosition: "0% 50%" },
					"50%": { backgroundPosition: "100% 50%" },
					"100%": { backgroundPosition: "0% 50%" },
				},
			},
			backgroundSize: {
				"300%": "300%",
			},
			animation: {
				gradient: "animatedgradient 6s ease infinite alternate",
			},
		},
	},
	plugins: [daisyui],
	daisyui: {
		themes: [
			{
				light: {
					primary: "#0052cc", // Deep blue
					"primary-content": "#ffffff", // White for text on primary
					secondary: "#7d8597", // Muted gray-blue
					"secondary-content": "#ffffff", // White for text on secondary
					accent: "#36b37e", // Vibrant green
					"accent-content": "#ffffff", // White for text on accent
					neutral: "#f4f5f7", // Soft light gray
					"neutral-content": "#172b4d", // Dark gray for text
					"base-100": "#ffffff", // Pure white
					"base-200": "#f7f8fa", // Slightly off-white for subtle contrast
					"base-300": "#ebedf0", // Light gray for dividers
					"base-content": "#172b4d", // Dark gray for text
					info: "#0052cc", // Blue for informational elements
					"info-content": "#ffffff", // White for text on info
					success: "#36b37e", // Green for success messages
					"success-content": "#ffffff", // White for text on success
					warning: "#ffab00", // Amber for warnings
					"warning-content": "#ffffff", // White for text on warning
					error: "#ff5630", // Red for errors
					"error-content": "#ffffff", // White for text on error
				},
			},
			{
				dark: {
					primary: "#579dff", // Bright blue
					"primary-content": "#ffffff", // White for text on primary
					secondary: "#a1b0c1", // Softer gray-blue
					"secondary-content": "#ffffff", // White for text on secondary
					accent: "#79f2c0", // Bright green
					"accent-content": "#001f0d", // Dark green for contrast
					neutral: "#1d2025", // Deep gray for backgrounds
					"neutral-content": "#ffffff", // White for text
					"base-100": "#252a31", // Slightly lighter gray
					"base-200": "#2d333b", // Dark gray for subtle contrast
					"base-300": "#374151", // Even darker gray for dividers
					"base-content": "#ffffff", // White for text
					info: "#0052cc", // Blue for informational elements
					"info-content": "#c6dbff", // Light blue for text on info
					success: "#36b37e", // Green for success messages
					"success-content": "#001f0d", // Dark green for text on success
					warning: "#ffab00", // Amber for warnings
					"warning-content": "#332b00", // Dark amber for contrast
					error: "#ff5630", // Red for errors
					"error-content": "#330e0b", // Dark red for contrast
				},
			},
		],
	},
} satisfies Config;
