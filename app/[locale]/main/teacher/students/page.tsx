import { fetchStudentsByTeacher } from "@/app/lib/actions/students.actions";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getFrameClass, getFrameLabel, getFrameColor } from "@/app/lib/frame-utils";
import getAvatar from "@/utils/get-avatar";
import Image from "next/image";

export default async function TeacherStudentsPage() {
	const session = await auth();

	if (!session?.user?.email) redirect("/login");

	const students = await fetchStudentsByTeacher();

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-2xl font-bold">My Students</h1>
				<p className="text-base-content/60 mt-1">
					Students who have taken or scheduled classes with you
				</p>
			</div>

			{students.length === 0 ? (
				<div className="text-center py-12">
					<div className="text-6xl mb-4">
						<i className="fa-solid fa-user-graduate text-base-content/20"></i>
					</div>
					<p className="text-xl text-base-content/70">
						No students yet
					</p>
					<p className="text-base-content/50">
						Students will appear here once they book classes with
						you
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{students.map((student) => {
						const activeFrame = student.activeFrame ?? null;
						const frameClass = getFrameClass(activeFrame);
						return (
							<div
								key={student.id}
								className="card bg-base-200 shadow-lg hover:shadow-xl transition-all"
							>
								<div className="card-body">
									<div className="flex items-center gap-4">
										{student.email ? (
											<div className={`size-16 rounded-full shrink-0 overflow-hidden ${frameClass}`}>
												<Image
													src={getAvatar(student.email, student.avatarOptions)} unoptimized
													alt={`${student.firstName} ${student.lastName}`}
													width={64}
													height={64}
													className="w-full h-full object-cover"
												/>
											</div>
										) : (
											<div className={`size-16 rounded-full bg-neutral text-neutral-content flex items-center justify-center shrink-0 ${frameClass}`}>
												<span className="text-xl">
													{student.firstName.charAt(0)}
													{student.lastName.charAt(0)}
												</span>
											</div>
										)}
										<div className="flex-1">
											<h3 className="card-title text-lg">
												{student.firstName}{" "}
												{student.lastName}
											</h3>
											{activeFrame && (
												<span className={`text-xs font-medium ${getFrameColor(activeFrame)}`}>
													<i className="fa-solid fa-gem mr-1 text-[10px]"></i>
													{getFrameLabel(activeFrame)}
												</span>
											)}
											<p className="text-sm text-base-content/70 mt-0.5">
												{student.email}
											</p>
											{student.phoneNumber && (
												<p className="text-sm text-base-content/70">
													<i className="fa-solid fa-phone mr-2"></i>
													{student.phoneNumber}
												</p>
											)}
										</div>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
