import { fetchClasses } from "@/app/lib/actions/classes.actions";
import ClassesTable from "@/app/ui/main/classes/classes-table";

export default async function ClassesPage() {
	const classes = await fetchClasses();

	return <ClassesTable classes={classes} />;
}
