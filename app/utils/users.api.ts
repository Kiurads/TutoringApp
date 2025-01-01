import prisma from "@/prisma";

export async function fetchUsers() {
	try {
		const users = await prisma.user.findMany();
		return users;
	} catch (error) {
		console.log(error);
	}
}

export async function fetchUserByEmail(email: string) {
	try {
		const user = await prisma.user.findUnique({
			where: { email: email },
		});

		return user;
	} catch (error) {
		console.log(error);
	}
}
