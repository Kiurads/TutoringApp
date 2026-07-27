import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { authConfig } from "./auth.config";
import { applyPasswordStalenessCheck } from "@/app/lib/auth/session-staleness";

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

				const user = await prisma.user.findUnique({
					where: { email },
					select: {
						id: true,
						email: true,
						password: true,
						role: true,
						teachingStyle: true,
						passwordChangedAt: true,
					},
				});

				if (!user) {
					return null;
				} else {
					const isMatch = bcrypt.compareSync(
						credentials.password as string,
						user.password
					);
					if (!isMatch) {
						throw new Error("Incorrect password.");
					}
				}

				// Set teachers online on login
				if (user.role === "teacher") {
					await prisma.user.update({
						where: { id: user.id },
						data: { isOnline: true },
					});
				}

				return {
					id: user.id,
					email: user.email,
					role: user.role,
					// Non-teachers are never gated on this, so `true` is a safe default.
					teacherPreferencesSet:
						user.role === "teacher" ? user.teachingStyle !== null : true,
					passwordChangedAt: user.passwordChangedAt,
				};
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
