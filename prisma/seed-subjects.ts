import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Mirrors the categories already promised on the landing page
// (SubjectsSection in app/page.tsx), with "Languages" broken out into
// concrete bookable subjects.
const subjects = [
	"Mathematics",
	"Physics",
	"Chemistry",
	"Biology",
	"Programming",
	"English",
	"Spanish",
	"French",
	"German",
	"History",
	"Music",
	"Art & Design",
	"Economics",
	"Literature",
];

async function main() {
	console.log("Seeding subjects...");
	for (const name of subjects) {
		await prisma.subject.upsert({
			where: { name },
			update: {},
			create: { name },
		});
	}
	console.log(`✅ Seeded ${subjects.length} subjects.`);
}

main()
	.catch(console.error)
	.finally(() => prisma.$disconnect());
