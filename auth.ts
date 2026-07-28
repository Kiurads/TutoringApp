import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import prisma from "./prisma";
import { authConfig } from "./auth.config";
import { applyPasswordStalenessCheck } from "@/app/lib/auth/session-staleness";
import { verifyCredentials } from "@/app/lib/auth/verify-credentials";

export const {
	handlers: { GET, POST },
	signIn,
	signOut,
	auth,
} = NextAuth({
	...authConfig,
	adapter: PrismaAdapter(prisma),
	session: { strategy: "jwt" },
	providers: [
		Credentials({
			name: "Credentials",
			credentials: {
				email: {
					label: "Email",
					type: "email",
				},
				password: {
					label: "Password",
					type: "password",
				},
			},
			authorize: async (credentials) => {
				if (
					!credentials ||
					!credentials.email ||
					!credentials.password
				) {
					return null;
				}

				const email = credentials.email as string;
				const password = credentials.password as string;

				const user = await verifyCredentials(email, password);
				if (!user) {
					throw new Error("Incorrect password.");
				}

				// Set teachers online on login
				if (user.role === "teacher") {
					await prisma.user.update({
						where: { id: user.id },
						data: { isOnline: true },
					});
				}

				return user;
			},
		}),
	],
	callbacks: {
		...authConfig.callbacks,
		// Layers a DB-backed staleness check on top of authConfig's shared jwt
		// callback. Deliberately not part of authConfig itself: that config is
		// also used directly by middleware.ts on the Edge runtime, where a
		// Prisma call isn't safe to make on every request. This fuller check
		// only runs where this file (auth.ts, Node runtime) is actually used —
		// i.e. real auth() calls in Server Components/Actions, not middleware's
		// navigation-level gating.
		jwt: async (params) => {
			const token = await authConfig.callbacks.jwt(params);

			if (!params.user && token.sub) {
				const dbUser = await prisma.user.findUnique({
					where: { id: token.sub },
					select: { passwordChangedAt: true },
				});
				return applyPasswordStalenessCheck(token, dbUser?.passwordChangedAt?.getTime() ?? null);
			}

			return token;
		},
	},
});
