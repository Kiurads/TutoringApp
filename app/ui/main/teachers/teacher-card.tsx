import { TeacherDetails } from "@/app/lib/types/teachers.types";
import getAvatar from "@/utils/get-avatar";
import Image from "next/image";
import Link from "next/link";

export default function TeacherCard(props: { teacher: TeacherDetails }) {
	const { teacher } = props;

	return (
		<Link
			href={`/main/student/teachers/${teacher.id}`}
			className="relative block overflow-hidden rounded-lg border border-base-300 bg-base-200 p-4 sm:p-6 lg:p-8 h-full hover:bg-base-100 transition-all"
		>
			<span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-primary via-accent to-secondary"></span>

			<div className="sm:flex sm:justify-between sm:gap-4">
				<div>
					<h3 className="text-lg font-bold text-base-content sm:text-xl">
						{teacher.name}
					</h3>

					<p className="mt-1 text-xs font-medium text-base-content">
						{teacher.email}
					</p>
				</div>

				<div className="hidden sm:block sm:shrink-0">
					<Image
						alt=""
						width={1000}
						height={1000}
						src={getAvatar(teacher.email)}
						className="size-16 rounded-lg object-cover shadow-sm"
					/>
				</div>
			</div>

			<div className="mt-4">
				<p className="text-sm text-pretty text-base-content">
					{teacher.bio}
				</p>
			</div>

			<dl className="mt-6 flex gap-4 sm:gap-6">
				<div className="flex flex-col-reverse">
					<dt className="text-sm font-medium text-base-content">
						Rating
					</dt>
					<dd className="text-xs text-base-content">
						{teacher.rating}
					</dd>
				</div>
				<div className="flex flex-col-reverse">
					<dt className="text-sm font-medium text-base-content">
						Price/Hour
					</dt>
					<dd className="text-xs text-base-content">
						{teacher.pricePerHour + "€"}
					</dd>
				</div>
			</dl>
		</Link>
	);
}
