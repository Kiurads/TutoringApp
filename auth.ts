import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "./prisma";
import { authConfig } from "./auth.config";

export const { signIn, signOut, auth } = NextAuth({
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
				};
			},
		}),
	],
});
