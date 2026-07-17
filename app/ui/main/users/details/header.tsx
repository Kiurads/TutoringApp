import getAvatar from "@/utils/get-avatar";
import Image from "next/image";
import TeacherRating from "./teacher-rating";

interface UserHeaderProps {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	role: string;
	bio?: string | null;
	createdAt: Date;
}

export default function UserDetailsHeader(props: {
	user: UserHeaderProps | null | undefined;
	rating: number;
	reviewCount?: number;
}) {
	const { user, rating, reviewCount } = props;

	if (!user) {
		return <div>User not found.</div>;
	}

	return (
		<div className="card bg-base-200 shadow-lg overflow-hidden">
			<div className="card-body gap-4">
				<div className="flex items-start justify-between gap-4">
					<div className="flex items-center gap-4">
						<Image
							alt={`${user.firstName} ${user.lastName}`}
							width={64}
							height={64}
							src={getAvatar(user.email)} unoptimized
							className="size-16 rounded-xl object-cover shadow-sm shrink-0"
						/>
						<div>
							<span className="badge badge-ghost badge-sm capitalize mb-1">
								{user.role}
							</span>
							<h3 className="text-xl font-bold">
								{user.firstName} {user.lastName}
							</h3>
							<p className="text-sm text-base-content/50">{user.email}</p>
						</div>
					</div>

					{/* Rating — only shown for teachers */}
					{user.role === "teacher" && (
						<div className="shrink-0 pt-1">
							<TeacherRating rating={rating} reviewCount={reviewCount} />
						</div>
					)}
				</div>

				{user.bio && (
					<p className="text-sm text-base-content/70 leading-relaxed border-t border-base-300 pt-4">
						{user.bio}
					</p>
				)}

				<p className="text-xs text-base-content/40">
					Member since{" "}
					{user.createdAt.toLocaleDateString("en-US", {
						month: "long",
						year: "numeric",
					})}
				</p>
			</div>

			<span className="h-1 bg-gradient-to-r from-primary via-accent to-secondary block" />
		</div>
	);
}
