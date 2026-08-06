"use client";

import CreateSubjectForm from "@/app/ui/subject/subject-create-form";

export default function CreateSubjectPage() {
	return (
		<div className="max-w-md mx-auto">
			<h1 className="text-2xl font-bold mb-6">Add Subject</h1>
			<CreateSubjectForm />
		</div>
	);
}
