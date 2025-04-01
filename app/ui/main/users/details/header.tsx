import getAvatar from "@/utils/get-avatar";
import Image from "next/image";
import TeacherRating from "./teacher-rating";

export default function UserDetailsHeader(props: {
	user: any;
	rating: number;
}) {
	const { user, rating } = props;

	if (!user) {
		return <div>User not found.</div>;
	}

	return (
		<div className="card w-auto rounded shadow-xl relative">
			<div className="card-body bg-base-200 rounded">
				<div className="badge-dash capitalize">{user.role}</div>
				<div className="sm:flex sm:justify-between sm:gap-4">
					<div>
						<h3 className="card-title">
							{user.firstName + " " + user.lastName}
						</h3>
					</div>

					<div className="hidden sm:block sm:shrink-0">
						<Image
							alt=""
							width={1000}
							height={1000}
							src={getAvatar(user.email)}
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
				</dl>
			</div>

			<span className="h-2 bg-gradient-to-r from-primary via-accent to-secondary"></span>

			{/* Teacher Rating component positioned at the bottom-right corner */}
			<div className="absolute bottom-12 right-8">
				<TeacherRating rating={rating} />
			</div>
		</div>
	);
}
