"use server";

import RequestRegularClassForm from "@/app/ui/main/regular-classes/request-regular-class-form";

export default async function RequestRegularClassPage() {
	return (
		<div className="flex justify-center">
			<RequestRegularClassForm />
		</div>
	);
}
