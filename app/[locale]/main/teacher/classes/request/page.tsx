import RequestClassForm from "@/app/ui/main/classes/create/teacher/create-class-form";

export default async function ClassesPage(props: {
	searchParams: Promise<{ startTime?: string; duration?: string }>;
}) {
	const { startTime, duration } = await props.searchParams;

	return (
		<div className="flex min-h-[80vh] items-center justify-center py-8">
			<RequestClassForm
				initialStartTime={startTime}
				initialDuration={duration ? parseFloat(duration) : undefined}
			/>
		</div>
	);
}
