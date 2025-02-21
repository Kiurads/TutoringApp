import { fetchUserById } from "@/app/lib/actions/users.actions";

export default async function UsersDetailsPage(props: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await props.params;
	const userData = await fetchUserById(id);

	return <div>{id}</div>;
}
