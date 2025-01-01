import { Subject } from "@/models";
import { Op } from "sequelize";

export async function fetchSubjects(): Promise<Subject[]> {
	return await Subject.findAll({
		raw: true,
	});
}

export async function fetchSubjectsByName(name: string): Promise<Subject[]> {
	return await Subject.findAll({
		raw: true,
		where: {
			name: {
				[Op.like]: name,
			},
		},
	});
}

export async function fetchSubjectsById(id: number): Promise<Subject | null> {
	return await Subject.findOne({
		raw: true,
		where: {
			id: id,
		},
	});
}
