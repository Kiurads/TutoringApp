import getAvatar from "@/utils/get-avatar";
import Image from "next/image";

// TeacherCard Component
export default function TeacherCard(props: {
	email: string;
	firstName: string;
	lastName: string;
	bio: string | null;
	ratingAverage: number | null;
	pricePerHour: string;
}) {
	return (
		<a
			href="#"
			className="relative block overflow-hidden rounded-lg border border-gray-100 p-4 sm:p-6 lg:p-8 h-full"
		>
			<span className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-r from-green-300 via-blue-500 to-purple-600"></span>

			<div className="sm:flex sm:justify-between sm:gap-4">
				<div>
					<h3 className="text-lg font-bold text-gray-900 sm:text-xl">
						{props.firstName} {props.lastName}
					</h3>

					<p className="mt-1 text-xs font-medium text-gray-600">
						{props.email}
					</p>
				</div>

				<div className="hidden sm:block sm:shrink-0">
					<Image
						alt=""
						width={1000}
						height={1000}
						src={getAvatar(props.email)}
						className="size-16 rounded-lg object-cover shadow-sm"
					/>
				</div>
			</div>

			<div className="mt-4">
				<p className="text-sm text-pretty text-gray-500">{props.bio}</p>
			</div>

			<dl className="mt-6 flex gap-4 sm:gap-6">
				<div className="flex flex-col-reverse">
					<dt className="text-sm font-medium text-gray-600">
						Rating
					</dt>
					<dd className="text-xs text-gray-500">
						{props.ratingAverage !== null
							? `${props.ratingAverage.toFixed(1)}/5` // Safely call .toFixed() if ratingAverage is not null
							: "No ratings yet"}
					</dd>
				</div>
				<div className="flex flex-col-reverse">
					<dt className="text-sm font-medium text-gray-600">
						Price/Hour
					</dt>
					<dd className="text-xs text-gray-500">
						{props.pricePerHour + "€"}
					</dd>
				</div>
			</dl>
		</a>
	);
}
