import { fetchClassesByUser } from "@/app/utils/classes.actions";
import { fetchUserByEmail } from "@/app/utils/users.actions";
import Image from "next/image";

export default async function DashboardHeader(props: { userEmail: string }) {
	const avatar = `https://api.dicebear.com/9.x/big-ears-neutral/svg?&seed=${props.userEmail}`;

	const user = await fetchUserByEmail(props.userEmail);

	if (!user) {
		return <div>User not found.</div>;
	}

	const classes = await fetchClassesByUser(user);

	return (
		<div className="card w-auto rounded shadow-xl">
			<div className="card-body bg-base-200 rounded">
				<div className="badge-dash capitalize">{user.role}</div>
				<div className="sm:flex sm:justify-between sm:gap-4">
					<div>
						<h3 className="card-title">
							{"Welcome, " + user.firstName + " " + user.lastName}
						</h3>
					</div>

					<div className="hidden sm:block sm:shrink-0">
						<Image
							alt=""
							width={1000}
							height={1000}
							src={avatar}
							className="size-16 rounded-lg object-cover shadow-sm"
						/>
					</div>
				</div>

				<div>
					<p className="text-pretty text-sm text-gray-500">
						{user.email}
					</p>
				</div>

				<dl className="mt-6 flex gap-4 sm:gap-6">
					<div className="flex flex-col-reverse">
						<dt className="text-sm font-medium text-gray-600">
							Joined
						</dt>
						<dd className="text-xs text-gray-500">
							{user.createdAt.toLocaleDateString("en-us", {
								weekday: "long",
								year: "numeric",
								month: "short",
								day: "numeric",
							})}
						</dd>
					</div>

					<div className="flex flex-col-reverse">
						<dt className="text-sm font-medium text-gray-600">
							Classes attended
						</dt>
						<dd className="text-xs text-gray-500">
							{classes.length}
						</dd>
					</div>
				</dl>
			</div>

			<span className="h-2 bg-gradient-to-r from-primary via-accent to-secondary"></span>
		</div>
	);
}
