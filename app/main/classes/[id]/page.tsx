import { fetchClassById } from "@/app/lib/actions/classes.actions";
import ClassInfoCard from "@/app/ui/main/classes/details/class-info-card";

export default async function ClassDetailsPage(props: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await props.params;
	const classData = await fetchClassById(id);

	return (
		<div className="container mx-auto p-4">
			<ClassInfoCard classDetails={classData} />
		</div>
	);
}
