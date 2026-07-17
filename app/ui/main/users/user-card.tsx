import UserDetails from "@/app/lib/types/user.types";
import getAvatar from "@/utils/get-avatar";
import Image from "next/image";
import Link from "next/link";

export default function UserCard(props: { user: UserDetails }) {
	const { user } = props;
	return (
		<Link
			href={`/main/users/${user.id}`}
			className="relative block overflow-hidden rounded-lg border border-base-300 bg-base-200 p-4 sm:p-6 lg:p-8 h-full hover:bg-base-100 transition-all"
		>
			<span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-primary via-accent to-secondary"></span>

			<div className="sm:flex sm:justify-between sm:gap-4">
				<div>
					<h3 className="text-lg font-bold text-base-content sm:text-xl">
						{user.name}
					</h3>

					<p className="mt-1 text-xs font-medium text-base-content">
						{user.email}
					</p>

					<p className="mt-1 text-sm font-medium text-base-content badge badge-outline capitalize">
						{user.role}
					</p>
				</div>

				<div className="hidden sm:block sm:shrink-0">
					<Image
						alt=""
						width={1000}
						height={1000}
						src={getAvatar(user.email, user.avatarOptions)} unoptimized
						className="size-16 rounded-lg object-cover shadow-sm"
					/>
				</div>
			</div>
		</Link>
	);
}
