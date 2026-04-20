import { fetchClasses } from "@/app/lib/actions/classes.actions";
import ClassesTable from "@/app/ui/main/classes/classes-table";

export default async function ClassesPage() {
	const classes = await fetchClasses();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">Classes</h1>
				<p className="text-base-content/60 text-sm mt-1">
					{classes.length} class{classes.length !== 1 ? "es" : ""} across all students and teachers.
				</p>
			</div>
			<ClassesTable classes={classes} />
		</div>
	);
}
