import Link from "next/link";
import { fetchSubjects } from "@/app/lib/actions/subjects.actions";

const SUBJECT_ICONS: Record<string, string> = {
	Mathematics: "fa-square-root-variable",
	Physics: "fa-atom",
	Chemistry: "fa-flask",
	Biology: "fa-dna",
	Programming: "fa-laptop-code",
	English: "fa-language",
	Spanish: "fa-language",
	French: "fa-language",
	German: "fa-language",
	History: "fa-landmark",
	Music: "fa-music",
	"Art & Design": "fa-palette",
	Economics: "fa-chart-bar",
	Literature: "fa-book",
};

export default async function SubjectsPage() {
	const subjects = await fetchSubjects();

	return (
		<div className="flex flex-col gap-6 animate-fade-in">
			<div>
				<h1 className="text-2xl font-bold">Subjects</h1>
				<p className="text-base-content/60 mt-1">
					Pick a subject to see the teachers who cover it.
				</p>
			</div>

			{subjects.length === 0 ? (
				<div className="text-center py-16 text-base-content/50">
					<p className="text-lg font-medium">No subjects available yet</p>
				</div>
			) : (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
					{subjects.map((subject) => (
						<Link
							key={subject.id}
							href={`/main/student/teachers?subject=${encodeURIComponent(subject.name)}`}
							className="card bg-base-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
						>
							<div className="card-body gap-3">
								<div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center">
									<i
										className={`fa-solid ${SUBJECT_ICONS[subject.name] ?? "fa-book"} text-primary text-lg`}
									></i>
								</div>
								<div>
									<h2 className="font-semibold">{subject.name}</h2>
									<p className="text-sm text-base-content/50">
										{subject.teacherCount ?? 0} teacher
										{subject.teacherCount === 1 ? "" : "s"}
									</p>
								</div>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}
